import { useEffect, useState } from "react";
import { useCatalog } from "../catalog";

const message = "Bulk orders are available. International orders are welcome.";

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
