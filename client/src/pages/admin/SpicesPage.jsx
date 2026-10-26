import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../api";
import { useCatalog } from "../../catalog";
import { ConfirmModal } from "../../components/ConfirmModal";
import { CrossButton } from "../../components/CrossButton";
import { SpiceVisual } from "../../components/SpiceVisual";
import { PACKS, rupees } from "../../format";
import { field } from "./field";
import { PackPrices, packPricesFrom } from "./PackPrices";

export function SpicesPage() {
  const { products, reload } = useCatalog();
  const { state } = useLocation();
  const [openId, setOpenId] = useState("");
  const openedNotice = useRef(false);
  const ordered = [...products].reverse();
  const open = ordered.find((product) => product.id === openId);

  useEffect(() => {
    document.title = "Spices · Admin";
  }, []);

  useEffect(() => {
    const newest = products[products.length - 1];
    if (!state?.notice || openedNotice.current || !newest) return;
    openedNotice.current = true;
    setOpenId(newest.id);
  }, [state, products]);

  return (
    <section>
      <h1 className="font-serif text-5xl">Spice rates and photos</h1>
      <p className="mt-3 max-w-xl text-ink/75">
        The newest spice is at the top. Open a card to change its prices, photo, or description. A smaller pack can cost more for its size, and a larger pack can cost less.
      </p>
      {state?.notice && <p className="mt-4 text-sm text-leaf">{state.notice}</p>}
      {open && (
        <div className="mt-6">
          <ProductEditor key={open.id} product={open} onSaved={reload} onClose={() => setOpenId("")} />
        </div>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((product) => {
          const pack = product.packs?.[0];
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => setOpenId(product.id)}
              className={`overflow-hidden rounded-3xl border bg-card text-left ${openId === product.id ? "border-ink" : "border-line"}`}
            >
              <SpiceVisual product={product} className="aspect-[4/3] w-full" />
              <span className="block p-4">
                <span className="block font-serif text-2xl">{product.name}</span>
                <span className="mt-1 block text-sm text-ink/70">{pack ? `${pack.label} · ${rupees(pack.price)}` : product.category}</span>
              </span>
            </button>
          );
        })}
      </div>
      {products.length === 0 && (
        <p className="mt-6 text-sm text-ink/75">
          No spices yet. <Link to="/admin/spices/new" className="text-leaf">Add a spice</Link>.
        </p>
      )}
    </section>
  );
}

function ProductEditor({ product, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: product.name,
    category: product.category,
    description: product.description,
    prices: packPricesFrom(product),
    inStock: product.inStock,
    bestSeller: Boolean(product.bestSeller),
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);

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
        body: JSON.stringify({
          ...form,
          prices: Object.fromEntries(PACKS.map((grams) => [grams, Number(form.prices[grams])])),
        }),
      });
      setMessage("Saved. The shop is using these prices.");
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
    setConfirming(false);
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
              placeholder="One line customers see under the spice name."
              className={field}
            />
          </label>
          <PackPrices prices={form.prices} onChange={(grams, value) => set("prices", { ...form.prices, [grams]: value })} />
          <label className="flex items-end gap-2 pb-3 text-sm">
            <input type="checkbox" checked={form.inStock} onChange={(event) => set("inStock", event.target.checked)} />
            Available to order
          </label>
          <label className="flex items-end gap-2 pb-3 text-sm md:col-span-2">
            <input type="checkbox" checked={form.bestSeller} onChange={(event) => set("bestSeller", event.target.checked)} />
            Show in Our Best Sellers
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
        {message && <p className="mt-3 text-sm text-leaf">{message}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream">
            Save prices
          </button>
          <button type="button" onClick={onClose} className="rounded-full border border-line px-4 py-2 text-sm">
            Close
          </button>
          <CrossButton label={`Remove ${product.name}`} tone="maroon" onClick={() => setConfirming(true)} />
        </div>
      </div>
      <ConfirmModal
        open={confirming}
        title="Remove this spice?"
        message={`${product.name} will leave the shop.`}
        confirmLabel="Remove"
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </form>
  );
}
