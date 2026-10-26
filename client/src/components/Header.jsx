import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../cart";
import { useCatalog } from "../catalog";
import { rupees } from "../format";
import { CrossButton } from "./CrossButton";
import { HomeLink, StoryLink } from "./SiteLinks";

const links = [
  ["/", "Home"],
  ["/shop", "Shop"],
  ["/#story", "Our story"],
];

export function Header() {
  const { settings } = useCatalog();
  const { items, count, total, open, setOpen, setQty, remove } = useCart();
  const brand = settings?.brandName || "Shiv Durga Spices";
  const deliveryCharge = items.length ? Number(settings?.deliveryCharge) || 0 : 0;
  const grandTotal = total + deliveryCharge;

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/80 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <HomeLink className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full sm:h-14 sm:w-14">
              <img src="/logo.jpg" alt="" className="h-full w-full scale-[1.42] object-cover" />
            </span>
            <span className="truncate font-serif text-xl leading-none text-ink sm:text-[1.7rem]">{brand}</span>
          </HomeLink>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {links.map(([to, label]) =>
              to === "/#story" ? (
                <StoryLink key={to} className="text-ink/80 hover:text-ink">
                  {label}
                </StoryLink>
              ) : (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    isActive ? "text-ink underline decoration-saffron decoration-2 underline-offset-8" : "text-ink/80 hover:text-ink"
                  }
                >
                  {label}
                </NavLink>
              ),
            )}
          </nav>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-leaf px-4 py-2 text-sm font-medium text-white"
          >
            Order
            {count > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{count}</span>}
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-5 px-5 pb-3 text-sm md:hidden">
          {links.map(([to, label]) => {
            if (to === "/#story") {
              return (
                <StoryLink key={to} className="text-ink/80">
                  {label}
                </StoryLink>
              );
            }
            if (to === "/") {
              return (
                <HomeLink key={to} className="text-ink/80">
                  {label}
                </HomeLink>
              );
            }
            return (
              <NavLink key={to} to={to} className="text-ink/80">
                {label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-40">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close order" onClick={() => setOpen(false)} />
          <aside className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-serif text-2xl">Your order</h2>
              <CrossButton label="Close" onClick={() => setOpen(false)} />
            </div>
            <div className="flex-1 space-y-4 overflow-auto px-5 py-4">
              {items.length === 0 && <p className="text-ink/70">The order is empty. Add a spice and a pack size.</p>}
              {items.map((item) => (
                <div key={item.key} className="rounded-2xl border border-line bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-ink/70">
                        {item.label} · {rupees(item.unitPrice)}
                      </p>
                    </div>
                    <CrossButton label={`Remove ${item.name}`} tone="maroon" onClick={() => remove(item.key)} />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <button type="button" className="h-8 w-8 rounded-full border border-line" onClick={() => setQty(item.key, item.qty - 1)}>
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button type="button" className="h-8 w-8 rounded-full border border-line" onClick={() => setQty(item.key, item.qty + 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-line px-5 py-4">
              {items.length > 0 && (
                <div className="mb-3 space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Spices</span>
                    <span>{rupees(total)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery</span>
                    <span>{deliveryCharge ? rupees(deliveryCharge) : "Free"}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span>Estimated total</span>
                    <span className="font-serif text-2xl">{rupees(grandTotal)}</span>
                  </div>
                </div>
              )}
              <Link
                to="/order"
                onClick={() => setOpen(false)}
                className={`block rounded-full px-4 py-3 text-center text-sm font-medium text-white ${items.length ? "bg-leaf" : "pointer-events-none bg-leaf/40"}`}
              >
                Review and send on WhatsApp
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
