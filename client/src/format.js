export const BRAND = "Shivdurga Kerala Spices";
export const PACKS = [100, 250, 500, 1000];

export function packLabel(grams) {
  return grams === 1000 ? "1 kg" : `${grams} g`;
}

export function gramsLabel(grams) {
  const value = Math.max(0, Math.round(Number(grams) || 0));
  if (value >= 1000) return `${Math.round((value / 1000) * 100) / 100} kg`;
  return `${value} g`;
}

export function heldGrams(items, productId) {
  return (items || []).reduce((sum, item) => sum + (item.productId === productId ? Number(item.grams) * Number(item.qty) : 0), 0);
}

export function priceFor(ratePerKg, grams) {
  const rate = Number(ratePerKg);
  if (!Number.isFinite(rate)) return 0;
  return Math.round((rate * grams) / 1000);
}

export function phoneLabel(digits) {
  const value = String(digits || "").replace(/\D/g, "");
  if (value.length === 12 && value.startsWith("91")) return `+91 ${value.slice(2, 7)} ${value.slice(7)}`;
  if (value.length === 10) return `+91 ${value.slice(0, 5)} ${value.slice(5)}`;
  return value ? `+${value}` : "";
}

export function orderGrams(items) {
  return items.reduce((sum, item) => sum + Number(item.grams) * Number(item.qty), 0);
}

export function deliveryFor(totalGrams, settings) {
  const grams = Math.max(0, Number(totalGrams) || 0);
  const limitKg = Number(settings?.deliveryLimitKg ?? 5);
  const upTo = Number(settings?.deliveryPerKgUpTo ?? 90);
  const above = Number(settings?.deliveryPerKgAbove ?? 60);
  if (grams <= 0) return 0;
  const kg = grams / 1000;
  const charge = kg > limitKg ? above : upTo;
  if (!Number.isFinite(charge)) return 0;
  return Math.round(charge);
}

export function deliveryLine(settings) {
  const limit = Number(settings?.deliveryLimitKg ?? 5);
  const upTo = Number(settings?.deliveryPerKgUpTo ?? 90);
  const above = Number(settings?.deliveryPerKgAbove ?? 60);
  return `Delivery is ${rupees(upTo)} for an order up to ${limit} kg, and ${rupees(above)} when the order is above ${limit} kg.`;
}

export function indiaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}

export function dayLabel(iso) {
  const [year, month, day] = String(iso || "").split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function activeOffer(offers, now = new Date()) {
  const today = indiaToday(now);
  const current = (offers || []).filter((offer) => offer.startsOn <= today && offer.endsOn >= today);
  current.sort((a, b) => b.percent - a.percent || String(b.startsOn).localeCompare(String(a.startsOn)));
  return current[0] || null;
}

export function discountFor(spiceTotal, offer) {
  const percent = Number(offer?.percent) || 0;
  const spices = Math.max(0, Math.round(Number(spiceTotal) || 0));
  if (percent < 1) return 0;
  return Math.round((spices * percent) / 100);
}

export function confirmHref(origin, confirmPath) {
  const url = new URL(confirmPath, origin);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") url.hostname = "lvh.me";
  return url.href;
}

export function rupees(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
