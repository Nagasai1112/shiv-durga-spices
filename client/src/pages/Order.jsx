import { useEffect, useState } from "react";
import { Form, Formik, useField, useFormikContext } from "formik";
import { Link } from "react-router-dom";
import * as Yup from "yup";
import { useCart } from "../cart";
import { CrossButton } from "../components/CrossButton";
import { useCatalog } from "../catalog";
import { rupees } from "../format";

function read(key) {
  return sessionStorage.getItem(key) || "";
}

function lettersOnly(label) {
  return Yup.string()
    .trim()
    .required(`${label} is required.`)
    .test("letters", function (value) {
      if (!value) return true;
      if (/\d/.test(value)) return this.createError({ message: `${label} cannot contain numbers.` });
      if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(value)) {
        return this.createError({ message: `Enter a valid ${label.toLowerCase()}.` });
      }
      return true;
    });
}

const orderSchema = Yup.object({
  name: lettersOnly("Name"),
  door: Yup.string()
    .trim()
    .required("Door number is required.")
    .test("has-digit", "Enter a valid door number.", (value) => !value || /\d/.test(value)),
  city: lettersOnly("City"),
  address: Yup.string().trim().required("Complete address is required."),
  pin: Yup.string()
    .trim()
    .required("PIN number is required.")
    .matches(/^\d{6}$/, { message: "Enter a 6-digit PIN number.", excludeEmptyString: true }),
  district: Yup.string().trim().required("District is required."),
  phone: Yup.string()
    .trim()
    .required("Phone number is required.")
    .matches(/^[6-9]\d{9}$/, { message: "Enter a valid 10-digit mobile number.", excludeEmptyString: true }),
  landmark: Yup.string().trim(),
  note: Yup.string().trim(),
});

function showFieldErrors(err, setErrors, setTouched) {
  const errors = {};
  const touched = {
    name: true,
    door: true,
    city: true,
    address: true,
    pin: true,
    district: true,
    phone: true,
    landmark: true,
    note: true,
  };
  for (const issue of err.inner?.length ? err.inner : [err]) {
    if (issue.path && !errors[issue.path]) errors[issue.path] = issue.message;
  }
  setTouched(touched, false);
  setErrors(errors);
  requestAnimationFrame(() => {
    document.querySelector("[aria-invalid='true']")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function trimmedOrder(values) {
  return {
    name: values.name.trim(),
    door: values.door.trim(),
    city: values.city.trim(),
    address: values.address.trim(),
    pin: values.pin.trim(),
    district: values.district.trim(),
    phone: values.phone.trim(),
    landmark: values.landmark.trim(),
    note: values.note.trim(),
  };
}

function rememberOrder(values) {
  const trimmed = trimmedOrder(values);
  sessionStorage.setItem("order-name", trimmed.name);
  sessionStorage.setItem("order-door", trimmed.door);
  sessionStorage.setItem("order-city", trimmed.city);
  sessionStorage.setItem("order-address", trimmed.address);
  sessionStorage.setItem("order-pin", trimmed.pin);
  sessionStorage.setItem("order-district", trimmed.district);
  sessionStorage.setItem("order-phone", trimmed.phone);
  sessionStorage.setItem("order-landmark", trimmed.landmark);
  sessionStorage.setItem("order-note", trimmed.note);
  return trimmed;
}

function phoneDigits(value) {
  let digits = String(value).replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

function WhatsAppOrderLink({ number, message, onMissing }) {
  const { values, setErrors, setTouched } = useFormikContext();
  const href = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message(trimmedOrder(values)))}`
    : "#";

  function onClick(event) {
    event.preventDefault();
    try {
      orderSchema.validateSync(values, { abortEarly: false });
    } catch (err) {
      showFieldErrors(err, setErrors, setTouched);
      return;
    }
    if (!number) {
      onMissing();
      return;
    }
    rememberOrder(values);
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.location.href = href;
    else window.location.assign(href);
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="mt-5 block w-full rounded-full bg-leaf px-4 py-3 text-center text-sm font-medium text-white"
    >
      Order on WhatsApp
    </a>
  );
}

function OrderField({ name, label, optional = false, as = "input", onValue, flagNumbers = false, ...props }) {
  const [field, meta, helpers] = useField(name);
  const invalid = Boolean(meta.error && (meta.touched || (flagNumbers && /\d/.test(field.value))));
  const Tag = as;

  return (
    <label className="block text-sm">
      {label}
      {optional && <span className="text-ink/50"> (optional)</span>}
      <Tag
        {...field}
        {...props}
        aria-invalid={invalid || undefined}
        onChange={(event) => {
          if (onValue) helpers.setValue(onValue(event.target.value));
          else field.onChange(event);
        }}
        className={`mt-1 w-full rounded-2xl border bg-cream px-3 py-3 ${invalid ? "border-maroon" : "border-line"}`}
      />
      {invalid && <p className="mt-1 text-sm text-maroon">{meta.error}</p>}
    </label>
  );
}

export function Order() {
  const { items, total, setQty, remove, clear } = useCart();
  const { settings } = useCatalog();
  const brand = settings?.brandName || "Shiv Durga Spices";
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `Order · ${brand}`;
  }, [brand]);

  function message(values) {
    const lines = items.map(
      (item) => `- ${item.name}, ${item.label} × ${item.qty} — ${rupees(item.unitPrice)} each`,
    );
    return [
      `Hello ${brand}, I would like to order:`,
      "",
      ...lines,
      "",
      `Spices: ${rupees(total)}`,
      `Delivery: ${deliveryCharge ? rupees(deliveryCharge) : "Free"}`,
      `Estimated total: ${rupees(grandTotal)}`,
      "",
      settings?.paymentNote || "Pay by UPI or cash. We confirm the payment with you on WhatsApp.",
      settings?.deliveryNote || "",
      "",
      `Name: ${values.name}`,
      `Phone: ${values.phone}`,
      `Door number: ${values.door}`,
      `City: ${values.city}`,
      `Complete address: ${values.address}`,
      `PIN: ${values.pin}`,
      `District: ${values.district}`,
      values.landmark ? `Landmark: ${values.landmark}` : "",
      values.note ? `Note: ${values.note}` : "",
      "",
      "Please confirm the total, delivery, and payment.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const whatsappNumber = settings?.whatsappNumber || "";
  const deliveryCharge = Number(settings?.deliveryCharge) || 0;
  const grandTotal = total + deliveryCharge;

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-serif text-5xl">Your order is empty</h1>
        <p className="mt-3 text-ink/75">Add spices from the shop, then send the order on WhatsApp.</p>
        <Link to="/shop" className="mt-6 inline-block rounded-full bg-saffron px-5 py-3 text-sm font-medium text-white">
          Shop spices
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <h1 className="font-serif text-5xl">Review the order</h1>
        <p className="mt-3 text-ink/75">
          Spice prices are from when you added each pack. Delivery is added on the right. Tap Order on WhatsApp and press send. The shop sees the order in WhatsApp. {settings?.paymentNote}
        </p>
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.key} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-ink/70">
                  {item.label} · {rupees(item.unitPrice)} each
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="h-8 w-8 rounded-full border border-line" onClick={() => setQty(item.key, item.qty - 1)}>
                  −
                </button>
                <span>{item.qty}</span>
                <button type="button" className="h-8 w-8 rounded-full border border-line" onClick={() => setQty(item.key, item.qty + 1)}>
                  +
                </button>
                <CrossButton label={`Remove ${item.name}`} tone="maroon" onClick={() => remove(item.key)} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <Formik
        initialValues={{
          name: read("order-name"),
          door: read("order-door"),
          city: read("order-city"),
          address: read("order-address"),
          pin: read("order-pin"),
          district: read("order-district"),
          phone: read("order-phone"),
          landmark: read("order-landmark"),
          note: read("order-note"),
        }}
        validationSchema={orderSchema}
        onSubmit={() => {}}
      >
        <Form noValidate className="h-fit rounded-[2rem] border border-line bg-card p-6">
          <div className="space-y-2 text-sm">
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
              <span className="font-serif text-3xl">{rupees(grandTotal)}</span>
            </div>
          </div>
          {settings?.deliveryNote && <p className="mt-3 text-sm text-ink/70">{settings.deliveryNote}</p>}
          <div className="mt-5">
            <OrderField name="name" label="Name" autoComplete="name" flagNumbers />
          </div>
          <div className="mt-3">
            <OrderField
              name="phone"
              label="Phone number"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={16}
              onValue={phoneDigits}
            />
          </div>
          <div className="mt-3">
            <OrderField name="door" label="Door number" autoComplete="address-line1" />
          </div>
          <div className="mt-3">
            <OrderField name="city" label="City" autoComplete="address-level-2" flagNumbers />
          </div>
          <div className="mt-3">
            <OrderField name="address" label="Complete address" as="textarea" rows="2" autoComplete="street-address" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <OrderField
              name="pin"
              label="PIN number"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              onValue={(value) => value.replace(/\D/g, "").slice(0, 6)}
            />
            <OrderField name="district" label="District" />
          </div>
          <div className="mt-3">
            <OrderField name="landmark" label="Landmark" optional />
          </div>
          <div className="mt-3">
            <OrderField name="note" label="Note for the shop" optional as="textarea" rows="3" />
          </div>
          {error && <p className="mt-3 text-sm text-maroon">{error}</p>}
          <WhatsAppOrderLink
            number={whatsappNumber}
            message={message}
            onMissing={() => setError("The shop WhatsApp number is not set yet. Add it from the admin page.")}
          />
          <button type="button" onClick={clear} className="mt-3 w-full text-sm text-ink/60">
            Clear order
          </button>
        </Form>
      </Formik>
    </main>
  );
}
