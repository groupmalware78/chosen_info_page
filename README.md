# Chosen Logistics Ltd: Website & CMS

A one-page website for a co-loading / freight consolidation business, with a built-in content management system at `/admin`.

**Public site sections:** Hero · Our brand · Who we are · Services · Rates (filterable table and cost estimator) · FAQs · Contact form. Terms & Conditions (`/terms`) and Privacy Policy (`/privacy`) are linked in the footer.

**Admin (`/admin`):** edit every section, manage services, rates and FAQs (add, edit, reorder, publish or hide), read and export enquiries, upload images, show or hide sections, edit the legal pages, and configure the **site theme** (presets, colours, fonts, corner radius, hero overlay, with a live preview).

## Stack

- **Frontend:** React 19 + Vite. No UI framework. Theme is applied through CSS variables.
- **Backend:** Express 5 on Node's built-in SQLite (`node:sqlite`). No native modules to compile.
- **Security:** scrypt password hashing; HttpOnly `SameSite=Strict` session cookies (stored hashed); CSRF header check; Helmet CSP; rate-limited API, login and contact form; 15-minute idle timeout on admin sessions; zod validation on every write; link and image URL allow-lists; uploaded images verified by file signature (SVG blocked); contact-form honeypot; CSV export protected against formula injection.

Requires **Node.js 22.13 or newer** (24 LTS recommended).

## Local development

```bash
npm install
cp .env.example .env          # optional: set ADMIN_PASSWORD
npm run dev                   # API on :4000, site on http://localhost:5173
```

Open http://localhost:5173/admin. If `ADMIN_PASSWORD` was not set, a generated password is printed in the terminal on first start.

## Production

```bash
npm ci
npm run build
NODE_ENV=production ADMIN_PASSWORD='choose-a-strong-one' npm start
```

In production the server returns the page with the theme, SEO tags and content already in the HTML, so there is no flash of unstyled content and search engines see real titles and descriptions.

### Docker

```bash
docker build -t chosen-logistics .
docker run -d -p 3000:3000 -v chosen-data:/data \
  -e ADMIN_PASSWORD='choose-a-strong-one' -e TRUST_PROXY=1 chosen-logistics
```

### Railway

```bash
npm run deploy
```

`scripts/deploy-railway.sh` uses the Railway CLI (`brew install railway`) and can be re-run safely. On the first run it:

1. logs you in and creates (or links) a Railway project and a `web` service
2. attaches a **persistent volume at `/data`** for the database and uploads (without it, content is wiped on every deploy)
3. sets `NODE_ENV`, `DATA_DIR`, `TRUST_PROXY` and `ADMIN_EMAIL`, and generates `ADMIN_PASSWORD` if you didn't provide one
4. builds with the `Dockerfile` (see `railway.json`), deploys and waits on the `/healthz` health check
5. generates a public `*.up.railway.app` domain and prints the site URL and first-time admin login

Options: `RAILWAY_SERVICE`, `RAILWAY_PROJECT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CUSTOM_DOMAIN`, for example:
`ADMIN_EMAIL=you@company.com CUSTOM_DOMAIN=www.chosenlogistics.com npm run deploy`.

For email notifications, add `RESEND_API_KEY` (and optionally `CONTACT_FROM` / `CONTACT_NOTIFY_TO`) in the Railway dashboard (Service → Variables).

### Deployment checklist

- Serve over **HTTPS**. Session cookies are `Secure` in production.
- Set `TRUST_PROXY=1` when running behind nginx or a PaaS load balancer.
- Keep `DATA_DIR` on persistent storage and **back it up**. It holds `chosen.db` and `uploads/`.
- Set `RESEND_API_KEY` if you want an email for each new enquiry. Enquiries are always saved in the admin.
- Replace the sample content: rates, phone number, address and legal text are placeholders. **Have the Terms and Privacy Policy reviewed for your jurisdiction.**
- Health check: `GET /healthz`.

### Forgotten password

```bash
ADMIN_EMAIL=admin@chosenlogistics.com ADMIN_PASSWORD='new-strong-password' npm run reset-admin
```

## Project layout

```
server/            Express API, auth, validation schemas, seed content
  routes/public.js   GET /api/content, POST /api/contact
  routes/admin.js    /api/admin/* (auth, content, collections, messages, uploads)
shared/constants.js  Theme presets, fonts, icons (used by server and client)
client/src/site/     Public one-page site
client/src/admin/    CMS (schema-driven forms in admin/schema.js)
```

To add an editable field, add it to the zod schema in `server/schemas.js`, add it to the form layout in `client/src/admin/schema.js`, and render it in `client/src/site/Site.jsx`.
