import fs from "node:fs";
import path from "node:path";
import { db, freshStarter, getSettings, saveSettings, storageIsDurable, uploadsDir } from "./db.js";

const repo = process.env.GITHUB_REPO || "Nagasai1112/shiv-durga-spices";
const branch = process.env.GITHUB_CATALOG_BRANCH || "live-data";
const filePath = "catalog.json";
const packs = [100, 250, 500, 1000];

export const temporaryStoreError =
  "This live site clears saved spices, photos, and stock when it sleeps. On Render, mount a disk at /var/data and set DATA_DIR=/var/data, or set GITHUB_TOKEN so names, photos, descriptions, and stock stay until you change them.";

let publishTail = Promise.resolve();

export function storageReport() {
  const disk = storageIsDurable();
  const github = Boolean(process.env.GITHUB_TOKEN);
  return {
    durable: disk || github,
    where: disk ? "disk" : github ? "github" : "temporary",
  };
}

function insideUploads(file) {
  const relative = path.relative(uploadsDir, file);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function readUpload(url) {
  if (!url || !url.startsWith("/uploads/")) return null;
  const filename = path.basename(url);
  if (!/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) return null;
  const file = path.join(uploadsDir, filename);
  if (!insideUploads(file) || !fs.existsSync(file)) return null;
  const bytes = fs.readFileSync(file);
  if (bytes.length < 32 || bytes.length > 5 * 1024 * 1024) return null;
  return { filename, base64: bytes.toString("base64") };
}

function writeUpload(imageFile) {
  if (!imageFile || typeof imageFile.base64 !== "string") return null;
  const filename = path.basename(String(imageFile.filename || ""));
  if (!/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) return null;
  const bytes = Buffer.from(imageFile.base64, "base64");
  if (bytes.length < 32 || bytes.length > 5 * 1024 * 1024) return null;
  const file = path.join(uploadsDir, filename);
  if (!insideUploads(file)) return null;
  fs.writeFileSync(file, bytes);
  return `/uploads/${filename}`;
}

function whole(value, min, max) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

function text(value, max) {
  const next = String(value || "").trim();
  if (!next || next.length > max) return null;
  return next;
}

function normalizeProduct(row, index) {
  const id = String(row?.id || "");
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return null;
  const name = text(row.name, 80);
  const category = text(row.category, 40);
  const description = String(row.description || "").trim();
  if (!name || !category || description.length > 500) return null;
  const prices = {};
  for (const grams of packs) {
    const price = whole(row.prices?.[grams] ?? row.prices?.[String(grams)], 1, 500000);
    if (price === null) return null;
    prices[grams] = price;
  }
  const stockGrams = whole(row.stockGrams, 0, 100000000);
  const costPerKg = whole(row.costPerKg, 0, 10000000);
  if (stockGrams === null || costPerKg === null) return null;
  const uploaded = writeUpload(row.imageFile);
  const linked = typeof row.image === "string" && /^\/(spices|uploads|reviews)\/[\w.-]+$/.test(row.image) ? row.image : null;
  const image = uploaded || linked;
  return {
    id,
    name,
    category,
    description,
    ratePerKg: prices[1000],
    image,
    listed: typeof row.listed === "boolean" ? row.listed : row.inStock !== false,
    bestSeller: row.bestSeller === true,
    sortOrder: whole(row.sortOrder, 1, 100000) || index + 1,
    updatedAt: text(row.updatedAt, 40) || new Date().toISOString(),
    prices,
    costPerKg,
    stockGrams,
  };
}

function normalizeReview(row, index) {
  const id = String(row?.id || "");
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return null;
  const quote = text(row.quote, 280);
  if (!quote) return null;
  const stars = whole(row.stars, 1, 5);
  if (stars === null) return null;
  const uploaded = writeUpload(row.imageFile);
  const linked = typeof row.image === "string" && /^\/(spices|uploads|reviews)\/[\w.-]+$/.test(row.image) ? row.image : null;
  const image = uploaded || linked;
  return {
    id,
    quote,
    label: text(row.label, 40) || "Verified customer",
    stars,
    image,
    sortOrder: whole(row.sortOrder, 1, 100000) || index + 1,
    createdAt: text(row.createdAt, 40) || new Date().toISOString(),
  };
}

export function buildSnapshot() {
  const products = db.prepare("SELECT * FROM products ORDER BY sort_order, name").all().map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    listed: Boolean(row.in_stock),
    bestSeller: Boolean(row.best_seller),
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
    stockGrams: Number(row.stock_grams) || 0,
    costPerKg: Number(row.cost_per_kg) || 0,
    image: row.image,
    imageFile: readUpload(row.image),
    prices: Object.fromEntries(packs.map((grams) => [grams, row[`price_${grams}`] || 0])),
  }));
  const reviews = db.prepare("SELECT * FROM reviews ORDER BY sort_order, created_at").all().map((row) => ({
    id: row.id,
    quote: row.quote,
    label: row.label,
    stars: row.stars,
    image: row.image,
    imageFile: readUpload(row.image),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }));
  const offers = db.prepare("SELECT * FROM offers").all().map((row) => ({
    id: row.id,
    title: row.title,
    note: row.note,
    percent: row.percent,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    createdAt: row.created_at,
  }));
  return { savedAt: new Date().toISOString(), products, reviews, offers, settings: getSettings() };
}

export function applySnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.products)) return false;
  const products = snapshot.products.map(normalizeProduct).filter(Boolean);
  if (!products.length) return false;
  const reviews = Array.isArray(snapshot.reviews) ? snapshot.reviews.map(normalizeReview).filter(Boolean) : null;
  const offers = Array.isArray(snapshot.offers)
    ? snapshot.offers
        .map((row) => {
          const id = String(row?.id || "");
          const title = text(row.title, 80);
          const startsOn = text(row.startsOn, 10);
          const endsOn = text(row.endsOn, 10);
          const percent = whole(row.percent, 1, 90);
          if (!/^offer-[a-z0-9]+$/.test(id) || !title || !startsOn || !endsOn || percent === null) return null;
          return {
            id,
            title,
            note: String(row.note || "").trim().slice(0, 200),
            percent,
            startsOn,
            endsOn,
            createdAt: text(row.createdAt, 40) || new Date().toISOString(),
          };
        })
        .filter(Boolean)
    : null;

  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM products").run();
    const insertProduct = db.prepare(
      `INSERT INTO products (
        id, name, category, description, rate_per_kg, image, in_stock, best_seller, sort_order, updated_at,
        price_100, price_250, price_500, price_1000, cost_per_kg, stock_grams
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const product of products) {
      insertProduct.run(
        product.id,
        product.name,
        product.category,
        product.description,
        product.ratePerKg,
        product.image,
        product.listed ? 1 : 0,
        product.bestSeller ? 1 : 0,
        product.sortOrder,
        product.updatedAt,
        product.prices[100],
        product.prices[250],
        product.prices[500],
        product.prices[1000],
        product.costPerKg,
        product.stockGrams,
      );
    }
    if (reviews) {
      db.prepare("DELETE FROM reviews").run();
      const insertReview = db.prepare(
        "INSERT INTO reviews (id, quote, label, stars, image, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      );
      for (const review of reviews) {
        insertReview.run(review.id, review.quote, review.label, review.stars, review.image, review.sortOrder, review.createdAt);
      }
    }
    if (offers) {
      db.prepare("DELETE FROM offers").run();
      const insertOffer = db.prepare(
        "INSERT INTO offers (id, title, note, percent, starts_on, ends_on, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      );
      for (const offer of offers) {
        insertOffer.run(offer.id, offer.title, offer.note, offer.percent, offer.startsOn, offer.endsOn, offer.createdAt);
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  if (snapshot.settings && typeof snapshot.settings === "object") saveSettings(snapshot.settings);
  return true;
}

async function github(pathname, options = {}) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    method: options.method || "GET",
    signal: AbortSignal.timeout(60000),
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "User-Agent": "shiv-durga-spices",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text.slice(0, 180) };
    }
  }
  if (!response.ok) {
    const error = new Error(data.message || `GitHub responded ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function fetchSnapshot() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "shiv-durga-spices",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const refResponse = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, {
    headers,
    signal: AbortSignal.timeout(15000),
  });
  if (refResponse.status === 404) return null;
  if (!refResponse.ok) throw new Error(`Could not read the saved catalog (${refResponse.status})`);
  const ref = await readJson(refResponse);
  const commitResponse = await fetch(ref.object.url, { headers, signal: AbortSignal.timeout(15000) });
  if (!commitResponse.ok) throw new Error("Could not read the saved catalog commit");
  const commit = await readJson(commitResponse);
  const treeResponse = await fetch(commit.tree.url, { headers, signal: AbortSignal.timeout(15000) });
  if (!treeResponse.ok) throw new Error("Could not read the saved catalog tree");
  const tree = await readJson(treeResponse);
  const entry = (tree.tree || []).find((item) => item.path === filePath);
  if (!entry) return null;
  const blobResponse = await fetch(entry.url, { headers, signal: AbortSignal.timeout(15000) });
  if (!blobResponse.ok) throw new Error("Could not read the saved catalog file");
  const blob = await readJson(blobResponse);
  const json = Buffer.from(String(blob.content || "").replace(/\n/g, ""), "base64").toString("utf8");
  return JSON.parse(json);
}

async function pushSnapshot(snapshot) {
  const encoded = Buffer.from(JSON.stringify(snapshot)).toString("base64");
  if (encoded.length > 90 * 1024 * 1024) throw new Error("The spice photos are too large to store");
  const blob = await github(`/repos/${repo}/git/blobs`, {
    method: "POST",
    body: { content: encoded, encoding: "base64" },
  });
  let parentSha = null;
  let baseTree = null;
  let branchExists = true;
  try {
    const ref = await github(`/repos/${repo}/git/ref/heads/${branch}`);
    parentSha = ref.object.sha;
    const parent = await github(`/repos/${repo}/git/commits/${parentSha}`);
    baseTree = parent.tree.sha;
  } catch (error) {
    if (error.status !== 404) throw error;
    branchExists = false;
    const main = await github("/repos/" + repo + "/git/ref/heads/main");
    parentSha = main.object.sha;
    const parent = await github(`/repos/${repo}/git/commits/${parentSha}`);
    baseTree = parent.tree.sha;
  }
  const tree = await github(`/repos/${repo}/git/trees`, {
    method: "POST",
    body: {
      base_tree: baseTree,
      tree: [{ path: filePath, mode: "100644", type: "blob", sha: blob.sha }],
    },
  });
  const commit = await github(`/repos/${repo}/git/commits`, {
    method: "POST",
    body: {
      message: "Save the shop spices and stock",
      tree: tree.sha,
      parents: [parentSha],
    },
  });
  if (branchExists) {
    await github(`/repos/${repo}/git/refs/heads/${branch}`, { method: "PATCH", body: { sha: commit.sha } });
  } else {
    await github(`/repos/${repo}/git/refs`, {
      method: "POST",
      body: { ref: `refs/heads/${branch}`, sha: commit.sha },
    });
  }
}

export async function restoreCatalog() {
  if (!freshStarter) return { restored: false };
  try {
    const snapshot = await fetchSnapshot();
    if (!snapshot) return { restored: false };
    const applied = applySnapshot(snapshot);
    return applied ? { restored: true, savedAt: snapshot.savedAt } : { restored: false };
  } catch (error) {
    console.error("Could not restore the shop catalog.", error.message);
    return { restored: false };
  }
}

async function publishCatalogNow() {
  if (!process.env.GITHUB_TOKEN) {
    if (storageIsDurable()) return { ok: true, where: "disk" };
    return { ok: false, error: temporaryStoreError };
  }
  try {
    await pushSnapshot(buildSnapshot());
    return { ok: true, where: "github" };
  } catch (error) {
    if (storageIsDurable()) return { ok: true, where: "disk" };
    return { ok: false, error: `The spice list could not be saved for the next visit. ${error.message}` };
  }
}

export function publishCatalog() {
  const run = publishTail.then(publishCatalogNow, publishCatalogNow);
  publishTail = run.then(
    () => {},
    () => {},
  );
  return run;
}
