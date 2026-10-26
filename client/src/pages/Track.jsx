import { useEffect, useState } from "react";
import { useCatalog } from "../catalog";
import { BRAND } from "../format";

const INDIA_POST = "https://indiapost.gov.in/VAS/Pages/trackconsignment.aspx";

function articleNumber(value) {
  return String(value || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function Track() {
  const { settings } = useCatalog();
  const brand = settings?.brandName || BRAND;
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState("");

  useEffect(() => {
    document.title = `Track · ${brand}`;
  }, [brand]);

  async function seeTracking(event) {
    event.preventDefault();
    const number = articleNumber(value);
    if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) {
      setReady("");
      setError("Paste the India Post number from WhatsApp. It looks like CL123456789IN.");
      return;
    }
    setError("");
    setValue(number);
    setReady(number);
    try {
      await navigator.clipboard.writeText(number);
    } catch {
      // The number stays on the page when the browser will not copy it.
    }
    window.open(INDIA_POST, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <p className="text-xs tracking-[0.2em] text-saffron uppercase">After dispatch</p>
      <h1 className="mt-2 font-serif text-5xl">Track your parcel</h1>
      <p className="mt-3 text-ink/75">
        When the shop sends your India Post number on WhatsApp, copy it and paste it here. No sign-in is needed.
      </p>
      <form onSubmit={seeTracking} className="mt-8 rounded-[2rem] border border-line bg-card p-6">
        <label className="block text-sm" htmlFor="tracking-number">
          India Post number
          <input
            id="tracking-number"
            value={value}
            onChange={(event) => {
              setValue(event.target.value.toUpperCase());
              setError("");
            }}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Paste the number from WhatsApp"
            className="mt-2 w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base tracking-wide text-ink outline-none"
          />
        </label>
        {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
        <button type="submit" className="mt-5 w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream">
          See tracking
        </button>
      </form>
      {ready && (
        <div className="mt-6 rounded-[2rem] border border-line bg-card p-6">
          <p className="text-sm text-ink/70">Your number</p>
          <p className="mt-1 font-serif text-3xl tracking-wide">{ready}</p>
          <p className="mt-3 text-sm text-ink/75">
            India Post is open in a new tab. Paste this number there and enter the security code. The updates appear after India Post scans the parcel.
          </p>
          <a
            href={INDIA_POST}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm text-leaf underline decoration-leaf/30 underline-offset-4"
          >
            Open India Post again
          </a>
        </div>
      )}
    </main>
  );
}
