import { Link } from "react-router-dom";
import { useCatalog } from "../catalog";
import { phoneLabel } from "../format";
import { HomeLink, StoryLink } from "./SiteLinks";

const menu = [
  ["/", "Home"],
  ["/shop", "Shop"],
  ["/#story", "Our story"],
  ["/reviews", "Reviews"],
  ["/order", "Order"],
  ["/track", "Track"],
];

const legal = [
  ["/privacy", "Privacy policy"],
  ["/refunds", "Refund and returns"],
  ["/shipping", "Shipping"],
  ["/terms", "Terms"],
  ["/contact", "Contact"],
  ["/#story", "About us"],
];

export function Footer() {
  const { settings } = useCatalog();
  const phone = settings?.phone || "917672091892";
  const email = settings?.email || "shivdurgaspices@gmail.com";

  return (
    <footer className="mt-20 bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-2 md:items-start lg:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] lg:gap-10">
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
          <h2 className="text-sm font-semibold tracking-[0.16em] uppercase">Reach us</h2>
          <a
            href="https://www.instagram.com/shivdurgaspices/"
            target="_blank"
            rel="noreferrer"
            aria-label="Shivdurga Kerala Spices on Instagram"
            className="mt-4 inline-flex text-cream hover:text-white"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/25 bg-white text-ink">
              <InstagramIcon />
            </span>
          </a>
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

        <div>
          <h2 className="text-sm font-semibold tracking-[0.16em] uppercase">Legal</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {legal.map(([to, label]) => (
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

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
