# Al-Saif store

Arabic-first electronics storefront (Arabic and English) with an admin dashboard and its own backend.

| Folder | What it is | Start it |
| --- | --- | --- |
| `/` (repository root) | Storefront and admin dashboard: React 19, TypeScript, Vite, Tailwind | `pnpm install`, then `pnpm dev` (http://localhost:5175) |
| `server/` | Backend API: Express, Prisma, MySQL 8 | See [server/README.md](server/README.md) |

## What lives where

- **Database (MySQL, through the API):** products, departments, product photos, stock, product page content,
  orders (numbered from 1001), customer accounts and saved addresses, shipping zones and methods, payment
  options, admin users and sessions.
- **Browser (localStorage), for now:** home page content edited from the dashboard (hero slides, section
  texts, brand settings), the cart and the wishlist.

In development Vite forwards `/api` and `/uploads` to the API on `127.0.0.1:4000`, so run both: the API
(`server/`, `pnpm dev`) and the storefront (`pnpm dev` here). Without the API the storefront still opens with
its built-in catalogue, but checkout, accounts and the dashboard need it.

## Main features

- Storefront: departments, product pages, search with live suggestions, cart, wishlist, checkout (guests or
  signed-in customers), light and dark themes, Arabic and English.
- Customer accounts: register with first and last name, mobile number, email and password; sign in with the
  mobile number or email; saved addresses; order history; preset avatars; welcome email (SMTP).
- Admin dashboard: products and product pages, photos, departments, stock, orders with status history,
  customers, shipping zones and methods, payment options, home page content.

## Secrets and local data

Secrets never go into the repository: copy `server/.env.example` to `server/.env` and fill it in locally.
`.gitignore` keeps out `.env` files, database dumps, private keys, `server/catalogue-data/` (local catalogue
snapshots), `server/mail-log/` (test emails) and `public/uploads/` (photos uploaded on a local machine).
