import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../../catalog";

const cards = [
  ["/admin/spices", "Spice prices and photos", "Type the price of each pack, change the photo, and choose a best seller."],
  ["/admin/spices/new", "Add a spice", "Put a new spice in the shop and type a price for each pack."],
  ["/admin/reviews", "Customer reviews", "Edit the reviews that appear on the home page."],
  ["/admin/reviews/new", "Add a review", "Add a customer’s words, stars, and a WhatsApp screenshot."],
  ["/admin/shop", "Shop details", "Change contact details, the delivery charge, and how customers pay."],
  ["/admin/password", "Password", "Change the password used to open this admin. Do this before the site is public."],
];

export function AdminHome() {
  const { products, status } = useCatalog();

  useEffect(() => {
    document.title = "Admin · Shivdurga Kerala Spices";
  }, []);

  return (
    <section>
      <h1 className="font-serif text-5xl">What do you want to change?</h1>
      <p className="mt-3 max-w-xl text-ink/75">
        {status === "ready" && (
          <>
            {products.length} {products.length === 1 ? "spice is" : "spices are"} in the shop.{" "}
          </>
        )}
        Pick one task. Each opens on its own page.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map(([to, title, copy]) => (
          <Link key={to} to={to} className="rounded-[2rem] border border-line bg-card p-6 hover:border-saffron">
            <h2 className="font-serif text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-ink/75">{copy}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
