import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  PACKS,
  db,
  uploadsDir,
  packLabel,
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
  if (name.length < 2 || name.length > 80) return { error: "Enter a spice name" };
  if (!category || category.length > 40) return { error: "Enter a category, such as Whole" };
  if (description.length > 500) return { error: "Keep the description under 500 characters" };
  const prices = {};
  const source = body.prices || {};
  for (const grams of [100, 250, 500, 1000]) {
    const price = Math.round(Number(source[grams] ?? source[String(grams)]));
    const label = grams === 1000 ? "1 kg" : `${grams} g`;
    if (!Number.isFinite(price) || price < 1 || price > 500000) {
      return { error: `Enter a price from ₹1 to ₹5,00,000 for ${label}` };
    }
    prices[grams] = price;
  }
  const costPerKg = body.costPerKg === "" || body.costPerKg === undefined || body.costPerKg === null ? 0 : Math.round(Number(body.costPerKg));
  if (!Number.isFinite(costPerKg) || costPerKg < 0 || costPerKg > 10000000) {
    return { error: "Enter today’s buying price per kg, or leave it blank" };
  }
  return {
    value: {
      name,
      category,
      description,
      prices,
      costPerKg,
      inStock: body.inStock !== false && body.inStock !== 0,
      bestSeller: body.bestSeller === true || body.bestSeller === 1,
    },
  };
}

function readSettings(body) {
  const brandName = String(body.brandName || "").trim();
  const tagline = String(body.tagline || "").trim();
  const phone = String(body.phone || "").replace(/\D/g, "");
  if (brandName.length < 2 || brandName.length > 60) return { error: "Enter the brand name" };
  if (tagline.length > 120) return { error: "Keep the tagline under 120 characters" };
  if (phone && (phone.length < 10 || phone.length > 15)) return { error: "Enter the phone number with country code" };
  const enteredWhatsapp = String(body.whatsappNumber || "").replace(/\D/g, "");
  const whatsappNumber = !enteredWhatsapp || (phone.endsWith(enteredWhatsapp) && enteredWhatsapp.length >= 10 && enteredWhatsapp.length < phone.length)
    ? phone
    : enteredWhatsapp;
  if (whatsappNumber && (whatsappNumber.length < 10 || whatsappNumber.length > 15)) {
    return { error: "Enter the WhatsApp number with country code, digits only. Example: 9198XXXXXXX" };
  }
  const email = String(body.email || "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email" };
  const deliveryLimitKg = Number(body.deliveryLimitKg);
  const deliveryPerKgUpTo = Math.round(Number(body.deliveryPerKgUpTo));
  const deliveryPerKgAbove = Math.round(Number(body.deliveryPerKgAbove));
  if (!Number.isFinite(deliveryLimitKg) || deliveryLimitKg < 0 || deliveryLimitKg > 100) {
    return { error: "Enter the weight where the delivery charge changes" };
  }
  if (!Number.isFinite(deliveryPerKgUpTo) || deliveryPerKgUpTo < 0 || deliveryPerKgUpTo > 100000) {
    return { error: "Enter the delivery charge up to that weight" };
  }
  if (!Number.isFinite(deliveryPerKgAbove) || deliveryPerKgAbove < 0 || deliveryPerKgAbove > 100000) {
    return { error: "Enter the delivery charge above that weight" };
  }
  const deliveryNote = String(body.deliveryNote || "").trim();
  const paymentNote = String(body.paymentNote || "").trim();
  if (deliveryNote.length > 240) return { error: "Keep the delivery note under 240 characters" };
  if (paymentNote.length > 240) return { error: "Keep the payment note under 240 characters" };
  return {
    value: {
      brandName,
      tagline,
      whatsappNumber,
      phone,
      email,
      deliveryLimitKg,
      deliveryPerKgUpTo,
      deliveryPerKgAbove,
      deliveryNote,
      paymentNote,
    },
  };
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

function readAdmin() {
  return db.prepare("SELECT username, salt, password_hash FROM admin WHERE id = 1").get();
}

function loginAdmin(req, res) {
  const ip = clientIp(req);
  if (tooManyAttempts(ip)) {
    res.status(429).json({ error: "Too many tries. Wait a few minutes and try again." });
    return;
  }
  const admin = readAdmin();
  const username = String(req.body.username || "admin").trim().toLowerCase();
  const password = String(req.body.password || "");
  const nameOk = admin && username === String(admin.username || "admin").trim().toLowerCase();
  if (!nameOk || !verifyPassword(password, admin.salt, admin.password_hash)) {
    recordAttempt(ip);
    res.status(401).json({ error: "That sign-in is not right" });
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
  res.json({ ok: true, username: admin.username || "admin" });
}

function logoutAdmin(req, res) {
  if (req.cookies.sid) db.prepare("DELETE FROM sessions WHERE token = ?").run(req.cookies.sid);
  res.clearCookie("sid");
  res.json({ ok: true });
}

function currentAdmin(req, res) {
  const admin = readAdmin();
  res.json({ ok: true, username: admin?.username || "admin" });
}

app.post("/api/auth/login", loginAdmin);
app.post("/api/auth/logout", logoutAdmin);
app.get("/api/auth/me", requireAdmin, currentAdmin);

app.post("/api/admin/login", loginAdmin);
app.post("/api/admin/logout", logoutAdmin);
app.get("/api/admin/me", requireAdmin, currentAdmin);

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
  const { name, category, description, prices, costPerKg, inStock, bestSeller } = parsed.value;
  const sort = (db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS n FROM products").get().n || 0) + 1;
  const id = uniqueId(name);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO products (
      id, name, category, description, rate_per_kg, image, in_stock, best_seller, sort_order, updated_at,
      price_100, price_250, price_500, price_1000, cost_per_kg
    ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    name,
    category,
    description,
    prices[1000],
    inStock ? 1 : 0,
    bestSeller ? 1 : 0,
    sort,
    now,
    prices[100],
    prices[250],
    prices[500],
    prices[1000],
    costPerKg,
  );
  res.status(201).json(toProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(id)));
});

app.get("/api/admin/products", requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY sort_order, name").all();
  res.json(rows.map((row) => ({ ...toProduct(row), costPerKg: row.cost_per_kg || 0 })));
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
  const { name, category, description, prices, costPerKg, inStock, bestSeller } = parsed.value;
  db.prepare(
    `UPDATE products SET
      name = ?, category = ?, description = ?, rate_per_kg = ?, in_stock = ?, best_seller = ?, updated_at = ?,
      price_100 = ?, price_250 = ?, price_500 = ?, price_1000 = ?, cost_per_kg = ?
    WHERE id = ?`,
  ).run(
    name,
    category,
    description,
    prices[1000],
    inStock ? 1 : 0,
    bestSeller ? 1 : 0,
    new Date().toISOString(),
    prices[100],
    prices[250],
    prices[500],
    prices[1000],
    costPerKg,
    req.params.id,
  );
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

function rupees(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function lettersOnly(label, value) {
  const text = String(value || "").trim();
  if (text.length < 2 || text.length > 80) return `Enter ${label.toLowerCase()}`;
  if (/\d/.test(text) || !/^[\p{L}][\p{L}\s.'-]*$/u.test(text)) return `Enter a valid ${label.toLowerCase()}`;
  return "";
}

function indiaToday(when = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(when);
}

function orderDateStamp(when = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
  }).formatToParts(when);
  const pick = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${pick("day")}${pick("month")}`;
}

function orderItemGrams(row) {
  let items = [];
  try {
    items = JSON.parse(row.items_json);
  } catch {
    items = [];
  }
  const totals = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const grams = Math.round(Number(item.grams) * Number(item.qty));
    const id = String(item.productId || "");
    if (!id || !Number.isFinite(grams) || grams <= 0) continue;
    totals.set(id, (totals.get(id) || 0) + grams);
  }
  return totals;
}

function changeStock(row, sign) {
  const adjust = db.prepare("UPDATE products SET stock_grams = stock_grams + ? WHERE id = ?");
  for (const [id, grams] of orderItemGrams(row)) adjust.run(sign * grams, id);
}

function stampItemCosts(row) {
  let items = [];
  try {
    items = JSON.parse(row.items_json);
  } catch {
    items = [];
  }
  if (!Array.isArray(items)) return;
  const costs = new Map(db.prepare("SELECT id, cost_per_kg FROM products").all().map((product) => [product.id, product.cost_per_kg || 0]));
  const next = items.map((item) => ({
    ...item,
    costPerKg: costs.get(String(item.productId || "")) ?? 0,
  }));
  db.prepare("UPDATE orders SET items_json = ? WHERE id = ?").run(JSON.stringify(next), row.id);
}

function indiaYearMonth(iso) {
  const date = new Date(iso || "");
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const pick = (type) => Number(parts.find((part) => part.type === type)?.value);
  const year = pick("year");
  const month = pick("month");
  if (!year || !month) return null;
  return { year, month };
}

function indiaYear(when = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric" }).format(when));
}

const pageNames = {
  "/": "Home",
  "/shop": "Shop",
  "/offers": "Offers",
  "/order": "Order",
  "/reviews": "Reviews",
  "/track": "Track",
  "/contact": "Contact",
  "/privacy": "Privacy policy",
  "/refunds": "Refunds",
  "/shipping": "Shipping",
  "/terms": "Terms",
};

function stockReport(year) {
  const products = db.prepare("SELECT id, name, stock_grams, sort_order, cost_per_kg, price_100, price_250, price_500, price_1000 FROM products ORDER BY sort_order, name").all();
  const names = new Map(products.map((product) => [product.id, product.name]));
  const costNow = new Map(products.map((product) => [product.id, product.cost_per_kg || 0]));
  const orders = db.prepare("SELECT items_json, confirmed_at, total, discount, spice_total FROM orders WHERE status = 'confirmed'").all();
  const sold = new Map();
  const selected = Number(year) || indiaYear();
  const years = new Set([selected]);
  const months = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, orders: 0, total: 0, grams: 0, profit: 0 }));

  for (const order of orders) {
    let items = [];
    try {
      items = JSON.parse(order.items_json);
    } catch {
      items = [];
    }
    const lines = [];
    for (const item of Array.isArray(items) ? items : []) {
      const grams = Math.round(Number(item.grams) * Number(item.qty));
      const revenue = Math.round(Number(item.unitPrice) * Number(item.qty));
      if (!Number.isFinite(grams) || grams <= 0) continue;
      lines.push({
        id: String(item.productId || item.name || ""),
        name: item.name || "Spice",
        grams,
        revenue: Number.isFinite(revenue) ? revenue : 0,
        costPerKg: item.costPerKg,
      });
    }
    const spiceTotal = lines.reduce((sum, line) => sum + line.revenue, 0) || Number(order.spice_total) || 0;
    const discount = Number(order.discount) || 0;
    let orderGrams = 0;
    let orderProfit = 0;
    for (const line of lines) {
      const share = spiceTotal > 0 ? line.revenue / spiceTotal : 0;
      const lineDiscount = Math.round(discount * share);
      const savedCost = Number(line.costPerKg);
      const costPerKg = Number.isFinite(savedCost) ? savedCost : costNow.get(line.id) || 0;
      const cost = Math.round((line.grams * costPerKg) / 1000);
      const lineProfit = line.revenue - lineDiscount - cost;
      const current = sold.get(line.id) || { id: line.id, name: names.get(line.id) || line.name, grams: 0, profit: 0 };
      current.grams += line.grams;
      current.profit += lineProfit;
      sold.set(line.id, current);
      orderGrams += line.grams;
      orderProfit += lineProfit;
    }
    const when = indiaYearMonth(order.confirmed_at);
    if (!when) continue;
    years.add(when.year);
    if (when.year !== selected) continue;
    months[when.month - 1].orders += 1;
    months[when.month - 1].total += Number(order.total) || 0;
    months[when.month - 1].grams += orderGrams;
    months[when.month - 1].profit += orderProfit;
  }

  const hitRows = db.prepare("SELECT path, COUNT(*) AS hits FROM page_hits GROUP BY path").all();
  const hits = new Map();
  for (const row of hitRows) {
    const path = String(row.path || "");
    let label = pageNames[path];
    if (!label && path.startsWith("/spice/")) label = names.get(path.slice("/spice/".length)) || "Spice";
    if (!label) label = "Other";
    hits.set(label, (hits.get(label) || 0) + Number(row.hits || 0));
  }

  const lowGrams = 500;
  return {
    lowGrams,
    spices: products.map((product) => {
      const stockGrams = product.stock_grams || 0;
      return {
        id: product.id,
        name: product.name,
        stockGrams,
        soldGrams: sold.get(product.id)?.grams || 0,
        costPerKg: product.cost_per_kg || 0,
        soldPerKg: product.price_1000 || 0,
        profit: sold.get(product.id)?.profit || 0,
        level: stockGrams <= 0 ? "out" : stockGrams < lowGrams ? "low" : "ok",
      };
    }),
    sold: [...sold.values()].sort((a, b) => b.grams - a.grams || a.name.localeCompare(b.name)),
    months,
    year: selected,
    years: [...years].sort((a, b) => b - a),
    hits: [...hits.entries()]
      .map(([label, count]) => ({ label, hits: count }))
      .sort((a, b) => b.hits - a.hits || a.label.localeCompare(b.label)),
  };
}

function orderCode(phone, when = new Date()) {
  const base = `SDS-${orderDateStamp(when)}-${phone}`;
  if (!db.prepare("SELECT id FROM orders WHERE code = ?").get(base)) return base;
  for (let extra = 2; extra < 100; extra += 1) {
    const code = `${base}-${extra}`;
    if (!db.prepare("SELECT id FROM orders WHERE code = ?").get(code)) return code;
  }
  return `${base}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

function toOffer(row, today = indiaToday()) {
  let timing = "ended";
  if (row.starts_on > today) timing = "upcoming";
  else if (row.ends_on >= today) timing = "on";
  return {
    id: row.id,
    title: row.title,
    note: row.note,
    percent: row.percent,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    timing,
  };
}

function currentOffer() {
  const today = indiaToday();
  const row = db
    .prepare("SELECT * FROM offers WHERE starts_on <= ? AND ends_on >= ? ORDER BY percent DESC, starts_on DESC LIMIT 1")
    .get(today, today);
  return row ? toOffer(row, today) : null;
}

function readOffer(body) {
  const title = String(body?.title || "").trim();
  if (title.length < 2 || title.length > 80) return { error: "Enter the festival name" };
  const percent = Number(body?.percent);
  if (!Number.isInteger(percent) || percent < 1 || percent > 90) return { error: "Enter a discount from 1 to 90 percent" };
  const startsOn = String(body?.startsOn || "");
  const endsOn = String(body?.endsOn || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(endsOn)) {
    return { error: "Enter the start and end dates" };
  }
  if (endsOn < startsOn) return { error: "The end date has to be on or after the start date" };
  const note = String(body?.note || "").trim();
  if (note.length > 400) return { error: "Keep the note shorter" };
  return { value: { title, percent, startsOn, endsOn, note } };
}

function readOrder(body) {
  const nameError = lettersOnly("name", body.name);
  if (nameError) return { error: nameError };
  const cityError = lettersOnly("city", body.city);
  if (cityError) return { error: cityError };
  const phone = String(body.phone || "").replace(/\D/g, "");
  if (!/^[6-9]\d{9}$/.test(phone)) return { error: "Enter a valid 10-digit mobile number" };
  const door = String(body.door || "").trim();
  if (!door || door.length > 40 || !/\d/.test(door)) return { error: "Enter a valid door number" };
  const address = String(body.address || "").trim();
  if (address.length < 3 || address.length > 240) return { error: "Enter the complete address" };
  const pin = String(body.pin || "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(pin)) return { error: "Enter a 6-digit PIN number" };
  const district = String(body.district || "").trim();
  if (district.length < 2 || district.length > 40) return { error: "Enter the district" };
  const landmark = String(body.landmark || "").trim();
  const note = String(body.note || "").trim();
  if (landmark.length > 80) return { error: "Keep the landmark under 80 characters" };
  if (note.length > 240) return { error: "Keep the note under 240 characters" };
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) {
    return { error: "Add a spice before sending the order" };
  }

  const items = [];
  const asked = new Map();
  for (const item of body.items) {
    const grams = Number(item.grams);
    const qty = Math.round(Number(item.qty));
    if (!PACKS.includes(grams) || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      return { error: "Choose a pack and a quantity for each spice" };
    }
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(String(item.productId || ""));
    if (!product) return { error: "One of the spices is no longer in the shop" };
    const have = product.stock_grams || 0;
    if (!product.in_stock || have <= 0) return { error: `${product.name} is sold out` };
    const need = (asked.get(product.id) || 0) + grams * qty;
    if (need > have) {
      const leftLabel = have >= 1000 ? `${Math.round((have / 1000) * 100) / 100} kg` : `${have} g`;
      return { error: `${product.name} has ${leftLabel} left in the shop` };
    }
    asked.set(product.id, need);
    const unitPrice = product[`price_${grams}`] || Math.round((product.rate_per_kg * grams) / 1000);
    if (!unitPrice) return { error: `Set a price for ${product.name}` };
    items.push({
      productId: product.id,
      name: product.name,
      grams,
      label: packLabel(grams),
      unitPrice,
      qty,
    });
  }

  const spiceTotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const grams = items.reduce((sum, item) => sum + item.grams * item.qty, 0);
  const settings = getSettings();
  const limitKg = Number(settings.deliveryLimitKg) || 5;
  const deliveryCharge = Math.round(grams / 1000 > limitKg ? Number(settings.deliveryPerKgAbove) || 0 : Number(settings.deliveryPerKgUpTo) || 0);
  const offer = currentOffer();
  const discount = offer ? Math.round((spiceTotal * offer.percent) / 100) : 0;
  return {
    value: {
      name: String(body.name).trim(),
      phone,
      door,
      city: String(body.city).trim(),
      address,
      pin,
      district,
      landmark,
      note,
      items,
      spiceTotal,
      deliveryCharge,
      discount,
      offerTitle: offer?.title || "",
      offerPercent: offer?.percent || 0,
      total: spiceTotal - discount + deliveryCharge,
      paymentNote: settings.paymentNote,
      deliveryNote: settings.deliveryNote,
      brandName: settings.brandName,
    },
  };
}

function orderText(order) {
  const lines = order.items.map(
    (item) => `- ${item.name}, ${item.label} × ${item.qty} — ${rupees(item.unitPrice)} each`,
  );
  return [
    `Hello ${order.brandName}, I would like to order:`,
    `Order code: ${order.code}`,
    "",
    ...lines,
    "",
    `Spices: ${rupees(order.spiceTotal)}`,
    order.discount
      ? `Festival offer (${order.offerTitle}): ${order.offerPercent}% off spices, -${rupees(order.discount)}`
      : null,
    `Delivery: ${order.deliveryCharge ? rupees(order.deliveryCharge) : "Free"}`,
    `Estimated total: ${rupees(order.total)}`,
    "",
    order.paymentNote || "Pay by UPI or cash. We confirm the payment with you on WhatsApp.",
    order.deliveryNote || "",
    "",
    `Name: ${order.name}`,
    `Phone: ${order.phone}`,
    `Door number: ${order.door}`,
    `City: ${order.city}`,
    `Complete address: ${order.address}`,
    `PIN: ${order.pin}`,
    `District: ${order.district}`,
    order.landmark ? `Landmark: ${order.landmark}` : null,
    order.note ? `Note: ${order.note}` : null,
    "",
    "Please confirm the total, delivery, and payment.",
    "",
    "Shop link:",
    "{{SHOP_CONFIRM_URL}}",
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function toOrder(row) {
  return {
    id: row.id,
    code: row.code,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    status: row.status,
    name: row.name,
    phone: row.phone,
    door: row.door,
    city: row.city,
    address: row.address,
    pin: row.pin,
    district: row.district,
    landmark: row.landmark,
    note: row.note,
    items: JSON.parse(row.items_json),
    spiceTotal: row.spice_total,
    deliveryCharge: row.delivery_charge,
    discount: row.discount || 0,
    offerTitle: row.offer_title || "",
    offerPercent: row.offer_percent || 0,
    total: row.total,
  };
}

app.post("/api/orders", (req, res) => {
  const parsed = readOrder(req.body);
  if (parsed.error) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const order = parsed.value;
  const id = `order-${randomBytes(8).toString("hex")}`;
  const code = orderCode(order.phone);
  const token = randomBytes(24).toString("hex");
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO orders (
      id, code, created_at, name, phone, door, city, address, pin, district, landmark, note,
      items_json, spice_total, delivery_charge, total, status, confirm_token, confirmed_at,
      offer_title, offer_percent, discount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'held', ?, '', ?, ?, ?)`,
  ).run(
    id,
    code,
    now,
    order.name,
    order.phone,
    order.door,
    order.city,
    order.address,
    order.pin,
    order.district,
    order.landmark,
    order.note,
    JSON.stringify(order.items),
    order.spiceTotal,
    order.deliveryCharge,
    order.total,
    token,
    order.offerTitle,
    order.offerPercent,
    order.discount,
  );
  res.status(201).json({
    code,
    confirmPath: `/desk/${token}`,
    message: orderText({ ...order, code }),
  });
});

app.post("/api/admin/orders/delete", requireAdmin, (req, res) => {
  const ids = [
    ...new Set(
      (Array.isArray(req.body?.ids) ? req.body.ids : []).filter((id) => typeof id === "string" && /^order-[a-f0-9]+$/.test(id)),
    ),
  ];
  if (!ids.length) {
    res.status(400).json({ error: "Choose an order to remove" });
    return;
  }
  const find = db.prepare("SELECT * FROM orders WHERE id = ? AND status = 'confirmed'");
  const remove = db.prepare("DELETE FROM orders WHERE id = ? AND status = 'confirmed'");
  let removed = 0;
  db.exec("BEGIN");
  try {
    for (const id of ids) {
      const row = find.get(id);
      if (!row) continue;
      if (row.stock_counted) changeStock(row, 1);
      removed += Number(remove.run(id).changes) || 0;
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  res.json({ removed });
});

app.get("/api/offers", (req, res) => {
  const today = indiaToday();
  const offers = db
    .prepare("SELECT * FROM offers")
    .all()
    .map((row) => toOffer(row, today))
    .sort((a, b) => {
      const rank = { on: 0, upcoming: 1, ended: 2 };
      return rank[a.timing] - rank[b.timing] || a.startsOn.localeCompare(b.startsOn);
    });
  res.json(offers);
});

app.post("/api/admin/offers", requireAdmin, (req, res) => {
  const parsed = readOffer(req.body);
  if (parsed.error) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const offer = parsed.value;
  const id = `offer-${randomBytes(8).toString("hex")}`;
  db.prepare(
    "INSERT INTO offers (id, title, note, percent, starts_on, ends_on, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, offer.title, offer.note, offer.percent, offer.startsOn, offer.endsOn, new Date().toISOString());
  const saved = db.prepare("SELECT * FROM offers WHERE id = ?").get(id);
  res.status(201).json(toOffer(saved));
});

app.put("/api/admin/offers/:id", requireAdmin, (req, res) => {
  const current = db.prepare("SELECT * FROM offers WHERE id = ?").get(req.params.id);
  if (!current) {
    res.status(404).json({ error: "That offer is not on the site." });
    return;
  }
  const parsed = readOffer(req.body);
  if (parsed.error) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const offer = parsed.value;
  db.prepare("UPDATE offers SET title = ?, note = ?, percent = ?, starts_on = ?, ends_on = ? WHERE id = ?").run(
    offer.title,
    offer.note,
    offer.percent,
    offer.startsOn,
    offer.endsOn,
    current.id,
  );
  res.json(toOffer(db.prepare("SELECT * FROM offers WHERE id = ?").get(current.id)));
});

app.delete("/api/admin/offers/:id", requireAdmin, (req, res) => {
  const current = db.prepare("SELECT * FROM offers WHERE id = ?").get(req.params.id);
  if (!current) {
    res.status(404).json({ error: "That offer is not on the site." });
    return;
  }
  db.prepare("DELETE FROM offers WHERE id = ?").run(current.id);
  res.json({ ok: true });
});

app.get("/api/admin/menu", requireAdmin, (_req, res) => {
  const outOfStock = db
    .prepare("SELECT name FROM products WHERE stock_grams <= 0 ORDER BY sort_order, name")
    .all()
    .map((row) => row.name);
  res.json({
    outOfStock,
    items: [
      { to: "/admin", label: "Home", end: true },
      { to: "/admin/orders", label: "Orders", end: false },
      { to: "/admin/stock", label: "Stock", end: false, badge: outOfStock.length },
      { to: "/admin/offers", label: "Offers", end: false },
      { to: "/admin/spices", label: "Spices", end: true },
      { to: "/admin/spices/new", label: "Add a spice", end: false },
      { to: "/admin/reviews", label: "Reviews", end: true },
      { to: "/admin/reviews/new", label: "Add a review", end: false },
      { to: "/admin/shop", label: "Shop details", end: false },
      { to: "/admin/password", label: "Password", end: false },
    ],
  });
});

app.get("/api/admin/stock", requireAdmin, (req, res) => {
  res.json(stockReport(req.query.year));
});

app.put("/api/admin/stock", requireAdmin, (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const update = db.prepare("UPDATE products SET stock_grams = ? WHERE id = ?");
  for (const item of items) {
    const kg = Number(item?.kg);
    const id = String(item?.id || "");
    if (!id || !Number.isFinite(kg) || kg < 0 || kg > 100000) continue;
    update.run(Math.round(kg * 1000), id);
  }
  res.json(stockReport(req.body?.year));
});

app.post("/api/hits", (req, res) => {
  const path = String(req.body?.path || "").split("?")[0].slice(0, 80);
  if (!/^\/[a-z0-9/_-]*$/i.test(path) || path.startsWith("/admin") || path.startsWith("/desk") || path.startsWith("/sign-in")) {
    res.json({ ok: true });
    return;
  }
  db.prepare("INSERT INTO page_hits (path, created_at) VALUES (?, ?)").run(path, new Date().toISOString());
  res.json({ ok: true });
});

app.get("/api/admin/orders", requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM orders WHERE status = 'confirmed' ORDER BY confirmed_at DESC").all();
  res.json(rows.map(toOrder));
});

app.get("/api/admin/orders/by-token/:token", requireAdmin, (req, res) => {
  const row = db.prepare("SELECT * FROM orders WHERE confirm_token = ?").get(req.params.token);
  if (!row) {
    res.status(404).json({ error: "This confirmation link is not valid." });
    return;
  }
  res.json(toOrder(row));
});

app.post("/api/admin/orders/by-token/:token/confirm", requireAdmin, (req, res) => {
  const row = db.prepare("SELECT * FROM orders WHERE confirm_token = ?").get(req.params.token);
  if (!row) {
    res.status(404).json({ error: "This confirmation link is not valid." });
    return;
  }
  if (row.status !== "confirmed") {
    stampItemCosts(row);
    changeStock(row, -1);
    db.prepare("UPDATE orders SET status = 'confirmed', confirmed_at = ?, stock_counted = 1 WHERE id = ?").run(new Date().toISOString(), row.id);
  }
  const saved = db.prepare("SELECT * FROM orders WHERE id = ?").get(row.id);
  res.json({ order: toOrder(saved), already: row.status === "confirmed" });
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
  console.log(`Shivdurga Kerala Spices server  http://localhost:${port}`);
});
