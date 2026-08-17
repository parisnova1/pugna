import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { NavFn } from '../App'
import { apiFetch } from '../lib/api'
import { formatDisplayDate } from '../lib/date'
import BackButton from '../components/BackButton'

const RED = '#0070f3'
const CARD = '#0f0f0f'
const BORDER = '#333333'
const MUTED = '#888888'
const DISPLAY = "'Geist Sans', sans-serif"

type EventResult = { id: number; name: string; date: string; location: string; discipline: string; organizer_name: string }
type FighterResult = { id: number; name: string; club: string; weight: string; record: string; discipline: string; location: string }
type ClubResult = { id: number; name: string; location: string; disciplines: string[]; member_count: number }

function matches(query: string, ...fields: Array<string | undefined | null>) {
  const q = query.toLowerCase()
  return fields.some(f => f?.toLowerCase().includes(q))
}

export default function SearchResults({ nav }: { nav: NavFn }) {
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''

  const [events, setEvents] = useState<EventResult[]>([])
  const [fighters, setFighters] = useState<FighterResult[]>([])
  const [clubs, setClubs] = useState<ClubResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query) { setLoading(false); return }
    setLoading(true)
    setError(null)
    Promise.all([
      apiFetch<{ events: EventResult[] }>('/api/public/events'),
      apiFetch<{ fighters: FighterResult[] }>('/api/public/fighters'),
      apiFetch<{ clubs: ClubResult[] }>('/api/clubs'),
    ])
      .then(([e, f, c]) => {
        setEvents(e.events.filter(x => matches(query, x.name, x.location, x.discipline, x.organizer_name)))
        setFighters(f.fighters.filter(x => matches(query, x.name, x.club, x.location, x.discipline)))
        setClubs(c.clubs.filter(x => matches(query, x.name, x.location, ...x.disciplines)))
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Search failed.'))
      .finally(() => setLoading(false))
  }, [query])

  const totalResults = events.length + fighters.length + clubs.length

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '48px 32px 80px' }}>
      <div style={{ marginBottom: '20px' }}>
        <BackButton />
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '8px' }}>Search</div>
      <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '32px' }}>
        {query ? `Results for "${query}"` : 'Search Pugna'}
      </h1>

      {!query ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>
          Type something in the search box above to look across events, fighters and clubs.
        </div>
      ) : loading ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>Searching…</div>
      ) : error ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: RED }}>{error}</div>
      ) : totalResults === 0 ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>
          No events, fighters or clubs match "{query}".
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {events.length > 0 && (
            <ResultSection title={`Events (${events.length})`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1px', backgroundColor: BORDER }}>
                {events.map(e => (
                  <ResultCard key={e.id} onClick={() => nav(`/events/${e.id}`)}
                    eyebrow={e.discipline} title={e.name} sub={`${formatDisplayDate(e.date)} · ${e.location}`} tag={e.organizer_name}
                  />
                ))}
              </div>
            </ResultSection>
          )}
          {fighters.length > 0 && (
            <ResultSection title={`Fighters (${fighters.length})`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1px', backgroundColor: BORDER }}>
                {fighters.map(f => (
                  <ResultCard key={f.id} onClick={() => nav(`/fighters/${f.id}`)}
                    eyebrow={f.discipline} title={f.name} sub={`${f.club} · ${f.weight}`} tag={f.record}
                  />
                ))}
              </div>
            </ResultSection>
          )}
          {clubs.length > 0 && (
            <ResultSection title={`Clubs (${clubs.length})`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1px', backgroundColor: BORDER }}>
                {clubs.map(c => (
                  <ResultCard key={c.id} onClick={() => nav(`/clubs/${c.id}`)}
                    eyebrow={c.disciplines[0] ?? ''} title={c.name} sub={c.location} tag={`${c.member_count} members`}
                  />
                ))}
              </div>
            </ResultSection>
          )}
        </div>
      )}
    </div>
  )
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '16px' }}>{title}</div>
      {children}
    </div>
  )
}

function ResultCard({ eyebrow, title, sub, tag, onClick }: { eyebrow: string; title: string; sub: string; tag: string; onClick: () => void }) {
  return (
    <div style={{ backgroundColor: CARD, padding: '20px', cursor: 'pointer' }}
      onClick={onClick}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#141414')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
    >
      {eyebrow && <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.15em', color: RED, textTransform: 'uppercase', marginBottom: '8px' }}>{eyebrow}</div>}
      <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '6px' }}>{title}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{sub}</div>
      {tag && <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: '#ccc', marginTop: '8px' }}>{tag}</div>}
    </div>
  )
}
