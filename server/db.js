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
    ratePerKg: row.rate_per_kg,
    image: row.image,
    inStock: Boolean(row.in_stock),
    bestSeller: Boolean(row.best_seller),
    updatedAt: row.updated_at,
    packs: PACKS.map((grams) => ({
      grams,
      label: packLabel(grams),
      price: priceFor(row.rate_per_kg, grams),
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

const seeds = [
  ["kashmiri-chilli", "Kashmiri chilli", "Whole", "Bright red and mild. The colour in gravies, marinades, and Sunday chicken.", 1200],
  ["turmeric", "Turmeric powder", "Whole", "Golden and earthy, for dal, rice, and haldi doodh.", 480],
  ["coriander", "Coriander powder", "Whole", "Warm and citrusy. A quiet base for almost every masala.", 360],
  ["garam-masala", "Garam masala", "Whole", "A roasted house blend, added at the end so the aroma stays.", 880],
  ["cumin", "Cumin seeds", "Whole", "Nutty jeera for tadka. Crush a pinch if you want it louder.", 720],
  ["black-pepper", "Black pepper", "Whole", "Whole peppercorns with a sharp, piney heat.", 980],
  ["cardamom", "Green cardamom", "Whole", "Fragrant pods for chai, kheer, and biryani.", 3600],
  ["mustard", "Mustard seeds", "Whole", "Small black seeds that crackle as soon as they meet hot oil.", 240],
];

const count = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
if (count === 0) {
  const insert = db.prepare(
    "INSERT INTO products (id, name, category, description, rate_per_kg, image, in_stock, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, NULL, 1, ?, ?)",
  );
  const now = new Date().toISOString();
  seeds.forEach((row, index) => insert.run(...row, index + 1, now));
}

setting("brand_name", "Shiv Durga Spices");
setting("whatsapp_number", "");
setting("tagline", "Taste and trust, straight from Kerala");
setting("phone", "917672091892");
setting("email", "shivdurgaspices@gmail.com");
setting("delivery_charge", "0");
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
];

if (db.prepare("SELECT COUNT(*) AS n FROM reviews").get().n === 0) {
  const insertReview = db.prepare(
    "INSERT INTO reviews (id, quote, label, stars, image, sort_order, created_at) VALUES (?, ?, ?, 5, ?, ?, ?)",
  );
  const now = new Date().toISOString();
  reviewSeeds.forEach((row, index) => insertReview.run(row[0], row[1], "Verified customer", row[2], index + 1, now));
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
    brandName: setting("brand_name", "Shiv Durga Spices"),
    whatsappNumber: setting("whatsapp_number", ""),
    tagline: setting("tagline", "Taste and trust, straight from Kerala"),
    phone: setting("phone", "917672091892"),
    email: setting("email", "shivdurgaspices@gmail.com"),
    deliveryCharge: Number(setting("delivery_charge", "0")) || 0,
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
  put.run("delivery_charge", String(next.deliveryCharge));
  put.run("delivery_note", next.deliveryNote);
  put.run("payment_note", next.paymentNote);
  return getSettings();
}
