// Single-elimination bracket generation with byes, using the standard
// tournament seeding order (1v16, 8v9, 5v12, 4v13, ... for a 16-bracket) so
// top seeds are spread out and can only meet in later rounds.

function nextPowerOfTwo(n) {
  let p = 2
  while (p < n) p *= 2
  return p
}

function seedOrder(n) {
  if (n === 1) return [1]
  const prev = seedOrder(n / 2)
  const result = []
  for (const s of prev) {
    result.push(s, n + 1 - s)
  }
  return result
}

/** Pure bracket math: fighterIds ordered best-seed-first. No DB access. */
export function computeBracket(fighterIds) {
  const n = fighterIds.length
  if (n < 2) throw new Error('Need at least 2 fighters to generate a bracket.')

  const bracketSize = nextPowerOfTwo(n)
  const order = seedOrder(bracketSize)
  const slotFighter = order.map(seed => fighterIds[seed - 1] ?? null)
  const totalRounds = Math.log2(bracketSize)

  const rounds = []
  const round1 = []
  for (let i = 0; i < slotFighter.length; i += 2) {
    round1.push({ slot: i / 2, fighterRed: slotFighter[i], fighterBlue: slotFighter[i + 1] })
  }
  rounds.push(round1)

  let prevCount = round1.length
  for (let r = 1; r < totalRounds; r++) {
    const count = prevCount / 2
    rounds.push(Array.from({ length: count }, (_, i) => ({ slot: i, fighterRed: null, fighterBlue: null })))
    prevCount = count
  }

  return { totalRounds, rounds }
}

/**
 * Marks a bout completed with the given winner, then propagates the winner
 * into whichever slot of `next_bout_id` this bout feeds (if any). Shared by
 * round-1 bye auto-resolution (persistBracket) and manual result entry
 * (PATCH /api/bouts/:id/result) — both are the same "advance winner"
 * operation, just triggered differently.
 */
export function advanceWinner(db, { boutId, winnerId, method = null, methodNote = null }) {
  const bout = db.prepare('SELECT * FROM bouts WHERE id = ?').get(boutId)
  db.prepare("UPDATE bouts SET status = 'completed', winner_id = ?, method = ?, method_note = ? WHERE id = ?").run(winnerId, method, methodNote, boutId)

  if (bout.next_bout_id) {
    const column = bout.next_bout_slot === 'red' ? 'fighter_red_id' : 'fighter_blue_id'
    db.prepare(`UPDATE bouts SET ${column} = COALESCE(${column}, ?) WHERE id = ?`).run(winnerId, bout.next_bout_id)
  }
}

/**
 * Persists a generated bracket: inserts `bouts` rows round by round, wires
 * next_bout_id/next_bout_slot for advancement, and auto-resolves round-1
 * byes (a single present fighter auto-advances without a recorded fight).
 */
export function persistBracket(db, { eventId, weightClassId, fighterIds }) {
  db.prepare('DELETE FROM bouts WHERE weight_class_id = ?').run(weightClassId)

  const { rounds } = computeBracket(fighterIds)

  const insertBout = db.prepare(`
    INSERT INTO bouts (event_id, weight_class_id, round, slot, fighter_red_id, fighter_blue_id, status)
    VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
  `)
  const setNextBout = db.prepare('UPDATE bouts SET next_bout_id = ?, next_bout_slot = ? WHERE id = ?')

  // roundIds[r] = array of inserted bout ids for round r, in slot order
  const roundIds = []

  for (let r = 0; r < rounds.length; r++) {
    const ids = []
    for (const m of rounds[r]) {
      const info = insertBout.run(eventId, weightClassId, r + 1, m.slot, m.fighterRed, m.fighterBlue)
      ids.push(Number(info.lastInsertRowid))
    }
    roundIds.push(ids)

    if (r > 0) {
      const prevIds = roundIds[r - 1]
      prevIds.forEach((prevBoutId, i) => {
        const nextBoutId = ids[Math.floor(i / 2)]
        const slot = i % 2 === 0 ? 'red' : 'blue'
        setNextBout.run(nextBoutId, slot, prevBoutId)
      })
    }
  }

  // Resolve round-1 byes and propagate the winner into round 2.
  const round1 = rounds[0]
  round1.forEach((m, i) => {
    const boutId = roundIds[0][i]
    const isBye = (m.fighterRed === null) !== (m.fighterBlue === null) // exactly one side present
    if (!isBye) return

    const winnerId = m.fighterRed ?? m.fighterBlue
    advanceWinner(db, { boutId, winnerId })
  })

  return { totalRounds: rounds.length, boutCount: roundIds.flat().length }
}
