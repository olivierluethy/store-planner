# Store Planner — Ladenplaner

A graphical top-down planner for a shop floor ("Einkaufsladen"). The floor holds
**5 shelves** (`Regal 1`–`Regal 5`) and **3 windows** (`Fenster 1`–`Fenster 3`).
Products are represented by their images and can be **dragged with mouse or
finger** into any shelf or window; their placement is persisted. Logged-out
visitors see the floor read-only; logged-in users create, edit, sort, place and
delete products and edit their own display name.

- **Frontend:** Ionic React 8 + TypeScript + Vite + Capacitor 6 (Android + iOS).
  Tailwind CSS only, dark mode only.
- **Backend:** plain PHP 8.2 REST API (no framework), PDO + MySQL/MariaDB.
- **Auth:** opaque bearer tokens (30-day sliding), no cookies/sessions.
- **No image uploads** — images are referenced by external URL only.

See [`docs/STYLEGUIDE.md`](docs/STYLEGUIDE.md) for the visual system,
[`docs/API.md`](docs/API.md) for the API, and
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for shared-hosting deployment.

## Repository layout

```
frontend/                         Ionic React app (Vite)
backend/public/                   API document root (front controller)
backend/src/                      Router, controllers, helpers
backend/database/migrations/      001_init.sql, 002_seed.sql
docs/                             STYLEGUIDE.md, API.md, DEPLOYMENT.md
```

## Local setup

### Backend

Requires PHP 8.2+ and MySQL/MariaDB.

```bash
cd backend
cp config.example.php config.php          # then edit DB credentials + CORS origins
# import the schema + seed into your database:
mysql -u root -p storeplanner < database/migrations/001_init.sql
mysql -u root -p storeplanner < database/migrations/002_seed.sql
# (or import both files through phpMyAdmin)
php -S localhost:8080 -t public            # dev server → http://localhost:8080
```

Demo login after seeding: `demo@store.local` / `demo1234`.

### Frontend

Requires Node 18+.

```bash
cd frontend
cp .env.example .env                        # set VITE_API_BASE_URL, e.g. http://localhost:8080
npm install
npm run dev                                 # → http://localhost:5173
npm run build                               # production build into dist/
```

### Native (Capacitor)

```bash
cd frontend
npm run build
npx cap sync
npx cap open android      # or: npx cap open ios
```
