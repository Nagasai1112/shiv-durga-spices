# Shiv Durga Spices

A small shop website for Shiv Durga Spices. Customers browse Kerala spices, pick a pack size, and send the order on WhatsApp. The shop confirms the total in the chat. There is no online payment.

The shopkeeper updates the auction rate, photos, brand name, tagline, and WhatsApp number from an admin page.

## What a customer can do

The site works on a computer and on a phone. Pages stack on a small screen.

### Home

- A scrolling line under the header: bulk orders are available, and international orders are welcome. Tapping it opens WhatsApp when the shop number is set. The line pauses when the pointer rests on it.
- Brand name and tagline, both editable from admin.
- A product carousel with the first spices, arrows, dots, and a pause when the pointer is over it.
- Three featured spices. Each one shows 100 g, 250 g, 500 g, and 1 kg. Tap a weight and the amount above the buttons changes.
- Three steps: choose a spice, choose a pack, send the order on WhatsApp.
- A customer-review carousel. Each card is a small phone screenshot, with stars, the customer’s words, and a label such as Verified customer. On a wide screen four cards show at once. It moves about every three seconds, the arrows step through the cards, and it pauses when the pointer is over it.
- An Our story section about spices from Kerala.

### Shop

- Every spice that is in stock.
- Category filters. **All** shows everything. The other labels, such as Ground, Whole, and Blends, come from the category typed in admin. They are not fixed in the code.
- Each card shows 100 g, 250 g, 500 g, and 1 kg. Tap a weight and the amount changes.

### Spice page

- Photo, category, description, and today’s auction rate per kg.
- One amount for the selected pack. Tap 100 g, 250 g, 500 g, or 1 kg and that amount changes.
- Quantity buttons and an add-to-order button.
- The order drawer shows the running list and total.

### Order

The cart is kept in the browser. Review shows each pack, quantity, and the price from the moment it was added.

The form uses Formik and Yup.

| Field | Required | Rule |
| --- | --- | --- |
| Name | Yes | Letters only. Numbers are rejected. |
| Door number | Yes | Must include a number. |
| City | Yes | Letters only. Numbers are rejected. |
| Complete address | Yes | |
| PIN number | Yes | Exactly 6 digits. |
| District | Yes | |
| Landmark | No | |
| Note for the shop | No | |

Empty required fields, a short PIN, or a number in the name or city keep the WhatsApp chat closed and show the message under that field. Name, door number, city, address, PIN, district, and landmark are remembered for the rest of the browser session. The note is not.

**Order on WhatsApp** opens `https://wa.me/` in a new tab with the list, estimated total, and the address filled in. Landmark and the note are included only when the customer typed them. The shop’s WhatsApp number has to be saved in admin first.

### Header and logo

The round logo in the header is the original artwork. A circular crop hides the white corners. The browser tab uses the same circular icon.

## What the shopkeeper can do

Open `/admin`. Customers are not linked here from the shop, but the page exists at that address.

- Sign in with the admin password. Eight wrong tries from the same address lock the form for about ten minutes.
- Change the brand name, tagline, and WhatsApp number. The number is digits only, with the country code, for example `9198XXXXXXX`.
- Change the admin password. The new password needs at least 6 characters.
- For each spice: name, category, description, in-stock switch, and the auction rate per kg. Saving the rate recalculates 100 g, 250 g, 500 g, and 1 kg.
- Upload a JPG, PNG, or WebP photo up to 5 MB. The previous photo is replaced.
- Add a spice or remove one.
- Add, edit, or remove a customer review: the words, a label, 1 to 5 stars, and a WhatsApp screenshot. Reviews show on the home page.

Pack price is `rate per kg × grams / 1000`, rounded to the nearest rupee.

## How the project is put together

- `client` is a React site built with Vite, React Router, and Tailwind.
- `server` is Node and Express. It stores the shop in SQLite (`server/data/shop.db`) and product photos in `server/uploads`.
- In development, Vite serves the site on port 5173 and forwards `/api` and `/uploads` to the API on port 4000.
- In production, `npm start` serves the built site and the API from the same Node process.

The database, uploaded photos, and `.env` are not part of the git history. The first time the server runs on an empty database it adds sample spices, the brand name **Shiv Durga Spices**, the tagline **Taste and trust, straight from Kerala**, and the first customer reviews. The WhatsApp number starts empty. Review screenshots that ship with the site live in `client/public/reviews`. Screenshots added later from admin are stored in `server/uploads`.

## Run it on your computer

Use Node.js 22 or newer. The server uses the built-in `node:sqlite` module.

```bash
npm install
npm install --prefix client
copy .env.example .env
npm run dev
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

Open http://localhost:5173.

Set `ADMIN_PASSWORD` in `.env` before the first start if you want a password other than the development default `shivdurga`. If the database already exists, change the password from the admin page instead. The value in `.env` is only used to create the first admin login.

## Run it for real

```bash
npm install
npm install --prefix client
npm run build
npm start
```

The site and the API are then on port 4000, or on `PORT` from the environment. Set `NODE_ENV=production` so the admin sign-in cookie is only sent over HTTPS.

Point the domain at this Node process. The temporary public preview link used during development is not part of the app and stops when the computer sleeps.
