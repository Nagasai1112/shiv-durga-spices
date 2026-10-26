import { useEffect, useState } from "react";
import { api } from "../api";
import { useCatalog } from "../catalog";
import { BRAND } from "../format";
import { ReviewCardSkeleton } from "../components/Skeleton";

function Stars({ value }) {
  const stars = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <p className="text-saffron" aria-label={`${stars} out of 5 stars`}>
      {"★★★★★".slice(0, stars)}
      <span className="text-line">{"★★★★★".slice(stars)}</span>
    </p>
  );
}

export function Reviews() {
  const { settings } = useCatalog();
  const brand = settings?.brandName || BRAND;
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const ordered = [...reviews].reverse();

  useEffect(() => {
    document.title = `Reviews · ${brand}`;
  }, [brand]);

  useEffect(() => {
    api("/api/reviews")
      .then((rows) => {
        setReviews(rows);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs tracking-[0.2em] text-saffron uppercase">Customers</p>
      <h1 className="mt-2 font-serif text-5xl">What customers say</h1>
      <p className="mt-3 max-w-xl text-ink/75">
        The newest review is at the top. These are words and WhatsApp chats from people who ordered.
      </p>
      {error && <p className="mt-4 text-sm text-maroon">{error}</p>}
      {status === "loading" && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true">
          <p className="sr-only">Opening the reviews…</p>
          {Array.from({ length: 6 }, (_, index) => (
            <ReviewCardSkeleton key={index} />
          ))}
        </div>
      )}
      {status === "ready" && ordered.length === 0 && (
        <p className="mt-6 text-sm text-ink/75">Reviews from customers will appear here.</p>
      )}
      <div className="mt-8 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((review) => (
          <article key={review.id} className="overflow-hidden rounded-3xl border border-line bg-card">
            {review.image ? (
              <img src={review.image} alt="" className="h-80 w-full bg-cream object-contain object-top" />
            ) : (
              <div className="grid h-40 place-items-center bg-cream text-sm text-ink/60">No screenshot</div>
            )}
            <div className="p-4">
              <Stars value={review.stars} />
              <p className="mt-2 text-sm text-ink">“{review.quote}”</p>
              {review.label && <p className="mt-3 text-sm text-ink/70">{review.label}</p>}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
