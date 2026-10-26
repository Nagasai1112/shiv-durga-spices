import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useCatalog } from "../catalog";
import { SpiceCard } from "../components/SpiceCard";
import { BRAND, deliveryLine } from "../format";

export function Shop() {
  const { products, settings, status } = useCatalog();
  const location = useLocation();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const brand = settings?.brandName || BRAND;
  const categories = ["All", ...new Set(products.map((product) => product.category))];
  const needle = query.trim().toLowerCase();
  const visible = products.filter((product) => {
    if (category !== "All" && product.category !== category) return false;
    if (!needle) return true;
    return `${product.name} ${product.description}`.toLowerCase().includes(needle);
  });

  useEffect(() => {
    document.title = `Shop · ${brand}`;
  }, [brand]);

  useEffect(() => {
    if (location.state?.focusSearch) document.getElementById("spice-search")?.focus();
  }, [location.state]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs tracking-[0.2em] text-saffron uppercase">The shop</p>
      <h1 className="mt-2 font-serif text-5xl">Every spice, four pack sizes</h1>
      <p className="mt-3 max-w-xl text-ink/75">
        Tap a weight to see its price. The shop sets each pack price on its own. {deliveryLine(settings)}
      </p>
      <label className="mt-6 block max-w-md text-sm">
        Search a spice
        <input
          id="spice-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cardamom, pepper, cloves"
          className="mt-2 w-full rounded-full border border-line bg-card px-4 py-2"
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
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
      {status === "ready" && visible.length === 0 && (
        <p className="mt-8 text-ink/70">{needle ? "No spice matches that search." : "Nothing in that group yet."}</p>
      )}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((product) => (
          <SpiceCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
