import { Link } from "react-router-dom";
import { useCatalog } from "../catalog";
import { phoneLabel } from "../format";
import { HomeLink, StoryLink } from "./SiteLinks";

const menu = [
  ["/", "Home"],
  ["/shop", "Shop"],
  ["/offers", "Offers"],
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
          <dl className="mt-4 space-y-3 text-sm leading-6 text-cream/90">
            <div className="flex items-start gap-2.5">
              <TradeNameIcon />
              <div>
                <dt className="inline">Trade name: </dt>
                <dd className="inline">
                  <HomeLink className="underline decoration-cream/30 underline-offset-4 hover:decoration-cream">
                    Shivdurga Kerala Spices
                  </HomeLink>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <AddressIcon />
              <div>
                <dt className="inline">Address: </dt>
                <dd className="inline">Thiruvananthapuram, Kerala</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <PhoneIcon />
              <div>
                <dt className="inline">Phone number: </dt>
                <dd className="inline">
                  <a href={`tel:+${phone}`} className="underline decoration-cream/30 underline-offset-4 hover:decoration-cream">
                    {phoneLabel(phone)}
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <EmailIcon />
              <div>
                <dt className="inline">Email: </dt>
                <dd className="inline">
                  <a href={`mailto:${email}`} className="underline decoration-cream/30 underline-offset-4 hover:decoration-cream">
                    {email}
                  </a>
                </dd>
              </div>
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

function DetailIcon({ children }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 h-[1.35rem] w-[1.35rem] shrink-0 overflow-visible">
      {children}
    </svg>
  );
}

const iconFill = { fill: "#000", stroke: "#fff", strokeWidth: 1.6, strokeLinejoin: "round", strokeLinecap: "round" };

function TradeNameIcon() {
  return (
    <DetailIcon>
      <path {...iconFill} d="M4.2 10.6 6.7 5h10.6l2.5 5.6H4.2z" />
      <path {...iconFill} d="M4.7 10.6h14.6v7.7a1.4 1.4 0 0 1-1.4 1.4H6.1a1.4 1.4 0 0 1-1.4-1.4v-7.7z" />
      <path {...iconFill} d="M10 19.7v-4.8h4v4.8" />
    </DetailIcon>
  );
}

function AddressIcon() {
  return (
    <DetailIcon>
      <path {...iconFill} d="M12 21.4s-6.1-5.3-6.1-10a6.1 6.1 0 1 1 12.2 0c0 4.7-6.1 10-6.1 10z" />
      <circle {...iconFill} cx="12" cy="11.2" r="2.15" />
    </DetailIcon>
  );
}

function PhoneIcon() {
  return (
    <DetailIcon>
      <path
        {...iconFill}
        d="M8.1 3.7h1.8c.55 0 1.05.38 1.16.92l.55 2.35c.1.52-.16 1.05-.64 1.32l-1.15.68a.85.85 0 0 0-.38.96 10.6 10.6 0 0 0 4.55 4.55c.4.2.88.12 1.16-.22l.9-1.05c.32-.38.86-.52 1.36-.36l2.2.72c.52.17.88.65.88 1.2v1.55c0 .7-.5 1.3-1.18 1.42-1.35.22-2.7.1-4-.5A15.8 15.8 0 0 1 5.9 8.55c-.48-1.28-.55-2.64-.28-3.95.12-.66.7-1.14 1.36-1.16z"
      />
    </DetailIcon>
  );
}

function EmailIcon() {
  return (
    <DetailIcon>
      <rect {...iconFill} x="3.3" y="5.4" width="17.4" height="13.2" rx="1.8" />
      <path {...iconFill} fill="none" d="M4.3 7.3 12 12.5l7.7-5.2" />
    </DetailIcon>
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
