# Deployment — shared hosting

This describes deploying Store Planner to typical PHP shared hosting (cPanel /
Plesk with phpMyAdmin). There is no automated PROD target in this project — these
are manual steps.

Two things ship: the **PHP API** (`backend/`) and the **static frontend build**
(`frontend/dist/`). They can live on the same host or separate hosts; what
matters is that the frontend's `VITE_API_BASE_URL` points at the API and the
API's CORS list includes the frontend origin.

---

## 1. Database (phpMyAdmin)

1. In your hosting panel, create a MySQL/MariaDB database and a user, and grant
   the user all privileges on that database. Note the **db name, user, password
   and host** (often `localhost`).
2. Open **phpMyAdmin**, select the new database.
3. **Import** → choose `backend/database/migrations/001_init.sql` → **Go**.
4. **Import** → choose `backend/database/migrations/002_seed.sql` → **Go**.
   This creates the 5 shelves + 3 windows, a demo user (`demo@store.local` /
   `demo1234`) and 6 demo products. Delete the demo user/products later if you
   don't want them in production.

## 2. Backend (PHP API)

1. Upload the `backend/` folder to the server (e.g. `~/storeplanner-api/`), or
   just its contents somewhere outside the web root, **plus** the `public/`
   folder which must become a document root.
2. **Point a domain/subdomain's document root at `backend/public`** (e.g. make
   `api.example.com` serve `.../storeplanner-api/public`). The included
   `public/.htaccess` rewrites all requests to `index.php` and forwards the
   `Authorization` header — Apache with `mod_rewrite` is required. On nginx,
   route all non-file requests to `index.php` instead.
3. Create `backend/config.php` from `backend/config.example.php` and fill in:
   ```php
   'db' => [
       'host' => 'localhost',
       'port' => 3306,
       'name' => 'your_db_name',
       'user' => 'your_db_user',
       'pass' => 'your_db_password',
       'charset' => 'utf8mb4',
   ],
   'cors_allowed_origins' => [
       'https://app.example.com',   // your deployed frontend origin
       'capacitor://localhost',     // iOS native app
       'https://localhost',         // Android native app
   ],
   'app_url' => 'https://api.example.com',
   'token_ttl_days' => 30,
   ```
   `config.php` is gitignored — it never leaves your machine via git, create it
   directly on the server.
4. Requires **PHP 8.2+** with `pdo_mysql`. Confirm the API answers:
   `https://api.example.com/api/health` → `{"ok":true,"service":"store-planner-api"}`.

## 3. Frontend (static build)

1. Locally, set the API URL and build:
   ```bash
   cd frontend
   echo "VITE_API_BASE_URL=https://api.example.com" > .env
   npm ci
   npm run build
   ```
2. Upload the **contents of `frontend/dist/`** to the frontend document root
   (e.g. `public_html/` of `app.example.com`).
3. Because the app has no client-side router (the two views switch in-place),
   no SPA rewrite rules are required — `index.html` is enough. If you later add
   routing, add a fallback rewrite to `index.html`.
4. Serve over **HTTPS**. Load `https://app.example.com` and confirm the floor
   plan renders and login works.

## 4. Native apps (optional)

The web build is wrapped by Capacitor. To produce native binaries:

```bash
cd frontend
npm run build
npx cap sync
npx cap open android   # build a signed APK/AAB in Android Studio
npx cap open ios       # build/archive in Xcode
```

`capacitor.config.ts` already sets the app id (`ch.janek.storeplanner`), a dark
status bar/splash and `androidScheme: 'https'`. Point the native app at the
production API by building the web assets with the production `.env` **before**
`npx cap sync`. Ensure `capacitor://localhost` and `https://localhost` are in
the API's `cors_allowed_origins`.

## 5. Post-deploy checklist

- [ ] `GET /api/health` returns ok over HTTPS.
- [ ] `GET /api/zones` returns the 8 seeded zones.
- [ ] Frontend loads the floor plan read-only when logged out.
- [ ] Register / login works and the display name appears in the header.
- [ ] Dragging a product persists across a page reload.
- [ ] Remove the demo account/products if not wanted in production.
