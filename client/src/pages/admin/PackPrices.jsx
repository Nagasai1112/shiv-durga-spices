import { PACKS, packLabel } from "../../format";
import { field } from "./field";

export function packPricesFrom(product) {
  const prices = { 100: "", 250: "", 500: "", 1000: "" };
  for (const pack of product?.packs || []) prices[pack.grams] = String(pack.price ?? "");
  return prices;
}

export function PackPrices({ prices, onChange }) {
  return PACKS.map((grams) => (
    <label key={grams} className="text-sm">
      {packLabel(grams)} (₹)
      <input
        inputMode="numeric"
        value={prices[grams] ?? ""}
        onChange={(event) => onChange(grams, event.target.value.replace(/\D/g, ""))}
        className={field}
        required
      />
    </label>
  ));
}
