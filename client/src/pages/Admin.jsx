import { useEffect, useState } from "react";
import { api } from "../api";
import { useCatalog } from "../catalog";
import { SpiceVisual } from "../components/SpiceVisual";
import { PACKS, priceFor, rupees } from "../format";

const field = "mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-3";

export function Admin() {
  const { products, settings, reload } = useCatalog();
  const [authed, setAuthed] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Admin · Shiv Durga Spices";
    api("/api/admin/me")
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  async function login(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      setAuthed(true);
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function logout() {
    await api("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  if (authed === null) return <main className="mx-auto max-w-3xl px-5 py-16">Checking the admin sign-in…</main>;

  if (!authed) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <form onSubmit={login} className="rounded-[2rem] border border-line bg-card p-8">
          <p className="text-xs tracking-[0.18em] text-saffron uppercase">Shop admin</p>
          <h1 className="mt-2 font-serif text-4xl">Sign in</h1>
          <p className="mt-2 text-sm text-ink/70">Change auction rates and photos from here. Customers never use this page.</p>
          <label className="mt-5 block text-sm">
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={field} />
          </label>
          {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
          <button type="submit" className="mt-5 w-full rounded-full bg-ink px-4 py-3 text-sm font-medium text-cream">
            Sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-saffron uppercase">Shop admin</p>
          <h1 className="mt-2 font-serif text-5xl">Rates and photos</h1>
          <p className="mt-2 max-w-xl text-ink/75">
            Change one number, the auction rate per kg. The shop recalculates 100 g, 250 g, 500 g, and 1 kg for every visitor.
          </p>
        </div>
        <button type="button" onClick={logout} className="rounded-full border border-line bg-card px-4 py-2 text-sm">
          Sign out
        </button>
      </div>
      {settings && <SettingsForm settings={settings} onSaved={reload} />}
      <div className="mt-8 space-y-5">
        {products.map((product) => (
          <ProductEditor key={product.id} product={product} onSaved={reload} />
        ))}
      </div>
      <AddProduct onSaved={reload} />
      <ReviewsManager />
      <PasswordForm />
    </main>
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
    <form onSubmit={save} className="mt-8 rounded-[2rem] border border-line bg-card p-5">
      <h2 className="font-serif text-2xl">Shop details</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          Brand name
          <input value={form.brandName} onChange={(event) => set("brandName", event.target.value)} className={field} />
        </label>
        <label className="text-sm">
          Tagline
          <input value={form.tagline} onChange={(event) => set("tagline", event.target.value)} className={field} />
        </label>
        <label className="text-sm md:col-span-2">
          WhatsApp number with country code
          <input
            value={form.whatsappNumber}
            onChange={(event) => set("whatsappNumber", event.target.value)}
            placeholder="919876543210"
            className={field}
          />
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

function ProductEditor({ product, onSaved }) {
  const [form, setForm] = useState({
    name: product.name,
    category: product.category,
    description: product.description,
    ratePerKg: product.ratePerKg,
    inStock: product.inStock,
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
            <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows="2" className={field} />
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
          <button type="button" onClick={remove} className="text-sm text-maroon">
            Remove spice
          </button>
        </div>
      </div>
    </form>
  );
}

function AddProduct({ onSaved }) {
  const blank = { name: "", category: "Ground", description: "", ratePerKg: "", inStock: true };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");

  async function create(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({ ...form, ratePerKg: Number(form.ratePerKg) }),
      });
      setForm(blank);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={create} className="mt-8 rounded-[2rem] border border-dashed border-saffron/50 bg-card p-5">
      <h2 className="font-serif text-2xl">Add a spice</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          Name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={field} />
        </label>
        <label className="text-sm">
          Category
          <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={field} />
        </label>
        <label className="text-sm md:col-span-2">
          Description
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="2" className={field} />
        </label>
        <label className="text-sm">
          Auction rate per kg (₹)
          <input value={form.ratePerKg} onChange={(event) => setForm({ ...form, ratePerKg: event.target.value })} className={field} />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
      <button type="submit" className="mt-4 rounded-full bg-saffron px-4 py-2 text-sm font-medium text-white">
        Add spice
      </button>
    </form>
  );
}

function ReviewsManager() {
  const [reviews, setReviews] = useState([]);
  const [quote, setQuote] = useState("");
  const [label, setLabel] = useState("Verified customer");
  const [stars, setStars] = useState(5);
  const [error, setError] = useState("");

  function load() {
    api("/api/reviews")
      .then(setReviews)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function create(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/admin/reviews", {
        method: "POST",
        body: JSON.stringify({ quote, label, stars: Number(stars) }),
      });
      setQuote("");
      setLabel("Verified customer");
      setStars(5);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="font-serif text-3xl">Customer reviews</h2>
      <p className="mt-2 max-w-xl text-sm text-ink/75">These appear in the home-page carousel. Add the customer’s words, a WhatsApp screenshot, and the stars.</p>
      <div className="mt-4 space-y-4">
        {reviews.map((review) => (
          <ReviewEditor key={review.id} review={review} onChange={load} />
        ))}
      </div>
      <form onSubmit={create} className="mt-4 rounded-[2rem] border border-dashed border-saffron/50 bg-card p-5">
        <h3 className="font-serif text-2xl">Add a review</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            Customer’s words
            <textarea value={quote} onChange={(event) => setQuote(event.target.value)} rows="2" className={field} />
          </label>
          <label className="text-sm">
            Label
            <input value={label} onChange={(event) => setLabel(event.target.value)} className={field} />
          </label>
          <label className="text-sm">
            Stars
            <select value={stars} onChange={(event) => setStars(Number(event.target.value))} className={field}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
        <button type="submit" className="mt-4 rounded-full bg-saffron px-4 py-2 text-sm font-medium text-white">
          Add review
        </button>
      </form>
    </section>
  );
}

function ReviewEditor({ review, onChange }) {
  const [quote, setQuote] = useState(review.quote);
  const [label, setLabel] = useState(review.label);
  const [stars, setStars] = useState(review.stars);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api(`/api/admin/reviews/${review.id}`, {
        method: "PUT",
        body: JSON.stringify({ quote, label, stars: Number(stars) }),
      });
      setMessage("Saved.");
      onChange();
    } catch (err) {
      setError(err.message);
    }
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      const body = new FormData();
      body.append("image", file);
      await api(`/api/admin/reviews/${review.id}/image`, { method: "POST", body });
      setMessage("Screenshot updated.");
      onChange();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    if (!window.confirm("Remove this review from the home page?")) return;
    try {
      await api(`/api/admin/reviews/${review.id}`, { method: "DELETE" });
      onChange();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={save} className="rounded-[2rem] border border-line bg-card p-5">
      <div className="grid gap-4 md:grid-cols-[140px_1fr]">
        {review.image ? (
          <img src={review.image} alt="" className="h-40 w-full rounded-2xl object-cover object-top" />
        ) : (
          <div className="grid h-40 place-items-center rounded-2xl bg-cream text-sm text-ink/60">No screenshot</div>
        )}
        <div>
          <label className="block text-sm">
            Customer’s words
            <textarea value={quote} onChange={(event) => setQuote(event.target.value)} rows="2" className={field} />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Label
              <input value={label} onChange={(event) => setLabel(event.target.value)} className={field} />
            </label>
            <label className="text-sm">
              Stars
              <select value={stars} onChange={(event) => setStars(Number(event.target.value))} className={field}>
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-3 block text-sm">
            WhatsApp screenshot
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} className="mt-1 block text-sm" />
          </label>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
      {message && <p className="mt-3 text-sm text-leaf">{message}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream">
          Save review
        </button>
        <button type="button" onClick={remove} className="text-sm text-maroon">
          Remove review
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api("/api/admin/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password changed.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={save} className="mt-8 rounded-[2rem] border border-line bg-card p-5">
      <h2 className="font-serif text-2xl">Change the admin password</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          Current password
          <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={field} />
        </label>
        <label className="text-sm">
          New password
          <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={field} />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
      {message && <p className="mt-3 text-sm text-leaf">{message}</p>}
      <button type="submit" className="mt-4 rounded-full border border-line px-4 py-2 text-sm">
        Update password
      </button>
    </form>
  );
}
