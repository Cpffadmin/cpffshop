# tfffoods Architecture

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · MongoDB/Mongoose 8 · NextAuth v4 (JWT) · Tailwind + shadcn/Radix · Zustand + React Context + SWR · Stripe · Brevo · Cloudinary · Google Maps.

## Directory map

```
app/                 App Router pages + api/ route handlers
components/          ~112 components (ui/, Navbar/, HomepageComponents/, products/, logistics/, admin/, theme/, language/)
providers/           React Context providers (Language, Cart, User, Wishlist, Store, Blog, Hero, Newsletter, About, Contact)
store/               Zustand stores (cartStore, productStore)
utils/               database.ts, routeHandler.ts, logger.ts, cache.ts, cloudinary.ts, env.ts, models/
utils/models/        Canonical Mongoose models
models/              HeroSection, FeaturesSection, GuaranteeSection (secondary location)
app/models/          StoreSettings stub (duplicate — avoid)
lib/                 emailService.ts, emailTemplates, auth.ts (stale duplicate)
public/locales/      i18n JSON (en, zh-TW)
scripts/             test-auth.ts, test-products.ts, test-app.ts
types/               shared TS types + next-auth.d.ts augmentation
hooks/               custom hooks
```

## Pages (`app/`)

**Customer:** `/`, `/products`, `/quick-order` (bulk order sheet — see below), `/products/[productId]`, `/product/[id]` (duplicate), `/products/brand/[brand]`, `/categories/[slug]`, `/brands/[slug]`, `/checkout` (+ success/canceled/offline-payment), `/orders[/orderId]`, `/invoices[/invoiceNumber]`, `/profile`, `/login`, `/signup`, `/about`, `/contact`, `/blog[/slug]`, `/privacy-policy`, `/warranty`, `/dashboard`.

**Admin (`/admin/*`):** dashboard, products (+create/editProduct), categories, specifications, brands, orders, invoices, roles, newsletter, blog, logistics, GuaranteeSection, featuresSection, gallery, settings (+theme/hero), delivery, period-users, product-of-the-month. Gated by client `useSession()` in `app/admin/layout.tsx` (NOT server-enforced).

**Conventions present:** root `layout.tsx` (deep provider tree) + admin `layout.tsx`; `not-found.tsx`; **`proxy.ts`** (Next 16's renamed middleware — see Auth). **Missing:** `loading.tsx`, `error.tsx`, route groups.

## API routes (`app/api/` — ~80 handlers)

- **Auth/users:** `auth/[...nextauth]` (config in `auth.config.ts`), `register`, `userData`, `order-templates` (saved quick-order lists), `updateUser`, `changPassword`, `deleteAcc`, `updateNotificationreference`.
- **Catalog:** `products` (paginated + LRU cache 30s), `products/quick-list` (whole catalogue, trimmed fields, for `/quick-order`), `products/allProducts`, `products-search`, `search`, `product/[productId]`, `products/manage/[productId]`, `products/featured`, `bestselling`, `product-of-the-month`, `products/brand/[brand]`, `categories[/category]`, `brands`, `review[/canReview|/allReviews]`, `wishlist`.
- **Orders/checkout:** `checkout` (~493 lines), `checkout/offline-payment`, `orders[/orderId][/download|/print]`, `orderAdmin[/orderId]` (GET/PUT unauthenticated).
- **Invoices:** `invoices/user`, `invoices/admin`, `invoices/[invoiceNumber][/download|/print]`, `invoices/status/[invoiceNumber]`, `cleanup`, `test`.
- **Admin:** `admin/users[/id]`, `admin/categories`, `admin/brands`, `admin/specifications/[categoryId]`, `admin/update-translations`, `admin/period-users`.
- **CMS:** `store-settings`, `theme-settings`, `hero-sections[/sectionId][/reorder|/activate]`, `features-section`, `guarantee-section`, `gallery`, `blog/posts[/id]`, `blog/featured`, `newsletter/subscribe`, `newsletter/subscribers`, `delivery`.
- **Logistics:** `logistics[/vehicleId][/maintenance|/assign]`.
- **Integrations:** `stripe/create-checkout-session`, `stripe/checkout-redirect`, `stripe/diagnostics`, `webhook` (Stripe + Brevo), `cloudinary/signature`, `health`.
- **Debug (security risk):** `test-session`, `test-email`, `stripe/diagnostics`, `invoices/test`.

## Quick order sheet (`/quick-order`)

A **second entry point into the existing cart**, not a parallel ordering flow — it does not replace `/products` or checkout.

**Saved lists (order templates):** `User.orderTemplates[]` stores `{ name, items: [{ product, quantity }] }` — **ids and quantities only**, never snapshots, so names/prices come from the live catalogue on load and deleted products are skipped instead of orphaning (contrast `User.cart`, which needs `removeDeletedProductsFromCart`). CRUD is `/api/order-templates` (GET/POST/PUT/DELETE, manual session check, max 20 lists). Reads ride along on `GET /api/userData` (whole user doc), so `useUser().userData.orderTemplates` powers both the form and the navbar badge with no extra request; writes call `refreshUserData()`. Loading a list fills the steppers (still editable), it does not add to the cart. Managed on the form (Rename pencil on the open list and in the arrival chooser) and in profile → Settings → Saved lists. Rename is `PUT /api/order-templates` with `{ id, displayNames }` only. **List names are bilingual like the catalogue:** `displayNames: { en, "zh-TW" }` is what the UI renders (`templateLabel()` in `lib/orderTemplates.ts`, falling back to the other language and then legacy `name`), and `name` is kept as the flat fallback derived server-side from `displayNames.en || displayNames["zh-TW"]`. Both save and rename dialogs use `MultiLangInput`; either field alone is accepted. List-name inputs must ignore Enter while `nativeEvent.isComposing` so Chinese IME can commit. **Two views, not one filtered grid** (`view: "list" | "browse"`): a customer with saved lists gets a chooser dialog on arrival (pick a list, or browse everything), and opening a list shows *only* its products with quantities pre-filled — the reorder sheet. A blinking "Add more products" button (`.quick-order-blink`, silenced for good via a `localStorage` flag once clicked) switches to the full catalogue, which shows an "Adding to <list>" bar and badges newly ordered rows as **New**. With no saved lists the chooser and switch never appear and the page is the plain catalogue it always was. The open list is the **active list** (`activeListId`); rows differing from the saved copy are counted as "n not saved yet" (ignoring ids absent from the catalogue, which loading skips), and the choice between **Save to \<list\>** and **Save as new list** is offered at save time rather than prompting when an off-list product is picked. **Clear and "Add all to cart" only empty the quantities — they never close the list** (an earlier version did, and since the arrival chooser fires once per visit the list became unreachable and looked deleted). For the same reason the browse view always offers "Open my saved lists" when no list is open, and an empty sheet never counts as unsaved (otherwise clearing would warn that the saved list was at risk). "Reload saved quantities" re-applies the list after a clear. Anything that would drop real unsaved edits confirms first (plus a `beforeunload` guard). Each view has a rows/cards toggle, defaulting by viewport rather than by view: **rows on mobile** (`QuickOrderRow` — thumbnail, name, price and stepper on one line, so a ten-item sheet fits on screen instead of scrolling past a card each) and **cards on desktop** (`QuickOrderCard`, photo-led, where there is room). A `matchMedia("(min-width: 768px)")` listener keeps that in step with the viewport until the customer touches the toggle, after which `layoutChosenRef` freezes their choice; both start at `rows` so the first client render matches the server. `QuickOrderRow` needs `min-w-0` on the row **and** the truncated name — `truncate` implies `nowrap`, so without it a long product name sets the grid track width and pushes the stepper off screen (the container also uses `grid-cols-1`, whose `minmax(0, 1fr)` permits shrinking, not an implicit `auto` track). Shared product shape in `components/quick-order/types.ts`. Category filtering reuses `CategoryMenu` (dropdown + 3-column overlay on mobile, scrolling chips with arrows on desktop) instead of a bespoke chip row that ran off the screen edge; its sentinel value for "no filter" is the string `"All Categories"`, and `hintWhenUnfiltered={false}` suppresses the products-page "pick a product type" blink, which is meaningless where browsing everything is normal. The saved-list count lives on the page, not as a navbar badge. `hooks/useQuickOrderReminder.ts` returns the count plus a `pulse` flag that runs for 10s **on the homepage only** whenever the customer has at least one saved list, styled by `.quick-order-pulse` (yellow, overrides `.navbar-button`) with a `prefers-reduced-motion` fallback. The pulse is invisible until a list exists, so it cannot be tested with an empty account. One dense grid of the whole catalogue with per-product quantity steppers, bilingual search and category chips; quantities persist in `localStorage` under `quick-order-quantities`. "Add all to cart" calls `useCart().addItems()`, which merges the lines into the current cart in **one** store update (one toast, one `/api/userData` sync) and opens the cart drawer, leaving checkout to the customer. Deliberately does **not** reuse `ProductCard`, which fetches `/api/product/:id` per card — 300 cards would mean 300 requests. Products whose category has a **select**-type specification show an options button that loads the full product and opens the shared `SpecificationsModal`; text specs such as `origin` are informational and keep the stepper.

## Data layer

**Connection** (`utils/database.ts`): global-cached singleton; pool `maxPoolSize:50 / minPoolSize:5`; `serverSelectionTimeoutMS:10000`; calls `ensureModelsAreRegistered()` on connect; `waitForConnection(timeout)` polling helper; connection event handlers + SIGINT cleanup. Alias `dbConnect` exists in `utils/config/dbConnection.ts` (same function).

**Models** (`utils/models/`): User, Product, Order, Invoice, InvoiceCounter, Category, Brand, BlogPost, Review, Newsletter, DeliverySettings, StoreSettings, Gallery, Logistics, Vehicle. `utils/models/index.ts` registers a subset; others load via side-effect import. Bilingual fields `{ en, "zh-TW" }` throughout. Key relationships: Product→Brand/Category/User; Order→User + items→Product; Invoice→User/Orders/items→Product; User.wishlist→Product.

## State management

- **Zustand:** `cartStore` (persisted to localStorage, syncs to `/api/userData`), `productStore` (optimistic deletes + SWR `mutate`).
- **Context:** Language, Cart, User, Wishlist, Store/StoreSettings, Blog, Hero, Newsletter, About, Contact, CartUI.
- **SWR:** product lists, blog, wishlist, product details (~18 files).
- **i18n:** `LanguageProvider` with `t(key)` + `getMultiLangValue`; locales under `public/locales/{en,zh-TW}/`; `MultiLangInput` for admin bilingual editing.

## Auth

NextAuth v4, JWT strategy (30-day), Google + Credentials (bcrypt). Active config: `app/api/auth/[...nextauth]/auth.config.ts` (stale duplicate in `lib/auth.ts`). Roles: `admin | accounting | logistics | user`, but most checks use the `admin` boolean. JWT callback persists only `id/email/role/admin`.

**Server-side route protection: `proxy.ts`** (repo root). Next.js 16 renamed the `middleware` convention to `proxy` — do NOT add a `middleware.ts` (Next 16 errors if both exist and crashes the dev server). `proxy.ts` uses `withAuth`, defines `PUBLIC_ROUTES` / `PUBLIC_API_ROUTES`, gates `/admin` pages to admins, and gates `ADMIN_API_ROUTES` (`/api/admin`, `/api/orderAdmin`) to admin tokens. Add new admin API prefixes there.

## Integrations

- **Stripe:** checkout session + `webhook` (`checkout.session.completed` → order update + email).
- **Brevo:** `lib/emailService.ts` + `lib/emailTemplates`; env validated in `utils/env.ts`. (`@sendgrid/mail`, `@aws-sdk/client-ses` are installed but unused.)
- **Cloudinary:** `utils/cloudinary.ts` (+ duplicate `utils/config/cloudinary.ts`); signed uploads via `cloudinary/signature`.
- **Google Maps / Leaflet:** `components/maps/`, `GoogleMapsScript.tsx`.
- **PDF:** `@react-pdf/renderer`, `jspdf`, `html2canvas` for invoices.
