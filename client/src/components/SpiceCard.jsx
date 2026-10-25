import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../cart";
import { rupees } from "../format";
import { SpiceVisual } from "./SpiceVisual";

export function SpiceCard({ product }) {
  const { add } = useCart();
  const [grams, setGrams] = useState(product.packs[0].grams);
  const pack = product.packs.find((item) => item.grams === grams) || product.packs[0];

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-[0_16px_40px_rgba(42,33,24,0.05)]">
      <Link to={`/spice/${product.id}`} className="relative block bg-cream-deep">
        <SpiceVisual product={product} className="aspect-[4/3] w-full" />
        {!product.inStock && (
          <span className="absolute top-3 left-3 rounded-full bg-ink px-3 py-1 text-xs text-cream">Sold out</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] tracking-[0.16em] text-saffron uppercase">{product.category}</p>
        <Link to={`/spice/${product.id}`} className="mt-1 font-serif text-2xl text-ink">
          {product.name}
        </Link>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {product.packs.map((item) => {
            const selected = item.grams === pack.grams;
            return (
              <button
                key={item.grams}
                type="button"
                onClick={() => setGrams(item.grams)}
                className={`rounded-2xl border px-2 py-2 text-left ${selected ? "border-saffron bg-saffron/10" : "border-line bg-cream"}`}
              >
                <span className="block text-xs text-ink/70">{item.label}</span>
                <span className="block text-sm font-semibold">{rupees(item.price)}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={!product.inStock}
          onClick={() => add(product, pack)}
          className="mt-4 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-cream disabled:cursor-not-allowed disabled:opacity-40"
        >
          {product.inStock ? `Add ${pack.label}` : "Sold out"}
        </button>
      </div>
    </article>
  );
}
