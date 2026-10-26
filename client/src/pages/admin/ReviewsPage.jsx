import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../api";
import { ConfirmModal } from "../../components/ConfirmModal";
import { CrossButton } from "../../components/CrossButton";
import { field } from "./field";

export function ReviewsPage() {
  const { state } = useLocation();
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState("");
  const openedNotice = useRef(false);
  const ordered = [...reviews].reverse();
  const open = ordered.find((review) => review.id === openId);

  function load() {
    api("/api/reviews")
      .then(setReviews)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    document.title = "Reviews · Admin";
    load();
  }, []);

  useEffect(() => {
    const newest = reviews[reviews.length - 1];
    if (!state?.notice || openedNotice.current || !newest) return;
    openedNotice.current = true;
    setOpenId(newest.id);
  }, [state, reviews]);

  return (
    <section>
      <h1 className="font-serif text-5xl">Customer reviews</h1>
      <p className="mt-3 max-w-xl text-ink/75">
        The newest review is at the top. Open a card to edit it. These appear on the reviews page and in the home-page carousel.
      </p>
      {state?.notice && <p className="mt-4 text-sm text-leaf">{state.notice}</p>}
      {error && <p className="mt-4 text-sm text-maroon">{error}</p>}
      {open && (
        <div className="mt-6">
          <ReviewEditor key={open.id} review={open} onChange={load} onClose={() => setOpenId("")} />
        </div>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((review) => (
          <button
            key={review.id}
            type="button"
            onClick={() => setOpenId(review.id)}
            className={`overflow-hidden rounded-3xl border bg-card text-left ${openId === review.id ? "border-ink" : "border-line"}`}
          >
            {review.image ? (
              <img src={review.image} alt="" className="h-40 w-full object-cover object-top" />
            ) : (
              <div className="grid h-40 place-items-center bg-cream text-sm text-ink/60">No screenshot</div>
            )}
            <span className="block p-4">
              <span className="text-saffron">{"★".repeat(review.stars || 0)}</span>
              <span className="mt-1 line-clamp-2 block text-sm text-ink">{review.quote}</span>
            </span>
          </button>
        ))}
      </div>
      {reviews.length === 0 && !error && (
        <p className="mt-6 text-sm text-ink/75">
          No reviews yet. <Link to="/admin/reviews/new" className="text-leaf">Add a review</Link>.
        </p>
      )}
    </section>
  );
}

function ReviewEditor({ review, onChange, onClose }) {
  const [quote, setQuote] = useState(review.quote);
  const [label, setLabel] = useState(review.label);
  const [stars, setStars] = useState(review.stars);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

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
    setConfirming(false);
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
        <button type="button" onClick={onClose} className="rounded-full border border-line px-4 py-2 text-sm">
          Close
        </button>
        <CrossButton label="Remove review" tone="maroon" onClick={() => setConfirming(true)} />
      </div>
      <ConfirmModal
        open={confirming}
        title="Remove this review?"
        message="It will leave the home page."
        confirmLabel="Remove"
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </form>
  );
}
