import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SpiceVisual } from "./SpiceVisual";

export function HomeCarousel({ products }) {
  const slides = products.slice(0, 8);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (count < 2 || paused) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [count, paused, index]);

  if (count === 0) return null;

  function go(next) {
    setIndex((next + count) % count);
  }

  const current = slides[index];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="overflow-hidden rounded-[2rem] border border-line bg-cream-deep" aria-roledescription="carousel" aria-label="Spices from Kerala">
        <div
          className="flex transition-transform duration-700 ease-in-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((product, slideIndex) => (
            <Link
              key={product.id}
              to={`/spice/${product.id}`}
              className="relative block min-w-full"
              aria-hidden={slideIndex !== index}
              tabIndex={slideIndex === index ? 0 : -1}
            >
              <SpiceVisual product={product} className="aspect-[4/3] w-full sm:aspect-[5/4]" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent px-5 pt-16 pb-5 text-cream">
                <span className="block text-[11px] tracking-[0.18em] uppercase">{product.category}</span>
                <span className="mt-1 block font-serif text-3xl">{product.name}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-lg text-ink shadow-sm"
            aria-label="Previous spice"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-lg text-ink shadow-sm"
            aria-label="Next spice"
          >
            ›
          </button>
          <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Choose a spice">
            {slides.map((product, dot) => (
              <button
                key={product.id}
                type="button"
                role="tab"
                aria-label={product.name}
                aria-selected={dot === index}
                onClick={() => setIndex(dot)}
                className={`h-2.5 rounded-full transition-all duration-300 ${dot === index ? "w-6 bg-ink" : "w-2.5 bg-ink/25"}`}
              />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            {current.name}, {index + 1} of {count}
          </p>
        </>
      )}
    </div>
  );
}
