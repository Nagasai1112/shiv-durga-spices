import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../cart";
import { useCatalog } from "../catalog";
import { SpiceVisual } from "../components/SpiceVisual";
import { rupees } from "../format";

export function SpicePage() {
  const { id } = useParams();
  const { products, settings, status } = useCatalog();
  const { add } = useCart();
  const product = products.find((item) => item.id === id);
  const [grams, setGrams] = useState(100);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    document.title = product ? `${product.name} · ${settings?.brandName || "Shiv Durga Spices"}` : "Spice";
  }, [product, settings]);

  if (status === "loading") return <main className="mx-auto max-w-6xl px-5 py-16">Opening the shop…</main>;
  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-16">
        <p>This spice is not in the shop.</p>
        <Link to="/shop" className="mt-4 inline-block text-leaf">
          Back to the shop
        </Link>
      </main>
    );
  }

  const pack = product.packs.find((item) => item.grams === grams) || product.packs[0];

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-2">
      <div className="overflow-hidden rounded-[2rem] border border-line bg-cream-deep">
        <SpiceVisual product={product} className="aspect-square w-full" />
      </div>
      <div>
        <p className="text-xs tracking-[0.18em] text-saffron uppercase">{product.category}</p>
        <h1 className="mt-2 font-serif text-5xl">{product.name}</h1>
        <p className="mt-4 max-w-lg text-lg text-ink/75">{product.description}</p>
        <p className="mt-4 text-sm text-ink/70">Today’s auction rate {rupees(product.ratePerKg)} per kg</p>
        <p className="mt-4 font-serif text-5xl">{rupees(pack.price)}</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {product.packs.map((item) => {
            const selected = item.grams === pack.grams;
            return (
              <button
                key={item.grams}
                type="button"
                aria-pressed={selected}
                onClick={() => setGrams(item.grams)}
                className={`rounded-xl px-2 py-3 text-center text-sm ${selected ? "bg-ink text-cream" : "border border-line bg-card text-ink"}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-full border border-line bg-card px-3 py-2">
            <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Fewer packs">
              −
            </button>
            <span className="min-w-6 text-center">{qty}</span>
            <button type="button" onClick={() => setQty((value) => value + 1)} aria-label="More packs">
              +
            </button>
          </div>
          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => add(product, pack, qty)}
            className="rounded-full bg-leaf px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
          >
            {product.inStock ? `Add ${qty} × ${pack.label}` : "Sold out"}
          </button>
        </div>
      </div>
    </main>
  );
}
