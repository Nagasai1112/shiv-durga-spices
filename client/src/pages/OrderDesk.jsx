import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { phoneLabel, rupees } from "../format";
import { field } from "./admin/field";

export function OrderDesk() {
  const { token } = useParams();
  const [authed, setAuthed] = useState(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Confirm order · Shivdurga Kerala Spices";
    api("/api/auth/me")
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!authed) return undefined;
    let ignore = false;
    api(`/api/admin/orders/by-token/${token}`)
      .then((next) => {
        if (!ignore) setOrder(next);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [authed, token]);

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const result = await api(`/api/admin/orders/by-token/${token}/confirm`, { method: "POST" });
      setOrder(result.order);
      setAdded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <p className="text-xs tracking-[0.18em] text-saffron uppercase">Shop only</p>
      <h1 className="mt-2 font-serif text-5xl">Add this order</h1>
      <p className="mt-3 text-ink/75">
        A tap on Order on WhatsApp does not put the order on the list. Add it here only after the customer agrees to pay in the chat.
      </p>
      {authed === null && <p className="mt-6 text-sm text-ink/70">Checking the shop sign-in…</p>}
      {authed === false && <DeskSignIn onSignedIn={() => setAuthed(true)} />}
      {authed && !order && !error && <p className="mt-6 text-sm text-ink/70">Loading the order…</p>}
      {error && <p className="mt-6 text-sm text-maroon">{error}</p>}
      {order && (
        <article className="mt-6 rounded-[2rem] border border-line bg-card p-6">
          <p className="text-sm text-ink/60">{order.code}</p>
          <h2 className="mt-1 font-serif text-3xl">{order.name}</h2>
          <p className="mt-2 text-sm">
            <a className="text-leaf" href={`tel:+91${order.phone}`}>
              {phoneLabel(order.phone)}
            </a>
          </p>
          <p className="mt-3 text-sm text-ink/80">
            {order.door}, {order.address}, {order.city}, {order.district} {order.pin}
            {order.landmark ? `. Landmark: ${order.landmark}` : ""}
          </p>
          {order.note && <p className="mt-2 text-sm text-ink/70">Note: {order.note}</p>}
          <ul className="mt-4 space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={`${item.productId}-${item.grams}`} className="flex justify-between gap-3">
                <span>
                  {item.name}, {item.label} × {item.qty}
                </span>
                <span>{rupees(item.unitPrice * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
            <p className="flex justify-between gap-3">
              <span>Spices</span>
              <span>{rupees(order.spiceTotal)}</span>
            </p>
            {order.discount > 0 && (
              <p className="flex justify-between gap-3 text-leaf">
                <span>
                  {order.offerTitle} ({order.offerPercent}% off)
                </span>
                <span>-{rupees(order.discount)}</span>
              </p>
            )}
            <p className="flex justify-between gap-3">
              <span>Delivery</span>
              <span>{order.deliveryCharge ? rupees(order.deliveryCharge) : "Free"}</span>
            </p>
            <p className="flex justify-between gap-3 pt-1 font-medium">
              <span>Estimated total</span>
              <span>{rupees(order.total)}</span>
            </p>
          </div>
          {order.status === "confirmed" || added ? (
            <p className="mt-5 text-sm text-leaf">
              This order is on the list.{" "}
              <Link className="underline decoration-leaf/40 underline-offset-4" to="/admin/orders">
                Open orders
              </Link>
            </p>
          ) : (
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className="mt-5 w-full rounded-full bg-leaf px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? "Adding…" : "Add to the order list"}
            </button>
          )}
        </article>
      )}
    </main>
  );
}

function DeskSignIn({ onSignedIn }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      window.dispatchEvent(new Event("auth-changed"));
      onSignedIn();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-[2rem] border border-line bg-card p-6">
      <h2 className="font-serif text-2xl">Sign in</h2>
      <p className="mt-2 text-sm text-ink/70">Only the shop can add an order. Customers do not use this page.</p>
      <label className="mt-4 block text-sm">
        Sign-in name
        <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className={field} />
      </label>
      <label className="mt-3 block text-sm">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className={field}
        />
      </label>
      {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
      <button type="submit" className="mt-5 w-full rounded-full bg-ink px-4 py-3 text-sm font-medium text-cream">
        Sign in
      </button>
    </form>
  );
}
