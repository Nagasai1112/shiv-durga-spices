import { useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../cart";
import { useCatalog } from "../catalog";
import { BRAND, activeOffer, deliveryFor, discountFor, heldGrams, orderGrams, rupees } from "../format";
import { CrossButton } from "./CrossButton";
import { HomeLink, StoryLink } from "./SiteLinks";

const links = [
  ["/", "Home"],
  ["/shop", "Shop"],
  ["/offers", "Offers"],
  ["/#story", "Our story"],
  ["/reviews", "Reviews"],
  ["/track", "Track"],
];

export function Header() {
  const { settings, offers, products } = useCatalog();
  const { items, count, total, open, setOpen, notice, setQty, remove } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const brand = settings?.brandName || BRAND;
  const offer = activeOffer(offers);
  const discount = discountFor(total, offer);
  const deliveryCharge = deliveryFor(orderGrams(items), settings);
  const grandTotal = total - discount + deliveryCharge;
  const cartInHistory = Boolean(location.state?.cart);
  const skipHistory = useRef(false);
  const wasOpen = useRef(open);

  function closeCart() {
    setOpen(false);
  }

  function leaveCart(event, to, state) {
    event.preventDefault();
    skipHistory.current = true;
    setOpen(false);
    navigate(to, { replace: cartInHistory, state });
  }

  useEffect(() => {
    function onPop() {
      skipHistory.current = true;
      setOpen(false);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setOpen]);

  useEffect(() => {
    if (skipHistory.current) {
      skipHistory.current = false;
      wasOpen.current = open;
      return;
    }
    if (open && !wasOpen.current && !cartInHistory) {
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { state: { ...(location.state || {}), cart: true } },
      );
    } else if (!open && wasOpen.current && cartInHistory) {
      navigate(-1);
    }
    wasOpen.current = open;
  }, [open, cartInHistory, location.pathname, location.search, location.hash, location.state, navigate]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") closeCart();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
            onClick={() => {
              if (location.pathname === "/shop" && !cartInHistory) {
                document.getElementById("spice-search")?.focus();
                return;
              }
              skipHistory.current = true;
              setOpen(false);
              navigate("/shop", { replace: cartInHistory, state: { focusSearch: true } });
            }}
            className="inline-flex shrink-0 items-center rounded-full border border-line bg-card px-4 py-2 text-sm font-medium"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-leaf px-4 py-2 text-sm font-medium text-white"
          >
            Order
            {count > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{count}</span>}
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 px-5 pb-3 text-sm md:hidden">
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
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close order" onClick={closeCart} />
          <aside className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-serif text-2xl">Your order</h2>
              <CrossButton label="Close" onClick={closeCart} />
            </div>
            <div className="flex-1 space-y-4 overflow-auto px-5 py-4">
              {offer && items.length > 0 && (
                <p className="rounded-2xl bg-leaf/10 px-4 py-3 text-sm text-leaf">
                  {offer.title} is on. {offer.percent}% off every spice.
                </p>
              )}
              {notice && <p className="rounded-2xl bg-[#f8efe9] px-4 py-3 text-sm text-maroon">{notice}</p>}
              {items.length === 0 && <p className="text-ink/70">The order is empty. Add a spice and a pack size.</p>}
              {items.map((item) => {
                const line = item.unitPrice * item.qty;
                const lineOff = offer ? Math.round((line * offer.percent) / 100) : 0;
                const product = products.find((spice) => spice.id === item.productId);
                const have = Number(product?.stockGrams);
                const more = !Number.isFinite(have) || heldGrams(items, item.productId) + Number(item.grams) <= have;
                return (
                <div key={item.key} className="rounded-2xl border border-line bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-ink/70">
                        {item.label} · {rupees(item.unitPrice)}
                        {item.qty > 1 ? ` × ${item.qty}` : ""}
                      </p>
                      {lineOff > 0 && (
                        <p className="text-sm text-leaf">
                          {offer.percent}% off · {rupees(line - lineOff)}
                        </p>
                      )}
                    </div>
                    <CrossButton label={`Remove ${item.name}`} tone="maroon" onClick={() => remove(item.key)} />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <button type="button" className="h-8 w-8 rounded-full border border-line" onClick={() => setQty(item.key, item.qty - 1)}>
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button type="button" disabled={!more} className="h-8 w-8 rounded-full border border-line disabled:opacity-40" onClick={() => setQty(item.key, item.qty + 1)}>
                      +
                    </button>
                    {!more && <span className="text-xs text-maroon">Sold out</span>}
                  </div>
                </div>
                );
              })}
            </div>
            <div className="border-t border-line px-5 py-4">
              {items.length > 0 && (
                <div className="mb-3 space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Spices</span>
                    <span>{rupees(total)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-leaf">
                      <span>
                        {offer.title} ({offer.percent}% off)
                      </span>
                      <span>-{rupees(discount)}</span>
                    </div>
                  )}
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
                onClick={(event) => leaveCart(event, "/order")}
                className={`block rounded-full px-4 py-3 text-center text-sm font-medium text-white ${items.length ? "bg-leaf" : "pointer-events-none bg-leaf/40"}`}
              >
                Review and send on WhatsApp
              </Link>
              <Link
                to="/shop"
                onClick={(event) => leaveCart(event, "/shop")}
                className="mt-3 block rounded-full border border-line px-4 py-3 text-center text-sm font-medium"
              >
                Shop more
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
