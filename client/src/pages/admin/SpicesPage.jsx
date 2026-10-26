import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../api";
import { useCatalog } from "../../catalog";
import { CrossButton } from "../../components/CrossButton";
import { SpiceVisual } from "../../components/SpiceVisual";
import { PACKS, priceFor, rupees } from "../../format";
import { field } from "./field";

export function SpicesPage() {
  const { products, reload } = useCatalog();
  const { state } = useLocation();

  useEffect(() => {
    document.title = "Spices · Admin";
  }, []);

  return (
    <section>
      <h1 className="font-serif text-5xl">Spice rates and photos</h1>
      <p className="mt-3 max-w-xl text-ink/75">
        Change one number, the auction rate per kg. The shop recalculates 100 g, 250 g, 500 g, and 1 kg for every visitor.
      </p>
      {state?.notice && <p className="mt-4 text-sm text-leaf">{state.notice}</p>}
      <div className="mt-6 space-y-5">
        {products.map((product) => (
          <ProductEditor key={product.id} product={product} onSaved={reload} />
        ))}
      </div>
      {products.length === 0 && (
        <p className="mt-6 text-sm text-ink/75">
          No spices yet. <Link to="/admin/spices/new" className="text-leaf">Add a spice</Link>.
        </p>
      )}
    </section>
  );
}

function ProductEditor({ product, onSaved }) {
  const [form, setForm] = useState({
    name: product.name,
    category: product.category,
    description: product.description,
    ratePerKg: product.ratePerKg,
    inStock: product.inStock,
    bestSeller: Boolean(product.bestSeller),
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...form, ratePerKg: Number(form.ratePerKg) }),
      });
      setMessage("Saved. The shop is using this rate.");
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("image", file);
      await api(`/api/admin/products/${product.id}/image`, { method: "POST", body });
      setMessage("Photo updated.");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Remove ${product.name} from the shop?`)) return;
    try {
      await api(`/api/admin/products/${product.id}`, { method: "DELETE" });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-5 rounded-[2rem] border border-line bg-card p-5 md:grid-cols-[180px_1fr]">
      <div>
        <div className="overflow-hidden rounded-2xl bg-cream-deep">
          <SpiceVisual product={product} className="aspect-square w-full" />
        </div>
        <label className="mt-3 block cursor-pointer rounded-full border border-line px-3 py-2 text-center text-sm">
          {uploading ? "Saving photo…" : "Replace photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={upload} />
        </label>
      </div>
      <div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Name
            <input value={form.name} onChange={(event) => set("name", event.target.value)} className={field} />
          </label>
          <label className="text-sm">
            Category
            <input value={form.category} onChange={(event) => set("category", event.target.value)} className={field} />
          </label>
          <label className="text-sm md:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              rows="2"
              placeholder="One line customers see on the spice page."
              className={field}
            />
          </label>
          <label className="text-sm">
            Auction rate per kg (₹)
            <input
              inputMode="numeric"
              value={form.ratePerKg}
              onChange={(event) => set("ratePerKg", event.target.value)}
              className={field}
            />
          </label>
          <label className="flex items-end gap-2 pb-3 text-sm">
            <input type="checkbox" checked={form.inStock} onChange={(event) => set("inStock", event.target.checked)} />
            Available to order
          </label>
          <label className="flex items-end gap-2 pb-3 text-sm md:col-span-2">
            <input type="checkbox" checked={form.bestSeller} onChange={(event) => set("bestSeller", event.target.checked)} />
            Show in Our Best Sellers
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PACKS.map((grams) => (
            <div key={grams} className="rounded-2xl bg-cream px-3 py-2">
              <p className="text-xs text-ink/60">{grams === 1000 ? "1 kg" : `${grams} g`}</p>
              <p className="font-medium">{rupees(priceFor(form.ratePerKg, grams))}</p>
            </div>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
        {message && <p className="mt-3 text-sm text-leaf">{message}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream">
            Save rate
          </button>
          <CrossButton label={`Remove ${product.name}`} tone="maroon" onClick={remove} />
        </div>
      </div>
    </form>
  );
}
