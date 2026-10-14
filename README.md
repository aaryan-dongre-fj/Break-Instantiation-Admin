# Generic admin

Staff admin for a copy of the generic backend. An admin manages every client and the admin accounts.

Sign in with email and password on `/`, then a credentials session sends you to `/dashboard`.

## One config

`instance.config.json` holds the product name, logo, and colors. `.env.local` holds the secrets and the service URLs. Empty `title`, `description`, and `appUrl` are filled from the product name and port. The layout matches Break-Admin.

The default colors are Break-Admin's: a black button, white label, and gray hover.

```json
{
  "productName": "Acme",
  "packageName": "acme-admin",
  "logo": "",
  "colors": {
    "primary": "#000000",
    "primaryForeground": "#ffffff",
    "primaryHover": "#808080"
  },
  "devPort": 3010,
  "apiBaseUrl": "http://127.0.0.1:8000",
  "clientPortalOrigin": "http://localhost:3001"
}
```

Leave `logo` empty to show the product name. Set it to a public path such as `/brand/logo.png` after placing a file in `public/brand`, or pass `--logo` to the script below.

`API_BASE_URL` is Django. Every company is served at `API_BASE_URL/t/<company>/`, and this admin opens it at `/<company>` (for example `http://localhost:3002/break`). `NEXTAUTH_URL` is this site's URL locally; leave it unset on Vercel. `CLIENT_PORTAL_ORIGIN` is the origin sent on those API calls, and the backend has to list it in `CSRF_TRUSTED_ORIGINS`. Invite emails use the company's stored client site, not this origin. Set both in `.env.local`. The values in `instance.config.json` are the fallback.

## Create a copy

From this repo:

```bash
node scripts/create-instance.mjs \
  --dest ../Acme-Admin \
  --name "Acme" \
  --port 3010 \
  --api http://127.0.0.1:8000 \
  --portal http://localhost:3001 \
  --logo ./logo.png
```

That copies the app, writes `instance.config.json`, generates `.env.local` secrets, builds a favicon from the name and primary color, installs dependencies, and prints the URL. Then:

```bash
cd ../Acme-Admin
npm run dev
```

`npm run apply-instance` does the same config step in the current checkout without copying. `npm run apply-instance -- --check` only validates the file.

GitHub Actions can do the same via **Create admin instance**. The workflow takes the same fields and uploads a zip. Run `npm install` in the unzipped folder before starting it. Replace the generated `SECRET` before sharing a deployment.

## This checkout

```bash
npm install
npm run dev
```

The dev server port comes from `instance.config.json`. Sign in with an admin or a backend admin from the generic backend. A Django superuser is a backend admin and can sign in here. Both see every client and manage admin accounts.
