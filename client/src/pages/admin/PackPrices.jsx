import { PACKS, packLabel, rupees } from "../../format";
import { field } from "./field";

export function packPricesFrom(product) {
  const prices = { 100: "", 250: "", 500: "", 1000: "" };
  for (const pack of product?.packs || []) prices[pack.grams] = String(pack.price ?? "");
  return prices;
}

export function PackPrices({ prices, costPerKg, onChange, onCost }) {
  const cost = Number(costPerKg);
  const known = Number.isFinite(cost) && cost > 0;
  const gaps = PACKS.map((grams) => {
    const sell = Number(prices[grams]);
    if (!known || !Number.isFinite(sell) || sell <= 0) return null;
    const paid = Math.round((cost * grams) / 1000);
    return { grams, profit: sell - paid };
  }).filter(Boolean);

  return (
    <>
      <div className="md:col-span-2">
        <p className="font-medium">Selling price</p>
        <p className="mt-1 text-ink/70">
          You choose what the customer pays. A smaller pack can be priced higher for its size, and a larger pack a little lower.
        </p>
      </div>
      {PACKS.map((grams) => (
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
      ))}
      <label className="text-sm md:col-span-2">
        Buying price today (₹ per kg)
        <input
          inputMode="numeric"
          value={costPerKg ?? ""}
          onChange={(event) => onCost(event.target.value.replace(/\D/g, ""))}
          placeholder="What you paid today"
          aria-label="Buying price per kilogram"
          className={field}
        />
        <span className="mt-1 block text-ink/60">
          This changes when you buy at a new price. The shop does not show it. Your profit is the selling price minus this.
        </span>
      </label>
      {gaps.length > 0 && (
        <p className="text-sm text-ink/75 md:col-span-2">
          At this buying price,{" "}
          {gaps
            .map((gap) =>
              gap.profit < 0
                ? `${packLabel(gap.grams)} is ${rupees(Math.abs(gap.profit))} under the buying price`
                : `${packLabel(gap.grams)} leaves ${rupees(gap.profit)}`,
            )
            .join(", ")}
          .
        </p>
      )}
    </>
  );
}
