import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')
mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(join(dataDir, 'pugna.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    discipline TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',
    fights INTEGER NOT NULL DEFAULT 0,
    fighters INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS fighters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    club TEXT NOT NULL,
    weight TEXT NOT NULL,
    record TEXT NOT NULL DEFAULT '0–0',
    status TEXT NOT NULL DEFAULT 'Unmatched',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

// Lightweight migrations for columns added after the initial release.
// Additive only (ALTER TABLE ... ADD COLUMN) so existing dev data survives.
function columnsOf(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name)
}

const fighterColumns = columnsOf('fighters')
if (!fighterColumns.includes('discipline')) {
  db.exec("ALTER TABLE fighters ADD COLUMN discipline TEXT NOT NULL DEFAULT 'Boxing'")
}
if (!fighterColumns.includes('location')) {
  db.exec("ALTER TABLE fighters ADD COLUMN location TEXT NOT NULL DEFAULT ''")
}
if (!fighterColumns.includes('event_id')) {
  db.exec('ALTER TABLE fighters ADD COLUMN event_id INTEGER REFERENCES events(id) ON DELETE CASCADE')
}
if (!fighterColumns.includes('weight_class_id')) {
  db.exec('ALTER TABLE fighters ADD COLUMN weight_class_id INTEGER')
}
if (!fighterColumns.includes('seed')) {
  db.exec('ALTER TABLE fighters ADD COLUMN seed INTEGER')
}
if (!fighterColumns.includes('club_id')) {
  db.exec('ALTER TABLE fighters ADD COLUMN club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL')
}
if (!fighterColumns.includes('source')) {
  // manual = organizer's own roster (existing rows, unaffected); walkup =
  // host-added directly at an event with no account; roster = created from
  // an accepted club nomination (see roster_fighter_id below).
  db.exec("ALTER TABLE fighters ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'")
}
if (!fighterColumns.includes('roster_fighter_id')) {
  db.exec('ALTER TABLE fighters ADD COLUMN roster_fighter_id INTEGER REFERENCES fighters(id) ON DELETE SET NULL')
}

const eventColumns = columnsOf('events')
if (!eventColumns.includes('format')) {
  db.exec("ALTER TABLE events ADD COLUMN format TEXT NOT NULL DEFAULT 'bracket'")
}
if (!eventColumns.includes('number_of_days')) {
  db.exec('ALTER TABLE events ADD COLUMN number_of_days INTEGER NOT NULL DEFAULT 1')
}
if (!eventColumns.includes('ring_count')) {
  db.exec('ALTER TABLE events ADD COLUMN ring_count INTEGER NOT NULL DEFAULT 1')
}
if (!eventColumns.includes('qr_token')) {
  db.exec('ALTER TABLE events ADD COLUMN qr_token TEXT')
}
if (!eventColumns.includes('venue')) {
  db.exec("ALTER TABLE events ADD COLUMN venue TEXT NOT NULL DEFAULT ''")
}
if (!eventColumns.includes('livestream_url')) {
  db.exec("ALTER TABLE events ADD COLUMN livestream_url TEXT NOT NULL DEFAULT ''")
}
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_events_qr_token ON events(qr_token)')

const userColumns = columnsOf('users')
if (!userColumns.includes('role')) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'organizer'")
}
if (!userColumns.includes('home_location')) {
  db.exec("ALTER TABLE users ADD COLUMN home_location TEXT NOT NULL DEFAULT ''")
}
if (!userColumns.includes('google_id')) {
  // Nullable — only set for accounts linked to a Google identity. SQLite
  // treats multiple NULLs in a UNIQUE column as non-conflicting, so this
  // still enforces one Google account can't be linked to two users.
  db.exec('ALTER TABLE users ADD COLUMN google_id TEXT')
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)')
}

// Backfill qr_token for any event created before this column existed.
const missingToken = db.prepare('SELECT id FROM events WHERE qr_token IS NULL').all()
if (missingToken.length > 0) {
  const setToken = db.prepare('UPDATE events SET qr_token = ? WHERE id = ?')
  for (const { id } of missingToken) {
    setToken.run(randomBytes(8).toString('hex'), id)
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS weight_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age_group TEXT NOT NULL DEFAULT 'adult',
    gender TEXT NOT NULL DEFAULT 'mixed',
    rounds_count INTEGER NOT NULL DEFAULT 3,
    round_minutes INTEGER NOT NULL DEFAULT 3,
    rest_minutes INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    weight_class_id INTEGER NOT NULL REFERENCES weight_classes(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    slot INTEGER NOT NULL,
    fighter_red_id INTEGER REFERENCES fighters(id) ON DELETE SET NULL,
    fighter_blue_id INTEGER REFERENCES fighters(id) ON DELETE SET NULL,
    next_bout_id INTEGER REFERENCES bouts(id) ON DELETE SET NULL,
    next_bout_slot TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    winner_id INTEGER REFERENCES fighters(id) ON DELETE SET NULL,
    method TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_bouts_weight_class ON bouts(weight_class_id);
  CREATE INDEX IF NOT EXISTS idx_fighters_event ON fighters(event_id);
  CREATE INDEX IF NOT EXISTS idx_weight_classes_event ON weight_classes(event_id);

  CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    disciplines TEXT NOT NULL DEFAULT '',
    founded_year INTEGER,
    member_count INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_clubs_owner ON clubs(owner_id);
`)

// Freeform fight-card fields for organizer-built "card" format events, which
// share the bouts table with the tournament bracket system but don't have a
// real weight-class/fighter-account structure — fighters are typed in as
// plain name+record text and ordering is manual, not bracket-seeded.
const boutColumns = columnsOf('bouts')
if (!boutColumns.includes('fighter_a_name')) db.exec('ALTER TABLE bouts ADD COLUMN fighter_a_name TEXT')
if (!boutColumns.includes('fighter_a_record')) db.exec('ALTER TABLE bouts ADD COLUMN fighter_a_record TEXT')
if (!boutColumns.includes('fighter_b_name')) db.exec('ALTER TABLE bouts ADD COLUMN fighter_b_name TEXT')
if (!boutColumns.includes('fighter_b_record')) db.exec('ALTER TABLE bouts ADD COLUMN fighter_b_record TEXT')
if (!boutColumns.includes('weight_class_text')) db.exec('ALTER TABLE bouts ADD COLUMN weight_class_text TEXT')
if (!boutColumns.includes('card_position')) db.exec('ALTER TABLE bouts ADD COLUMN card_position TEXT')
if (!boutColumns.includes('sort_order')) db.exec('ALTER TABLE bouts ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0')
if (!boutColumns.includes('rounds')) db.exec('ALTER TABLE bouts ADD COLUMN rounds INTEGER')
if (!boutColumns.includes('method_note')) db.exec('ALTER TABLE bouts ADD COLUMN method_note TEXT')
if (!boutColumns.includes('event_day_id')) db.exec('ALTER TABLE bouts ADD COLUMN event_day_id INTEGER REFERENCES event_days(id) ON DELETE SET NULL')

const weightClassColumns = columnsOf('weight_classes')
if (!weightClassColumns.includes('status')) {
  // open = still accepting nominations; closed = host locked the class,
  // ready to generate a bracket/card. Advisory only — not enforced against
  // nomination inserts, matching this schema's existing permissiveness.
  db.exec("ALTER TABLE weight_classes ADD COLUMN status TEXT NOT NULL DEFAULT 'open'")
}
if (!weightClassColumns.includes('capacity')) {
  db.exec('ALTER TABLE weight_classes ADD COLUMN capacity INTEGER')
}

const eventBoxingColumns = columnsOf('events')
if (!eventBoxingColumns.includes('template_pack_slug')) {
  db.exec('ALTER TABLE events ADD COLUMN template_pack_slug TEXT')
}
if (!eventBoxingColumns.includes('current_bout_id')) {
  db.exec('ALTER TABLE events ADD COLUMN current_bout_id INTEGER REFERENCES bouts(id) ON DELETE SET NULL')
}

const clubColumns = columnsOf('clubs')
if (!clubColumns.includes('logo_url')) {
  db.exec("ALTER TABLE clubs ADD COLUMN logo_url TEXT NOT NULL DEFAULT ''")
}
if (!clubColumns.includes('cover_url')) {
  db.exec("ALTER TABLE clubs ADD COLUMN cover_url TEXT NOT NULL DEFAULT ''")
}
if (!clubColumns.includes('lat')) {
  db.exec('ALTER TABLE clubs ADD COLUMN lat REAL')
}
if (!clubColumns.includes('lng')) {
  db.exec('ALTER TABLE clubs ADD COLUMN lng REAL')
}

// Best-effort backfill for clubs saved (seeded or manually created) before
// coordinates were captured — matched by exact location text. New clubs get
// real geocoded coordinates from the location autocomplete going forward.
const CITY_COORDS = {
  'Nürnberg, Bayern': [49.4521, 11.0767],
  'Fürth, Bayern': [49.4772, 10.9886],
  'Berlin': [52.5200, 13.4050],
  'Wien, Österreich': [48.2082, 16.3738],
  'Zürich, Schweiz': [47.3769, 8.5417],
  'München, Bayern': [48.1351, 11.5820],
  'Stuttgart, Baden-Württemberg': [48.7758, 9.1829],
  'Hamburg': [53.5511, 9.9937],
  'Köln, Nordrhein-Westfalen': [50.9375, 6.9603],
  'Dresden, Sachsen': [51.0504, 13.7373],
  'Leipzig, Sachsen': [51.3397, 12.3731],
}
const missingCoords = db.prepare('SELECT id, location FROM clubs WHERE lat IS NULL').all()
if (missingCoords.length > 0) {
  const setCoords = db.prepare('UPDATE clubs SET lat = ?, lng = ? WHERE id = ?')
  for (const { id, location } of missingCoords) {
    const coords = CITY_COORDS[location]
    if (coords) setCoords.run(coords[0], coords[1], id)
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS sparring_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    discipline TEXT NOT NULL,
    location TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    weight_range TEXT NOT NULL DEFAULT '',
    level TEXT NOT NULL DEFAULT 'All Levels',
    spots INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_sparring_club ON sparring_sessions(club_id);
  CREATE INDEX IF NOT EXISTS idx_sparring_date ON sparring_sessions(date);

  CREATE TABLE IF NOT EXISTS sparring_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sparring_sessions(id) ON DELETE CASCADE,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    fighter_count INTEGER NOT NULL,
    weight_category TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(session_id, club_id)
  );

  CREATE INDEX IF NOT EXISTS idx_sparring_reg_session ON sparring_registrations(session_id);

  CREATE TABLE IF NOT EXISTS club_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, club_id)
  );

  CREATE INDEX IF NOT EXISTS idx_club_follows_user ON club_follows(user_id);

  CREATE TABLE IF NOT EXISTS event_saves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, event_id)
  );

  CREATE INDEX IF NOT EXISTS idx_event_saves_user ON event_saves(user_id);

  CREATE TABLE IF NOT EXISTS fighter_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fighter_id INTEGER NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, fighter_id)
  );

  CREATE INDEX IF NOT EXISTS idx_fighter_follows_user ON fighter_follows(user_id);

  CREATE TABLE IF NOT EXISTS template_packs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    discipline TEXT NOT NULL,
    division TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS template_pack_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id INTEGER NOT NULL REFERENCES template_packs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT NOT NULL DEFAULT 'mixed',
    rounds_count INTEGER NOT NULL,
    round_minutes INTEGER NOT NULL,
    rest_minutes INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_template_pack_classes_pack ON template_pack_classes(pack_id);

  -- A club nominates one of its roster fighters into an event's weight
  -- class; the host accepts/rejects. Accepting copies the fighter into the
  -- event's own fighters roster (source='roster') rather than mutating this
  -- row, so a nomination stays a permanent record of what was proposed.
  CREATE TABLE IF NOT EXISTS nominations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    weight_class_id INTEGER NOT NULL REFERENCES weight_classes(id) ON DELETE CASCADE,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    fighter_id INTEGER NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    note TEXT NOT NULL DEFAULT '',
    decided_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    decided_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(fighter_id, weight_class_id)
  );

  CREATE INDEX IF NOT EXISTS idx_nominations_event ON nominations(event_id);
  CREATE INDEX IF NOT EXISTS idx_nominations_club ON nominations(club_id);

  -- Only relevant once number_of_days > 1 — a 1-day event never gets rows
  -- here, and the UI treats "no rows" as an implicit single day.
  CREATE TABLE IF NOT EXISTS event_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL,
    date TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'scheduled',
    UNIQUE(event_id, day_index)
  );

  CREATE INDEX IF NOT EXISTS idx_event_days_event ON event_days(event_id);

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    interruption_level TEXT NOT NULL DEFAULT 'active',
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    data TEXT NOT NULL DEFAULT '{}',
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS notification_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    categories TEXT NOT NULL DEFAULT '{}',
    quiet_hours_start TEXT,
    quiet_hours_end TEXT
  );

  CREATE TABLE IF NOT EXISTS event_mutes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, event_id)
  );

  CREATE INDEX IF NOT EXISTS idx_event_mutes_user ON event_mutes(user_id);
`)

const sparringColumns = columnsOf('sparring_sessions')
if (!sparringColumns.includes('message')) {
  db.exec("ALTER TABLE sparring_sessions ADD COLUMN message TEXT NOT NULL DEFAULT ''")
}
if (!sparringColumns.includes('accepting_requests')) {
  db.exec('ALTER TABLE sparring_sessions ADD COLUMN accepting_requests INTEGER NOT NULL DEFAULT 1')
}
// spots keeps its NOT NULL constraint (SQLite can't drop it without a table
// rebuild) — 0 is repurposed to mean "unlimited" so the field can go optional
// at the application layer without a migration.

// Night-of organizer live-console support (product brief Phase 2). A bout's
// `status` column stays free-text (always has been — see the base bouts
// table above), so 'delayed' and 'scratched' need no schema change to be
// legal values, only these two additive columns to carry their extra data.
const boutLiveColumns = columnsOf('bouts')
if (!boutLiveColumns.includes('delay_minutes')) {
  // Null = not delayed. Only meaningful while status = 'delayed' — cleared
  // by the same endpoint that reverts a bout back to 'scheduled'.
  db.exec('ALTER TABLE bouts ADD COLUMN delay_minutes INTEGER')
}

const eventLiveColumns = columnsOf('events')
if (!eventLiveColumns.includes('intermission_note')) {
  // Null = not in intermission. Non-null (including '') = intermission is
  // active; the text is an optional organizer note ("back in 10") shown to
  // guests. A pointer/flag rather than an enum value on `status`, since
  // intermission is orthogonal to the event's Draft/Open/Active lifecycle.
  db.exec('ALTER TABLE events ADD COLUMN intermission_note TEXT')
}

// Phase 3 — a fighter account's own read/accept-or-decline of a nomination
// their club made for them. Deliberately separate from `nominations.status`
// (the organizer's accept/reject onto the card) so this stays a soft signal
// that never blocks or reorders the existing club/organizer nomination
// lifecycle. Null = fighter hasn't responded yet.
const nominationColumns = columnsOf('nominations')
if (!nominationColumns.includes('fighter_response')) {
  db.exec('ALTER TABLE nominations ADD COLUMN fighter_response TEXT')
}
