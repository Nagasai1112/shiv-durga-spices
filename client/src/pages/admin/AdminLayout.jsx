import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { api } from "../../api";

const links = [
  ["/admin", "Home", true],
  ["/admin/spices", "Spices", true],
  ["/admin/spices/new", "Add a spice", false],
  ["/admin/reviews", "Reviews", true],
  ["/admin/reviews/new", "Add a review", false],
  ["/admin/shop", "Shop details", false],
  ["/admin/password", "Password", false],
];

export function AdminLayout() {
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    document.title = "Admin · Shivdurga Kerala Spices";
    api("/api/auth/me")
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("auth-changed"));
    setAuthed(false);
  }

  if (authed === null) return <main className="mx-auto max-w-3xl px-5 py-16">Checking the admin sign-in…</main>;

  if (!authed) return <Navigate to="/sign-in" replace />;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tracking-[0.18em] text-saffron uppercase">Shop admin</p>
        <button type="button" onClick={logout} className="rounded-full border border-line bg-card px-4 py-2 text-sm">
          Sign out
        </button>
      </div>
      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Admin">
        {links.map(([to, label, end]) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm ${isActive ? "bg-ink text-cream" : "border border-line bg-card text-ink hover:border-saffron"}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-8">
        <Outlet />
      </div>
    </main>
  );
}
