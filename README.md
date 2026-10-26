# Shivdurga Kerala Spices

A shop website for Shivdurga Kerala Spices in Thiruvananthapuram, Kerala. Customers browse whole spices, pick a pack, and send the order on WhatsApp. The shop confirms the total in the chat. There is no online payment and no customer account.

The shopkeeper changes pack prices, photos, descriptions, reviews, delivery charges, shop details, and the password from the admin pages. Sign in is at `/sign-in`. That page is not linked from the header or the footer.

## Live site

The public shop is https://shivdurgaspices.com. https://www.shivdurgaspices.com redirects there. The domain is registered at Namecheap. One Render web service, `shiv-durga-spices`, serves the built pages and the API together. There is no separate frontend host.

Namecheap stays on BasicDNS. The host records are:

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `216.24.57.1` |
| CNAME | `www` | `shiv-durga-spices.onrender.com` |

Render verifies the names and issues the HTTPS certificate. The Render workspace stays on the free Hobby plan. The service instance is separate: a free instance sleeps after a quiet period, and a paid instance stays awake. Prices, uploaded photos, and the WhatsApp number are stored on the service disk. A persistent disk is what keeps those admin changes after a restart or a new deploy.

## What a customer can do

The site works on a computer and on a phone. Layout uses Tailwind CSS utility classes, so sections sit in columns on a wide screen and stack on a small one.

### Home

- A scrolling line under the header. Tapping it opens WhatsApp when the shop number is set. The line pauses when the pointer rests on it.
- The brand name and tagline. Both can be edited in admin.
- A product carousel.
- Our Best Sellers. Marked spices sit side by side on a wide screen. On a phone they stack.
- Featured spices. Each card shows the description, then 100 g, 250 g, 500 g, and 1 kg. Tap a weight and that pack’s price changes.
- Three steps: choose a spice, choose a pack, send the order on WhatsApp.
- A customer-review carousel. On a wide screen several cards show at once. It pauses when the pointer is over it. **See all reviews** opens the reviews page.
- An Our story section.

### Shop

- Search from the header, or from the search box on the shop page. It matches the spice name and the description.
- Category filters. **All** shows everything. Other labels come from the category typed in admin.
- Each card shows the description and the four pack prices.

### Spice page

- Photo, category, description, and the price of the selected pack.
- Pack buttons for 100 g, 250 g, 500 g, and 1 kg.
- An add-to-order button. The order drawer shows the running list, the delivery charge, and the estimated total.

### Order

The cart stays in the browser. Each line keeps the pack price from the moment it was added.

The form uses Formik and Yup.

| Field | Required | Rule |
| --- | --- | --- |
| Name | Yes | Letters only. Numbers are rejected. |
| Phone | Yes | A 10-digit Indian mobile number, starting with 6, 7, 8, or 9. |
| Door number | Yes | Must include a number. |
| City | Yes | Letters only. Numbers are rejected. |
| Complete address | Yes | |
| PIN number | Yes | Exactly 6 digits. |
| District | Yes | |
| Landmark | No | |
| Note for the shop | No | |

**Review and send on WhatsApp** opens `https://wa.me/` with the list, the delivery charge, the estimated total, and the address. The shop’s WhatsApp number has to be saved in admin first. The website does not keep a copy of the order.

Delivery is one flat charge for the whole order. Up to 5 kg, including a small pack, it is ₹90. Above 5 kg it is ₹60. The cutoff and both amounts can be changed in Shop details.

The phone’s back button closes the order drawer and stays on the site. **Shop more** closes the drawer and opens the shop, with the spices already chosen still in the cart.

### Reviews

`/reviews` lists every customer review as a card. The newest review is at the top. Each card shows the WhatsApp screenshot, the stars, and the customer’s words. No sign-in is needed. The home carousel stays in its own order and links here.

### Track

After dispatch, the shop sends an India Post number on WhatsApp. The customer opens **Track**, pastes that number, and India Post opens so they can see the parcel. The number looks like `CL123456789IN`. No customer login is required. India Post asks for the number on its own page.

### Header and footer

The header links are Home, Shop, Our story, Reviews, and Track. The round logo and the trade name go back to the home page. The footer lists the address as Thiruvananthapuram, Kerala, plus the shop phone and email. **Reach us** is the Instagram icon only. It opens https://www.instagram.com/shivdurgaspices/ in a new tab. The footer menu adds Order beside those header links.

## What the shopkeeper can do

Open `/sign-in`. After signing in, the admin home links to spices, reviews, shop details, and the password.

- Eight wrong tries from the same address lock the form for about ten minutes.
- Change the brand name, tagline, WhatsApp number, phone, email, delivery note, and payment note.
- Set the delivery cutoff in kg, the flat charge up to that weight, and the flat charge above it.
- For each spice: name, category, description, in-stock switch, best-seller switch, and a separate price for 100 g, 250 g, 500 g, and 1 kg.
- Upload a JPG, PNG, or WebP photo up to 5 MB.
- Add a spice or remove one. Removing asks for confirmation in a dialog on the page.
- Spices and reviews are shown as cards, side by side. The newest one is at the top. Open a card to edit that spice or review, then close it to return to the cards.
- Add, edit, or remove a customer review, including the WhatsApp screenshot.

New spices added in admin appear in the shop with the ones already there. The starter list is only what a new database begins with.

## Starter spices

The first time the server runs, and when an older database still has the previous sample spices, the shop is filled with these whole spices:

| Spice | Description |
| --- | --- |
| Cardamom | A fragrant spice with a sweet, refreshing aroma, commonly used in sweets, tea, and cooking. |
| Clove | A warm and aromatic spice with a strong, slightly sweet flavour, widely used in cooking and beverages. |
| Cinnamon Stick | A naturally sweet and aromatic spice used to add warmth and flavour to curries, desserts, and drinks. |
| Black Pepper | A classic spice with a sharp, pungent flavour that enhances the taste of a wide variety of dishes. |
| Star Anise | A star-shaped spice with a sweet, licorice-like aroma, often used in biryanis, curries, and beverages. |
| Mace | The delicate, aromatic outer covering of nutmeg, known for its warm and slightly sweet flavour. |
| Nutmeg | A warm, fragrant spice with a slightly sweet and nutty flavour, perfect for sweets, curries, and beverages. |
| Bay Leaf | An aromatic leaf that adds a subtle, earthy fragrance and flavour to rice dishes, curries, and gravies. |

Cardamom and Clove start as best sellers. Each pack starts with a price based on a per-kilogram rate. Replace those prices in admin. Their photos ship with the site in `client/public/spices`. A photo uploaded later from admin replaces the starter photo for that spice.

The brand starts as **Shivdurga Kerala Spices**, the tagline as **Taste and trust, straight from Keralam**, the phone as **917672091892**, and the email as **shivdurgaspices@gmail.com**. The WhatsApp number used for orders starts empty until it is saved in Shop details.

## How the project is put together

- `client` is a React site built with Vite, React Router, and Tailwind.
- `server` is Node and Express. It stores the shop in SQLite (`server/data/shop.db`) and product photos in `server/uploads`.
- In development, Vite serves the site on port 5173 and forwards `/api` and `/uploads` to the API on port 4000.
- In production, `npm start` serves the built site and the API from the same Node process.

The database, uploaded photos, and `.env` are not part of the git history. Review screenshots that ship with the site live in `client/public/reviews`. Screenshots added later from admin are stored in `server/uploads`.

A free host with no lasting disk starts again from the starter spices. Prices, photos, and the WhatsApp number typed into the live admin need to be entered again after that disk is cleared.

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

Set `ADMIN_PASSWORD` in `.env` before the first start. If the database already exists, change the password from the admin password page. The value in `.env` is only used to create the first admin login.

## Run it for real

The client build needs the client development packages. A production install skips those unless they are requested.

```bash
npm install
npm install --prefix client --include=dev
npm run build
npm start
```

The site and the API are then on port 4000, or on `PORT` from the environment. Set `NODE_ENV=production` so the admin sign-in cookie is only sent over HTTPS. Set `NODE_VERSION=22` on the host.

On Render, the live service is the one web service above. Use this build command:

```bash
npm install && npm install --prefix client --include=dev && npm run build
```

Use `npm run start` as the start command.
