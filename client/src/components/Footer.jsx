import { Link } from "react-router-dom";
import { useCatalog } from "../catalog";
import { phoneLabel } from "../format";
import { HomeLink, StoryLink } from "./SiteLinks";

const menu = [
  ["/", "Home"],
  ["/shop", "Shop"],
  ["/#story", "Our story"],
  ["/order", "Order"],
];

export function Footer() {
  const { settings } = useCatalog();
  const phone = settings?.phone || "917672091892";
  const email = settings?.email || "shivdurgaspices@gmail.com";

  return (
    <footer className="mt-20 bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[auto_1fr_auto] md:items-start md:gap-16">
        <HomeLink className="justify-self-center md:justify-self-start">
          <img
            src="/logo.jpg"
            alt="Shivdurga Kerala Spices"
            className="h-40 w-40 rounded-full object-cover shadow-[0_8px_24px_rgba(0,0,0,0.25)] sm:h-48 sm:w-48"
          />
        </HomeLink>

        <div>
          <h2 className="text-sm font-semibold tracking-[0.16em] uppercase">Company details</h2>
          <dl className="mt-4 space-y-2 text-sm leading-6 text-cream/90">
            <div>
              <dt className="inline">Trade name: </dt>
              <dd className="inline">
                <HomeLink className="underline decoration-cream/30 underline-offset-4 hover:decoration-cream">
                  Shivdurga Kerala Spices
                </HomeLink>
              </dd>
            </div>
            <div>
              <dt className="inline">Address: </dt>
              <dd className="inline">Thiruvananthapuram, Kerala</dd>
            </div>
            <div>
              <dt className="inline">Phone number: </dt>
              <dd className="inline">
                <a href={`tel:+${phone}`} className="underline decoration-cream/30 underline-offset-4 hover:decoration-cream">
                  {phoneLabel(phone)}
                </a>
              </dd>
            </div>
            <div>
              <dt className="inline">Email: </dt>
              <dd className="inline">
                <a href={`mailto:${email}`} className="underline decoration-cream/30 underline-offset-4 hover:decoration-cream">
                  {email}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-[0.16em] uppercase">Menu</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {menu.map(([to, label]) => (
              <li key={to}>
                {to === "/#story" ? (
                  <StoryLink className="text-cream/90 hover:text-white">{label}</StoryLink>
                ) : (
                  <Link to={to} className="text-cream/90 hover:text-white">
                    {label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto max-w-6xl px-5 py-4 text-xs text-cream/70">
          <p>
            © {new Date().getFullYear()}{" "}
            <HomeLink className="cursor-pointer hover:text-cream">Shivdurga Kerala Spices</HomeLink>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
