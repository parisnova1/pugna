# Pugna (web)

A private network for amateur combat sports: organizers publish fight cards, clubs
nominate fighters, and viewers follow events live. This is the web app; the
mobile app lives in a sibling repo (`pugna-mobile-app`) and talks to the same
backend in `server/`.

## Running locally

Two processes, in separate terminals:

```bash
cd server && npm install && npm run dev   # API on http://localhost:4000
npm install && npm run dev                # web app on http://localhost:5173 (or the port Vite prints)
```

The backend uses a local SQLite file (`server/data/pugna.db`, created
automatically) — no external database to set up.

## Environment variables

**Web app** (`.env.local` at the repo root, see `.env.example`):

- `VITE_API_URL` — base URL of the API server. Defaults to `http://localhost:4000`
  if unset, so it's only needed once you're pointing at a deployed backend.

**Server** (`server/.env`, see `server/.env.example`):

- `JWT_SECRET` — auto-generated on first run if not set; only set it yourself
  if you need a stable secret across restarts (e.g. in production).
- `GOOGLE_CLIENT_ID_WEB` / `_IOS` / `_ANDROID` — optional, only needed to enable
  "Sign in with Google". Must match the mobile app's
  `EXPO_PUBLIC_GOOGLE_CLIENT_ID_*` values (same client IDs, without the prefix).

## Seeding demo data

The server seeds itself automatically the first time it starts against an
empty database (`server/src/seed.js`, called from `server/src/index.js`) —
demo clubs, a couple of events, and the built-in weight-class template packs
(IBA 2024 Elite, Club Show, World Boxing).

To get a fresh seed, stop the server and delete the database file:

```bash
rm server/data/pugna.db
npm --prefix server run dev
```

There's no separate "seed one event" command — the seeding is all-or-nothing
based on whether the `events`/`clubs`/`template_packs` tables are empty. For a
one-off test event, it's usually faster to sign up an organizer account
through the app and create it directly.

## Printing event QR codes

Each event's QR code (Organizer → Manage Event → Setup tab) is generated at a
fixed 180×180px raster, sized for on-screen preview and small downloads —
scanning distance matters more than print size for QR codes in practice, but
if you're printing large (posters, banners), don't naively upscale the
downloaded PNG: it's not vector, and stretching it past roughly its native
size will blur the modules and hurt scan reliability. For a large print,
either keep the physical print size small (a few centimeters per side is
usually plenty for a phone camera at arm's length) or regenerate the code at
a higher resolution by changing the `width` passed to `QRCode.toDataURL(...)`
in `src/pages/EventManage.tsx` before printing.

## Project structure

See [`AGENTS.md`](AGENTS.md) for the frontend's file layout and conventions,
and [`docs/contract.md`](docs/contract.md) for the frontend/backend API
contract shared with the mobile app.
