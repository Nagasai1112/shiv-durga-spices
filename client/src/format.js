export const PACKS = [100, 250, 500, 1000];

export function packLabel(grams) {
  return grams === 1000 ? "1 kg" : `${grams} g`;
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

export function rupees(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
