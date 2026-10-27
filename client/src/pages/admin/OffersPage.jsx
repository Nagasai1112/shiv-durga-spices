import { useEffect, useState } from "react";
import { api } from "../../api";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useCatalog } from "../../catalog";
import { dayLabel } from "../../format";
import { field } from "./field";

const empty = { title: "", percent: "10", startsOn: "", endsOn: "", note: "" };

export function OffersPage() {
  const { offers, reload } = useCatalog();
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Festival offers · Admin";
  }, []);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function edit(offer) {
    setEditing(offer.id);
    setForm({
      title: offer.title,
      percent: String(offer.percent),
      startsOn: offer.startsOn,
      endsOn: offer.endsOn,
      note: offer.note || "",
    });
    setMessage("");
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const body = { ...form, percent: Number(form.percent) };
    try {
      if (editing) {
        await api(`/api/admin/offers/${editing}`, { method: "PUT", body: JSON.stringify(body) });
        setMessage("Offer saved.");
      } else {
        await api("/api/admin/offers", { method: "POST", body: JSON.stringify(body) });
        setMessage("Offer added. It appears on the Festival offers page.");
      }
      setForm(empty);
      setEditing("");
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!pending) return;
    const id = pending.id;
    setPending(null);
    setError("");
    try {
      await api(`/api/admin/offers/${id}`, { method: "DELETE" });
      if (editing === id) {
        setEditing("");
        setForm(empty);
      }
      setMessage("Offer removed.");
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h1 className="font-serif text-5xl">Festival offers</h1>
      <p className="mt-3 max-w-xl text-ink/75">
        Add an offer for Onam, Diwali, Christmas, or any festival. While the dates include today, that percentage comes off the spices in the WhatsApp total. Delivery is not discounted.
      </p>
      <form onSubmit={save} className="mt-6 rounded-[2rem] border border-line bg-card p-5">
        <h2 className="font-serif text-2xl">{editing ? "Edit this offer" : "Add an offer"}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Festival name
            <input value={form.title} onChange={(event) => set("title", event.target.value)} className={field} />
          </label>
          <label className="text-sm">
            Percent off spices
            <input
              value={form.percent}
              onChange={(event) => set("percent", event.target.value.replace(/\D/g, "").slice(0, 2))}
              inputMode="numeric"
              className={field}
            />
          </label>
          <label className="text-sm">
            Starts
            <input type="date" value={form.startsOn} onChange={(event) => set("startsOn", event.target.value)} className={field} />
          </label>
          <label className="text-sm">
            Ends
            <input type="date" value={form.endsOn} onChange={(event) => set("endsOn", event.target.value)} className={field} />
          </label>
          <label className="text-sm md:col-span-2">
            Note <span className="text-ink/50">(optional)</span>
            <textarea value={form.note} onChange={(event) => set("note", event.target.value)} rows="2" className={field} />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
        {message && <p className="mt-3 text-sm text-leaf">{message}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" disabled={busy} className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream disabled:opacity-60">
            {busy ? "Saving…" : editing ? "Save offer" : "Add offer"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing("");
                setForm(empty);
              }}
              className="rounded-full border border-line px-5 py-2.5 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <div className="mt-6 space-y-3">
        {offers.map((offer) => (
          <article key={offer.id} className="flex flex-wrap items-start justify-between gap-3 rounded-[2rem] border border-line bg-card p-5">
            <div>
              <h2 className="font-serif text-2xl">{offer.title}</h2>
              <p className="mt-1 text-sm">
                {offer.percent}% off · {dayLabel(offer.startsOn)} to {dayLabel(offer.endsOn)}
                {offer.timing === "on" ? " · on now" : offer.timing === "upcoming" ? " · coming up" : " · ended"}
              </p>
              {offer.note && <p className="mt-2 text-sm text-ink/70">{offer.note}</p>}
            </div>
            <div className="flex gap-3 text-sm">
              <button type="button" onClick={() => edit(offer)} className="text-leaf">
                Edit
              </button>
              <button type="button" onClick={() => setPending(offer)} className="text-maroon">
                Delete
              </button>
            </div>
          </article>
        ))}
        {offers.length === 0 && <p className="text-sm text-ink/70">No festival offers yet.</p>}
      </div>
      <ConfirmModal
        open={Boolean(pending)}
        title={pending ? `Delete the ${pending.title} offer?` : ""}
        message="It will leave the Festival offers page. Orders already placed keep the total they had."
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setPending(null)}
      />
    </section>
  );
}
