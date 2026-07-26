# Store Planner — API

Plain PHP 8.2 REST API. All responses are JSON. Base URL is the backend document
root (`backend/public`), e.g. `http://localhost:8080`. The frontend points at it
through `VITE_API_BASE_URL`.

## Conventions

- **Auth:** send `Authorization: Bearer <token>` on authenticated endpoints.
  Tokens are opaque 64-char strings with a sliding 30-day expiry (each authed
  request pushes the expiry forward).
- **Content type:** request bodies are JSON (`Content-Type: application/json`).
- **Errors** use a uniform envelope:
  ```json
  { "error": { "code": "validation_error", "message": "Some fields are invalid.", "fields": { "email": "Enter a valid email address." } } }
  ```
  `fields` is present only for field-level validation errors.
- **CORS:** allowed origins are configured in `backend/config.php`. `OPTIONS`
  preflight returns `204`.

### Status codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created (register, create product) |
| 204 | No content (CORS preflight) |
| 401 | `unauthorized` / `invalid_credentials` |
| 404 | `not_found` |
| 405 | `method_not_allowed` |
| 409 | `email_taken` |
| 422 | `validation_error` |
| 500 | `server_error` |

## Health

### `GET /` · `GET /api/health`
```json
{ "ok": true, "service": "store-planner-api" }
```

---

## Zones (public)

### `GET /api/zones`
Returns all zones on the shared floor, ordered by `sort_order`.
```json
{ "zones": [
  { "id": 1, "name": "Fenster 1", "type": "window", "x": 40, "y": 20, "w": 280, "h": 90, "sort_order": 1 },
  { "id": 4, "name": "Regal 1", "type": "shelf", "x": 40, "y": 160, "w": 270, "h": 200, "sort_order": 4 }
] }
```
`type` is `shelf` or `window`. `x, y, w, h` are in logical units on the fixed
`1000 × 700` canvas.

---

## Products

### `GET /api/products` (public)
Query params (all optional):

| Param | Values | Default |
|---|---|---|
| `sort` | `name` · `created` · `updated` · `zone` | `sort_order` |
| `order` | `asc` · `desc` | `asc` |
| `search` | free text (matches name + description) | — |

```json
{ "products": [
  {
    "id": 1, "name": "Bio-Äpfel", "description": "Knackige regionale Äpfel …",
    "image_url": "https://…/apples.jpg",
    "zone_id": 4, "pos_x": 0.28, "pos_y": 0.4,
    "sort_order": 1, "created_by": 1, "created_by_name": "Demo Ladenchef",
    "created_at": "2026-01-01 10:00:00", "updated_at": "2026-01-01 10:00:00"
  }
] }
```
`zone_id`, `pos_x`, `pos_y` are `null` for unplaced products (they live in the
tray). `pos_x` / `pos_y` are floats in `0–1` relative to the zone's box.

### `POST /api/products` (auth) → `201`
```json
{ "name": "Milch", "description": "1L Vollmilch", "image_url": "https://…", "zone_id": 4 }
```
`name` required (1–120). `description` optional (≤2000). `image_url` optional,
must be `http`/`https` (≤2048). `zone_id` optional — when given, the product is
placed centred (`0.5, 0.5`) in that zone. Returns `{ "product": { … } }`.

### `PATCH /api/products/{id}` (auth)
Partial update of `name`, `description`, `image_url` (send only the fields you
change). Returns `{ "product": { … } }`. `404` if the product does not exist.

### `DELETE /api/products/{id}` (auth)
`{ "ok": true }`. `404` if not found.

### `PATCH /api/products/{id}/placement` (auth)
Move a product into a zone, reposition it, or un-place it (tray).
```json
{ "zone_id": 6, "pos_x": 0.42, "pos_y": 0.55 }
```
- `zone_id: null` → un-places the product (`pos_x`/`pos_y` set to null).
- When `zone_id` is a number: it must exist, and `pos_x`/`pos_y` are required,
  each in `0–1`. They are clamped server-side to `0.02–0.98`.

Returns `{ "product": { … } }`.

### `PATCH /api/products/reorder` (auth)
Persist list ordering. Body is an array (or `{ "items": [ … ] }`):
```json
{ "items": [ { "id": 3, "sort_order": 1 }, { "id": 1, "sort_order": 2 } ] }
```
Returns `{ "ok": true }`.

---

## Auth

### `POST /api/auth/register` (public) → `201`
```json
{ "email": "a@b.com", "display_name": "Anna", "password": "min8chars" }
```
`display_name` 2–60, `password` ≥8. `409 email_taken` if the email exists.
Returns `{ "token": "…", "user": { "id", "email", "display_name" } }`.

### `POST /api/auth/login` (public)
```json
{ "email": "a@b.com", "password": "…" }
```
`401 invalid_credentials` on a bad email/password. Returns `{ "token", "user" }`.

### `GET /api/auth/me` (auth)
`{ "user": { "id", "email", "display_name" } }`. `401` without a valid token.

### `POST /api/auth/logout` (auth)
Revokes the presented token. `{ "ok": true }`.

---

## Account

### `PATCH /api/me` (auth)
```json
{ "display_name": "New Name" }
```
2–60 chars. Returns the updated `{ "user": { … } }`.

### `PATCH /api/me/password` (auth)
```json
{ "current_password": "…", "new_password": "min8chars" }
```
`401 invalid_credentials` if the current password is wrong. `{ "ok": true }`.
