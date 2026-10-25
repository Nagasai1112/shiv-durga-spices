import { useEffect, useState } from "react";
import { api } from "../api";

function usePerView() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    function update() {
      if (window.innerWidth >= 1100) setCount(4);
      else if (window.innerWidth >= 700) setCount(2);
      else setCount(1);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

function Stars({ value }) {
  return (
    <p className="text-saffron" aria-label={`${value} out of 5 stars`}>
      {"★★★★★".slice(0, value)}
      <span className="text-line">{"★★★★★".slice(value)}</span>
    </p>
  );
}

export function ReviewCarousel() {
  const [reviews, setReviews] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const perView = usePerView();
  const maxIndex = Math.max(0, reviews.length - perView);

  useEffect(() => {
    api("/api/reviews")
      .then((rows) => setReviews(rows.filter((review) => review.image)))
      .catch(() => setReviews([]));
  }, []);

  useEffect(() => {
    if (index > maxIndex) setIndex(maxIndex);
  }, [index, maxIndex]);

  useEffect(() => {
    if (maxIndex < 1 || paused) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, 2800);
    return () => window.clearInterval(timer);
  }, [maxIndex, paused]);

  if (reviews.length === 0) return null;

  function go(next) {
    setIndex(Math.min(maxIndex, Math.max(0, next)));
  }

  return (
    <section className="mx-auto mt-16 max-w-6xl px-5" aria-label="Customer reviews">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-saffron uppercase">Customers</p>
          <h2 className="mt-2 font-serif text-3xl">What customers say</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className="h-10 w-10 rounded-full border border-line bg-card disabled:opacity-40" aria-label="Previous reviews">
            ←
          </button>
          <button type="button" onClick={() => go(index + 1)} disabled={index === maxIndex} className="h-10 w-10 rounded-full border border-line bg-card disabled:opacity-40" aria-label="Next reviews">
            →
          </button>
        </div>
      </div>
      <div
        className="overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
        >
          {reviews.map((review) => (
            <article key={review.id} className="shrink-0 px-2" style={{ width: `${100 / perView}%` }}>
              <div className="flex h-full flex-col items-center rounded-[1.6rem] border border-line bg-card px-4 py-6 text-center">
                <div className="h-56 w-36 overflow-hidden rounded-[1.3rem] border border-ink/10 bg-cream-deep shadow-[0_12px_28px_rgba(60,58,50,0.12)]">
                  <img src={review.image} alt="" className="h-full w-full object-cover object-top" />
                </div>
                <div className="mt-4">
                  <Stars value={review.stars} />
                  <p className="mt-2 text-sm text-ink">“{review.quote}”</p>
                  {review.label && <p className="mt-4 text-sm text-ink/70">{review.label}</p>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
