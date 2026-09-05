import { useEffect, useState } from 'react'
import type { NavFn } from '../App'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../lib/api'
import { formatDisplayDate } from '../lib/date'
import LocationInput from '../components/LocationInput'

import { ACCENT as RED, CARD, LINE as BORDER, MUTED, TEXT, BG, ACCENT_SOFT, POSITIVE_GREEN, FONT_BODY as DISPLAY } from '../theme'

const DISCIPLINES = ['Boxing', 'Kickboxing', 'Muay Thai', 'MMA', 'BJJ', 'Wrestling']

type DashView = 'overview' | 'events' | 'fighters' | 'matchmaking' | 'results' | 'analytics'

type EventRow = { id: number; name: string; date: string; location: string; venue: string; discipline: string; format: 'bracket' | 'card'; livestream_url: string; fights: number; fighters: number; status: 'Active' | 'Draft' | 'Open'; views: number }
type FighterRow = { id: number; name: string; club: string; weight: string; record: string; status: 'Matched' | 'Unmatched'; discipline: string; location: string }
type EventFields = { name: string; date: string; location: string; venue: string; discipline: string; format?: EventRow['format']; livestreamUrl: string; status: EventRow['status'] }
type FighterFields = { name: string; club: string; weight: string; record: string; status: FighterRow['status']; discipline: string; location: string }

const inputStyle: React.CSSProperties = {
  width: '100%', backgroundColor: '#F7F5F0', border: `1px solid ${BORDER}`, color: TEXT,
  padding: '11px 14px', fontFamily: DISPLAY, fontSize: '14px', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '6px',
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, width: '100%', maxWidth: '440px', padding: '32px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: '24px', fontWeight: 900, textTransform: 'uppercase' }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" style={{ color: MUTED, padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function SubmitButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{ marginTop: '8px', width: '100%', backgroundColor: RED, color: TEXT, fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px', transition: 'background-color 0.15s', opacity: disabled ? 0.6 : 1 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1' }}
    >
      {children}
    </button>
  )
}

export default function OrganizerDashboard({ nav }: { nav: NavFn }) {
  const { user, logout } = useAuth()
  const [view, setView] = useState<DashView>('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [events, setEvents] = useState<EventRow[]>([])
  const [fighters, setFighters] = useState<FighterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [eventModal, setEventModal] = useState<{ id: number | null } | null>(null)
  const [fighterModalOpen, setFighterModalOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      apiFetch<{ events: EventRow[] }>('/api/events'),
      apiFetch<{ fighters: FighterRow[] }>('/api/fighters'),
    ])
      .then(([e, f]) => { setEvents(e.events); setFighters(f.fighters) })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  const createEvent = async (fields: EventFields) => {
    const { event } = await apiFetch<{ event: EventRow }>('/api/events', { method: 'POST', body: JSON.stringify(fields) })
    setEvents(prev => [event, ...prev])
    setEventModal(null)
    // Straight into the builder, same as Duplicate — the whole point of a
    // fast create is not making the organizer go find the row afterward.
    nav(`/organizer/events/${event.id}/manage`)
  }

  const updateEvent = async (id: number, fields: EventFields) => {
    const { event } = await apiFetch<{ event: EventRow }>(`/api/events/${id}`, { method: 'PATCH', body: JSON.stringify(fields) })
    setEvents(prev => prev.map(e => (e.id === id ? event : e)))
    setEventModal(null)
  }

  const duplicateEvent = async (id: number) => {
    const { event } = await apiFetch<{ event: EventRow }>(`/api/events/${id}/duplicate`, { method: 'POST' })
    setEvents(prev => [event, ...prev])
    nav(`/organizer/events/${event.id}/manage`)
  }

  const deleteEvent = async (id: number) => {
    const target = events.find(e => e.id === id)
    if (!window.confirm(`Delete "${target?.name ?? 'this event'}"? This permanently deletes the event, its weight classes, bouts, and nominations. This can't be undone.`)) return
    await apiFetch(`/api/events/${id}`, { method: 'DELETE' })
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const addFighter = async (fields: FighterFields) => {
    const { fighter } = await apiFetch<{ fighter: FighterRow }>('/api/fighters', { method: 'POST', body: JSON.stringify(fields) })
    setFighters(prev => [fighter, ...prev])
    setFighterModalOpen(false)
  }

  const navItems: Array<[DashView, string, string]> = [
    ['overview', 'Overview', 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    ['events', 'Events', 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z'],
    ['fighters', 'Fighters', 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
    ['matchmaking', 'Matchmaking', 'M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z'],
    ['results', 'Results', 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4'],
    ['analytics', 'Analytics', 'M18 20V10M12 20V4M6 20v-6'],
  ]

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '76px' : '240px', flexShrink: 0, backgroundColor: BG, borderRight: `1px solid ${BORDER}`,
        padding: '20px 0', position: 'sticky', top: '64px', height: 'calc(100vh - 64px)', overflowY: 'auto', overflowX: 'hidden',
        display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', padding: '0 12px', marginBottom: '12px' }}>
          <button
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ color: MUTED, padding: '8px', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
            onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {!collapsed && (
          <div style={{ padding: '0 24px', marginBottom: '32px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', marginBottom: '4px' }}>Organizer Dashboard</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase' }}>{user?.name || 'Organizer'}</div>
            {user?.email && <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, letterSpacing: '0.04em', marginTop: '2px' }}>{user.email}</div>}
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {navItems.map(([v, label, icon]) => (
            <button key={v} onClick={() => setView(v)}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: collapsed ? '12px' : '12px 24px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                backgroundColor: view === v ? CARD : 'transparent',
                borderLeft: collapsed ? '2px solid transparent' : (view === v ? `2px solid ${RED}` : '2px solid transparent'),
                color: view === v ? TEXT : MUTED, transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (view !== v) { e.currentTarget.style.color = TEXT; e.currentTarget.style.backgroundColor = CARD } }}
              onMouseLeave={e => { if (view !== v) { e.currentTarget.style.color = MUTED; e.currentTarget.style.backgroundColor = 'transparent' } }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d={icon} /></svg>
              {!collapsed && <span style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ margin: collapsed ? '20px 12px 0' : '32px 24px 0', borderTop: `1px solid ${BORDER}`, paddingTop: collapsed ? '12px' : '24px' }}>
          <button
            onClick={() => setEventModal({ id: null })}
            title={collapsed ? 'Create Event' : undefined}
            style={{ width: '100%', backgroundColor: RED, color: TEXT, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: collapsed ? '12px 0' : '12px', transition: 'background-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {collapsed ? '+' : '+ Create Event'}
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ margin: collapsed ? '20px 12px 0' : '24px 24px 0', borderTop: `1px solid ${BORDER}`, paddingTop: collapsed ? '12px' : '20px' }}>
          <button
            onClick={() => { logout(); nav('/') }}
            title={collapsed ? 'Log Out' : undefined}
            style={{ width: '100%', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, padding: collapsed ? '10px 0' : '10px', border: `1px solid ${BORDER}`, transition: 'color 0.15s, border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = TEXT; e.currentTarget.style.borderColor = TEXT }}
            onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER }}
          >
            {collapsed ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            ) : 'Log Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: '40px 48px', backgroundColor: BG }}>
        {loadError && (
          <div style={{ backgroundColor: ACCENT_SOFT, border: `1px solid ${RED}`, color: TEXT, fontFamily: DISPLAY, fontSize: '13px', letterSpacing: '0.04em', padding: '14px 18px', marginBottom: '24px' }}>
            {loadError} — is the API server running on port 4000?
          </div>
        )}
        {loading ? (
          <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>Loading…</div>
        ) : (
          <>
            {view === 'overview' && <OverviewView events={events} fighters={fighters} onEdit={id => setEventModal({ id })} />}
            {view === 'events' && <EventsView events={events} onCreate={() => setEventModal({ id: null })} onEdit={id => setEventModal({ id })} onManage={id => nav(`/organizer/events/${id}/manage`)} onDuplicate={duplicateEvent} onDelete={deleteEvent} />}
            {view === 'fighters' && <FightersView fighters={fighters} onAddFighter={() => setFighterModalOpen(true)} />}
            {view === 'matchmaking' && <MatchmakingView />}
            {view === 'results' && <ResultsView />}
            {view === 'analytics' && <AnalyticsView events={events} />}
          </>
        )}
      </main>

      {eventModal && (
        <EventModal
          initial={eventModal.id !== null ? events.find(e => e.id === eventModal.id) ?? null : null}
          onCancel={() => setEventModal(null)}
          onSave={fields => (eventModal.id !== null ? updateEvent(eventModal.id, fields) : createEvent(fields))}
        />
      )}
      {fighterModalOpen && (
        <FighterModal onCancel={() => setFighterModalOpen(false)} onSave={addFighter} />
      )}
    </div>
  )
}

function EventModal({ initial, onCancel, onSave }: { initial: EventRow | null; onCancel: () => void; onSave: (fields: EventFields) => Promise<void> }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [venue, setVenue] = useState(initial?.venue ?? '')
  const [discipline, setDiscipline] = useState(initial?.discipline ?? DISCIPLINES[0])
  const [format, setFormat] = useState<EventRow['format']>(initial?.format ?? 'card')
  const [livestreamUrl, setLivestreamUrl] = useState(initial?.livestream_url ?? '')
  const [status, setStatus] = useState<EventRow['status']>(initial?.status ?? 'Draft')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !date.trim() || !location.trim()) {
      setError('Fill in name, date and location.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSave({ name: name.trim(), date: date.trim(), location: location.trim(), venue: venue.trim(), discipline, format: initial ? undefined : format, livestreamUrl: livestreamUrl.trim(), status })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={initial ? 'Edit Event' : 'Create Event'} onClose={onCancel}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Event Name</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Fight Night Nürnberg" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Venue</label>
            <input style={inputStyle} value={venue} onChange={e => setVenue(e.target.value)} placeholder="Arena Nürnberger Versicherung" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Location (City / Region)</label>
          <LocationInput inputStyle={inputStyle} value={location} onChange={setLocation} placeholder="Nürnberg, Bayern" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Discipline</label>
            <select style={inputStyle} value={discipline} onChange={e => setDiscipline(e.target.value)}>
              {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as EventRow['status'])}>
              <option value="Draft">Draft</option>
              <option value="Open">Open for nominations</option>
              <option value="Active">Active</option>
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Format {initial && <span style={{ color: '#555' }}>(locked after creation)</span>}</label>
          {initial ? (
            <div style={{ ...inputStyle, color: MUTED, cursor: 'default' }}>
              {initial.format === 'card' ? 'Fight Card (ordered bout list)' : 'Tournament Bracket (weight classes)'}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '2px' }}>
              {([['card', 'Fight Card'], ['bracket', 'Tournament Bracket']] as const).map(([v, label]) => (
                <button key={v} type="button" onClick={() => setFormat(v)}
                  style={{ flex: 1, padding: '12px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: `1px solid ${format === v ? RED : BORDER}`, backgroundColor: format === v ? ACCENT_SOFT : 'transparent', color: format === v ? TEXT : MUTED }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>Livestream URL (optional)</label>
          <input style={inputStyle} value={livestreamUrl} onChange={e => setLivestreamUrl(e.target.value)} placeholder="https://youtube.com/…" />
        </div>
        {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED }}>{error}</div>}
        <SubmitButton disabled={saving}>{saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Event'}</SubmitButton>
      </form>
    </Modal>
  )
}

function FighterModal({ onCancel, onSave }: { onCancel: () => void; onSave: (fields: FighterFields) => Promise<void> }) {
  const [name, setName] = useState('')
  const [club, setClub] = useState('')
  const [weight, setWeight] = useState('')
  const [record, setRecord] = useState('')
  const [status, setStatus] = useState<FighterRow['status']>('Unmatched')
  const [discipline, setDiscipline] = useState(DISCIPLINES[0])
  const [location, setLocation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !club.trim() || !weight.trim()) {
      setError('Fill in name, club and weight.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSave({ name: name.trim(), club: club.trim(), weight: weight.trim(), record: record.trim() || '0–0', status, discipline, location: location.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Add Fighter" onClose={onCancel}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Fighter Name</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Marcus Müller" />
        </div>
        <div>
          <label style={labelStyle}>Club</label>
          <input style={inputStyle} value={club} onChange={e => setClub(e.target.value)} placeholder="Boxclub Nürnberg" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Weight</label>
            <input style={inputStyle} value={weight} onChange={e => setWeight(e.target.value)} placeholder="75 KG" />
          </div>
          <div>
            <label style={labelStyle}>Record</label>
            <input style={inputStyle} value={record} onChange={e => setRecord(e.target.value)} placeholder="8–2" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Discipline</label>
            <select style={inputStyle} value={discipline} onChange={e => setDiscipline(e.target.value)}>
              {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <LocationInput inputStyle={inputStyle} value={location} onChange={setLocation} placeholder="Nürnberg" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as FighterRow['status'])}>
            <option value="Unmatched">Unmatched</option>
            <option value="Matched">Matched</option>
          </select>
        </div>
        {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED }}>{error}</div>}
        <SubmitButton disabled={saving}>{saving ? 'Saving…' : 'Add Fighter'}</SubmitButton>
      </form>
    </Modal>
  )
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '24px', borderTop: accent ? `2px solid ${RED}` : `1px solid ${BORDER}` }}>
      <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.18em', color: MUTED, textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 900, lineHeight: 1, color: accent ? RED : TEXT }}>{value}</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

function OverviewView({ events, fighters, onEdit }: { events: EventRow[]; fighters: FighterRow[]; onEdit: (id: number) => void }) {
  const totalViews = events.reduce((sum, e) => sum + e.views, 0)
  const unmatched = fighters.filter(f => f.status === 'Unmatched').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '4px' }}>Dashboard</div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 900, textTransform: 'uppercase' }}>Overview</h1>
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          August 2026
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', marginBottom: '48px' }}>
        <StatCard label="Upcoming Events" value={String(events.length)} accent />
        <StatCard label="Registered Fighters" value={String(fighters.length)} sub="Across all events" />
        <StatCard label="Unmatched Fighters" value={String(unmatched)} sub="Need opponents" />
        <StatCard label="Total Event Views" value={totalViews.toLocaleString()} sub="Last 30 days" />
      </div>

      {/* Recent events */}
      <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '16px' }}>Upcoming Events</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER, marginBottom: '48px' }}>
        {events.length === 0 && (
          <div style={{ backgroundColor: CARD, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
            No events yet — create your first event.
          </div>
        )}
        {events.map(e => (
          <div key={e.id} style={{ backgroundColor: CARD, padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 80px', alignItems: 'center', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 800, textTransform: 'uppercase' }}>{e.name}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{formatDisplayDate(e.date)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 800 }}>{e.fights}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fights</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 800 }}>{e.fighters}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fighters</div>
            </div>
            <div>
              <span style={{ fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', border: `1px solid ${e.status === 'Active' ? POSITIVE_GREEN : BORDER}`, color: e.status === 'Active' ? POSITIVE_GREEN : MUTED }}>
                {e.status}
              </span>
            </div>
            <button onClick={() => onEdit(e.id)} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Edit →</button>
          </div>
        ))}
      </div>

      {/* Messages preview */}
      <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '16px' }}>Recent Activity</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER }}>
        {[
          { msg: 'Boxclub Nürnberg registered 4 fighters for Fight Night Nürnberg', time: '2h ago' },
          { msg: 'FC Ring Fürth requested fighter slot — David Okafor, 74 KG', time: '5h ago' },
          { msg: 'Fight card updated: Braun vs. Wisniewski confirmed as Main Event', time: '1d ago' },
          { msg: 'New ticket sale: 48 tickets sold this week', time: '2d ago' },
        ].map((a, i) => (
          <div key={i} style={{ backgroundColor: CARD, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 500, color: MUTED, letterSpacing: '0.02em' }}>{a.msg}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EventsView({ events, onCreate, onEdit, onManage, onDuplicate, onDelete }: { events: EventRow[]; onCreate: () => void; onEdit: (id: number) => void; onManage: (id: number) => void; onDuplicate: (id: number) => void; onDelete: (id: number) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 900, textTransform: 'uppercase' }}>My Events</h1>
        <button onClick={onCreate} style={{ backgroundColor: RED, color: TEXT, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 24px' }}>
          + Create Event
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {events.length === 0 && (
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
            No events yet — create your first event.
          </div>
        )}
        {events.map(e => (
          <div key={e.id} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '24px', cursor: 'pointer', transition: 'background-color 0.15s' }}
            onClick={() => onManage(e.id)}
            onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = '#141414')}
            onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = CARD)}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 100px) 210px', alignItems: 'center', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase' }}>{e.name}</div>
                  <span style={{ fontFamily: DISPLAY, fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${e.status === 'Active' ? POSITIVE_GREEN : e.status === 'Open' ? RED : BORDER}`, color: e.status === 'Active' ? POSITIVE_GREEN : e.status === 'Open' ? RED : MUTED }}>
                    {e.status}
                  </span>
                </div>
                <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{formatDisplayDate(e.date)} · {e.location} · {e.discipline}</div>
              </div>
              {([['Fights', e.fights], ['Fighters', e.fighters], ['Views', e.views]] as const).map(([l, v]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '24px', fontWeight: 900 }}>{v}</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button onClick={e2 => { e2.stopPropagation(); onEdit(e.id) }} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Edit</button>
                <button onClick={e2 => { e2.stopPropagation(); onDuplicate(e.id) }} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duplicate</button>
                <button onClick={e2 => { e2.stopPropagation(); onDelete(e.id) }} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: '#D92D20', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Delete</button>
                <button onClick={e2 => { e2.stopPropagation(); onManage(e.id) }} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Manage →</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FightersView({ fighters, onAddFighter }: { fighters: FighterRow[]; onAddFighter: () => void }) {
  const imgs = [
    'https://images.unsplash.com/photo-1607702713064-0143212236ae?w=80&h=80&fit=crop',
    'https://images.unsplash.com/photo-1602827113876-839bcf3ccb3a?w=80&h=80&fit=crop',
  ]
  const [filter, setFilter] = useState<'All' | 'Matched' | 'Unmatched'>('All')
  const filtered = filter === 'All' ? fighters : fighters.filter(f => f.status === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 900, textTransform: 'uppercase' }}>Registered Fighters</h1>
        <div style={{ display: 'flex', gap: '2px' }}>
          {(['All', 'Matched', 'Unmatched'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 16px', border: `1px solid ${filter === f ? RED : BORDER}`, color: filter === f ? TEXT : MUTED, backgroundColor: filter === f ? ACCENT_SOFT : 'transparent' }}
            >
              {f}
            </button>
          ))}
          <button onClick={onAddFighter} style={{ backgroundColor: RED, color: TEXT, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 20px', marginLeft: '10px' }}>
            Add Fighter
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER }}>
        <div style={{ backgroundColor: BG, padding: '10px 20px', display: 'grid', gridTemplateColumns: '1fr 160px 80px 100px 100px', gap: '16px', alignItems: 'center' }}>
          {['Fighter', 'Club', 'Weight', 'Record', 'Status'].map(h => (
            <div key={h} style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ backgroundColor: CARD, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
            No fighters match this filter.
          </div>
        ) : filtered.map((f, i) => (
          <div key={f.id} style={{ backgroundColor: CARD, padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 160px 80px 100px 100px', gap: '16px', alignItems: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F2F0EA')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = CARD)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#E5E2DA' }}>
                <img src={imgs[i % 2]} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', filter: 'grayscale(30%)' }} />
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: '17px', fontWeight: 800, textTransform: 'uppercase' }}>{f.name}</div>
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.club}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700 }}>{f.weight}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700 }}>{f.record}</div>
            <span style={{ fontFamily: DISPLAY, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px', border: `1px solid ${f.status === 'Matched' ? POSITIVE_GREEN : '#B8860B'}`, color: f.status === 'Matched' ? POSITIVE_GREEN : '#B8860B', display: 'inline-block' }}>
              {f.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchmakingView() {
  const [matched, setMatched] = useState<number | null>(null)

  return (
    <div>
      <h1 style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>Matchmaking</h1>
      <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, marginBottom: '40px' }}>
        Enter fighter requirements to find suitable opponents from across the PUGNA network.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Requirements */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>Requirements</div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {[['Sport', 'Boxing'], ['Weight', '75 KG'], ['Level', 'Amateur'], ['Fights', '5–10'], ['Distance', '≤ 150 km'], ['Availability', '23 Aug 2026']].map(([k, v]) => (
              <div key={k} style={{ backgroundColor: '#F7F5F0', border: `1px solid ${BORDER}`, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</span>
                <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <button style={{ width: '100%', backgroundColor: RED, color: TEXT, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px' }}>
              Find Matches
            </button>
          </div>
        </div>

        {/* Results */}
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '16px' }}>Top Matches</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER }}>
            {[
              { match: 92, name: 'Marcus Müller', club: 'Boxclub Nürnberg', weight: '75 KG', record: '8–2', location: 'Nürnberg', fights: 10, age: 26 },
              { match: 88, name: 'David Okafor', club: 'FC Ring Fürth', weight: '74 KG', record: '6–3', location: 'Fürth', fights: 9, age: 24 },
              { match: 81, name: 'Tobias Lang', club: 'Boxclub Nürnberg', weight: '76 KG', record: '7–1', location: 'Erlangen', fights: 8, age: 28 },
              { match: 76, name: 'Nico Schmidt', club: 'Fight Academy München', weight: '75 KG', record: '3–0', location: 'München', fights: 3, age: 22 },
            ].map((m, i) => (
              <div key={i} style={{ backgroundColor: CARD, padding: '20px', display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '20px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: '32px', fontWeight: 900, color: i === 0 ? RED : TEXT, lineHeight: 1 }}>{m.match}%</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Match</div>
                  {/* Bar */}
                  <div style={{ height: '3px', backgroundColor: '#E5E2DA', marginTop: '6px' }}>
                    <div style={{ height: '100%', width: `${m.match}%`, backgroundColor: i === 0 ? RED : MUTED }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>{m.name}</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                    {m.club} · {m.weight} · {m.record} · {m.location}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[`${m.fights} fights`, `Age ${m.age}`].map(t => (
                      <span key={t} style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED, padding: '2px 8px', border: `1px solid ${BORDER}`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => setMatched(i)}
                    style={{ backgroundColor: matched === i ? POSITIVE_GREEN : RED, color: TEXT, fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 20px', transition: 'background-color 0.15s', whiteSpace: 'nowrap' }}
                  >
                    {matched === i ? 'Selected ✓' : 'Select Fighter'}
                  </button>
                  <button style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase' }}>View Profile</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultsView() {
  return (
    <div>
      <h1 style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '32px' }}>Results</h1>
      <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>No past events. Results will appear here after events conclude.</div>
    </div>
  )
}

function AnalyticsView({ events }: { events: EventRow[] }) {
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
  const views = [320, 580, 440, 820, 1100, events.reduce((s, e) => s + e.views, 0)]
  const maxViews = Math.max(...views)

  return (
    <div>
      <h1 style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '32px' }}>Analytics</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', marginBottom: '48px' }}>
        {[
          { label: 'Total Event Views', value: views[5].toLocaleString(), change: '+18%' },
          { label: 'Fighter Profile Views', value: '1,204', change: '+32%' },
          { label: 'Tickets Sold', value: '186', change: '+11%' },
        ].map((s, i) => (
          <div key={i} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '24px', borderTop: i === 0 ? `2px solid ${RED}` : `1px solid ${BORDER}` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 900, lineHeight: 1, color: i === 0 ? RED : TEXT }}>{s.value}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: POSITIVE_GREEN, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{s.change} vs last period</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '24px' }}>
        <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '24px' }}>Event Views — Last 6 Months</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px' }}>
          {months.map((m, i) => (
            <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED }}>{views[i]}</div>
              <div style={{ width: '100%', backgroundColor: i === 5 ? RED : BORDER, height: `${(views[i] / maxViews) * 120}px`, transition: 'height 0.3s' }}
                onMouseEnter={e => { if (i !== 5) (e.currentTarget.style.backgroundColor = '#D8D4CA') }}
                onMouseLeave={e => { if (i !== 5) (e.currentTarget.style.backgroundColor = BORDER) }}
              />
              <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase' }}>{m}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
