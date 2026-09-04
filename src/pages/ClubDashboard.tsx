import { useEffect, useState } from 'react'
import type { NavFn } from '../App'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../lib/api'
import { formatDisplayDate } from '../lib/date'
import LocationInput from '../components/LocationInput'
import { FighterDiscovery } from './Home'

import { ACCENT as RED, CARD, LINE as BORDER, MUTED, TEXT, BG, ACCENT_SOFT, POSITIVE_GREEN, FONT_BODY as DISPLAY } from '../theme'

const DISCIPLINES = ['Boxing', 'Kickboxing', 'Muay Thai', 'MMA', 'BJJ', 'Wrestling']
const LEVELS = ['Amateur', 'Intermediate', 'Advanced', 'All Levels'] as const

const inputStyle: React.CSSProperties = {
  width: '100%', backgroundColor: '#F7F5F0', border: `1px solid ${BORDER}`, color: TEXT,
  padding: '11px 14px', fontFamily: DISPLAY, fontSize: '14px', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '6px',
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, width: '100%', maxWidth: '480px', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
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
    <button type="submit" disabled={disabled}
      style={{ marginTop: '8px', width: '100%', backgroundColor: RED, color: TEXT, fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px', opacity: disabled ? 0.6 : 1 }}
    >
      {children}
    </button>
  )
}

type Club = {
  id: number
  name: string
  location: string
  disciplines: string[]
  founded_year: number | null
  member_count: number
  description: string
  logo_url: string
  cover_url: string
  lat: number | null
  lng: number | null
}

type SparringSessionRow = {
  id: number
  discipline: string
  location: string
  date: string
  time: string
  weight_range: string
  level: string
  spots: number
  registered_fighters: number
}

type Participant = { id: number; club_id: number; club_name: string; fighter_count: number; weight_category: string }

type Tab = 'details' | 'sparring' | 'myFighters' | 'fighters'

const CLUB_NAV_ITEMS: Array<[Tab, string, string]> = [
  ['details', 'Club Details', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a8 8 0 0 1 16 0v1'],
  ['sparring', 'Sparring', 'M3 5h18M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5M8 3v4M16 3v4M8 13h8M8 17h5'],
  ['myFighters', 'My Fighters', 'M12 4l2.5 5 5.5.8-4 4 1 5.5-5-2.6-5 2.6 1-5.5-4-4 5.5-.8z'],
  ['fighters', 'Find Fighters', 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
]

export default function ClubDashboard({ nav }: { nav: NavFn }) {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('details')
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
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
            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', marginBottom: '4px' }}>Club Dashboard</div>
            <div style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase' }}>{user?.name || 'Club'}</div>
            {user?.email && <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, letterSpacing: '0.04em', marginTop: '2px' }}>{user.email}</div>}
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {CLUB_NAV_ITEMS.map(([v, label, icon]) => (
            <button key={v} onClick={() => setTab(v)}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
                padding: collapsed ? '12px' : '12px 24px', justifyContent: collapsed ? 'center' : 'flex-start',
                fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: tab === v ? TEXT : MUTED,
                borderLeft: collapsed ? '2px solid transparent' : (tab === v ? `2px solid ${RED}` : '2px solid transparent'),
                backgroundColor: tab === v ? CARD : 'transparent',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d={icon} /></svg>
              {!collapsed && label}
            </button>
          ))}
        </nav>

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

      <main style={{ flex: 1, minWidth: 0, backgroundColor: BG, ...(tab === 'fighters' ? {} : { padding: '40px 48px' }) }}>
        {tab === 'details' && <DetailsTab />}
        {tab === 'sparring' && <SparringTab />}
        {tab === 'myFighters' && <MyFightersTab />}
        {tab === 'fighters' && <FighterDiscovery nav={nav} standalone />}
      </main>
    </div>
  )
}

// ── Club Details ────────────────────────────────────────────────────────

function DetailsTab() {
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [foundedYear, setFoundedYear] = useState('')
  const [memberCount, setMemberCount] = useState(0)
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ club: Club }>('/api/clubs/me')
      .then(r => {
        setClub(r.club)
        setName(r.club.name)
        setLocation(r.club.location)
        setDisciplines(r.club.disciplines)
        setFoundedYear(r.club.founded_year ? String(r.club.founded_year) : '')
        setMemberCount(r.club.member_count)
        setDescription(r.club.description)
        setLogoUrl(r.club.logo_url)
        setCoverUrl(r.club.cover_url)
        if (r.club.lat != null && r.club.lng != null) setCoords({ lat: r.club.lat, lng: r.club.lng })
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load club profile.'))
      .finally(() => setLoading(false))
  }, [])

  const toggleDiscipline = (d: string) => {
    setDisciplines(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]))
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Club name is required.'); return }
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      const { club: updated } = await apiFetch<{ club: Club }>('/api/clubs/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
          disciplines,
          foundedYear: foundedYear ? Number(foundedYear) : '',
          memberCount,
          description: description.trim(),
          logoUrl: logoUrl.trim(),
          coverUrl: coverUrl.trim(),
          ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
        }),
      })
      setClub(updated)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>Club Details</h1>
      <p style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, marginBottom: '32px' }}>
        Fill in your club’s profile — this is what appears on your public PUGNA club page.
      </p>

      {loading ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>Loading…</div>
      ) : loadError || !club ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: RED }}>{loadError || 'Club profile not found.'}</div>
      ) : (
        <form onSubmit={save} style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Club Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Boxclub Nürnberg" />
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <LocationInput
              inputStyle={inputStyle}
              value={location}
              onChange={v => { setLocation(v); setCoords(null) }}
              onSelect={r => setCoords({ lat: r.lat, lng: r.lon })}
              placeholder="Nürnberg, Bayern"
            />
            <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: coords ? POSITIVE_GREEN : MUTED, marginTop: '6px' }}>
              {coords ? 'Location pinned — clubs can find you in radius search.' : 'Pick a suggestion from the list so clubs can find you in radius search.'}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Disciplines</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DISCIPLINES.map(d => (
                <button key={d} type="button" onClick={() => toggleDiscipline(d)}
                  style={{ padding: '9px 16px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: `1px solid ${disciplines.includes(d) ? RED : BORDER}`, backgroundColor: disciplines.includes(d) ? ACCENT_SOFT : 'transparent', color: disciplines.includes(d) ? TEXT : MUTED }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Founded Year</label>
              <input type="number" style={inputStyle} value={foundedYear} onChange={e => setFoundedYear(e.target.value)} placeholder="1982" />
            </div>
            <div>
              <label style={labelStyle}>Member Count</label>
              <input type="number" min={0} style={inputStyle} value={memberCount} onChange={e => setMemberCount(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>About</label>
            <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell fighters and organizers about your club…" />
          </div>

          <div>
            <label style={labelStyle}>Logo URL</label>
            <input type="url" style={inputStyle} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://…" />
            <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, marginTop: '6px' }}>Shown as the small square badge on your club page. Leave blank to use your initials.</div>
          </div>

          <div>
            <label style={labelStyle}>Cover Photo URL</label>
            <input type="url" style={inputStyle} value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://…" />
            <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, marginTop: '6px' }}>Wide banner image at the top of your club page. Leave blank to use the default.</div>
          </div>

          {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED }}>{error}</div>}
          <button type="submit" disabled={saving}
            style={{ backgroundColor: RED, color: TEXT, fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px', opacity: saving ? 0.6 : 1, alignSelf: 'flex-start', minWidth: '200px' }}
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Club Details'}
          </button>
        </form>
      )}
    </div>
  )
}

// ── Sparring ─────────────────────────────────────────────────────────────

function SparringTab() {
  const [sessions, setSessions] = useState<SparringSessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [participantsFor, setParticipantsFor] = useState<SparringSessionRow | null>(null)

  const load = () =>
    apiFetch<{ sessions: SparringSessionRow[] }>('/api/sparring/me')
      .then(r => setSessions(r.sessions))
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load sparring sessions.'))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const remove = async (id: number) => {
    setBusyId(id)
    try {
      await apiFetch(`/api/sparring/${id}`, { method: 'DELETE' })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 900, textTransform: 'uppercase' }}>Sparring</h1>
        <button onClick={() => setAddOpen(true)} style={{ backgroundColor: RED, color: TEXT, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 24px' }}>
          + Add Sparring Session
        </button>
      </div>
      <p style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, marginBottom: '32px' }}>
        Sessions you host here appear publicly under Sparring for fighters and other clubs to find.
      </p>

      {loading ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>Loading…</div>
      ) : loadError ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: RED }}>{loadError}</div>
      ) : sessions.length === 0 ? (
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center', maxWidth: '640px' }}>
          No sparring sessions yet — add one to invite fighters and other clubs.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER, maxWidth: '980px' }}>
          <div style={{ backgroundColor: BG, padding: '10px 16px', display: 'grid', gridTemplateColumns: '100px 1fr 100px 70px 90px 90px 80px 170px', gap: '12px' }}>
            {['Discipline', 'Location', 'Date', 'Time', 'Weight', 'Level', 'Joined', ''].map(h => (
              <div key={h} style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>
          {sessions.map(s => (
            <div key={s.id} style={{ backgroundColor: CARD, padding: '12px 16px', display: 'grid', gridTemplateColumns: '100px 1fr 100px 70px 90px 90px 80px 170px', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: TEXT }}>{s.discipline}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: TEXT }}>{s.location}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{formatDisplayDate(s.date)}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{s.time}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{s.weight_range || '—'}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{s.level}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: s.registered_fighters > 0 ? POSITIVE_GREEN : MUTED }}>{s.registered_fighters}/{s.spots}</div>
              <div style={{ display: 'flex', gap: '14px', justifySelf: 'end' }}>
                <button onClick={() => setParticipantsFor(s)} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: MUTED, textTransform: 'uppercase' }}>
                  Participants
                </button>
                <button onClick={() => remove(s.id)} disabled={busyId === s.id} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: RED, textTransform: 'uppercase', opacity: busyId === s.id ? 0.5 : 1 }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <AddSparringModal
          onCancel={() => setAddOpen(false)}
          onSave={async fields => {
            await apiFetch('/api/sparring', { method: 'POST', body: JSON.stringify(fields) })
            await load()
            setAddOpen(false)
          }}
        />
      )}

      {participantsFor && (
        <ParticipantsModal session={participantsFor} onClose={() => setParticipantsFor(null)} />
      )}
    </div>
  )
}

function ParticipantsModal({ session, onClose }: { session: SparringSessionRow; onClose: () => void }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<{ participants: Participant[] }>(`/api/sparring/${session.id}/participants`)
      .then(r => setParticipants(r.participants))
      .finally(() => setLoading(false))
  }, [session.id])

  return (
    <Modal title="Participants" onClose={onClose}>
      <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>
        {session.discipline} · {session.location} · {formatDisplayDate(session.date)} · {session.time}
      </div>
      {loading ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>Loading…</div>
      ) : participants.length === 0 ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>No clubs have joined yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {participants.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', border: `1px solid ${BORDER}` }}>
              <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, color: TEXT, textTransform: 'uppercase' }}>{p.club_name}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase' }}>{p.fighter_count} fighter{p.fighter_count === 1 ? '' : 's'} · {p.weight_category}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function AddSparringModal({ onCancel, onSave }: {
  onCancel: () => void
  onSave: (fields: { discipline: string; location: string; date: string; time: string; weightRange: string; level: string; spots: number }) => Promise<void>
}) {
  const [discipline, setDiscipline] = useState(DISCIPLINES[0])
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [weightRange, setWeightRange] = useState('')
  const [level, setLevel] = useState<typeof LEVELS[number]>('All Levels')
  const [spots, setSpots] = useState(8)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!location.trim() || !date || !time) { setError('Fill in location, date and time.'); return }
    setError(null)
    setSaving(true)
    try {
      await onSave({ discipline, location: location.trim(), date, time, weightRange: weightRange.trim(), level, spots })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Add Sparring Session" onClose={onCancel}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Discipline</label>
            <select style={inputStyle} value={discipline} onChange={e => setDiscipline(e.target.value)}>
              {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Level</label>
            <select style={inputStyle} value={level} onChange={e => setLevel(e.target.value as typeof LEVELS[number])}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Location</label>
          <LocationInput inputStyle={inputStyle} value={location} onChange={setLocation} placeholder="Nürnberg" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Time</label>
            <input type="time" style={inputStyle} value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Weight Range (optional)</label>
            <input style={inputStyle} value={weightRange} onChange={e => setWeightRange(e.target.value)} placeholder="70–80 KG" />
          </div>
          <div>
            <label style={labelStyle}>Spots</label>
            <input type="number" min={1} style={inputStyle} value={spots} onChange={e => setSpots(Number(e.target.value))} />
          </div>
        </div>
        {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED }}>{error}</div>}
        <SubmitButton disabled={saving}>{saving ? 'Saving…' : 'Add Sparring Session'}</SubmitButton>
      </form>
    </Modal>
  )
}

// ── My Fighters (roster + nominations) ──────────────────────────────────

type RosterFighter = { id: number; name: string; weight: string; record: string }
type NominationRow = { id: number; status: 'pending' | 'accepted' | 'rejected'; event_name: string; weight_class_name: string; fighter_name: string }

function MyFightersTab() {
  const [fighters, setFighters] = useState<RosterFighter[]>([])
  const [nominations, setNominations] = useState<NominationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [formTarget, setFormTarget] = useState<RosterFighter | 'new' | null>(null)

  const load = () =>
    Promise.all([
      apiFetch<{ fighters: RosterFighter[] }>('/api/fighters'),
      apiFetch<{ nominations: NominationRow[] }>('/api/clubs/me/nominations'),
    ]).then(([f, n]) => { setFighters(f.fighters); setNominations(n.nominations) })

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const withdraw = async (id: number) => {
    await apiFetch(`/api/nominations/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 900, textTransform: 'uppercase' }}>My Fighters</h1>
        <button onClick={() => setFormTarget('new')} style={{ backgroundColor: RED, color: TEXT, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 24px' }}>
          + Add Fighter
        </button>
      </div>
      <p style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, marginBottom: '32px' }}>
        Your roster — nominate these fighters into any event that's open for nominations.
      </p>

      {loading ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>Loading…</div>
      ) : fighters.length === 0 ? (
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center', maxWidth: '640px' }}>
          No fighters on your roster yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER, maxWidth: '760px' }}>
          <div style={{ backgroundColor: BG, padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 120px 120px 80px', gap: '12px' }}>
            {['Name', 'Weight', 'Record', ''].map(h => (
              <div key={h} style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>
          {fighters.map(f => (
            <div key={f.id} style={{ backgroundColor: CARD, padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 120px 120px 80px', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700, textTransform: 'uppercase' }}>{f.name}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{f.weight}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{f.record}</div>
              <button onClick={() => setFormTarget(f)} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', justifySelf: 'end' }}>Edit</button>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontFamily: DISPLAY, fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', marginTop: '40px', marginBottom: '16px' }}>Your Nominations</h2>
      {nominations.length === 0 ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase' }}>No nominations sent yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '760px' }}>
          {nominations.map(n => (
            <div key={n.id} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>{n.fighter_name} · {n.weight_class_name}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase' }}>{n.event_name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: MUTED, textTransform: 'uppercase' }}>{n.status}</span>
                {n.status === 'pending' && (
                  <button onClick={() => withdraw(n.id)} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: RED, textTransform: 'uppercase' }}>Withdraw</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {formTarget && (
        <FighterFormModal
          initial={formTarget === 'new' ? null : formTarget}
          onCancel={() => setFormTarget(null)}
          onSave={async fields => {
            if (formTarget !== 'new') {
              await apiFetch(`/api/fighters/${formTarget.id}`, { method: 'PATCH', body: JSON.stringify(fields) })
            } else {
              await apiFetch('/api/fighters', { method: 'POST', body: JSON.stringify({ ...fields, club: '', discipline: 'Boxing' }) })
            }
            await load()
            setFormTarget(null)
          }}
        />
      )}
    </div>
  )
}

function FighterFormModal({ initial, onCancel, onSave }: {
  initial: RosterFighter | null
  onCancel: () => void
  onSave: (fields: { name: string; weight: string; record: string }) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [weight, setWeight] = useState(initial?.weight ?? '')
  const [record, setRecord] = useState(initial?.record ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !weight.trim()) { setError('Name and weight are required.'); return }
    setError(null)
    setSaving(true)
    try {
      await onSave({ name: name.trim(), weight: weight.trim(), record: record.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={initial ? 'Edit Fighter' : 'Add Fighter'} onClose={onCancel}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Weight</label>
            <input style={inputStyle} value={weight} onChange={e => setWeight(e.target.value)} placeholder="75 KG" />
          </div>
          <div>
            <label style={labelStyle}>Record</label>
            <input style={inputStyle} value={record} onChange={e => setRecord(e.target.value)} placeholder="0–0" />
          </div>
        </div>
        {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED }}>{error}</div>}
        <SubmitButton disabled={saving}>{saving ? 'Saving…' : 'Save Fighter'}</SubmitButton>
      </form>
    </Modal>
  )
}
