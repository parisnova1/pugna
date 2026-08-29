const RED = '#0070f3'
const CARD = '#0f0f0f'
const BORDER = '#333333'
const BORDER2 = '#2a2a2a'
const MUTED = '#888888'
const DISPLAY = "'Geist Sans', sans-serif"

export type Bout = {
  id: number
  round: number
  slot: number
  fighter_red_id: number | null
  fighter_blue_id: number | null
  status: string
  winner_id: number | null
  method: string | null
  event_day_id?: number | null
}

type FighterLookup = Record<number, { name: string; club: string }>

const COLUMN_W = 240
const COLUMN_GAP = 56
const MATCH_H = 68
const ROW = 96

function fighterLabel(id: number | null, lookup: FighterLookup, isFirstRound: boolean): string {
  if (id === null) return isFirstRound ? 'BYE' : 'TBD'
  return lookup[id]?.name ?? `Fighter #${id}`
}

export default function Bracket({ bouts, fighters, onBoutClick }: { bouts: Bout[]; fighters: FighterLookup; onBoutClick?: (bout: Bout) => void }) {
  if (bouts.length === 0) {
    return (
      <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', padding: '32px 0' }}>
        No bracket generated yet.
      </div>
    )
  }

  const totalRounds = Math.max(...bouts.map(b => b.round))
  const rounds: Bout[][] = Array.from({ length: totalRounds }, (_, r) =>
    bouts.filter(b => b.round === r + 1).sort((a, b) => a.slot - b.slot),
  )
  const round0Count = rounds[0].length
  const totalHeight = round0Count * ROW
  const totalWidth = totalRounds * COLUMN_W + (totalRounds - 1) * COLUMN_GAP

  const centerY = (r: number, slot: number) => (slot + 0.5) * ROW * 2 ** r
  const colX = (r: number) => r * (COLUMN_W + COLUMN_GAP)

  // Connector paths between round r and round r+1
  const connectors: string[] = []
  for (let r = 0; r < totalRounds - 1; r++) {
    const rightEdge = colX(r) + COLUMN_W
    const leftEdge = colX(r + 1)
    const midX = rightEdge + COLUMN_GAP / 2
    for (const match of rounds[r + 1]) {
      const j = match.slot
      const yTop = centerY(r, 2 * j)
      const yBottom = centerY(r, 2 * j + 1)
      const yNext = centerY(r + 1, j)
      connectors.push(`M ${rightEdge} ${yTop} H ${midX} V ${yBottom} H ${rightEdge}`)
      connectors.push(`M ${midX} ${yNext} H ${leftEdge}`)
    }
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
      <div style={{ position: 'relative', width: totalWidth, height: totalHeight, minHeight: totalHeight }}>
        <svg width={totalWidth} height={totalHeight} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          {connectors.map((d, i) => (
            <path key={i} d={d} stroke={BORDER2} strokeWidth={2} fill="none" />
          ))}
        </svg>

        {rounds.map((matches, r) => (
          <div key={r}>
            {r === 0 && (
              <div style={{ position: 'absolute', top: -28, left: colX(r), width: COLUMN_W, fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.15em', color: RED, textTransform: 'uppercase' }}>
                Round 1
              </div>
            )}
            {r > 0 && (
              <div style={{ position: 'absolute', top: -28, left: colX(r), width: COLUMN_W, fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.15em', color: RED, textTransform: 'uppercase' }}>
                {r === totalRounds - 1 ? 'Final' : r === totalRounds - 2 ? 'Semifinal' : `Round ${r + 1}`}
              </div>
            )}
            {matches.map(m => {
              const y = centerY(r, m.slot) - MATCH_H / 2
              const isBye = m.fighter_red_id === null || m.fighter_blue_id === null
              const isClickable = Boolean(onBoutClick) && m.status === 'scheduled' && !isBye
              return (
                <div
                  key={m.id}
                  onClick={isClickable ? () => onBoutClick!(m) : undefined}
                  onMouseEnter={isClickable ? e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.backgroundColor = '#071a30' } : undefined}
                  onMouseLeave={isClickable ? e => { e.currentTarget.style.borderColor = BORDER2; e.currentTarget.style.backgroundColor = CARD } : undefined}
                  title={isClickable ? 'Click to record a result' : undefined}
                  style={{
                    position: 'absolute', top: y, left: colX(r), width: COLUMN_W, height: MATCH_H,
                    backgroundColor: CARD, border: `1px solid ${isClickable ? BORDER2 : BORDER}`, display: 'flex', flexDirection: 'column',
                    cursor: isClickable ? 'pointer' : 'default', transition: 'background-color 0.15s, border-color 0.15s',
                  }}
                >
                  {([['red', m.fighter_red_id], ['blue', m.fighter_blue_id]] as const).map(([side, fid]) => {
                    const isWinner = m.winner_id !== null && m.winner_id === fid
                    return (
                      <div
                        key={side}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', padding: '0 10px',
                          borderBottom: side === 'red' ? `1px solid ${BORDER}` : 'none',
                          backgroundColor: isWinner ? 'rgba(76,175,80,0.08)' : 'transparent',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: DISPLAY, fontSize: '13px', fontWeight: isWinner ? 800 : 500,
                            color: fid === null ? MUTED : isWinner ? '#4caf50' : '#eee',
                            textTransform: fid === null ? 'uppercase' : 'none',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {fighterLabel(fid, fighters, r === 0)}
                        </span>
                      </div>
                    )
                  })}
                  {!isBye && m.status === 'completed' && m.method && (
                    <div style={{ position: 'absolute', right: -4, top: -10, backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, padding: '1px 6px', fontFamily: DISPLAY, fontSize: '10px', color: MUTED, textTransform: 'uppercase' }}>
                      {m.method}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
