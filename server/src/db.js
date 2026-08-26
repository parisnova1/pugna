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
`)
