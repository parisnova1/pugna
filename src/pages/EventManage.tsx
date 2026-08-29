import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { NavFn } from '../App'
import { apiFetch } from '../lib/api'
import { formatDisplayDate } from '../lib/date'
import ExcelImport, { type ImportedFighter } from '../components/ExcelImport'
import BracketView, { type Bout } from '../components/Bracket'
import CopyButton from '../components/CopyButton'

const RED = '#0070f3'
const CARD = '#0f0f0f'
const BORDER = '#333333'
const MUTED = '#888888'
const DISPLAY = "'Geist Sans', sans-serif"

type AgeGroup = 'adult' | 'youth' | 'children'

type EventDetail = {
  id: number
  name: string
  date: string
  location: string
  venue: string
  discipline: string
  status: string
  format: 'bracket' | 'card'
  livestream_url: string
  number_of_days: number
  ring_count: number
  qr_token: string
}

type WeightClass = {
  id: number
  event_id: number
  name: string
  age_group: AgeGroup
  gender: string
  rounds_count: number
  round_minutes: number
  rest_minutes: number
  sort_order: number
  fighterCount: number
}

type EventFighter = {
  id: number
  name: string
  club: string
  weight: string
  record: string
  status: string
  weight_class_id: number | null
}

const inputStyle: React.CSSProperties = {
  width: '100%', backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#fff',
  padding: '11px 14px', fontFamily: "'Geist Sans', sans-serif", fontSize: '14px', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: '6px',
}

function Modal({ title, onClose, children, maxWidth = '440px' }: { title: string; onClose: () => void; children: React.ReactNode; maxWidth?: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, width: '100%', maxWidth, padding: '32px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
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
      style={{ marginTop: '8px', width: '100%', backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px', opacity: disabled ? 0.6 : 1, transition: 'background-color 0.15s' }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#0058cc' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = RED }}
    >
      {children}
    </button>
  )
}

type Tab = 'setup' | 'weight-classes' | 'fighters' | 'bracket' | 'fightcard'

export default function EventManage({ nav: _nav }: { nav: NavFn }) {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const onBack = () => navigate('/organizer')
  const [tab, setTab] = useState<Tab>('setup')
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([])
  const [fighters, setFighters] = useState<EventFighter[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadDetail = () =>
    apiFetch<{ event: EventDetail; weightClasses: WeightClass[] }>(`/api/events/${eventId}/detail`)
      .then(r => { setEvent(r.event); setWeightClasses(r.weightClasses) })

  const loadFighters = () =>
    apiFetch<{ fighters: EventFighter[] }>(`/api/events/${eventId}/fighters`)
      .then(r => setFighters(r.fighters))

  useEffect(() => {
    setLoading(true)
    Promise.all([loadDetail(), loadFighters()])
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load event.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  useEffect(() => {
    if (event) setTab(event.format === 'card' ? 'fightcard' : 'weight-classes')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id])

  const refreshAll = () => Promise.all([loadDetail(), loadFighters()])

  if (!eventId) return null

  const tabs: Array<[Tab, string]> = event?.format === 'card'
    ? [['setup', 'Setup'], ['fightcard', 'Fight Card']]
    : [['setup', 'Setup'], ['weight-classes', 'Weight Classes'], ['fighters', 'Fighters'], ['bracket', 'Bracket']]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px 80px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
      >
        ← My Events
      </button>

      {loading ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>Loading…</div>
      ) : loadError || !event ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: RED }}>{loadError || 'Event not found.'}</div>
      ) : (
        <>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>{event.name}</h1>
          <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '28px' }}>
            {formatDisplayDate(event.date)} · {event.location} · {event.discipline}
          </div>

          <div style={{ display: 'flex', gap: '2px', borderBottom: `1px solid ${BORDER}`, marginBottom: '32px' }}>
            {tabs.map(([v, label]) => (
              <button key={v} onClick={() => setTab(v)}
                style={{ padding: '12px 20px', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tab === v ? '#fff' : MUTED, borderBottom: tab === v ? `2px solid ${RED}` : '2px solid transparent' }}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'setup' && <SetupTab event={event} onSaved={setEvent} />}
          {tab === 'weight-classes' && (
            <WeightClassesTab eventId={eventId} discipline={event.discipline} weightClasses={weightClasses} onChange={loadDetail} />
          )}
          {tab === 'fighters' && (
            <FightersTab eventId={eventId} fighters={fighters} weightClasses={weightClasses} onChange={refreshAll} />
          )}
          {tab === 'bracket' && <BracketTab weightClasses={weightClasses} fighters={fighters} />}
          {tab === 'fightcard' && <FightCardTab eventId={eventId} />}
        </>
      )}
    </div>
  )
}

// ── Setup ────────────────────────────────────────────────────────────────

function SetupTab({ event, onSaved }: { event: EventDetail; onSaved: (e: EventDetail) => void }) {
  const [tournamentType, setTournamentType] = useState<'day' | 'multi-day'>(event.number_of_days > 1 ? 'multi-day' : 'day')
  const [numberOfDays, setNumberOfDays] = useState(event.number_of_days)
  const [ringCount, setRingCount] = useState(event.ring_count)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  // Bracket events point at the live, real-time audience page (/e/:token);
  // card events have no bracket to update live, so their QR is just the
  // ordinary public event page — the same URL a fan would type or search for.
  const publicUrl = event.format === 'bracket'
    ? `${window.location.origin}/e/${event.qr_token}`
    : `${window.location.origin}/events/${event.id}`

  useEffect(() => {
    let cancelled = false
    import('qrcode').then(QRCode =>
      QRCode.toDataURL(publicUrl, { margin: 1, width: 180, color: { dark: '#000000', light: '#ffffff' } }),
    ).then(url => { if (!cancelled) setQrDataUrl(url) })
    return () => { cancelled = true }
  }, [publicUrl])

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const days = tournamentType === 'day' ? 1 : Math.max(2, numberOfDays)
      const { event: updated } = await apiFetch<{ event: EventDetail }>(`/api/events/${event.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ numberOfDays: days, ringCount: Math.max(1, ringCount) }),
      })
      onSaved(updated)
      setNumberOfDays(updated.number_of_days)
      setRingCount(updated.ring_count)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '520px' }}>
      {event.format === 'bracket' && (
        <>
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '14px' }}>Tournament Type</div>
            <div style={{ display: 'flex', gap: '2px' }}>
              {(['day', 'multi-day'] as const).map(t => (
                <button key={t} onClick={() => setTournamentType(t)}
                  style={{ flex: 1, padding: '14px', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: `1px solid ${tournamentType === t ? RED : BORDER}`, backgroundColor: tournamentType === t ? '#071a30' : 'transparent', color: tournamentType === t ? '#fff' : MUTED }}
                >
                  {t === 'day' ? 'Day Tournament' : 'Multi-Day Tournament'}
                </button>
              ))}
            </div>
          </div>

          {tournamentType === 'multi-day' && (
            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>Number of Days</label>
              <input type="number" min={2} style={inputStyle} value={numberOfDays} onChange={e => setNumberOfDays(Number(e.target.value))} />
            </div>
          )}

          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>{tournamentType === 'multi-day' ? 'Number of Rings' : 'Rings Running'}</label>
            <input type="number" min={1} style={inputStyle} value={ringCount} onChange={e => setRingCount(Number(e.target.value))} />
            <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, marginTop: '6px' }}>
              {ringCount > 1 ? `Multiple rings — fights can run in parallel, filtered by weight category.` : 'Single ring — all fights run in one queue.'}
            </div>
          </div>

          {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED, marginBottom: '14px' }}>{error}</div>}
          <button onClick={save} disabled={saving}
            style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px 28px', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Settings'}
          </button>
        </>
      )}

      <div style={{ marginTop: '40px', paddingTop: '28px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '12px' }}>Public Link</div>
        <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, marginBottom: '16px' }}>
          {event.format === 'bracket'
            ? 'Print or display this QR code at the venue gate. Scanning it opens a live, no-login audience page — fighter list and bracket, updating in real time as results are recorded.'
            : 'Print this on posters, flyers or venue signage. Scanning it takes fans straight to this event’s public fight card page.'}
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '180px', height: '180px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {qrDataUrl ? <img src={qrDataUrl} alt="Public event QR code" width={180} height={180} /> : (
              <span style={{ fontFamily: DISPLAY, fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Generating…</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <code style={{ display: 'block', backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, padding: '10px 14px', fontSize: '13px', color: '#ccc', wordBreak: 'break-all' }}>{publicUrl}</code>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <CopyButton text={publicUrl} />
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`${event.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`}
                  style={{ display: 'inline-block', textAlign: 'center', border: `1px solid ${BORDER}`, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 18px' }}
                >
                  Download QR
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Weight Classes ──────────────────────────────────────────────────────────

const AGE_GROUPS: Array<{ value: AgeGroup; label: string; hint: string }> = [
  { value: 'adult', label: 'Adult', hint: '3 × 3 min, 1 min rest' },
  { value: 'youth', label: 'Youth', hint: '3 × 2 min, 1 min rest' },
  { value: 'children', label: 'Children', hint: '3 × 1 min, 1 min rest' },
]

function WeightClassesTab({ eventId, discipline, weightClasses, onChange }: { eventId: string; discipline: string; weightClasses: WeightClass[]; onChange: () => void }) {
  const [templateOpen, setTemplateOpen] = useState(false)
  const [packOpen, setPackOpen] = useState(false)
  const [classModal, setClassModal] = useState<{ wc: WeightClass | null } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const deleteClass = async (id: number) => {
    setBusyId(id)
    try {
      await apiFetch(`/api/weight-classes/${id}`, { method: 'DELETE' })
      await onChange()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase' }}>Weight Classes</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setTemplateOpen(true)} style={{ border: `1px solid ${BORDER}`, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 18px' }}>
            + Boxing Template
          </button>
          {discipline === 'Boxing' && (
            <button onClick={() => setPackOpen(true)} style={{ border: `1px solid ${BORDER}`, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 18px' }}>
              + Template Pack
            </button>
          )}
          <button onClick={() => setClassModal({ wc: null })} style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 18px' }}>
            + Add Weight Class
          </button>
        </div>
      </div>

      {weightClasses.length === 0 ? (
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
          No weight classes yet — apply the boxing template for quick setup, or add one manually.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER }}>
          <div style={{ backgroundColor: '#060606', padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 90px 90px 1fr 90px 100px', gap: '12px' }}>
            {['Name', 'Age Group', 'Gender', 'Rounds', 'Fighters', ''].map(h => (
              <div key={h} style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>
          {weightClasses.map(wc => (
            <div key={wc.id} style={{ backgroundColor: CARD, padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 90px 90px 1fr 90px 100px', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '16px', fontWeight: 800, textTransform: 'uppercase' }}>{wc.name}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'capitalize' }}>{wc.age_group}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'capitalize' }}>{wc.gender}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{wc.rounds_count} × {wc.round_minutes} min · {wc.rest_minutes} min rest</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 700 }}>{wc.fighterCount}</div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setClassModal({ wc })} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: MUTED, textTransform: 'uppercase' }}>Edit</button>
                <button onClick={() => deleteClass(wc.id)} disabled={busyId === wc.id} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: RED, textTransform: 'uppercase', opacity: busyId === wc.id ? 0.5 : 1 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {templateOpen && (
        <TemplateModal
          onCancel={() => setTemplateOpen(false)}
          onApply={async (ageGroup, gender) => {
            await apiFetch(`/api/events/${eventId}/weight-classes/template`, { method: 'POST', body: JSON.stringify({ ageGroup, gender }) })
            await onChange()
            setTemplateOpen(false)
          }}
        />
      )}
      {classModal && (
        <WeightClassModal
          initial={classModal.wc}
          onCancel={() => setClassModal(null)}
          onSave={async fields => {
            if (classModal.wc) {
              await apiFetch(`/api/weight-classes/${classModal.wc.id}`, { method: 'PATCH', body: JSON.stringify(fields) })
            } else {
              await apiFetch(`/api/events/${eventId}/weight-classes`, { method: 'POST', body: JSON.stringify(fields) })
            }
            await onChange()
            setClassModal(null)
          }}
        />
      )}
      {packOpen && (
        <PackModal
          discipline={discipline}
          onCancel={() => setPackOpen(false)}
          onApply={async packSlug => {
            await apiFetch(`/api/events/${eventId}/weight-classes/from-pack`, { method: 'POST', body: JSON.stringify({ packSlug }) })
            await onChange()
            setPackOpen(false)
          }}
        />
      )}
    </div>
  )
}

type TemplatePack = { id: number; slug: string; name: string; division: string; classes: { id: number }[] }

function PackModal({ discipline, onCancel, onApply }: { discipline: string; onCancel: () => void; onApply: (packSlug: string) => Promise<void> }) {
  const [packs, setPacks] = useState<TemplatePack[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ packs: TemplatePack[] }>(`/api/template-packs?discipline=${encodeURIComponent(discipline)}`)
      .then(r => { setPacks(r.packs); setSelected(r.packs[0]?.slug ?? null) })
      .catch(() => setPacks([]))
  }, [discipline])

  const apply = async () => {
    if (!selected) return
    setApplying(true)
    setError(null)
    try {
      await onApply(selected)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply template pack.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <Modal title="Use Template Pack" onClose={onCancel}>
      <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, marginBottom: '20px' }}>
        Adds a frozen copy of the pack's classes to this event — editing the master pack later won't change this event.
      </p>
      {packs === null ? (
        <p style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>Loading…</p>
      ) : packs.length === 0 ? (
        <p style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>No template packs available for this discipline yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
          {packs.map(pack => (
            <button key={pack.slug} type="button" onClick={() => setSelected(pack.slug)}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${selected === pack.slug ? RED : BORDER}`, backgroundColor: selected === pack.slug ? '#071a30' : 'transparent' }}
            >
              <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>{pack.name}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED }}>{pack.classes.length} classes</span>
            </button>
          ))}
        </div>
      )}
      {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED, marginBottom: '14px' }}>{error}</div>}
      <button
        type="button"
        onClick={apply}
        disabled={applying || !selected}
        style={{ width: '100%', backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px', opacity: applying || !selected ? 0.6 : 1 }}
      >
        {applying ? 'Applying…' : 'Apply Pack'}
      </button>
    </Modal>
  )
}

function TemplateModal({ onCancel, onApply }: { onCancel: () => void; onApply: (ageGroup: AgeGroup, gender: string) => Promise<void> }) {
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult')
  const [gender, setGender] = useState('mixed')
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apply = async () => {
    setApplying(true)
    setError(null)
    try {
      await onApply(ageGroup, gender)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply template.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <Modal title="Apply Boxing Template" onClose={onCancel}>
      <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, marginBottom: '20px' }}>
        Adds the standard set of amateur boxing weight classes for the selected age group, pre-filled with typical round timing — every value stays editable after.
      </p>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Age Group</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {AGE_GROUPS.map(g => (
            <button key={g.value} type="button" onClick={() => setAgeGroup(g.value)}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${ageGroup === g.value ? RED : BORDER}`, backgroundColor: ageGroup === g.value ? '#071a30' : 'transparent' }}
            >
              <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>{g.label}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED }}>{g.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Gender</label>
        <select style={inputStyle} value={gender} onChange={e => setGender(e.target.value)}>
          <option value="mixed">Mixed</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED, marginBottom: '14px' }}>{error}</div>}
      <button
        type="button"
        onClick={apply}
        disabled={applying}
        style={{ width: '100%', backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px', opacity: applying ? 0.6 : 1 }}
      >
        {applying ? 'Applying…' : 'Apply Template'}
      </button>
    </Modal>
  )
}

function WeightClassModal({ initial, onCancel, onSave }: {
  initial: WeightClass | null
  onCancel: () => void
  onSave: (fields: { name: string; ageGroup: AgeGroup; gender: string; roundsCount: number; roundMinutes: number; restMinutes: number }) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(initial?.age_group ?? 'adult')
  const [gender, setGender] = useState(initial?.gender ?? 'mixed')
  const [roundsCount, setRoundsCount] = useState(initial?.rounds_count ?? 3)
  const [roundMinutes, setRoundMinutes] = useState(initial?.round_minutes ?? 3)
  const [restMinutes, setRestMinutes] = useState(initial?.rest_minutes ?? 1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    setError(null)
    setSaving(true)
    try {
      await onSave({ name: name.trim(), ageGroup, gender, roundsCount, roundMinutes, restMinutes })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={initial ? 'Edit Weight Class' : 'Add Weight Class'} onClose={onCancel}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="67 KG" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Age Group</label>
            <select style={inputStyle} value={ageGroup} onChange={e => setAgeGroup(e.target.value as AgeGroup)}>
              <option value="adult">Adult</option>
              <option value="youth">Youth</option>
              <option value="children">Children</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Gender</label>
            <select style={inputStyle} value={gender} onChange={e => setGender(e.target.value)}>
              <option value="mixed">Mixed</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Rounds</label>
            <input type="number" min={1} style={inputStyle} value={roundsCount} onChange={e => setRoundsCount(Number(e.target.value))} />
          </div>
          <div>
            <label style={labelStyle}>Round (min)</label>
            <input type="number" min={1} style={inputStyle} value={roundMinutes} onChange={e => setRoundMinutes(Number(e.target.value))} />
          </div>
          <div>
            <label style={labelStyle}>Rest (min)</label>
            <input type="number" min={0} style={inputStyle} value={restMinutes} onChange={e => setRestMinutes(Number(e.target.value))} />
          </div>
        </div>
        {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED }}>{error}</div>}
        <SubmitButton disabled={saving}>{saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Weight Class'}</SubmitButton>
      </form>
    </Modal>
  )
}

// ── Fighters ─────────────────────────────────────────────────────────────

function FightersTab({ eventId, fighters, weightClasses, onChange }: {
  eventId: string; fighters: EventFighter[]; weightClasses: WeightClass[]; onChange: () => void
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  const classById = Object.fromEntries(weightClasses.map(wc => [wc.id, wc.name]))

  const assignClass = async (fighterId: number, weightClassId: number | null) => {
    await apiFetch(`/api/events/${eventId}/fighters/${fighterId}/weight-class`, { method: 'PATCH', body: JSON.stringify({ weightClassId }) })
    await onChange()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase' }}>Fighters</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setImportOpen(true)} style={{ border: `1px solid ${BORDER}`, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 18px' }}>
            Import Excel
          </button>
          <button onClick={() => setAddOpen(true)} style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 18px' }}>
            + Add Fighter
          </button>
        </div>
      </div>

      {importResult && (
        <div style={{ backgroundColor: '#06140a', border: '1px solid #1e4a2c', color: '#4caf50', fontFamily: DISPLAY, fontSize: '13px', padding: '12px 16px', marginBottom: '20px' }}>
          {importResult}
        </div>
      )}

      {fighters.length === 0 ? (
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
          No fighters yet — add one, or import a roster from Excel.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER }}>
          <div style={{ backgroundColor: '#060606', padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 90px 1fr', gap: '12px' }}>
            {['Fighter', 'Club', 'Weight', 'Weight Class'].map(h => (
              <div key={h} style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>
          {fighters.map(f => (
            <div key={f.id} style={{ backgroundColor: CARD, padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 90px 1fr', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '16px', fontWeight: 800, textTransform: 'uppercase' }}>{f.name}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED }}>{f.club}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: '#eee' }}>{f.weight}</div>
              <select
                style={{ ...inputStyle, padding: '8px 10px', fontSize: '13px' }}
                value={f.weight_class_id ?? ''}
                onChange={e => assignClass(f.id, e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Unassigned —</option>
                {weightClasses.map(wc => <option key={wc.id} value={wc.id}>{wc.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <AddFighterModal
          weightClasses={weightClasses}
          onCancel={() => setAddOpen(false)}
          onSave={async fields => {
            await apiFetch(`/api/events/${eventId}/fighters`, { method: 'POST', body: JSON.stringify(fields) })
            await onChange()
            setAddOpen(false)
          }}
        />
      )}
      {importOpen && (
        <ExcelImport
          onCancel={() => setImportOpen(false)}
          onImport={async (rows: ImportedFighter[]) => {
            const { imported, skipped } = await apiFetch<{ imported: number; skipped: number }>(`/api/events/${eventId}/fighters/import`, {
              method: 'POST',
              body: JSON.stringify({ fighters: rows }),
            })
            await onChange()
            setImportOpen(false)
            setImportResult(`Imported ${imported} fighter${imported === 1 ? '' : 's'}${skipped > 0 ? ` (${skipped} row${skipped === 1 ? '' : 's'} skipped — missing name or weight)` : ''}.`)
          }}
        />
      )}
    </div>
  )
}

function AddFighterModal({ weightClasses, onCancel, onSave }: {
  weightClasses: WeightClass[]
  onCancel: () => void
  onSave: (fields: { name: string; club: string; weight: string; record: string; weightClassId: number | null }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [club, setClub] = useState('')
  const [weight, setWeight] = useState('')
  const [record, setRecord] = useState('')
  const [weightClassId, setWeightClassId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !club.trim() || !weight.trim()) { setError('Fill in name, club and weight.'); return }
    setError(null)
    setSaving(true)
    try {
      await onSave({ name: name.trim(), club: club.trim(), weight: weight.trim(), record: record.trim(), weightClassId: weightClassId ? Number(weightClassId) : null })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
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
        <div>
          <label style={labelStyle}>Weight Class</label>
          <select style={inputStyle} value={weightClassId} onChange={e => setWeightClassId(e.target.value)}>
            <option value="">— Unassigned —</option>
            {weightClasses.map(wc => <option key={wc.id} value={wc.id}>{wc.name}</option>)}
          </select>
        </div>
        {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED }}>{error}</div>}
        <SubmitButton disabled={saving}>{saving ? 'Saving…' : 'Add Fighter'}</SubmitButton>
      </form>
    </Modal>
  )
}

// ── Bracket ──────────────────────────────────────────────────────────────

function BracketTab({ weightClasses, fighters }: { weightClasses: WeightClass[]; fighters: EventFighter[] }) {
  const [selected, setSelected] = useState<number | null>(weightClasses[0]?.id ?? null)
  const [bouts, setBouts] = useState<Bout[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultBout, setResultBout] = useState<Bout | null>(null)

  const fightersById = Object.fromEntries(fighters.map(f => [f.id, { name: f.name, club: f.club }]))

  const loadBracket = (weightClassId: number) => {
    setLoading(true)
    setError(null)
    apiFetch<{ bouts: Bout[] }>(`/api/weight-classes/${weightClassId}/bracket`)
      .then(r => setBouts(r.bouts))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load bracket.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (selected) loadBracket(selected)
    else setBouts([])
  }, [selected])

  const generate = async () => {
    if (!selected) return
    setGenerating(true)
    setError(null)
    try {
      await apiFetch(`/api/weight-classes/${selected}/bracket`, { method: 'POST' })
      loadBracket(selected)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate bracket.')
    } finally {
      setGenerating(false)
    }
  }

  const currentClass = weightClasses.find(wc => wc.id === selected)

  if (weightClasses.length === 0) {
    return (
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
        Add weight classes first, then come back here to generate brackets.
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {weightClasses.map(wc => (
          <button key={wc.id} onClick={() => setSelected(wc.id)}
            style={{ padding: '10px 16px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: `1px solid ${selected === wc.id ? RED : BORDER}`, backgroundColor: selected === wc.id ? '#071a30' : 'transparent', color: selected === wc.id ? '#fff' : MUTED }}
          >
            {wc.name} <span style={{ color: MUTED }}>({wc.fighterCount})</span>
          </button>
        ))}
      </div>

      {currentClass && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {currentClass.fighterCount} fighter{currentClass.fighterCount === 1 ? '' : 's'} in this class
          </div>
          <button onClick={generate} disabled={generating || currentClass.fighterCount < 2}
            style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 20px', opacity: generating || currentClass.fighterCount < 2 ? 0.5 : 1 }}
          >
            {generating ? 'Generating…' : bouts.length > 0 ? 'Regenerate Bracket' : 'Generate Bracket'}
          </button>
        </div>
      )}

      {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED, marginBottom: '16px' }}>{error}</div>}

      {loading ? (
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>Loading…</div>
      ) : (
        <div style={{ paddingTop: '32px' }}>
          <BracketView bouts={bouts} fighters={fightersById} onBoutClick={setResultBout} />
        </div>
      )}

      {resultBout && (
        <ResultModal
          bout={resultBout}
          fighters={fightersById}
          onCancel={() => setResultBout(null)}
          onSave={async (winnerId, method) => {
            await apiFetch(`/api/bouts/${resultBout.id}/result`, { method: 'PATCH', body: JSON.stringify({ winnerId, method }) })
            setResultBout(null)
            if (selected) loadBracket(selected)
          }}
        />
      )}
    </div>
  )
}

function ResultModal({ bout, fighters, onCancel, onSave }: {
  bout: Bout
  fighters: Record<number, { name: string; club: string }>
  onCancel: () => void
  onSave: (winnerId: number, method: string) => Promise<void>
}) {
  const [winnerId, setWinnerId] = useState<number | null>(null)
  const [method, setMethod] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const corners = ([['red', bout.fighter_red_id], ['blue', bout.fighter_blue_id]] as const).filter(
    (c): c is [typeof c[0], number] => c[1] !== null,
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!winnerId) { setError('Pick a winner.'); return }
    setError(null)
    setSaving(true)
    try {
      await onSave(winnerId, method.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save result.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Record Result" onClose={onCancel}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Winner</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {corners.map(([side, fid]) => (
              <button key={side} type="button" onClick={() => setWinnerId(fid)}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${winnerId === fid ? RED : BORDER}`, backgroundColor: winnerId === fid ? '#071a30' : 'transparent' }}
              >
                <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, color: '#fff' }}>{fighters[fid]?.name ?? `Fighter #${fid}`}</span>
                <span style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase' }}>{fighters[fid]?.club}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Method (optional)</label>
          <input style={inputStyle} value={method} onChange={e => setMethod(e.target.value)} placeholder="TKO R2" />
        </div>
        {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED }}>{error}</div>}
        <SubmitButton disabled={saving}>{saving ? 'Saving…' : 'Record Result'}</SubmitButton>
      </form>
    </Modal>
  )
}

// ── Fight Card (simple ordered bout list, for format: 'card' events) ───────

type CardBout = {
  id: number
  fighter_a_name: string
  fighter_a_record: string
  fighter_b_name: string
  fighter_b_record: string
  weight_class_text: string
  card_position: 'main' | 'co-main' | 'undercard'
  rounds: number | null
}

const CARD_POSITIONS: Array<[CardBout['card_position'], string]> = [
  ['main', 'Main Event'],
  ['co-main', 'Co-Main'],
  ['undercard', 'Undercard'],
]

function FightCardTab({ eventId }: { eventId: string }) {
  const [bouts, setBouts] = useState<CardBout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<{ bout: CardBout | null } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = () =>
    apiFetch<{ bouts: CardBout[] }>(`/api/events/${eventId}/card-bouts`).then(r => setBouts(r.bouts))

  useEffect(() => {
    setLoading(true)
    load()
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load fight card.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= bouts.length) return
    const reordered = [...bouts]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setBouts(reordered)
    await apiFetch(`/api/events/${eventId}/card-bouts/reorder`, {
      method: 'POST',
      body: JSON.stringify({ order: reordered.map(b => b.id) }),
    })
  }

  const remove = async (id: number) => {
    setBusyId(id)
    try {
      await apiFetch(`/api/card-bouts/${id}`, { method: 'DELETE' })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>Loading…</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase' }}>Fight Card</h2>
        <button onClick={() => setModal({ bout: null })} style={{ backgroundColor: RED, color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 18px' }}>
          + Add Bout
        </button>
      </div>

      {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED, marginBottom: '16px' }}>{error}</div>}

      {bouts.length === 0 ? (
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, padding: '32px 20px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', textAlign: 'center' }}>
          No bouts yet — add the first one to start building the card.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: BORDER }}>
          <div style={{ backgroundColor: '#060606', padding: '10px 16px', display: 'grid', gridTemplateColumns: '110px 1fr 1fr 130px 70px 160px', gap: '12px' }}>
            {['Position', 'Fighter A', 'Fighter B', 'Weight Class', 'Rounds', ''].map(h => (
              <div key={h} style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>
          {bouts.map((b, i) => (
            <div key={b.id} style={{ backgroundColor: CARD, padding: '12px 16px', display: 'grid', gridTemplateColumns: '110px 1fr 1fr 130px 70px 160px', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontFamily: DISPLAY, fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${b.card_position === 'main' ? RED : BORDER}`, color: b.card_position === 'main' ? RED : MUTED, display: 'inline-block', width: 'fit-content' }}>
                {CARD_POSITIONS.find(([v]) => v === b.card_position)?.[1] ?? b.card_position}
              </span>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 800, textTransform: 'uppercase' }}>{b.fighter_a_name}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED }}>{b.fighter_a_record || '—'}</div>
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: '15px', fontWeight: 800, textTransform: 'uppercase' }}>{b.fighter_b_name}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED }}>{b.fighter_b_record || '—'}</div>
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: '#ccc' }}>{b.weight_class_text || '—'}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: '#ccc' }}>{b.rounds ?? '—'}</div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" style={{ color: i === 0 ? '#333' : MUTED, padding: '2px 4px' }}>▲</button>
                <button onClick={() => move(i, 1)} disabled={i === bouts.length - 1} aria-label="Move down" style={{ color: i === bouts.length - 1 ? '#333' : MUTED, padding: '2px 4px' }}>▼</button>
                <button onClick={() => setModal({ bout: b })} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: MUTED, textTransform: 'uppercase' }}>Edit</button>
                <button onClick={() => remove(b.id)} disabled={busyId === b.id} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, color: RED, textTransform: 'uppercase', opacity: busyId === b.id ? 0.5 : 1 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <CardBoutModal
          initial={modal.bout}
          onCancel={() => setModal(null)}
          onSave={async fields => {
            if (modal.bout) {
              await apiFetch(`/api/card-bouts/${modal.bout.id}`, { method: 'PATCH', body: JSON.stringify(fields) })
            } else {
              await apiFetch(`/api/events/${eventId}/card-bouts`, { method: 'POST', body: JSON.stringify(fields) })
            }
            await load()
            setModal(null)
          }}
        />
      )}
    </div>
  )
}

function CardBoutModal({ initial, onCancel, onSave }: {
  initial: CardBout | null
  onCancel: () => void
  onSave: (fields: {
    fighterAName: string; fighterARecord: string; fighterBName: string; fighterBRecord: string
    weightClassText: string; cardPosition: CardBout['card_position']; rounds: number | null
  }) => Promise<void>
}) {
  const [fighterAName, setFighterAName] = useState(initial?.fighter_a_name ?? '')
  const [fighterARecord, setFighterARecord] = useState(initial?.fighter_a_record ?? '')
  const [fighterBName, setFighterBName] = useState(initial?.fighter_b_name ?? '')
  const [fighterBRecord, setFighterBRecord] = useState(initial?.fighter_b_record ?? '')
  const [weightClassText, setWeightClassText] = useState(initial?.weight_class_text ?? '')
  const [cardPosition, setCardPosition] = useState<CardBout['card_position']>(initial?.card_position ?? 'undercard')
  const [rounds, setRounds] = useState(initial?.rounds ?? 10)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fighterAName.trim() || !fighterBName.trim()) { setError('Both fighter names are required.'); return }
    setError(null)
    setSaving(true)
    try {
      await onSave({
        fighterAName: fighterAName.trim(), fighterARecord: fighterARecord.trim(),
        fighterBName: fighterBName.trim(), fighterBRecord: fighterBRecord.trim(),
        weightClassText: weightClassText.trim(), cardPosition, rounds: rounds || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={initial ? 'Edit Bout' : 'Add Bout'} onClose={onCancel}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Fighter A Name</label>
            <input style={inputStyle} value={fighterAName} onChange={e => setFighterAName(e.target.value)} placeholder="Konstantin Braun" />
          </div>
          <div>
            <label style={labelStyle}>Fighter A Record</label>
            <input style={inputStyle} value={fighterARecord} onChange={e => setFighterARecord(e.target.value)} placeholder="12–2–0" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Fighter B Name</label>
            <input style={inputStyle} value={fighterBName} onChange={e => setFighterBName(e.target.value)} placeholder="Piotr Wiśniewski" />
          </div>
          <div>
            <label style={labelStyle}>Fighter B Record</label>
            <input style={inputStyle} value={fighterBRecord} onChange={e => setFighterBRecord(e.target.value)} placeholder="9–4–1" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Weight Class</label>
            <input style={inputStyle} value={weightClassText} onChange={e => setWeightClassText(e.target.value)} placeholder="Heavyweight" />
          </div>
          <div>
            <label style={labelStyle}>Rounds</label>
            <input type="number" min={1} style={inputStyle} value={rounds} onChange={e => setRounds(Number(e.target.value))} />
          </div>
          <div>
            <label style={labelStyle}>Card Position</label>
            <select style={inputStyle} value={cardPosition} onChange={e => setCardPosition(e.target.value as CardBout['card_position'])}>
              {CARD_POSITIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </div>
        </div>
        {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED }}>{error}</div>}
        <SubmitButton disabled={saving}>{saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Bout'}</SubmitButton>
      </form>
    </Modal>
  )
}
