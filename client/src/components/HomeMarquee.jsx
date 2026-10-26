import { useEffect, useState } from "react";
import { useCatalog } from "../catalog";

const message = "Bulk orders are available. International orders are welcome. Prices may vary according to the stock.";

const unboxingLines = [
  "360° unboxing video is mandatory.",
  "Open the parcel clearly without hiding the items.",
  "Only clear opening videos will be accepted for missing or wrong item claims.",
];

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduce;
}

const purityLine = "100% Pure & Authentic Spices • Rich Aroma • Bold Flavor • Authentic Taste";

export function PurityMarquee() {
  const reduceMotion = usePrefersReducedMotion();
  const line = (copy) => (
    <span key={copy} className="mx-8 inline-flex items-center gap-8">
      <span>100% Pure & Authentic Spices</span>
      <span className="text-saffron" aria-hidden="true">
        •
      </span>
      <span>Rich Aroma</span>
      <span className="text-saffron" aria-hidden="true">
        •
      </span>
      <span>Bold Flavor</span>
      <span className="text-saffron" aria-hidden="true">
        •
      </span>
      <span>Authentic Taste</span>
      <span className="text-saffron" aria-hidden="true">
        •
      </span>
    </span>
  );

  return (
    <div className="overflow-hidden border-y border-white/10 bg-ink text-sm text-cream">
      <p className="sr-only">{purityLine}</p>
      {reduceMotion ? (
        <p className="px-5 py-2.5 text-center">{purityLine}</p>
      ) : (
        <div className="marquee-track flex w-max py-2.5 whitespace-nowrap" aria-hidden="true">
          <span className="flex">{[0, 1, 2, 3].map(line)}</span>
          <span className="flex">{[4, 5, 6, 7].map(line)}</span>
        </div>
      )}
    </div>
  );
}

export function UnboxingMarquee() {
  const reduceMotion = usePrefersReducedMotion();
  const copy = unboxingLines.join(" ");

  const line = (key) => (
    <span key={key} className="mx-6 inline-flex items-center gap-6">
      {unboxingLines.map((item) => (
        <span key={item} className="inline-flex items-center gap-6">
          <span>{item}</span>
          <span className="text-saffron" aria-hidden="true">·</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className="overflow-hidden bg-ink text-sm text-cream">
      <p className="sr-only">{copy}</p>
      {reduceMotion ? (
        <p className="px-5 py-2.5 text-center">{copy}</p>
      ) : (
        <div className="marquee-track flex w-max py-2.5 whitespace-nowrap" aria-hidden="true">
          <span className="flex">{[0, 1].map(line)}</span>
          <span className="flex">{[2, 3].map(line)}</span>
        </div>
      )}
    </div>
  );
}

export function HomeMarquee() {
  const { settings } = useCatalog();
  const reduceMotion = usePrefersReducedMotion();
  const number = settings?.whatsappNumber || "";
  const href = number
    ? `https://wa.me/${number}?text=${encodeURIComponent("Hello, I would like to ask about a bulk or international order.")}`
    : "/order";
  const external = Boolean(number);

  const line = (copy) => (
    <span key={copy} className="mx-6 inline-flex items-center gap-6">
      <span>Bulk orders are available</span>
      <span className="text-saffron">·</span>
      <span>International orders are welcome</span>
      <span className="text-saffron">·</span>
      <span>Prices may vary according to the stock</span>
      <span className="text-saffron">·</span>
      <span className="underline decoration-saffron decoration-2 underline-offset-4">Order on WhatsApp</span>
    </span>
  );

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="block overflow-hidden border-b border-white/10 bg-ink text-sm text-cream"
    >
      <span className="sr-only">{message} Order on WhatsApp.</span>
      {reduceMotion ? (
        <span className="block px-5 py-2.5 text-center">{message} Order on WhatsApp.</span>
      ) : (
        <span className="marquee-track flex w-max py-2.5 whitespace-nowrap" aria-hidden="true">
          <span className="flex">{[0, 1, 2, 3].map(line)}</span>
          <span className="flex">{[4, 5, 6, 7].map(line)}</span>
        </span>
      )}
    </a>
  );
}
