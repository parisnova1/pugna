import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { db } from './db.js'
import { boxingTemplate } from './weightClassTemplate.js'

const countEvents = db.prepare('SELECT COUNT(*) AS n FROM events')
const countClubs = db.prepare('SELECT COUNT(*) AS n FROM clubs')
const countTemplatePacks = db.prepare('SELECT COUNT(*) AS n FROM template_packs')
const insertTemplatePack = db.prepare('INSERT INTO template_packs (slug, discipline, division, name) VALUES (?, ?, ?, ?)')
const insertTemplatePackClass = db.prepare(`
  INSERT INTO template_pack_classes (pack_id, name, gender, rounds_count, round_minutes, rest_minutes, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)
const insertUser = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
const insertEvent = db.prepare(`
  INSERT INTO events (organizer_id, name, date, location, discipline, status, fights, fighters, views)
  VALUES (?, ?, ?, ?, ?, 'Active', ?, ?, ?)
`)
const insertFighter = db.prepare(`
  INSERT INTO fighters (organizer_id, name, club, weight, record, status, discipline, location)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)
const insertClub = db.prepare(`
  INSERT INTO clubs (name, location, disciplines, founded_year, member_count, description)
  VALUES (?, ?, ?, ?, ?, ?)
`)

export function seedIfEmpty() {
  seedClubsIfEmpty()
  seedTemplatePacksIfEmpty()

  if (countEvents.get().n > 0) return

  // Seed organizer accounts are unattended demo rows — the password is random
  // and discarded, these exist only so public events/fighters have a real
  // organizer to join against.
  const seedPasswordHash = bcrypt.hashSync(randomBytes(24).toString('hex'), 10)
  const makeOrganizer = (name, email) => insertUser.run(name, email, seedPasswordHash).lastInsertRowid

  const nurnberg = makeOrganizer('FC Boxring Nürnberg', 'seed+nurnberg@pugna.app')
  const berlinKampf = makeOrganizer('Kampfsport Berlin e.V.', 'seed+berlin@pugna.app')
  const eliteBoxing = makeOrganizer('Elite Boxing GmbH', 'seed+elite@pugna.app')
  const mmaAustria = makeOrganizer('MMA Austria GmbH', 'seed+austria@pugna.app')
  const fightLeagueCh = makeOrganizer('Fight League CH', 'seed+ch@pugna.app')
  const boxclubMunich = makeOrganizer('Boxclub München', 'seed+munich@pugna.app')

  insertEvent.run(nurnberg, 'Fight Night Nürnberg', '23 Aug 2026', 'Nürnberg, Bayern', 'Boxing', 8, 16, 840)
  insertEvent.run(berlinKampf, 'Open Ring Berlin', '6 Sep 2026', 'Berlin', 'Kickboxing', 12, 24, 610)
  insertEvent.run(eliteBoxing, 'Championship Night Berlin', '14 Sep 2026', 'Berlin', 'Boxing', 10, 20, 2000)
  insertEvent.run(mmaAustria, 'Vienna Combat Night', '28 Sep 2026', 'Wien, Österreich', 'MMA', 9, 18, 730)
  insertEvent.run(fightLeagueCh, 'Zürich Fight League', '11 Oct 2026', 'Zürich, Schweiz', 'Muay Thai', 7, 14, 410)
  insertEvent.run(boxclubMunich, 'Munich Boxing Gala', '18 Oct 2026', 'München, Bayern', 'Boxing', 11, 22, 590)

  insertFighter.run(nurnberg, 'Marcus Müller', 'Boxclub Nürnberg', '75 KG', '8–2', 'Matched', 'Boxing', 'Nürnberg')
  insertFighter.run(nurnberg, 'David Okafor', 'FC Ring Fürth', '74 KG', '6–3', 'Unmatched', 'Boxing', 'Fürth')
  insertFighter.run(berlinKampf, 'Julian Reiter', 'Kampfsport Berlin', '70 KG', '11–1', 'Matched', 'Kickboxing', 'Berlin')
  insertFighter.run(mmaAustria, 'Emre Yildiz', 'MMA Stuttgart', '77 KG', '9–4', 'Unmatched', 'MMA', 'Stuttgart')

  console.log('Seeded demo organizers, events and fighters (fresh database).')
}

// Runs independently of seedIfEmpty's events-empty guard so a `clubs` table
// added after an existing dev database was already seeded still gets filled.
function seedClubsIfEmpty() {
  if (countClubs.get().n > 0) return

  // Unclaimed directory listings — no owner_id until a real club account
  // registers and (eventually) claims one, or fills in their own via signup.
  const clubs = [
    ['Boxclub Nürnberg', 'Nürnberg, Bayern', 'Boxing', 1982, 84, 'One of Bavaria’s most established boxing clubs, training fighters from beginner to professional level.'],
    ['FC Ring Fürth', 'Fürth, Bayern', 'Boxing', 1994, 46, 'A close-knit amateur boxing club known for developing regional title contenders.'],
    ['Kampfsport Berlin e.V.', 'Berlin', 'MMA,BJJ,Wrestling', 2005, 130, 'Berlin’s largest mixed martial arts gym, with dedicated wrestling and grappling programs.'],
    ['Elite Boxing GmbH', 'Berlin', 'Boxing', 2011, 58, 'Professional-focused boxing gym running regular fight cards across Germany.'],
    ['MMA Austria', 'Wien, Österreich', 'MMA,Muay Thai', 2009, 72, 'Austria’s leading MMA academy, producing fighters for national and international promotions.'],
    ['Fight League CH', 'Zürich, Schweiz', 'Kickboxing,Muay Thai', 2013, 39, 'Swiss kickboxing and Muay Thai club with a strong youth development program.'],
    ['München Fight Club', 'München, Bayern', 'Boxing,Muay Thai', 2001, 95, 'A multi-discipline striking gym in the heart of Munich, open to all experience levels.'],
    ['MMA Stuttgart', 'Stuttgart, Baden-Württemberg', 'MMA', 2016, 51, 'A newer MMA gym focused on technical grappling and modern striking systems.'],
    ['Hamburg Boxring', 'Hamburg', 'Boxing', 1975, 110, 'A historic harbor-city boxing club with one of the oldest active amateur programs in Germany.'],
    ['Rhein Kickboxing', 'Köln, Nordrhein-Westfalen', 'Kickboxing', 1998, 63, 'Rhineland kickboxing club competing regularly on the German amateur and semi-pro circuit.'],
  ]
  for (const [name, location, disciplines, foundedYear, memberCount, description] of clubs) {
    insertClub.run(name, location, disciplines, foundedYear, memberCount, description)
  }

  console.log('Seeded demo clubs.')
}

// Runs independently, same reasoning as seedClubsIfEmpty — a database that
// predates template packs should still get the one built-in pack. Generated
// from the existing boxingTemplate() rather than hand-duplicating weight
// labels, so this stays in sync with the manual /weight-classes/template
// endpoint's class list.
function seedTemplatePacksIfEmpty() {
  if (countTemplatePacks.get().n > 0) return

  const packId = insertTemplatePack.run(
    'boxing.amateur.elite.iba-2024',
    'Boxing',
    'elite',
    'IBA 2024 Elite'
  ).lastInsertRowid

  const classes = boxingTemplate({ ageGroup: 'adult', gender: 'mixed' })
  for (const c of classes) {
    insertTemplatePackClass.run(packId, c.name, c.gender, c.roundsCount, c.roundMinutes, c.restMinutes, c.sortOrder)
  }

  console.log('Seeded boxing.amateur.elite.iba-2024 template pack.')
}
