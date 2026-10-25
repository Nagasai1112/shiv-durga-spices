import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  db,
  uploadsDir,
  toProduct,
  toReview,
  verifyPassword,
  setPassword,
  getSettings,
  saveSettings,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 4000;
app.set("trust proxy", 1);

const attempts = new Map();

function clientIp(req) {
  return req.ip || "local";
}

function tooManyAttempts(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((time) => now - time < 10 * 60 * 1000);
  attempts.set(ip, recent);
  return recent.length >= 8;
}

function recordAttempt(ip) {
  const recent = attempts.get(ip) || [];
  recent.push(Date.now());
  attempts.set(ip, recent);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename(req, file, callback) {
      const ext = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[file.mimetype];
      callback(null, `${req.params.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new Error("Use a JPG, PNG, or WebP image"));
      return;
    }
    callback(null, true);
  },
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDir));

function requireAdmin(req, res, next) {
  const token = req.cookies.sid;
  if (!token || !db.prepare("SELECT token FROM sessions WHERE token = ?").get(token)) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  next();
}

function slugify(name) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "spice";
}

function uniqueId(name) {
  const base = slugify(name);
  let id = base;
  let n = 2;
  while (db.prepare("SELECT id FROM products WHERE id = ?").get(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

function readProduct(body) {
  const name = String(body.name || "").trim();
  const category = String(body.category || "").trim();
  const description = String(body.description || "").trim();
  const rate = Number(body.ratePerKg);
  if (name.length < 2 || name.length > 80) return { error: "Enter a spice name" };
  if (!category || category.length > 40) return { error: "Enter a category, such as Ground or Whole" };
  if (description.length > 500) return { error: "Keep the description under 500 characters" };
  if (!Number.isFinite(rate)) return { error: "Enter the auction rate per kg in rupees" };
  const ratePerKg = Math.round(rate);
  if (ratePerKg < 1 || ratePerKg > 500000) return { error: "Enter a rate between ₹1 and ₹5,00,000 per kg" };
  return {
    value: {
      name,
      category,
      description,
      ratePerKg,
      inStock: body.inStock !== false && body.inStock !== 0,
    },
  };
}

function readSettings(body) {
  const brandName = String(body.brandName || "").trim();
  const tagline = String(body.tagline || "").trim();
  const whatsappNumber = String(body.whatsappNumber || "").replace(/\D/g, "");
  if (brandName.length < 2 || brandName.length > 60) return { error: "Enter the brand name" };
  if (tagline.length > 120) return { error: "Keep the tagline under 120 characters" };
  if (whatsappNumber && (whatsappNumber.length < 10 || whatsappNumber.length > 15)) {
    return { error: "Enter the WhatsApp number with country code, digits only. Example: 9198XXXXXXX" };
  }
  return { value: { brandName, tagline, whatsappNumber } };
}

function imageFile(url) {
  if (!url || !url.startsWith("/uploads/")) return null;
  const file = path.join(uploadsDir, path.basename(url));
  return file.startsWith(uploadsDir) ? file : null;
}

function removeImage(url) {
  const file = imageFile(url);
  if (file && fs.existsSync(file)) fs.unlinkSync(file);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/settings", (req, res) => {
  res.json(getSettings());
});

app.get("/api/products", (req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY sort_order, name").all();
  res.json(rows.map(toProduct));
});

app.get("/api/reviews", (req, res) => {
  const rows = db.prepare("SELECT * FROM reviews ORDER BY sort_order, created_at").all();
  res.json(rows.map(toReview));
});

app.get("/api/products/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!row) {
    res.status(404).json({ error: "That spice is not in the shop" });
    return;
  }
  res.json(toProduct(row));
});

app.post("/api/admin/login", (req, res) => {
  const ip = clientIp(req);
  if (tooManyAttempts(ip)) {
    res.status(429).json({ error: "Too many tries. Wait a few minutes and try again." });
    return;
  }
  const admin = db.prepare("SELECT salt, password_hash FROM admin WHERE id = 1").get();
  const password = String(req.body.password || "");
  if (!admin || !verifyPassword(password, admin.salt, admin.password_hash)) {
    recordAttempt(ip);
    res.status(401).json({ error: "That password is not right" });
    return;
  }
  attempts.delete(ip);
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, created_at) VALUES (?, ?)").run(token, Date.now());
  res.cookie("sid", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  if (req.cookies.sid) db.prepare("DELETE FROM sessions WHERE token = ?").run(req.cookies.sid);
  res.clearCookie("sid");
  res.json({ ok: true });
});

app.get("/api/admin/me", requireAdmin, (req, res) => {
  res.json({ ok: true });
});

app.put("/api/admin/settings", requireAdmin, (req, res) => {
  const parsed = readSettings(req.body);
  if (parsed.error) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  res.json(saveSettings(parsed.value));
});

app.put("/api/admin/password", requireAdmin, (req, res) => {
  const currentPassword = String(req.body.currentPassword || "");
  const nextPassword = String(req.body.newPassword || "");
  const admin = db.prepare("SELECT salt, password_hash FROM admin WHERE id = 1").get();
  if (!verifyPassword(currentPassword, admin.salt, admin.password_hash)) {
    res.status(401).json({ error: "The current password is not right" });
    return;
  }
  if (nextPassword.length < 6) {
    res.status(400).json({ error: "Use at least 6 characters for the new password" });
    return;
  }
  setPassword(nextPassword);
  res.json({ ok: true });
});

app.post("/api/admin/products", requireAdmin, (req, res) => {
  const parsed = readProduct(req.body);
  if (parsed.error) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const { name, category, description, ratePerKg, inStock } = parsed.value;
  const sort = (db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS n FROM products").get().n || 0) + 1;
  const id = uniqueId(name);
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO products (id, name, category, description, rate_per_kg, image, in_stock, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)",
  ).run(id, name, category, description, ratePerKg, inStock ? 1 : 0, sort, now);
  res.status(201).json(toProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(id)));
});

app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  const current = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!current) {
    res.status(404).json({ error: "That spice is not in the shop" });
    return;
  }
  const parsed = readProduct(req.body);
  if (parsed.error) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const { name, category, description, ratePerKg, inStock } = parsed.value;
  db.prepare(
    "UPDATE products SET name = ?, category = ?, description = ?, rate_per_kg = ?, in_stock = ?, updated_at = ? WHERE id = ?",
  ).run(name, category, description, ratePerKg, inStock ? 1 : 0, new Date().toISOString(), req.params.id);
  res.json(toProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id)));
});

app.post("/api/admin/products/:id/image", requireAdmin, (req, res) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      const message = error.code === "LIMIT_FILE_SIZE" ? "Use an image under 5 MB" : error.message;
      res.status(400).json({ error: message || "Could not save that image" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Choose an image first" });
      return;
    }
    const current = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    if (!current) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: "That spice is not in the shop" });
      return;
    }
    removeImage(current.image);
    const image = `/uploads/${req.file.filename}`;
    db.prepare("UPDATE products SET image = ?, updated_at = ? WHERE id = ?").run(
      image,
      new Date().toISOString(),
      req.params.id,
    );
    res.json(toProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id)));
  });
});

function readReview(body) {
  const quote = String(body.quote || "").trim();
  const label = String(body.label || "").trim() || "Verified customer";
  const stars = Number(body.stars);
  if (quote.length < 2 || quote.length > 280) return { error: "Enter the customer's words." };
  if (label.length > 40) return { error: "Keep the label under 40 characters." };
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { error: "Choose from 1 to 5 stars." };
  return { value: { quote, label, stars } };
}

function uniqueReviewId() {
  let id = `review-${Date.now().toString(36)}`;
  let n = 2;
  while (db.prepare("SELECT id FROM reviews WHERE id = ?").get(id)) {
    id = `review-${Date.now().toString(36)}-${n}`;
    n += 1;
  }
  return id;
}

app.post("/api/admin/reviews", requireAdmin, (req, res) => {
  const parsed = readReview(req.body);
  if (parsed.error) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const id = uniqueReviewId();
  const sort = (db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS n FROM reviews").get().n || 0) + 1;
  db.prepare(
    "INSERT INTO reviews (id, quote, label, stars, image, sort_order, created_at) VALUES (?, ?, ?, ?, NULL, ?, ?)",
  ).run(id, parsed.value.quote, parsed.value.label, parsed.value.stars, sort, new Date().toISOString());
  res.status(201).json(toReview(db.prepare("SELECT * FROM reviews WHERE id = ?").get(id)));
});

app.put("/api/admin/reviews/:id", requireAdmin, (req, res) => {
  const current = db.prepare("SELECT * FROM reviews WHERE id = ?").get(req.params.id);
  if (!current) {
    res.status(404).json({ error: "That review is not on the site." });
    return;
  }
  const parsed = readReview(req.body);
  if (parsed.error) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  db.prepare("UPDATE reviews SET quote = ?, label = ?, stars = ? WHERE id = ?").run(
    parsed.value.quote,
    parsed.value.label,
    parsed.value.stars,
    req.params.id,
  );
  res.json(toReview(db.prepare("SELECT * FROM reviews WHERE id = ?").get(req.params.id)));
});

app.post("/api/admin/reviews/:id/image", requireAdmin, (req, res) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      const message = error.code === "LIMIT_FILE_SIZE" ? "Use an image under 5 MB" : error.message;
      res.status(400).json({ error: message || "Could not save that image" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Choose an image first" });
      return;
    }
    const current = db.prepare("SELECT * FROM reviews WHERE id = ?").get(req.params.id);
    if (!current) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: "That review is not on the site." });
      return;
    }
    if (current.image && current.image.startsWith("/uploads/")) removeImage(current.image);
    const image = `/uploads/${req.file.filename}`;
    db.prepare("UPDATE reviews SET image = ? WHERE id = ?").run(image, req.params.id);
    res.json(toReview(db.prepare("SELECT * FROM reviews WHERE id = ?").get(req.params.id)));
  });
});

app.delete("/api/admin/reviews/:id", requireAdmin, (req, res) => {
  const current = db.prepare("SELECT * FROM reviews WHERE id = ?").get(req.params.id);
  if (!current) {
    res.status(404).json({ error: "That review is not on the site." });
    return;
  }
  if (current.image && current.image.startsWith("/uploads/")) removeImage(current.image);
  db.prepare("DELETE FROM reviews WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  const current = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!current) {
    res.status(404).json({ error: "That spice is not in the shop" });
    return;
  }
  removeImage(current.image);
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

const dist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      next();
      return;
    }
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  res.status(500).json({ error: "Something went wrong on the shop server" });
});

app.listen(port, () => {
  console.log(`Shiv Durga Spices server  http://localhost:${port}`);
});
