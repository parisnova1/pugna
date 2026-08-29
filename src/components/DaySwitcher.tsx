const RED = '#0070f3'
const BORDER = '#333333'
const MUTED = '#888888'
const DISPLAY = "'Geist Sans', sans-serif"

export type EventDay = { id: number; day_index: number; date: string; label: string; status: 'scheduled' | 'live' | 'completed' }

export default function DaySwitcher({ days, selectedId, onSelect }: { days: EventDay[]; selectedId: number | null; onSelect: (id: number) => void }) {
  if (days.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {days.map(day => {
        const active = day.id === selectedId
        return (
          <button
            key={day.id}
            onClick={() => onSelect(day.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              border: `1px solid ${active ? RED : BORDER}`, backgroundColor: active ? '#071a30' : 'transparent', color: active ? '#fff' : MUTED,
            }}
          >
            {day.status === 'live' && <span style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: '#ff453a' }} />}
            {day.label}
          </button>
        )
      })}
    </div>
  )
}
