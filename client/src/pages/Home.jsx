import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useCatalog } from "../catalog";
import { HomeCarousel } from "../components/HomeCarousel";
import { PurityMarquee } from "../components/HomeMarquee";
import { StoryLink, scrollToStory } from "../components/SiteLinks";
import { ReviewCarousel } from "../components/ReviewCarousel";
import { SpiceCard } from "../components/SpiceCard";

export function Home() {
  const { products, settings, status } = useCatalog();
  const { hash, state } = useLocation();
  const brand = settings?.brandName || "Shivdurga Kerala Spices";
  const tagline = settings?.tagline || "Taste and trust, straight from Kerala";

  useEffect(() => {
    document.title = brand;
  }, [brand]);

  useEffect(() => {
    if ((hash === "#story" || state?.scrollTo === "story") && status !== "loading") scrollToStory();
  }, [hash, state, status]);

  const marked = products.filter((product) => product.bestSeller);
  const bestSellers = marked.length ? marked : products.filter((product) => /cardamom/i.test(product.name));
  const bestIds = new Set(bestSellers.map((product) => product.id));
  const featured = products.filter((product) => !bestIds.has(product.id)).slice(0, 3);

  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div>
          <p className="text-xs tracking-[0.22em] text-saffron uppercase">{brand}</p>
          <h1 className="mt-3 max-w-xl font-serif text-5xl leading-[1.05] text-ink sm:text-6xl">{tagline}</h1>
          <p className="mt-5 max-w-md text-lg text-ink/75">
            Pure whole spices from Kerala, packed with care. Choose 100 g, 250 g, 500 g or 1 kg and order on WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="rounded-full bg-saffron px-5 py-3 text-sm font-medium text-white">
              Shop spices
            </Link>
            <StoryLink className="rounded-full border border-ink/15 bg-card px-5 py-3 text-sm font-medium">
              Our story
            </StoryLink>
          </div>
        </div>
        <HomeCarousel products={products} />
      </section>

      <PurityMarquee />

      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-14">
          <h2 className="text-center font-serif text-4xl">Our Best Sellers</h2>
          <div
            className={`mt-8 grid gap-5 ${
              bestSellers.length === 1
                ? "mx-auto max-w-sm"
                : bestSellers.length === 2
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {bestSellers.map((product) => (
              <SpiceCard key={product.id} product={product} badge="Best seller" />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 pt-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Featured spices</h2>
          <Link to="/shop" className="text-sm text-leaf">
            See the whole shop
          </Link>
        </div>
        {status === "loading" && <p className="text-ink/70">Opening the shop…</p>}
        {status === "error" && <p className="text-maroon">The shop server is not running. From the project folder, run npm run dev.</p>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <SpiceCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-6xl gap-4 px-5 md:grid-cols-3">
        {[
          ["1", "Choose the spice", "Open a tin from the shop and pick the one you want."],
          ["2", "Choose the pack", "100 g, 250 g, 500 g, and 1 kg. The amount changes when you tap a weight."],
          ["3", "Send it on WhatsApp", "Your name and address, and the list go to the shop. They confirm the total in the chat."],
        ].map(([step, title, copy]) => (
          <div key={step} className="rounded-3xl border border-line bg-card p-5">
            <p className="font-serif text-3xl text-saffron">{step}</p>
            <h3 className="mt-2 font-serif text-2xl">{title}</h3>
            <p className="mt-2 text-sm text-ink/75">{copy}</p>
          </div>
        ))}
      </section>

      <ReviewCarousel />

      <section id="story" className="mx-auto mt-16 max-w-6xl scroll-mt-28 px-5">
        <div className="rounded-[2rem] bg-ink px-6 py-10 text-cream sm:px-10">
          <p className="text-xs tracking-[0.2em] text-cream/75 uppercase">Our story</p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl">
            {brand} brings you fresh, pure spices straight from Kerala, the land of spice gardens.
          </h2>
          <p className="mt-4 max-w-2xl text-cream/85">
            Choosing is simple: pick your spice, select the weight, and send your order on WhatsApp. We’ll confirm the price, payment and delivery with you personally, just like at the counter.
          </p>
        </div>
      </section>
    </main>
  );
}
