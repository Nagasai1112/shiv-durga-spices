import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { api } from "../../api";

export function AdminLayout() {
  const [authed, setAuthed] = useState(null);
  const [items, setItems] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
  const [storage, setStorage] = useState(null);
  const [menuError, setMenuError] = useState("");
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  function loadMenu() {
    return api("/api/admin/menu")
      .then((menu) => {
        setItems(Array.isArray(menu.items) ? menu.items : []);
        setOutOfStock(Array.isArray(menu.outOfStock) ? menu.outOfStock : []);
        setStorage(menu.storage || null);
      })
      .catch((err) => setMenuError(err.message));
  }

  useEffect(() => {
    document.title = "Admin · Shivdurga Kerala Spices";
    api("/api/auth/me")
      .then(() => {
        setAuthed(true);
        return loadMenu();
      })
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!authed) return undefined;
    loadMenu();
    const refresh = () => loadMenu();
    window.addEventListener("stock-changed", refresh);
    return () => window.removeEventListener("stock-changed", refresh);
  }, [authed, pathname]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("auth-changed"));
    setAuthed(false);
  }

  if (authed === null) return <main className="mx-auto max-w-3xl px-5 py-16">Checking the admin sign-in…</main>;

  if (!authed) return <Navigate to="/sign-in" replace />;

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 lg:flex-row lg:items-start">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-full border border-line bg-card px-4 py-2 text-sm"
          aria-expanded={open}
        >
          {open ? "Close menu" : "Admin menu"}
        </button>
      </div>
      <aside className={`${open ? "block" : "hidden"} w-full shrink-0 lg:sticky lg:top-28 lg:block lg:w-56`}>
        <nav className="rounded-[2rem] border border-line bg-card p-3" aria-label="Admin">
          <p className="px-3 pt-2 pb-3 text-xs tracking-[0.18em] text-saffron uppercase">Shop admin</p>
          {menuError && <p className="px-3 pb-2 text-sm text-maroon">{menuError}</p>}
          {!items.length && !menuError && <p className="px-3 pb-3 text-sm text-ink/70">Opening the menu…</p>}
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={Boolean(item.end)}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-sm ${isActive ? "bg-ink text-cream" : "text-ink hover:bg-cream-deep"}`
                }
              >
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${item.to === "/admin/stock" ? "bg-maroon text-cream" : ""}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
          <button type="button" onClick={logout} className="mt-3 w-full rounded-2xl px-3 py-2.5 text-left text-sm text-ink/70 hover:bg-cream-deep">
            Sign out
          </button>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        {storage?.where === "temporary" && (
          <div className="mb-4 rounded-[2rem] border border-maroon/30 bg-[#f8efe9] px-5 py-4">
            <p className="font-medium text-maroon">Saves do not last on this host</p>
            <p className="mt-1 text-sm text-ink/80">
              Names, photos, descriptions, and stock are wiped when the live site sleeps. Mount a disk at /var/data and set DATA_DIR to /var/data, or set GITHUB_TOKEN, then add the spice and the kilograms again.
            </p>
          </div>
        )}
        {outOfStock.length > 0 && pathname !== "/admin/stock" && (
          <div className="mb-4 rounded-[2rem] border border-maroon/30 bg-[#f8efe9] px-5 py-4">
            <p className="font-medium text-maroon">Out of stock</p>
            <p className="mt-1 text-sm text-ink/80">
              {outOfStock.length === 1
                ? outOfStock[0]
                : outOfStock.length === 2
                  ? `${outOfStock[0]} and ${outOfStock[1]}`
                  : `${outOfStock.slice(0, -1).join(", ")} and ${outOfStock[outOfStock.length - 1]}`}{" "}
              {outOfStock.length === 1 ? "is" : "are"} finished. The shop shows {outOfStock.length === 1 ? "it" : "them"} as sold out.
            </p>
            <Link to="/admin/stock" className="mt-2 inline-block text-sm text-maroon underline decoration-maroon/40 underline-offset-4">
              Open stock
            </Link>
          </div>
        )}
        <Outlet />
      </div>
    </main>
  );
}
