import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../catalog";
import { activeOffer, dayLabel } from "../format";

const timingLabel = { on: "On now", upcoming: "Coming up", ended: "Ended" };

export function Offers() {
  const { offers, settings, status } = useCatalog();
  const brand = settings?.brandName || "Shivdurga Kerala Spices";
  const live = activeOffer(offers);

  useEffect(() => {
    document.title = `Festival offers · ${brand}`;
  }, [brand]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs tracking-[0.22em] text-saffron uppercase">{brand}</p>
      <h1 className="mt-3 font-serif text-5xl">Festival offers</h1>
      <p className="mt-3 max-w-xl text-ink/75">
        During a festival the shop takes a percentage off the spices. Delivery stays the same. The offer is already included in the WhatsApp total.
      </p>
      {live && (
        <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-[#c4a574] bg-[#f7f1e4] px-6 py-8 text-center">
          <span className="offer-spark offer-spark-a" aria-hidden="true" />
          <span className="offer-spark offer-spark-b" aria-hidden="true" />
          <span className="offer-spark offer-spark-c" aria-hidden="true" />
          <span className="offer-spark offer-spark-d" aria-hidden="true" />
          <span className="offer-spark offer-spark-e" aria-hidden="true" />
          <p className="offer-hurray font-serif text-5xl text-maroon sm:text-6xl">Hurray</p>
          <p className="relative mt-2 text-lg">
            {live.title} is on. {live.percent}% off every spice.
          </p>
        </div>
      )}
      {status === "loading" && <p className="mt-8 text-sm text-ink/70">Loading offers…</p>}
      {status !== "loading" && offers.length === 0 && (
        <p className="mt-8 text-ink/75">There is no festival offer right now. Prices on the shop page are the regular prices.</p>
      )}
      <div className="mt-8 space-y-4">
        {offers.map((offer) => (
          <article key={offer.id} className={`rounded-[2rem] border bg-card p-6 ${offer.timing === "on" ? "offer-live border-maroon/40" : "border-line"}`}>
            <p className={`text-xs tracking-[0.16em] uppercase ${offer.timing === "on" ? "text-leaf" : "text-saffron"}`}>
              {timingLabel[offer.timing] || "Offer"}
            </p>
            <h2 className="mt-2 font-serif text-3xl">{offer.title}</h2>
            <p className="mt-2 text-lg">{offer.percent}% off spices</p>
            <p className="mt-1 text-sm text-ink/70">
              {dayLabel(offer.startsOn)} to {dayLabel(offer.endsOn)}
            </p>
            {offer.note && <p className="mt-3 text-sm text-ink/80">{offer.note}</p>}
          </article>
        ))}
      </div>
      <Link to="/shop" className="mt-8 inline-block rounded-full bg-saffron px-5 py-3 text-sm font-medium text-white">
        Shop spices
      </Link>
    </main>
  );
}
