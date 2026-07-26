# Store Planner — Styleguide

> Single source of truth for the visual system. Dark mode **only**. Tailwind CSS
> **only** for styling. Ionic components are used for structure, navigation and
> gestures — their palette is overridden so they inherit these tokens. Every new
> feature must look like it was always part of the product: colours and text
> styling below do not change.

## 1. Design direction — "Spotlight retail floor"

A top-down plan of a physical shop. The background is the **floor**; shelves and
windows are **raised surfaces** you can feel sit above it. One warm **amber**
accent behaves like **store lighting**: interactive elements glow, and a valid
drop zone *lights up under a spotlight* the moment a product is dragged over it.
That amber spotlight is the product's **signature** — the one memorable element;
everything else stays quiet, dark and disciplined.

- **Mood:** deep, tactile, technical-but-warm. A planning tool that still feels
  like a real store after hours.
- **Risk taken:** the accent doubles as literal light. Drop targets don't just
  get a border — they emit a soft radial glow, and lifted tiles cast a warm
  shadow, as if lit from the amber sign above.

## 2. Colour tokens

All colours are defined once as CSS custom properties on `:root` (see
`frontend/src/theme/variables.css`) and consumed through Tailwind theme names.
Never hard-code a hex outside this file's token table.

### Floor & surfaces (neutral slate ramp, cool undertone)

| Token | Hex | Use |
|---|---|---|
| `--bg-base`        | `#0E1116` | The floor. App background, furthest layer. |
| `--bg-layer`       | `#141A21` | Sunken panels, the map stage backdrop, tray well. |
| `--surface`        | `#1B222C` | Shelves, cards, list rows, modals. Default raised object. |
| `--surface-raised` | `#232C38` | Windows (shopfront), lifted tiles, hovered rows, popovers. |
| `--surface-inset`  | `#10151B` | Inputs, wells, the floor grid cells. |

### Lines

| Token | Hex | Use |
|---|---|---|
| `--border`        | `#2A3442` | Default hairline between surfaces. |
| `--border-strong` | `#3A4656` | Emphasised edges, focused inputs, zone outlines. |

### Text (on dark)

| Token | Hex | Use |
|---|---|---|
| `--text-primary`   | `#E8ECF1` | Headings, primary copy, values. |
| `--text-secondary` | `#A6B0BE` | Labels, secondary copy, zone captions. |
| `--text-muted`     | `#6B7684` | Meta, placeholders, disabled, "Nicht platziert". |
| `--text-on-accent` | `#1A1204` | Text/icon on top of an amber fill. |

### Accent — store light (amber)

| Token | Hex | Use |
|---|---|---|
| `--accent`         | `#F6A821` | Primary interactive: buttons, links, active tab, FAB, valid state. |
| `--accent-hover`   | `#FFB93E` | Hover / pressed / focus of accent elements. |
| `--accent-soft`    | `rgba(246,168,33,0.14)` | Accent fills at rest (chips, selected zone tint). |
| `--accent-ring`    | `rgba(246,168,33,0.45)` | Focus ring, selected outlines. |

### Semantic

| Token | Hex | Use |
|---|---|---|
| `--success`      | `#35D39A` | "Bild hinzugefügt", saved states, positive toasts. |
| `--success-soft` | `rgba(53,211,154,0.14)` | Success backgrounds. |
| `--danger`       | `#F1566B` | Destructive actions (delete), error toasts, invalid fields. |
| `--danger-hover` | `#FF6E82` | Hover of destructive buttons. |
| `--danger-soft`  | `rgba(241,86,107,0.14)` | Error field backgrounds, danger tint. |

### Drag & drop

| Token | Value | Use |
|---|---|---|
| `--drop-target`      | `rgba(246,168,33,0.16)` | Fill of a zone the pointer is validly over. |
| `--drop-target-ring` | `#F6A821` | 2px inset outline of the highlighted zone. |
| `--drop-glow`        | `0 0 0 1px rgba(246,168,33,0.5), 0 0 34px 4px rgba(246,168,33,0.28)` | The spotlight glow on a hovered valid zone. |
| `--drag-shadow`      | `0 16px 34px -8px rgba(0,0,0,0.66), 0 0 0 1px rgba(246,168,33,0.35), 0 0 22px rgba(246,168,33,0.22)` | Elevation + warm rim of a lifted tile. |

## 3. Typography

**One family — [Sora](https://fonts.google.com/specimen/Sora)** (geometric sans),
bundled offline via `@fontsource-variable/sora` (no external request; works in
the Capacitor native app). Hierarchy comes from weight, size and tracking, not
from a second family. Numeric data (product counts, coordinates) uses
**tabular figures** (`font-feature-settings: "tnum" 1`).

```
Font stack: 'Sora Variable', 'Sora', system-ui, -apple-system, 'Segoe UI', sans-serif
```

| Role | Size / Line | Weight | Tracking |
|---|---|---|---|
| Display (empty states, brand)  | 32 / 38px | 700 | -0.02em |
| H1 / view title                | 24 / 30px | 700 | -0.02em |
| H2 / modal title               | 20 / 26px | 600 | -0.015em |
| H3 / section                   | 16 / 22px | 600 | -0.01em |
| Body                           | 15 / 22px | 400 | 0 |
| Body-strong                    | 15 / 22px | 600 | 0 |
| Label / caption                | 13 / 18px | 500 | 0 |
| Eyebrow / overline             | 11 / 14px | 600 | 0.14em (UPPERCASE) |
| Numeric (counts, coords)       | inherit   | 600 | 0, `tnum` |

Body copy is `--text-primary`; supporting copy `--text-secondary`; meta
`--text-muted`. Sentence case everywhere except eyebrows (uppercase). German UI
copy (`de`) is the product language.

## 4. Spacing scale

4px base rhythm. Tailwind spacing keys map 1:1 (`1`=4px … `16`=64px). Component
padding uses the named steps below; do not invent off-scale values.

`2 (2px) · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`

- Screen gutter (mobile): `16px`. Desktop content max-width `1120px`, gutter `24px`.
- Card / modal padding: `20px`. List row: `12px 16px`. Tray: `12px`.

## 5. Radii

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 8px  | Inputs, chips, small buttons. |
| `--radius-md` | 12px | Product tiles, list rows, buttons. |
| `--radius-lg` | 16px | Cards, shelves, modals, tray. |
| `--radius-xl` | 22px | The map stage frame, windows (shopfront). |
| `--radius-pill` | 9999px | Name pills, tab pills, count badges. |

## 6. Elevation

Dark UI: elevation reads through a **lighter surface + soft shadow + a 1px top
inner highlight** (light appears to come from above).

| Token | Value |
|---|---|
| `--elev-1` | `0 1px 2px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)` |
| `--elev-2` | `0 4px 12px -2px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.05)` |
| `--elev-3` | `0 12px 28px -6px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.06)` |
| `--drag-shadow` | see §2 — used only by a lifted tile. |

## 7. Focus & interactive states

- **Focus ring (keyboard):** `box-shadow: 0 0 0 2px var(--bg-base), 0 0 0 4px var(--accent-ring)`. Always visible; never removed without replacement.
- **Buttons**
  - *Primary:* `--accent` bg, `--text-on-accent` text; hover `--accent-hover`; active scale `0.98`; disabled `opacity .45`.
  - *Secondary:* `--surface-raised` bg, `--text-primary`, `--border` outline; hover border `--border-strong`.
  - *Ghost:* transparent, `--text-secondary`; hover `--surface` bg + `--text-primary`.
  - *Danger:* `--danger` bg → `--danger-hover`; used only in confirm modals / destructive rows.
- **Links:** `--accent`; hover `--accent-hover`; underline on hover only.
- **Inputs:** `--surface-inset` bg, `--border` outline, `14px` radius-sm padding `10px 12px`; focus → border `--accent`, ring `--accent-ring`; error → border `--danger`, bg `--danger-soft`, message in `--danger`; success → border `--success`.
- **List row hover:** bg `--surface-raised`.
- **Transitions:** 150ms ease for colour/opacity, 180ms cubic-bezier(0.2,0.7,0.2,1) for transforms. Respect `prefers-reduced-motion` — disable non-essential motion, keep drags instantaneous.

## 8. Drag states (the core interaction)

| State | Visual |
|---|---|
| **idle** (placed) | Tile at `--surface-raised`, `--elev-2`, `--radius-md`. Authenticated: `cursor: grab`. Read-only: `cursor: default`. |
| **grabbed** | `scale(1.06)`, `z-index` above all, `box-shadow: var(--drag-shadow)`, `cursor: grabbing`, `touch-action: none`. Tile follows pointer via `transform` (no re-layout, 60fps). |
| **hovering valid target** | The zone under the pointer fills with `--drop-target`, gains a 2px `--drop-target-ring` inset outline and the `--drop-glow` spotlight. Tile keeps grabbed styling. |
| **invalid / over nothing** | No zone highlighted. On release the tile animates back to its previous position (180ms). |
| **committing** | Optimistic snap into place; on API failure roll back + danger toast. |

Tap vs drag: a press only becomes a drag after **~6px** movement or **~120ms**
hold; a clean tap opens the product detail modal instead.

## 9. Component patterns

- **App shell:** fixed dark header (`--bg-base`, bottom `--border`), app name left,
  right side = display name (opens Profile modal) or "Login" button. Two views —
  **Ladenplan** (Store Map) and **Produkte** (Product List) — via a segmented
  pill control / `IonTabs`, styled to tokens.
- **Map stage:** `--bg-layer` frame, `--radius-xl`, a subtle floor grid drawn from
  `--surface-inset` lines. 1000×700 logical canvas, `contain`-scaled.
- **Zone — shelf:** `--surface` block, `--radius-lg`, `--border` outline, `--elev-1`,
  eyebrow label + count badge (pill) top-left.
- **Zone — window (shopfront):** `--surface-raised`, brighter `--border-strong`
  outline, an inner top highlight to read as glass along the top edge; visually
  distinct from shelves. Same label/count treatment.
- **Product tile:** image fills a `--radius-md` frame (`referrerPolicy=no-referrer`,
  `loading=lazy`); name in a `--radius-pill` pill underneath. Missing/broken image →
  **initial-letter fallback**: `--surface-raised` tile, single uppercase initial in
  `--text-secondary`, amber-tinted from a deterministic hue on the name.
- **Tray:** docked bottom of the map, `--bg-layer` well, horizontally scrollable
  row of unplaced tiles; itself a valid drop target (un-place).
- **Modals:** centered card `--surface`, `--radius-lg`, `--elev-3`, backdrop
  `rgba(6,9,13,0.66)` + blur. Title (H2), close affordance, actions bottom-right.
  Login/Register/Create/Edit/Profile/Confirm are all modals — never page redirects.
- **List row:** thumbnail, name (body-strong), description snippet (secondary,
  1 line clamp), location chip ("Regal 3" accent-soft / "Nicht platziert" muted).
- **Toast:** bottom, `--surface-raised`, `--elev-3`, left accent/success/danger bar.
- **Read-only banner:** persistent inline strip on the map, `--accent-soft` bg,
  `--accent` left rule, copy + "Anmelden" button opening the Login modal.

## 10. Ionic override contract

Ionic ships a light default palette; we force dark and remap its variables to the
tokens above in `frontend/src/theme/variables.css`:

- `--ion-background-color: var(--bg-base)`, `--ion-text-color: var(--text-primary)`.
- `--ion-color-primary` → `--accent` (+ contrast `--text-on-accent`, shade/tint from `--accent-hover`).
- `--ion-color-danger` → `--danger`; `--ion-color-success` → `--success`.
- Item/card/toolbar backgrounds → `--surface` / `--bg-base`; borders → `--border`.
- `<html class="ion-palette-dark dark">` is fixed; there is no theme toggle and no
  light palette is defined.

## 11. Do / Don't

- **Do** derive every colour and text style from the tokens above.
- **Do** keep the amber accent rare — one glowing thing per context.
- **Don't** add a second font family, a light theme, or a second accent hue.
- **Don't** style with anything but Tailwind utilities + these CSS variables.
- **Don't** restyle existing screens when adding a feature — match, don't reinvent.
