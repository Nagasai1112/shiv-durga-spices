import { useEffect, useState } from "react";
import { api } from "../../api";
import { useCatalog } from "../../catalog";
import { field } from "./field";

export function ShopPage() {
  const { settings, reload } = useCatalog();

  useEffect(() => {
    document.title = "Shop details · Admin";
  }, []);

  return (
    <section>
      <h1 className="font-serif text-5xl">Shop details</h1>
      <p className="mt-3 max-w-xl text-ink/75">
        These details appear on the site. The delivery charge is added to every order, and the phone and email appear in the footer.
      </p>
      {settings ? <SettingsForm settings={settings} onSaved={reload} /> : <p className="mt-6 text-sm text-ink/70">Loading shop details…</p>}
    </section>
  );
}

function SettingsForm({ settings, onSaved }) {
  const [form, setForm] = useState(settings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(form) });
      setMessage("Shop details saved.");
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={save} className="mt-6 rounded-[2rem] border border-line bg-card p-5">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          Brand name
          <input value={form.brandName || ""} onChange={(event) => set("brandName", event.target.value)} className={field} />
        </label>
        <label className="text-sm">
          Tagline
          <input value={form.tagline || ""} onChange={(event) => set("tagline", event.target.value)} className={field} />
        </label>
        <label className="text-sm">
          Phone number with country code
          <input
            value={form.phone || ""}
            onChange={(event) => set("phone", event.target.value)}
            placeholder="917672091892"
            className={field}
          />
        </label>
        <label className="text-sm">
          Email
          <input value={form.email || ""} onChange={(event) => set("email", event.target.value)} className={field} />
        </label>
        <label className="text-sm md:col-span-2">
          WhatsApp number with country code
          <input
            value={form.whatsappNumber || ""}
            onChange={(event) => set("whatsappNumber", event.target.value)}
            placeholder="917672091892"
            className={field}
          />
        </label>
        <label className="text-sm">
          Delivery charge (₹)
          <input
            inputMode="numeric"
            value={form.deliveryCharge ?? 0}
            onChange={(event) => set("deliveryCharge", event.target.value)}
            className={field}
          />
        </label>
        <label className="text-sm md:col-span-2">
          Where you deliver
          <textarea value={form.deliveryNote || ""} onChange={(event) => set("deliveryNote", event.target.value)} rows="2" className={field} />
        </label>
        <label className="text-sm md:col-span-2">
          How customers pay
          <textarea value={form.paymentNote || ""} onChange={(event) => set("paymentNote", event.target.value)} rows="2" className={field} />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
      {message && <p className="mt-3 text-sm text-leaf">{message}</p>}
      <button type="submit" className="mt-4 rounded-full bg-saffron px-4 py-2 text-sm font-medium text-white">
        Save shop details
      </button>
    </form>
  );
}
