export const PACKS = [100, 250, 500, 1000];

export function packLabel(grams) {
  return grams === 1000 ? "1 kg" : `${grams} g`;
}

export function priceFor(ratePerKg, grams) {
  const rate = Number(ratePerKg);
  if (!Number.isFinite(rate)) return 0;
  return Math.round((rate * grams) / 1000);
}

export function rupees(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
