import { DatabaseSync } from "node:sqlite";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const dataDir = path.join(__dirname, "data");
export const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, "shop.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    rate_per_kg INTEGER NOT NULL,
    image TEXT,
    in_stock INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    quote TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    stars INTEGER NOT NULL DEFAULT 5,
    image TEXT,
    sort_order INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    door TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    pin TEXT NOT NULL,
    district TEXT NOT NULL,
    landmark TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    items_json TEXT NOT NULL,
    spice_total INTEGER NOT NULL,
    delivery_charge INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'new'
  );
`);

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (columns.some((col) => col.name === column)) return false;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  return true;
}

ensureColumn("admin", "username", "TEXT NOT NULL DEFAULT 'admin'");
ensureColumn("orders", "confirm_token", "TEXT NOT NULL DEFAULT ''");
const addedBestSeller = ensureColumn("products", "best_seller", "INTEGER NOT NULL DEFAULT 0");
if (addedBestSeller) {
  db.prepare("UPDATE products SET best_seller = 1 WHERE lower(name) LIKE '%cardamom%'").run();
}
for (const grams of [100, 250, 500, 1000]) {
  ensureColumn("products", `price_${grams}`, "INTEGER NOT NULL DEFAULT 0");
}

export const PACKS = [100, 250, 500, 1000];

export function packLabel(grams) {
  return grams === 1000 ? "1 kg" : `${grams} g`;
}

export function priceFor(ratePerKg, grams) {
  return Math.round((ratePerKg * grams) / 1000);
}

export function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    image: row.image,
    inStock: Boolean(row.in_stock),
    bestSeller: Boolean(row.best_seller),
    updatedAt: row.updated_at,
    packs: PACKS.map((grams) => ({
      grams,
      label: packLabel(grams),
      price: row[`price_${grams}`] || priceFor(row.rate_per_kg, grams),
    })),
  };
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export function setPassword(password) {
  const { salt, hash } = hashPassword(password);
  db.prepare(
    "INSERT INTO admin (id, salt, password_hash) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET salt = excluded.salt, password_hash = excluded.password_hash",
  ).run(salt, hash);
}

function setting(key, fallback) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  if (!row) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(key, fallback);
    return fallback;
  }
  return row.value;
}

const defaults = [
  ["cardamom", "Cardamom", "A fragrant spice with a sweet, refreshing aroma, commonly used in sweets, tea, and cooking.", 3600, 1],
  ["clove", "Clove", "A warm and aromatic spice with a strong, slightly sweet flavour, widely used in cooking and beverages.", 880, 1],
  ["cinnamon-stick", "Cinnamon Stick", "A naturally sweet and aromatic spice used to add warmth and flavour to curries, desserts, and drinks.", 480, 0],
  ["black-pepper", "Black Pepper", "A classic spice with a sharp, pungent flavour that enhances the taste of a wide variety of dishes.", 980, 0],
  ["star-anise", "Star Anise", "A star-shaped spice with a sweet, licorice-like aroma, often used in biryanis, curries, and beverages.", 360, 0],
  ["mace", "Mace", "The delicate, aromatic outer covering of nutmeg, known for its warm and slightly sweet flavour.", 1200, 0],
  ["nutmeg", "Nutmeg", "A warm, fragrant spice with a slightly sweet and nutty flavour, perfect for sweets, curries, and beverages.", 1300, 0],
  ["bay-leaf", "Bay Leaf", "An aromatic leaf that adds a subtle, earthy fragrance and flavour to rice dishes, curries, and gravies.", 700, 0],
];

const previousPhotoIds = {
  cardamom: ["cardamom", "kashmiri-chilli"],
  clove: ["clove", "garam-masala"],
  "cinnamon-stick": ["cinnamon-stick", "turmeric"],
  "black-pepper": ["black-pepper", "cumin"],
  "star-anise": ["star-anise", "coriander"],
  mace: ["mace"],
  nutmeg: ["nutmeg"],
  "bay-leaf": ["bay-leaf"],
};

const bundledPhotos = {
  cardamom: "/spices/cardamom.jpg",
  clove: "/spices/clove.jpg",
  "cinnamon-stick": "/spices/cinnamon-stick.jpg",
  "black-pepper": "/spices/black-pepper.jpg",
  "star-anise": "/spices/star-anise.jpg",
  mace: "/spices/mace.jpg",
  nutmeg: "/spices/nutmeg.jpg",
  "bay-leaf": "/spices/bay-leaf.jpg",
};

const obsoleteIds = ["kashmiri-chilli", "turmeric", "coriander", "garam-masala", "cumin", "mustard"];

function savedPhoto(imageById, id) {
  for (const previousId of previousPhotoIds[id] || []) {
    const image = imageById.get(previousId);
    if (!image || !image.startsWith("/uploads/")) continue;
    const file = path.join(uploadsDir, path.basename(image));
    if (fs.existsSync(file)) return image;
  }
  return null;
}

function insertDefaultSpices(imageById = new Map()) {
  const insert = db.prepare(
    `INSERT INTO products (
      id, name, category, description, rate_per_kg, image, in_stock, best_seller, sort_order, updated_at,
      price_100, price_250, price_500, price_1000
    ) VALUES (?, ?, 'Whole', ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const now = new Date().toISOString();
  defaults.forEach(([id, name, description, rate, bestSeller], index) => {
    insert.run(
      id,
      name,
      description,
      rate,
      savedPhoto(imageById, id) || bundledPhotos[id] || null,
      bestSeller,
      index + 1,
      now,
      priceFor(rate, 100),
      priceFor(rate, 250),
      priceFor(rate, 500),
      rate,
    );
  });
}

db.prepare(
  `UPDATE products SET
    price_100 = ROUND(rate_per_kg * 100 / 1000.0),
    price_250 = ROUND(rate_per_kg * 250 / 1000.0),
    price_500 = ROUND(rate_per_kg * 500 / 1000.0),
    price_1000 = rate_per_kg
  WHERE price_100 = 0 AND price_250 = 0 AND price_500 = 0 AND price_1000 = 0 AND rate_per_kg > 0`,
).run();

const catalogVersion = db.prepare("SELECT value FROM settings WHERE key = 'catalog_version'").get()?.value;
const productCount = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
const obsoleteCount = db
  .prepare(`SELECT COUNT(*) AS n FROM products WHERE id IN (${obsoleteIds.map(() => "?").join(", ")})`)
  .get(...obsoleteIds).n;

if (catalogVersion !== "2" && (productCount === 0 || obsoleteCount > 0)) {
  const imageById = new Map(db.prepare("SELECT id, image FROM products").all().map((row) => [row.id, row.image]));
  db.prepare("DELETE FROM products").run();
  insertDefaultSpices(imageById);
  db.prepare("INSERT INTO settings (key, value) VALUES ('catalog_version', '2') ON CONFLICT(key) DO UPDATE SET value = '2'").run();
} else if (catalogVersion !== "2") {
  db.prepare("INSERT INTO settings (key, value) VALUES ('catalog_version', '2') ON CONFLICT(key) DO UPDATE SET value = '2'").run();
}

const useBundledPhoto = db.prepare("UPDATE products SET image = ? WHERE id = ?");
for (const [id, image] of Object.entries(bundledPhotos)) {
  const row = db.prepare("SELECT image FROM products WHERE id = ?").get(id);
  if (!row) continue;
  const upload = row.image && row.image.startsWith("/uploads/") ? path.join(uploadsDir, path.basename(row.image)) : "";
  if (upload && fs.existsSync(upload)) continue;
  if (row.image !== image) useBundledPhoto.run(image, id);
}

setting("brand_name", "Shivdurga Kerala Spices");
const storedBrand = db.prepare("SELECT value FROM settings WHERE key = 'brand_name'").get()?.value || "";
const foldedBrand = storedBrand.toLowerCase().replace(/\s+/g, "");
if (foldedBrand === "shivdurgaspices" || foldedBrand === "shivdurgakeralaspices") {
  db.prepare("UPDATE settings SET value = ? WHERE key = 'brand_name'").run("Shivdurga Kerala Spices");
}
setting("whatsapp_number", "");
setting("tagline", "Taste and trust, straight from Keralam");
if (db.prepare("SELECT value FROM settings WHERE key = 'tagline'").get()?.value === "Taste and trust, straight from Kerala") {
  db.prepare("UPDATE settings SET value = ? WHERE key = 'tagline'").run("Taste and trust, straight from Keralam");
}
setting("phone", "917672091892");
setting("email", "shivdurgaspices@gmail.com");
setting("delivery_charge", "0");
setting("delivery_limit_kg", "5");
setting("delivery_per_kg_upto", "90");
setting("delivery_per_kg_above", "60");
setting("delivery_note", "We deliver to the address you enter.");
const oldDeliveryNote = "We deliver to the address you enter. The delivery charge below is added to the order.";
if (db.prepare("SELECT value FROM settings WHERE key = 'delivery_note'").get()?.value === oldDeliveryNote) {
  db.prepare("UPDATE settings SET value = ? WHERE key = 'delivery_note'").run("We deliver to the address you enter.");
}
setting("payment_note", "Pay by UPI or cash. We confirm the payment with you on WhatsApp.");

if (!db.prepare("SELECT id FROM admin WHERE id = 1").get()) {
  setPassword(process.env.ADMIN_PASSWORD || "shivdurga");
}

const reviewSeeds = [
  ["happy", "The product is really, really good.", "/reviews/happy.jpg"],
  ["cardamom", "The cardamom is really good this time.", "/reviews/cardamom.jpg"],
  ["arrived", "It arrived yesterday. There is no damage, and it is good.", "/reviews/arrived.jpg"],
  ["aroma", "Super aroma, and it is tasty.", "/reviews/aroma.jpg"],
  ["parcel", "Spices received. The aroma is really good.", "/reviews/parcel.jpg"],
  ["orders", "The aroma is really good, and we are ready to order more.", "/reviews/orders.jpg"],
  ["kerala-taste", "The spices are really good, like what I bought five years back in Kerala.", "/reviews/kerala-taste.jpg"],
  ["packing-quality", "The parcel arrived. The packing is good, and the quality is good too.", "/reviews/packing-quality.jpg"],
  ["fresh-cardamom", "The parcel arrived. The spices are fresh, and the cardamom is very good.", "/reviews/fresh-cardamom.jpg"],
  ["elachi-quality", "The quality is super. The cardamom is so good, I feel like eating it as it is.", "/reviews/elachi-quality.jpg"],
  ["order-received", "I received the order. The spices are very good.", "/reviews/order-received.jpg"],
  ["super-packing", "I received the product. The quality is super and the packing is good.", "/reviews/super-packing.jpg"],
  ["strong-aroma", "The packing is really good. The quality is very good, and the smell is strong when the parcel is opened.", "/reviews/strong-aroma.jpg"],
  ["good-packing", "I received the parcel. The quality and packing are good.", "/reviews/good-packing.jpg"],
  ["true-flavor", "The nuts and spices smell natural, and the packing is amazing. I would like to buy more.", "/reviews/true-flavor.jpg"],
  ["spices-good", "The spices are really very good.", "/reviews/spices-good.jpg"],
  ["aroma-received", "The spices arrived, and the aroma is very good.", "/reviews/aroma-received.jpg"],
  ["more-orders", "My friends are ready to order, and people in my apartment want to order too.", "/reviews/more-orders.jpg"],
  ["used-spices", "I used the spices. They are very good. Thank you.", "/reviews/used-spices.jpg"],
  ["perfect-pack", "The parcel arrived, the quality is good, and the packaging is perfect this time.", "/reviews/perfect-pack.jpg"],
  ["relatives", "My relatives said the quality is very good.", "/reviews/relatives.jpg"],
  ["just-received", "The product arrived just now. The quality is very good.", "/reviews/just-received.jpg"],
  ["aroma-nice", "The aroma is noticeable, and it is nice.", "/reviews/aroma-nice.jpg"],
  ["super-aroma", "Super aroma, and it is tasty.", "/reviews/super-aroma.jpg"],
  ["no-damage", "It arrived yesterday. There is no damage, and it is good.", "/reviews/no-damage.jpg"],
  ["family-home", "The product reached us. Everyone at home said it is good.", "/reviews/family-home.jpg"],
];

const insertReview = db.prepare(
  "INSERT INTO reviews (id, quote, label, stars, image, sort_order, created_at) VALUES (?, ?, ?, 5, ?, ?, ?)",
);
const savedReviewIds = new Set(db.prepare("SELECT id FROM reviews").all().map((row) => row.id));
let reviewSort = db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS n FROM reviews").get().n || 0;
const reviewNow = new Date().toISOString();
for (const [id, quote, image] of reviewSeeds) {
  if (savedReviewIds.has(id)) continue;
  reviewSort += 1;
  insertReview.run(id, quote, "Verified customer", image, reviewSort, reviewNow);
}

export function toReview(row) {
  return {
    id: row.id,
    quote: row.quote,
    label: row.label,
    stars: row.stars,
    image: row.image,
  };
}

export function getSettings() {
  return {
    brandName: setting("brand_name", "Shivdurga Kerala Spices"),
    whatsappNumber: setting("whatsapp_number", ""),
    tagline: setting("tagline", "Taste and trust, straight from Keralam"),
    phone: setting("phone", "917672091892"),
    email: setting("email", "shivdurgaspices@gmail.com"),
    deliveryLimitKg: Number(setting("delivery_limit_kg", "5")) || 5,
    deliveryPerKgUpTo: Number(setting("delivery_per_kg_upto", "90")) || 0,
    deliveryPerKgAbove: Number(setting("delivery_per_kg_above", "60")) || 0,
    deliveryNote: setting("delivery_note", "We deliver to the address you enter."),
    paymentNote: setting("payment_note", "Pay by UPI or cash. We confirm the payment with you on WhatsApp."),
  };
}

export function saveSettings(next) {
  const put = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  put.run("brand_name", next.brandName);
  put.run("whatsapp_number", next.whatsappNumber);
  put.run("tagline", next.tagline);
  put.run("phone", next.phone);
  put.run("email", next.email);
  put.run("delivery_limit_kg", String(next.deliveryLimitKg));
  put.run("delivery_per_kg_upto", String(next.deliveryPerKgUpTo));
  put.run("delivery_per_kg_above", String(next.deliveryPerKgAbove));
  put.run("delivery_note", next.deliveryNote);
  put.run("payment_note", next.paymentNote);
  return getSettings();
}
