import { useEffect, useState } from "react";
import { useCatalog } from "../catalog";
import { SpiceCard } from "../components/SpiceCard";
import { rupees } from "../format";

export function Shop() {
  const { products, settings, status } = useCatalog();
  const [category, setCategory] = useState("All");
  const brand = settings?.brandName || "Shiv Durga Spices";
  const categories = ["All", ...new Set(products.map((product) => product.category))];
  const visible = category === "All" ? products : products.filter((product) => product.category === category);

  useEffect(() => {
    document.title = `Shop · ${brand}`;
  }, [brand]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs tracking-[0.2em] text-saffron uppercase">The shop</p>
      <h1 className="mt-2 font-serif text-5xl">Every spice, four pack sizes</h1>
      <p className="mt-3 max-w-xl text-ink/75">
        Tap a weight to see its price. Each price is today’s auction rate for that pack. Delivery is{" "}
        {Number(settings?.deliveryCharge) ? `${rupees(settings.deliveryCharge)}.` : "free."}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-full px-4 py-2 text-sm ${category === item ? "bg-ink text-cream" : "border border-line bg-card"}`}
          >
            {item}
          </button>
        ))}
      </div>
      {status === "loading" && <p className="mt-8 text-ink/70">Opening the shop…</p>}
      {status === "error" && <p className="mt-8 text-maroon">The shop server is not running.</p>}
      {status === "ready" && visible.length === 0 && <p className="mt-8 text-ink/70">Nothing in that group yet.</p>}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((product) => (
          <SpiceCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
