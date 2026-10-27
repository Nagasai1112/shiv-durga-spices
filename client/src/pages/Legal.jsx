import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../catalog";
import { BRAND, deliveryLine, phoneLabel } from "../format";

function Policy({ title, children }) {
  const { settings } = useCatalog();
  const brand = settings?.brandName || BRAND;

  useEffect(() => {
    document.title = `${title} · ${brand}`;
  }, [title, brand]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs tracking-[0.2em] text-saffron uppercase">Legal</p>
      <h1 className="mt-2 font-serif text-5xl">{title}</h1>
      <div className="mt-8 space-y-4 leading-7 text-ink/80">{children}</div>
    </main>
  );
}

export function PrivacyPolicy() {
  const { settings } = useCatalog();
  const brand = settings?.brandName || BRAND;
  const email = settings?.email || "shivdurgaspices@gmail.com";

  return (
    <Policy title="Privacy policy">
      <p>
        {brand} uses this website so you can choose spices and send an order on WhatsApp. There is no customer account and no payment on the website.
      </p>
      <p>
        The order list stays in your browser until you clear it. When you tap Review and send on WhatsApp, your name, phone number, address, and the spice list go into the WhatsApp chat. The website does not keep a copy of that order.
      </p>
      <p>
        The shopkeeper’s sign-in is separate. Customers do not use it. Questions about this policy can be sent to{" "}
        <a className="text-leaf" href={`mailto:${email}`}>{email}</a>.
      </p>
    </Policy>
  );
}

export function RefundPolicy() {
  const { settings } = useCatalog();
  const email = settings?.email || "shivdurgaspices@gmail.com";

  return (
    <Policy title="Refund and returns">
      <p>
        The spices are packed for your order. If the parcel arrives in good condition, the shop does not take the spices back and does not exchange them.
      </p>
      <p>Contact the shop on WhatsApp or by email if any of these happens when you open the parcel:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>The packing is damaged or has leaked.</li>
        <li>The spice you received is not the one you ordered.</li>
        <li>An item is missing.</li>
        <li>The spice is not fit to use on arrival.</li>
      </ul>
      <p>
        A 360° unboxing video is mandatory. Open the parcel clearly without hiding the items. Only a clear opening video is accepted for a missing or wrong item. Email{" "}
        <a className="text-leaf" href={`mailto:${email}`}>{email}</a> if you cannot use WhatsApp.
      </p>
      <p>
        Payment is arranged in the WhatsApp chat, not on this website. The shop confirms in that chat whether a refund applies.
      </p>
    </Policy>
  );
}

export function ShippingPolicy() {
  const { settings } = useCatalog();

  return (
    <Policy title="Shipping">
      <p>Orders are packed in Thiruvananthapuram, Kerala. {deliveryLine(settings)}</p>
      <p>
        After dispatch, the shop sends an India Post number on WhatsApp. You can paste that number on the <Link className="text-leaf" to="/track">Track</Link> page. India Post then shows the parcel.
      </p>
      <p>
        International orders are welcome. The shop confirms the shipping charge and the dispatch in the WhatsApp chat before you pay.
      </p>
    </Policy>
  );
}

export function Terms() {
  const { settings } = useCatalog();
  const brand = settings?.brandName || BRAND;

  return (
    <Policy title="Terms">
      <p>
        The prices on the site are the pack prices for 100 g, 250 g, 500 g, and 1 kg. {deliveryLine(settings)} The shop confirms the total in WhatsApp before payment. There is no payment on this website.
      </p>
      <p>
        An order needs your name, a 10-digit Indian mobile number, and your address. The shop can confirm or decline the order in the chat.
      </p>
      <p>
        If something is missing or wrong, a 360° unboxing video is mandatory. Open the parcel clearly without hiding the items. Only a clear opening video is accepted for that claim.
      </p>
      <p>The photographs, words, and spice list on this website belong to {brand}.</p>
    </Policy>
  );
}

export function Contact() {
  const { settings } = useCatalog();
  const brand = settings?.brandName || BRAND;
  const phone = settings?.phone || "917672091892";
  const email = settings?.email || "shivdurgaspices@gmail.com";
  const whatsapp = settings?.whatsappNumber || settings?.phone || "";

  return (
    <Policy title="Contact">
      <p>Questions and orders go to {brand} on WhatsApp, by phone, or by email.</p>
      <dl className="space-y-3">
        <div>
          <dt className="inline font-medium text-ink">Address: </dt>
          <dd className="inline">Thiruvananthapuram, Kerala</dd>
        </div>
        <div>
          <dt className="inline font-medium text-ink">Phone: </dt>
          <dd className="inline">
            <a className="text-leaf" href={`tel:+${phone}`}>{phoneLabel(phone)}</a>
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-ink">Email: </dt>
          <dd className="inline">
            <a className="text-leaf" href={`mailto:${email}`}>{email}</a>
          </dd>
        </div>
        {whatsapp && (
          <div>
            <dt className="inline font-medium text-ink">WhatsApp: </dt>
            <dd className="inline">
              <a className="text-leaf" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                {phoneLabel(whatsapp)}
              </a>
            </dd>
          </div>
        )}
        <div>
          <dt className="inline font-medium text-ink">Instagram: </dt>
          <dd className="inline">
            <a className="text-leaf" href="https://www.instagram.com/shivdurgaspices/" target="_blank" rel="noreferrer">
              @SHIVDURGASPICES
            </a>
          </dd>
        </div>
      </dl>
    </Policy>
  );
}
