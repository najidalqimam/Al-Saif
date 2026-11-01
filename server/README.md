# Al-Saif server and database

The backend for the Al-Saif store. It owns the MySQL database: only this package reads or writes it.
The React storefront and dashboard never connect to MySQL directly and never receive database
credentials. They will call this server's HTTP API in a later step.

**Status:**
- **Connected to the database:** the catalogue (products, categories, photos, stock, homepage offers). The
  storefront reads it from `GET /api/catalogue`; the dashboard signs in with a server session and saves every
  catalogue change through the admin API.
- **Still in the browser:** orders placed at checkout, shipping and payment settings, and homepage texts
  (hero, section copy, brand, custom sections). They move in a later step.
- **Without the API** (a static build such as GitHub Pages, or the server is off), the storefront falls back to
  its built-in catalogue and this browser's saved edits. The dashboard needs the API.

| Piece | Choice |
| --- | --- |
| Runtime | Node.js 20.17+ and TypeScript (run directly with `tsx`, no build step) |
| HTTP API | Express 5, zod validation, helmet, CORS, rate limiting |
| Database | MySQL 8 (8.0.34 locally on macOS 12; use 8.4 LTS where the OS allows it) |
| ORM and migrations | Prisma 6.19 |
| Package manager | pnpm 9 (this folder has its own `package.json` and lockfile) |

The project started on PostgreSQL. That schema and its migration are kept unchanged as a fallback; see
"PostgreSQL fallback" at the end.

## Where things are

| Path | What it is |
| --- | --- |
| `prisma/mysql/schema.prisma` | **The schema in use** (set by `"prisma": { "schema": ... }` in `package.json`) |
| `prisma/mysql/migrations/` | MySQL migration history |
| `prisma/schema.prisma`, `prisma/migrations/` | Previous PostgreSQL schema and migration, unchanged, not used |
| `docker-compose.yml` | Previous local PostgreSQL in Docker, not used |

## Prerequisites

- Node.js 20.17 or newer (`node -v`)
- pnpm 9 (`pnpm -v`, or `npm i -g pnpm@9`)
- MySQL 8.0.16 or newer (CHECK constraints are only enforced from 8.0.16), with an empty database and a
  user for it

### macOS 12 (Monterey) without Docker: MySQL from Oracle's archive

Homebrew no longer has ready-made MySQL packages for macOS 12, and MySQL 8.4 needs macOS 13. The last
release Oracle marks as compatible with Monterey is **8.0.34** ("Packages for Ventura (13) are compatible
with Monterey (12)"). Its binaries declare macOS 12.0 as their minimum. MySQL 8.0 no longer receives
security fixes, so this copy is for local development only, reachable from this Mac only.

How the local copy on this Mac is laid out (no installer, no background service, no admin password):

| Path | Contents |
| --- | --- |
| `~/mysql/mysql-8.0.34-macos13-x86_64/` (`~/mysql/current` links to it) | MySQL programs, from `mysql-8.0.34-macos13-x86_64.tar.gz` (MD5 `8b63786c10899ffaa06526772b672e1f`) |
| `~/mysql/etc/my.cnf` | Settings: `127.0.0.1` only, port 3306, X protocol off, `local_infile` off, UTC, utf8mb4, strict SQL mode |
| `~/mysql/data/alsaif/` | Database files |
| `~/mysql/log/mysqld.err` | Server log |
| `~/mysql/secrets/` (only your user can read it) | `root.cnf` (MySQL root) and `alsaif-app.cnf` (the app user), as MySQL option files |

Another project on this Mac runs its own MySQL on port 3307 (`~/masar-mysql`). The two are independent.

Start and stop (MySQL does not start by itself after a reboot):

```bash
# start
~/mysql/current/bin/mysqld --defaults-file=$HOME/mysql/etc/my.cnf --daemonize

# stop
~/mysql/current/bin/mysqladmin --defaults-extra-file=$HOME/mysql/secrets/root.cnf shutdown

# open a SQL prompt as the app user (no password typed or shown)
~/mysql/current/bin/mysql --defaults-extra-file=$HOME/mysql/secrets/alsaif-app.cnf alsaif
```

To set it up again on another Mac on macOS 12: download the same tarball from
https://downloads.mysql.com/archives/community/ (version 8.0.34, macOS, x86_64 or ARM), check its MD5,
unpack it under `~/mysql/`, write `my.cnf` with the settings above, run `mysqld --initialize`, start it,
replace the temporary root password, then create the database and user:

```sql
CREATE DATABASE alsaif CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE alsaif_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'alsaif'@'127.0.0.1' IDENTIFIED BY 'a-long-random-password';
GRANT ALL PRIVILEGES ON `alsaif`.* TO 'alsaif'@'127.0.0.1';
GRANT ALL PRIVILEGES ON `alsaif_shadow`.* TO 'alsaif'@'127.0.0.1';
GRANT ALL PRIVILEGES ON `alsaif\_test\_%`.* TO 'alsaif'@'127.0.0.1';
```

The user can only connect from `127.0.0.1` and only sees `alsaif`, the scratch database `alsaif_shadow`
that `prisma migrate dev` uses, and disposable `alsaif_test_*` databases.

## First-time setup

Run these from the `server/` folder.

```bash
# 1. Install dependencies (also generates the Prisma client from prisma/mysql/schema.prisma)
pnpm install

# 2. Create your local environment file (skip if server/.env already exists; never overwrite it)
cp .env.example .env
#    Edit .env: put the app user's password into DATABASE_URL and SHADOW_DATABASE_URL.
#    Characters such as @ : / ? # in the password must be URL-encoded. Never commit .env.

# 3. Start MySQL (see above), then create all tables by applying the committed migrations
pnpm db:deploy

# 4. Check that the database matches the migrations
pnpm db:status
```

Optional: `pnpm db:studio` opens Prisma Studio in the browser to look at the tables.

## Running the store locally

Three things run side by side: MySQL, the API and the Vite storefront. Vite forwards `/api` to the API
(`vite.config.ts`), so the admin cookie stays on the same origin.

```bash
~/mysql/current/bin/mysqld --defaults-file=$HOME/mysql/etc/my.cnf --daemonize   # 1. MySQL
cd server && pnpm dev                                                           # 2. API on 127.0.0.1:4000
pnpm dev                                                                        # 3. storefront, from the repository root: http://localhost:5175/ar
```

The dashboard is at http://localhost:5175/ar/admin. It needs an admin account in the database
(`pnpm admin:create`, below); the old browser-only password (`VITE_ADMIN_PASSWORD`) is no longer used and can
be removed from the root `.env` (anything prefixed `VITE_` ends up in the public bundle).

## Running the API

MySQL must be running first.

```bash
pnpm dev     # API on http://127.0.0.1:4000, restarts when files change
pnpm start   # same, without watching
```

Check it: `curl http://127.0.0.1:4000/api/health` should return `{"ok":true,"database":"up"}`.
If it says `"database":"down"`, MySQL isn't running or `DATABASE_URL` in `.env` is wrong.

Optional settings (defaults shown in `.env.example`): `HOST`, `PORT`, `CORS_ORIGIN` (the storefront's
address, `http://localhost:5175` by default), `SESSION_TTL_HOURS`. Port 4000 is used because 3001 is often
taken by other local tools.

### Creating the first admin

There are no built-in or demo accounts. Create real ones from the terminal:

```bash
pnpm admin:create
```

It asks for the email, name, role and password (typed hidden, minimum 12 characters). The first account
defaults to OWNER. Only a scrypt hash of the password is stored.

### Endpoints

| Method and path | Access | What it does |
| --- | --- | --- |
| `GET /api/health` | Public | API and database status |
| `POST /api/orders` | Public, 20 requests / 10 min per IP | Places an order (see below) |
| `POST /api/admin/auth/login` | Public, 10 failed tries / 15 min per IP | `{ email, password }`, sets the session cookie |
| `POST /api/admin/auth/logout` | Signed-in admin | Ends the session |
| `GET /api/admin/auth/me` | Signed-in admin | Current admin |
| `GET /api/admin/orders?status=NEW&limit=50` | OWNER, MANAGER, SUPPORT | Latest orders |
| `PATCH /api/admin/orders/:number/status` | OWNER, MANAGER, SUPPORT | `{ status?, paymentStatus?, note? }`; history is recorded, cancelling puts tracked stock back |
| `GET /api/catalogue` | Public | Visible products and non-archived categories for the storefront |
| `GET /api/admin/catalogue` | All roles | Everything, including hidden and archived items, stock and the low-stock level |
| `POST /api/admin/products` | OWNER, MANAGER, EDITOR | Create a product (optional photo as a data URL) |
| `PATCH /api/admin/products/:id` | OWNER, MANAGER, EDITOR | Names, labels, prices, category, visibility, homepage offer, new photo |
| `POST /api/admin/products/:id/archive` and `/restore` | OWNER, MANAGER, EDITOR | The dashboard's Delete archives; restore brings it back |
| `PUT /api/admin/products/:id/stock` | OWNER, MANAGER, EDITOR | `{ quantity, expected }`; refused with 409 if the stock changed since the dashboard read it |
| `POST /api/admin/categories`, `PATCH /api/admin/categories/:id` | OWNER, MANAGER, EDITOR | Create (two levels at most) and edit departments |
| `POST /api/admin/categories/:id/archive` and `/restore` | OWNER, MANAGER, EDITOR | Refused while the category still holds live products or subcategories |
| `PUT /api/admin/settings/inventory` | OWNER, MANAGER, EDITOR | `{ lowStock }` |
| `GET /api/checkout/options` | Public | Active shipping zones, shipping methods and payment options for the checkout |
| `GET /api/admin/checkout-settings` | All roles | All zones, methods and payment options (dashboard shipping and payments pages) |
| `PUT /api/admin/checkout-settings` | OWNER, MANAGER | Saves them; zones left out are deleted (orders keep their zone name), methods left out are switched off |
| `POST /api/account/register` | Public, 10 tries / hour per IP | `{ firstName, lastName, phone, email, password, locale? }`; creates the account, signs in, queues the welcome email |
| `POST /api/account/login` | Public, 10 failed tries / 15 min per IP | `{ login, password }`; `login` is the mobile number or the email |
| `POST /api/account/logout` | Signed-in customer | Ends the session |
| `GET /api/account/me`, `PATCH /api/account/me` | Signed-in customer | Profile; first name, last name and email can change, the phone (login) cannot |
| `POST /api/account/password` | Signed-in customer | `{ current, next }`; signs the customer out on other devices |
| `POST /api/account/welcome-email/resend` | Signed-in customer, 3 / hour | Queues the welcome email again if it was not delivered |
| `GET/POST /api/account/addresses`, `PATCH/DELETE /api/account/addresses/:id` | Signed-in customer | Saved addresses; one is always the main (default) address |
| `GET /api/account/orders` | Signed-in customer | The customer's own orders with status history (no order number) |
| `GET /api/admin/customers?q=&limit=100` | OWNER, MANAGER, SUPPORT | Registered customers with order count, money spent (not cancelled) and welcome email status |
| `GET /api/admin/customers/:id` | OWNER, MANAGER, SUPPORT | One customer with saved addresses and orders (with order numbers) |
| `POST /api/admin/customers/:id/welcome-email` | OWNER, MANAGER, SUPPORT | Queues and sends the welcome email again if it was not delivered |

`:id` is the id the storefront uses (`phone`, `demo-tv`, `p-mvtbrk5h`, `laptops`) or the database UUID.
There is no delete endpoint. The database also refuses to delete a product that appears in an order, or a
category that still holds products (`ON DELETE RESTRICT`).

Product photos uploaded from the dashboard are written as new files to `public/uploads/products/` (set
`UPLOAD_DIR` and `UPLOAD_URL_PREFIX` to change that). A file is never overwritten; a new photo is added in front
of the old ones, which stay on disk and in `product_images`.

`PATCH .../status` answers `409 ORDER_CHANGED` when another admin changed the same order at the same moment;
reload and try again. This is what guarantees a cancelled order's stock is returned only once.

`POST /api/orders` body. Anything else (prices, totals, fees, stock) is rejected, and amounts are always
computed on the server from the database:

```json
{
  "customer": { "fullName": "…", "phone": "05XXXXXXXX", "email": "optional" },
  "address": { "zoneCode": "central", "city": "…", "line1": "…", "notes": "optional" },
  "shippingMethodCode": "standard",
  "paymentMethod": "COD",
  "items": [{ "productId": "phone", "quantity": 1 }],
  "locale": "ar"
}
```

A signed-in customer may add `"saveAddress": { "label": "optional", "makeDefault": false }` to keep the
delivery address in the account. Guests can always order without an account.

`productId` is the storefront's own product id (`phone`, `demo-tv`) or the database UUID.
`paymentMethod` is `COD` or `BANK_TRANSFER` (online payment is not available). Errors come back as JSON with
a code, for example `OUT_OF_STOCK` (409), `SHIPPING_UNAVAILABLE` (422) or `INVALID_ORDER` (400, with the
fields that failed).

### How orders stay consistent

- An order, its items, its history and its stock changes are written in one transaction, at READ COMMITTED
  isolation (set explicitly; MySQL's own default is REPEATABLE READ).
- Stock is taken with a conditional update (`stock_quantity >= quantity`) that locks the row and re-checks
  the latest value, so two buyers can never get the same last unit.
- Products are locked in a fixed order (by id), so carts with the same products wait instead of
  deadlocking. If MySQL still aborts a transaction (deadlock, or two first orders from the same new phone
  number at once), the whole transaction is retried up to 3 times; it was rolled back completely, so a retry
  is safe.

### Order numbers

`orders.number` is a MySQL `AUTO_INCREMENT` sequence that started at **1001** (migration
`20261101140000_customer_accounts`). Every order takes the next number, also when orders arrive at the same
time; a failed order can leave a gap, never a duplicate. The internal `orders.id` (UUID) stays separate. The
number is shown only in the dashboard: the storefront answer, the confirmation page and the customer's account
never include it. The old browser-only orders (numbered from 1049) were test data and are not in the database.

### Customer accounts

- Registration needs first name, last name, Saudi mobile number, email and a password (8+ characters). Mobile
  number + password is the login. Phone and email are unique (the database enforces it, also for two
  registrations at the same moment); email is stored lower-case.
- Passwords are hashed with scrypt like admin passwords. The `alsaif_customer` cookie is `HttpOnly`,
  `SameSite=Strict`, limited to `/api`, `Secure` in production, and lasts `CUSTOMER_SESSION_DAYS`; only the
  token's SHA-256 hash is stored.
- Guest orders keep a contact snapshot and no customer link. Registering later with the same phone number does
  not attach earlier guest orders, so nobody can read someone else's orders by registering their number.
- Orders placed while signed in are linked to the account and listed on the account page.

### Welcome email

- The account and an `email_outbox` row are written in one transaction. The API sends the email right after
  answering the registration, and a background pass every minute sends anything still due.
- A failed send is retried after 1, 5, 15, 60 and 180 minutes, then marked `FAILED`; the customer can queue it
  again from the account page. Rows are claimed with a conditional update, so an email is never sent twice.
  Retrying a registration answers `PHONE_TAKEN` / `EMAIL_TAKEN`; it never creates a second account.
- Configure SMTP in `server/.env` (see `.env.example`): `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`,
  `SMTP_PASSWORD`, `MAIL_FROM`. Without `SMTP_HOST` the transport is `off`: emails wait in the queue (retries
  are not used up) and go out automatically once SMTP is set and the API restarts. Credentials stay on the
  server and are never logged or sent to the browser.

### How admin sessions work

- Login sets an `alsaif_admin` cookie: `HttpOnly` (not readable by page scripts), `SameSite=Strict`, limited
  to `/api/admin`, and `Secure` when `NODE_ENV=production`.
- The cookie holds a random 256-bit token; the database keeps only its SHA-256 hash. Logout revokes it, and
  sessions expire after `SESSION_TTL_HOURS`.
- Changing admin requests from an origin not in `CORS_ORIGIN` are refused.
- Wrong password and unknown email get the same answer and take the same time.

## Everyday commands

| Command | What it does |
| --- | --- |
| `pnpm db:deploy` | Apply committed migrations that have not run yet |
| `pnpm db:status` | Show which migrations are applied |
| `pnpm db:validate` | Check the schema |
| `pnpm db:generate` | Regenerate the Prisma client after pulling schema changes |
| `pnpm typecheck` | Type-check the server code |
| `pnpm dev` / `pnpm start` | Run the API (see "Running the API") |
| `pnpm admin:create` | Create an admin account |

`pnpm db:up`, `db:down` and `db:logs` still start the old PostgreSQL container and are not needed for MySQL.

Prisma prints a warning that the `package.json#prisma` setting will be removed in Prisma 7. It works in the
installed 6.19; move it to a `prisma.config.ts` file when upgrading.

## Importing the browser catalogue

The catalogue was moved into the database from a read-only snapshot of the browser's saved data, merged with
the storefront's code catalogue. The tools stay in the repository for re-runs or another machine; their data
files (`server/catalogue-data/`) stay out of Git.

```bash
pnpm catalogue:manifest --snapshot catalogue-data/<snapshot>.json --out catalogue-data/<manifest>.json [--write-images]
pnpm catalogue:import --manifest catalogue-data/<manifest>.json                         # dry run
pnpm catalogue:import --manifest catalogue-data/<manifest>.json --apply --database alsaif
pnpm catalogue:verify --manifest catalogue-data/<manifest>.json
```

- Products and categories keep their current ids in `legacy_id`; photos keep their exact paths.
- The browser's values win where they differ from the code (three demo laptops sit in sub-categories there).
- Nothing is invented: descriptions stay empty, unrecorded stock stays untracked (`NULL`).
- A re-run only adds what is missing and never changes or deletes existing rows; `--apply` needs the database
  name to be typed.
- Images that existed only inside the browser data are saved by `--write-images` as new files
  (`public/uploads/products/p-mvtbrk5h.webp`).

## Changing the schema

1. Edit `prisma/mysql/schema.prisma`.
2. Run `pnpm db:migrate --name short_description` (for example `--name add_coupons`). Prisma writes a
   new folder under `prisma/mysql/migrations/` and applies it to your local database. It needs
   `SHADOW_DATABASE_URL`.
3. Commit the schema change **and** the new migration folder together.

Rules:

- Never edit a migration that has already been committed or applied anywhere; add a new one instead.
- Rules Prisma cannot express (CHECK constraints such as prices >= 0, the order number starting at 1049)
  are written as SQL at the end of the migration. To add one, create the migration with
  `pnpm db:migrate --name ... --create-only`, append the SQL, then run `pnpm db:migrate` to apply it.
- Give every new text column an explicit `@db.VarChar(n)` that matches the API's validation. Without it
  Prisma uses `VARCHAR(191)`, and MySQL rejects longer values.
- `prisma migrate reset` **deletes all data** in the target database. Only use it on purpose.

## MySQL notes and limitations

- **Text comparison ignores case.** Tables use `utf8mb4_unicode_ci`, so unique values such as `slug`,
  `legacy_id`, `sku`, `code` and `email` treat `Phone` and `phone` as the same. CHECK rules that must see
  case (`currency` upper-case, admin `email` lower-case) compare bytes instead.
- **Times have no time zone.** Columns are `DATETIME(3)` in UTC; the server runs with `time_zone = +00:00`.
  Millisecond precision (PostgreSQL stored microseconds; JavaScript dates only have milliseconds anyway).
- **JSON columns have no default** (`payment_methods.public_config`, `home_sections.content_ar/en`); the code
  must always provide them.
- **Decimals are exact** (`DECIMAL(12,2)`, up to 9,999,999,999.99). A value with more than 2 decimals is
  rounded half-up without an error, as in PostgreSQL; values out of range are rejected.
- **Strict SQL mode is required.** Without it MySQL silently cuts text that is too long and clamps numbers
  that are out of range. `my.cnf` sets it; keep it on any hosting.
- **Foreign key on `categories.parent_id` uses `ON UPDATE RESTRICT`.** MySQL refuses a CHECK on a column whose
  foreign key cascades, and the "not its own parent" rule needs one. Ids never change, so nothing is lost.
- **Enums are column definitions** in MySQL, not named types. Adding a value is a migration that alters
  every column using it; Prisma generates it.

## Schema overview

All tables are `snake_case`, IDs are UUIDs stored as `CHAR(36)`, money is `DECIMAL(12,2)` in SAR, and times
are UTC `DATETIME(3)`.

- **Catalog:** `categories` (self-referencing `parent_id` for departments and subcategories),
  `products`, `product_images`, `stock_movements` (audit of every stock change).
- **Customers:** `customers` (identified by mobile number for guest checkout), `addresses`.
- **Shipping and payment settings:** `shipping_zones`, `shipping_methods`, `shipping_method_zones`,
  `payment_methods` (non-secret settings only).
- **Orders:** `orders` (with a snapshot of customer, address, shipping and totals), `order_items` (with a
  snapshot of product name and price at purchase time), `order_status_history`,
  `payment_status_history`.
- **Content:** `home_sections` (built-in, banner and product sections in display order),
  `home_section_products`, `hero_slides`, `store_settings` (brand, logo, low-stock threshold and other
  small settings).
- **Admin:** `admin_users` (scrypt password hashes, roles OWNER / MANAGER / EDITOR / SUPPORT),
  `admin_sessions` (only a hash of each session token is stored).

`src/orders/place-order.ts` shows how orders must be written: prices and fees come from the database, and
the order, its items, its history and the stock changes are saved in a single transaction.

## Security rules

- Database credentials live only in `server/.env` (ignored by Git), `~/mysql/secrets/` on this Mac, or the
  hosting provider's secret settings. Never put them in a `VITE_` variable: those end up in the public
  frontend bundle.
- MySQL listens on `127.0.0.1` only, with the X protocol and `LOAD DATA LOCAL` switched off.
- The app user has no rights outside its own databases.
- Payment gateway keys and other secrets go in environment variables, never in the `payment_methods` or
  `store_settings` tables.
- Database dumps (`*.dump`, `*.sql.gz`, `*.backup`) and key files are ignored by Git; keep them out of the
  repository.

## Using Cursor or Claude Code on another computer

Clone the repository, open it in the editor, and ask the assistant to follow "First-time setup" in
`server/README.md`. Points to keep in mind:

- The assistant should create `server/.env` from `.env.example` and ask you for the password instead of
  inventing one or committing it.
- MySQL must already be installed and running; the assistant should not install software or change system
  settings without asking.
- The storefront is a separate package at the repository root (`pnpm install` and `pnpm dev` there). It
  does not need the database yet.

## PostgreSQL fallback

The PostgreSQL setup is kept as it was: `prisma/schema.prisma`, `prisma/migrations/`, the local `alsaif`
database in Postgres.app, and its settings backed up in `server/.env.postgresql` (ignored by Git). To switch
back:

1. In `package.json`, set `"prisma": { "schema": "prisma/schema.prisma" }`.
2. Put the PostgreSQL `DATABASE_URL` from `.env.postgresql` back into `.env`.
3. Run `pnpm db:generate`. The generated client works with one database type at a time.

The order code works on both. The retry and lock-order changes made for MySQL also apply to PostgreSQL.
