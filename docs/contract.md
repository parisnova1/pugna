# Pugna — frontend/backend contract (web repo)

This document is deliberately duplicated (same content, adapted per-repo specifics) at
`D:\pugna\docs\contract.md` and `D:\pugna-mobile\docs\contract.md`. The **Canonical** sections
below are meant to read identically in both copies — that's the actual contract. The sections
above them describe what's true specifically in *this* repo today.

## 1. Auth (this repo)

- Context: `src/auth/AuthContext.tsx`. Email+password only on web — `login`/`signup` call
  `POST /api/auth/login` / `POST /api/auth/signup`. **No Google sign-in call exists in the web
  app**, even though the backend supports it (`POST /api/auth/google`, `server/src/routes/auth.js:83`,
  verified via `google-auth-library`). Google is mobile-only in practice today.
- Token: JWT, `Authorization: Bearer <token>` header (`src/lib/api.ts:18`). Stored in
  `localStorage` under key **`pugna_token`** (`src/lib/api.ts:2`).
- Env vars: `JWT_SECRET` (server, auto-generated if absent), `GOOGLE_CLIENT_ID_WEB` /
  `_IOS` / `_ANDROID` (server, `server/.env.example`) — must match mobile's
  `EXPO_PUBLIC_GOOGLE_CLIENT_ID_*` values per that file's own comment.
- No root `.env.example` exists in this repo. `.env.local` only holds a Vercel CLI deployment
  token, unrelated to app auth.

## 2. API_BASE (this repo)

`src/lib/api.ts:1` and `src/lib/ws.ts:1` (duplicated, not shared):
```ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
```
Env var name: **`VITE_API_URL`**. No override set locally, no `vercel.json`, no README —
**production value is not documented anywhere in this repo.**

## 3. Types as they exist here (pre-canonicalization)

No shared types file. Redefined per-file:
- `EventInfo` (`EventDetail.tsx:19`), `EventDetail` (`EventManage.tsx:19`),
  `PublicEventDetail` (`PublicEvent.tsx:10`), `EventResult` (`SearchResults.tsx:10`) — four
  different Event shapes.
- `Bout` is already centralized: `export type Bout` in `src/components/Bracket.tsx:5`,
  imported by `EventManage.tsx`, `EventDetail.tsx`, `PublicEvent.tsx`. Genuinely not a gap.
- `CardBout` (`EventManage.tsx:1088`) vs `CardBoutPublic` (`EventDetail.tsx:578`) — identical
  shape, two names.
- `NominationRow` defined twice with *different* shapes: organizer view
  (`EventManage.tsx:320`) vs club view (`ClubDashboard.tsx:531`).
- `Club` redefined in `ClubProfile.tsx:15` and `ClubDashboard.tsx:48` (adds `lat`/`lng`);
  narrower `PublicClub` (`Home.tsx:28`) and `ClubResult` (`SearchResults.tsx:12`) for list views.

## 4. Event list/detail fetching (this repo)

- List: `apiFetch('/api/public/events')` — `Home.tsx:320`, `SearchResults.tsx:34`.
- Public detail: `GET /api/public/events/:idOrToken` + `.../fighters` —
  `EventDetail.tsx:115-116`, `PublicEvent.tsx:84-85`. Backend resolves numeric id or
  `qr_token` (`server/src/routes/public.js`), gated to `status IN ('Open','Active')`.
- Organizer detail: `GET /api/events/:eventId/detail` (`EventManage.tsx:110`), served by
  `tournament.js:74` behind `requireAuth` + ownership check, no status gate. **This shape
  genuinely differs** from the public one (organizer's `EventDetail` type lacks
  `fights/fighters/views/organizer_name` the public `EventInfo` has) — not just a subset.

## 5. Bout/result mutation (this repo)

- `PATCH /api/bouts/:id/result` (`tournament.js:247`, called `EventManage.tsx:1009`), body
  `{ winnerId, method, methodNote }`. Requires `bout.status === 'scheduled'` else 400.
  `method` ∈ `{Decision, KO, TKO, RSC, Walkover, Abd, DQ, Injury}` (`tournament.js:45`).
  Success sets `status = 'completed'` via `advanceWinner()` (`server/src/bracket.js:57`).
- Live-bout *pointer* (event-level, not a bout status): `PATCH /api/events/:id/current-bout`
  (`tournament.js:310`, called `EventManage.tsx:874`), body `{ boutId }`.
- Bout status column only ever holds `'scheduled'` or `'completed'` in code today
  (`server/src/db.js:152,361`). Event-day status is separate:
  `DAY_STATUSES = {scheduled, live, completed}` (`eventDays.js:15`).

## 6. Routing (this repo)

`src/App.tsx:70-85`: `/`, `/home`, `/events`, `/events/:eventId`, `/fighters/:fighterId`,
`/clubs`, `/clubs/:clubId`, `/sparring`, `/search`, `/organizer`,
`/organizer/events/:eventId/manage`, `/club-dashboard`, `/notification-settings`, `*`.

`/e/:token` bypasses the entire app shell: `App.tsx:23-29` matches
`/\/e\/([^/?#]+)/` against `window.location.pathname` before `LanguageProvider` /
`AuthProvider` / `BrowserRouter` even mount, rendering `<PublicEvent token={...}/>` directly.
`PublicEvent.tsx` has its own inline `<Header/>` — no marketing chrome, per the brief's
"no marketing header on this page" rule (already true today).

## 7. i18n (this repo)

`src/i18n/LanguageContext.tsx`: localStorage key **`pugna_lang`**, default **`de`**.
`src/i18n/translations.ts`: flat `'section.key': string`, English is the typed source of
truth, German required for every key. **424 keys.**

## 8. Realtime (this repo)

`src/lib/ws.ts`: `subscribeToEvent(token, onMessage)`, reconnect backoff capped at 15s.
```ts
type EventMessage =
  | { type: 'bracket:update'; weightClassId: number }
  | { type: 'bout:live'; boutId: number | null; weightClassId: number | null }
  | { type: 'bout:result'; boutId: number; weightClassId: number; winnerId: number; method: string }
  | { type: 'event:status'; status: string }
```
Comment in this file already says this union must mirror mobile's `lib/ws.ts` — confirmed
identical there. Server broadcasts via `broadcastBracketUpdate`/`broadcastBoutResult`
(`tournament.js:291-292`).

## 9. Follow / QR / deep links (this repo)

- Club follow: `GET/POST/DELETE /api/clubs/following`, `/api/clubs/:id/follow`
  (`clubs.js:126-147`).
- Fighter follow: `/api/public/fighters/following`, `/api/public/fighters/:id/follow`.
- **No "follow an event" endpoint** — only save/mute (`/api/public/events/:id/save`, `.../mute`).
- QR: generated client-side, `EventManage.tsx:211-217`, `qrcode` npm package,
  `publicUrl = ${origin}/e/${event.qr_token}`.
- Scanning: `src/components/QrScanner.tsx` (`html5-qrcode`) — used for manual/camera
  check-in, not a follow flow.
- **No `/go/:code` short-link redirect exists.** The only short-token path is `/e/:token`
  itself.

## 10. EventManage.tsx structure (this repo)

1296 lines. Tab-driven: card-format events get Setup / Fight Card tabs; bracket-format
events get Setup / Weight Classes / Nominations / Fighters / Bracket tabs. Sections:
`SetupTab` (name/date/location/status, delete, QR generation), weight-class CRUD + template
packs, `NominationsTab` (accept/reject), fighter roster (manual add + weight-class
assignment), `BracketTab` (generate/view, day switching, set current live bout, record
result modal), card-bout list/reorder/CRUD for card-format events.

---

## CANONICAL (shared with the mobile repo's contract.md — keep these two in sync)

### Types

**User / Role** — already identical in both repos, no work needed:
```ts
type Role = 'organizer' | 'club' | 'viewer'
type User = { id: number; name: string; email: string; role: Role; home_location: string }
```

**Bout** — already identical in both repos (both export it from their Bracket component):
```ts
type Bout = {
  id: number; round: number; slot: number
  fighter_red_id: number | null; fighter_blue_id: number | null
  status: string; winner_id: number | null; method: string | null
  event_day_id?: number | null
}
```

**LiveBout** — near-identical; converge on mobile's version (it includes `status`):
```ts
type LiveBout = { id: number; weight_class_id: number; status: string; fighterRed: { name: string } | null; fighterBlue: { name: string } | null }
```

**CardBoutPublic** — already the same shape in both repos, just inconsistently named in web
(`CardBout` in `EventManage.tsx`, `CardBoutPublic` in `EventDetail.tsx`). Rename web's
organizer-side `CardBout` → `CardBoutPublic` to match. No shape change needed.
```ts
type CardBoutPublic = {
  id: number; fighter_a_name: string; fighter_a_record: string
  fighter_b_name: string; fighter_b_record: string
  weight_class_text: string; card_position: 'main' | 'co-main' | 'undercard'
  rounds: number | null
}
```

**Event** — canonical name **`Event`** (currently `EventInfo`/`EventRow`/`EventDetail`/
`PublicEventDetail`/`EventResult` across both repos). Full shape, backend field names:
```ts
type Event = {
  id: number; name: string; date: string; location: string; venue: string
  discipline: string; status: string; format: 'bracket' | 'card'
  livestream_url: string; qr_token: string
  fights: number; fighters: number; views: number; organizer_name: string
  current_bout_id: number | null; number_of_days: number; ring_count: number
}
```
List/public endpoints returning a narrower subset of this is fine — the gap is the *organizer*
detail endpoint (`GET /api/events/:eventId/detail`) genuinely omitting `fights/fighters/
views/organizer_name` that the public one has. Recommend the backend detail endpoint include
the full canonical shape so both frontends can use one type with optional narrowing, not two
divergent ones.

**Nomination** — two legitimately different, role-scoped shapes exist in *both* repos
already; keep two types but rename consistently (currently both called `NominationRow` in
each repo despite differing):
```ts
type OrganizerNomination = { id: number; status: 'pending' | 'accepted' | 'rejected'; club_name: string; fighter_name: string; fighter_weight: string; fighter_record: string; weight_class_name: string; note: string }
type MyNomination = { id: number; status: 'pending' | 'accepted' | 'rejected'; event_name: string; weight_class_name: string; fighter_name: string }
```

**Club** — canonical name **`Club`**, full shape (narrower `PublicClub` for list views is fine):
```ts
type Club = {
  id: number; name: string; location: string; disciplines: string[]
  founded_year: number | null; member_count: number; description: string
  logo_url: string; cover_url: string; lat?: number | null; lng?: number | null
}
```

### Status enums — the central Phase 1/2 gap

Only `'scheduled'` and `'completed'` are ever written to a bout's `status` column today, in
either repo. Event-day status is the separate `{scheduled, live, completed}` enum. **The
brief's proposed bout statuses (Scheduled | Delayed | Scratched | Walkover | In progress |
Final | Intermission) do not exist in the schema.** `Walkover` today is a *method* value on
a completed bout, not a status. "In progress" is currently modeled as the event's
`current_bout_id` pointer, not a per-bout state. Delayed/Scratched/Intermission have no
column, no enum value, no endpoint, in either frontend or the backend routes inventoried.
**This is the single largest blocker for Phase 2's live console** — those actions need new
backend support before either UI can wire them.

### Canonical route map

| Canonical (brief) | Web today | Mobile today | Gap |
|---|---|---|---|
| `/e/:slug` | ✅ `/e/:token`, bypasses app shell | ❌ not found — `/events/[id]` serves this role but has no distinct guest/token entry | Mobile missing |
| `/go/:code` | ❌ not found | ❌ not found | Missing both |
| `/events` | ✅ | ✅ `(tabs)/events` | OK |
| `/clubs` | ✅ | ✅ `(tabs)/clubs` | OK |
| `/sparring` | ✅ (stub-level, per non-goals OK) | ✅ `(tabs)/sparring` | OK |
| `/login` `/register` | ⚠️ `LoginModal` overlay, no dedicated route/URL | ✅ `(auth)/login`, `(auth)/signup` | Web has no addressable route |
| `/you` | ⚠️ `/home` (viewer-only; organizer/club get their own dashboards) | ✅ `(tabs)/you` | Naming differs, functionally analogous |
| `/host/:eventId/live` | ⚠️ `/organizer/events/:eventId/manage` (full builder, not a dedicated live console) | ⚠️ `organizer-events/[id].tsx` (same situation) | Missing both — Phase 2 work |

### Follow / QR — gap summary

- Club follow ✅ both repos, identical endpoints.
- Fighter follow ✅ both repos, identical endpoints.
- **Event follow ❌ missing both** — only save/mute exist. Decide: reuse `save` semantics for
  the brief's "Follow CTA" on the live card, or add a real event-follow endpoint later.
- QR **generation**: web only (`EventManage.tsx`). Mobile can *scan* (`scan.tsx`) but has no
  way to *generate/display* a QR for an event it organizes — gap for mobile's Phase 2.3.
- QR **scanning**/deep-link resolution: mobile's `scan.tsx` already resolves a scanned
  token or numeric id via `/api/public/events/{identifier}` and navigates in — this logic is
  directly reusable once `/go/:code` exists as a real route.

### i18n — gap summary

Both: localStorage/AsyncStorage key `pugna_lang`, default `de` — identical. Web has 424 keys,
mobile has ~537 — no shared source of truth, no tooling keeps them in sync. Not a blocker
(the brief explicitly doesn't want the codebases merged), but flagged as an ongoing
maintenance risk.

### Overall gap list (exists | partial | missing)

- Shared event list endpoint — **exists**, identical on both.
- Public live event detail — **exists** both, but shapes diverge from the organizer-side
  detail endpoint (web) in ways that should converge.
- Realtime bout/bracket updates — **exists** both, message union already identical.
- Bout status lifecycle beyond scheduled/completed (Delayed/Scratched/In-progress/
  Intermission) — **missing**, backend work required before Phase 2.
- `/e/:slug` public guest route — **exists web, missing mobile**.
- `/go/:code` short-link — **missing both**.
- Organizer live console (dedicated, not the full builder) — **missing both**.
- Event follow — **missing both** (save/mute exist as a partial substitute).
- QR generation on mobile — **missing** (scanning exists).
- Production `API_BASE` value — **undocumented** in either repo; needs verifying against
  actual Vercel project env vars outside the codebase before assuming the deployed web app
  can reach a real backend at all.
- `docs/contract.md` itself — **exists now**, this file.
