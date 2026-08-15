# Routes (public)

| Path | Page | Notes |
|---|---|---|
| `/` | Home | Hero, search, categories, featured, why/how, CTA, contact |
| `/products` | Products | Full listing, category filter (bottom sheet) |
| `/products/:id` | ProductDetail | Variant selection, enquire/call |
| `/categories/:id` | CategoryDetail | Products scoped to one category |
| `/search` | Search | Debounced, query preserved in URL (`?q=`) |
| `/about` | About | |
| `/contact` | Contact | Call / WhatsApp / email + address / Google Maps link (Location merged in) |
| `/enquire` | Enquire | Enquiry form; accepts `{ productId, productName }` nav state |
| `/request-purchase` | RequestPurchase | Out-of-stock "notify me" form; accepts `{ productName }` nav state; writes to `purchase_requests`, not `enquiries` |
| `*` | NotFound | |

Bottom nav tabs: Home, Search, Enquire (raised/emphasized center action), Tools (`/products`), Contact — five explicit destinations, no catch-all "More" tab. `About` is reachable from the footer instead.

## Admin routes

`/admin/*` is fully built: login, dashboard, categories, products,
customers, rentals, enquiries, purchase requests, reports/analytics,
homepage CMS (`/admin/homepage`), and settings (`/admin/settings` —
business contact info, appearance, admin account).
