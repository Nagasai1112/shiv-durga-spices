import { Link } from "react-router-dom";
import { useCatalog } from "../catalog";

export function Footer() {
  const { settings } = useCatalog();
  const brand = settings?.brandName || "Shiv Durga Spices";

  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-ink/70 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {brand}. Prices follow the day’s auction rate. The shop confirms every order on WhatsApp.
        </p>
        <Link to="/admin" className="text-leaf">
          Admin
        </Link>
      </div>
    </footer>
  );
}
