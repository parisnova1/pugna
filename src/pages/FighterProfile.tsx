import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { NavFn } from '../App'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { apiFetch } from '../lib/api'
import BackButton from '../components/BackButton'

import { ACCENT as RED, ON_ACCENT, CARD, LINE as BORDER, MUTED, TEXT, BG, FONT_BODY as DISPLAY } from '../theme'

type Fighter = {
  id: number
  name: string
  club: string
  weight: string
  record: string
  discipline: string
  location: string
  organizer_name: string
}

export default function FighterProfile({ nav: _nav }: { nav: NavFn }) {
  const { fighterId } = useParams<{ fighterId: string }>()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [fighter, setFighter] = useState<Fighter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [following, setFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiFetch<{ fighter: Fighter }>(`/api/public/fighters/${fighterId}`)
      .then(r => setFighter(r.fighter))
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load this fighter.'))
      .finally(() => setLoading(false))
  }, [fighterId])

  useEffect(() => {
    if (user?.role !== 'viewer') return
    apiFetch<{ fighters: { id: number }[] }>('/api/public/fighters/following')
      .then(r => setFollowing(r.fighters.some(f => f.id === Number(fighterId))))
      .catch(() => {})
  }, [fighterId, user?.role])

  const toggleFollow = async () => {
    setFollowBusy(true)
    try {
      if (following) {
        await apiFetch(`/api/public/fighters/${fighterId}/follow`, { method: 'DELETE' })
        setFollowing(false)
      } else {
        await apiFetch(`/api/public/fighters/${fighterId}/follow`, { method: 'POST' })
        setFollowing(true)
      }
    } catch {
      /* leave state unchanged on failure */
    } finally {
      setFollowBusy(false)
    }
  }

  if (loading) {
    return <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 32px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>Loading…</div>
  }
  if (error || !fighter) {
    return (
      <div style={{ maxWidth: '480px', margin: '100px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: DISPLAY, fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>Fighter Not Found</div>
        <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED }}>{error || 'This fighter doesn’t exist.'}</div>
      </div>
    )
  }

  const initials = fighter.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div>
      <div style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: BG, color: TEXT }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '48px 32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <BackButton />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', backgroundColor: CARD, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 900, color: RED }}>{initials || '?'}</span>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: RED }} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.25em', color: RED, textTransform: 'uppercase', marginBottom: '8px' }}>
                  {fighter.club}
                </div>
                <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.95, marginBottom: '16px' }}>
                  {fighter.name}
                </h1>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[fighter.discipline, fighter.weight, fighter.location].filter(Boolean).map(tag => (
                    <span key={tag} style={{ fontFamily: DISPLAY, fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase', padding: '4px 12px', border: `1px solid ${BORDER}` }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {user?.role === 'viewer' && (
              <button
                onClick={toggleFollow}
                disabled={followBusy}
                style={{
                  fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '12px 28px', opacity: followBusy ? 0.6 : 1, transition: 'all 0.15s',
                  backgroundColor: following ? 'transparent' : RED, color: following ? TEXT : ON_ACCENT,
                  border: `1px solid ${following ? BORDER : RED}`,
                }}
              >
                {following ? t('fighterProfile.following') : t('fighterProfile.followFighter')}
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px', display: 'flex', borderTop: `1px solid ${BORDER}` }}>
          {[
            { v: fighter.record, l: 'Record' },
            { v: fighter.weight, l: 'Weight' },
            { v: fighter.discipline, l: 'Discipline' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '16px 32px', borderRight: i < 2 ? `1px solid ${BORDER}` : 'none', paddingLeft: i === 0 ? '0' : '32px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '24px', fontWeight: 900 }}>{s.v}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '48px 32px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '48px' }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '12px' }}>About</div>
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: MUTED }}>
            {fighter.name} trains out of {fighter.club} in {fighter.location}, competing in {fighter.discipline.toLowerCase()} at {fighter.weight}. Current record: {fighter.record}.
          </p>
        </div>

        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, height: 'fit-content' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>Fighter Details</div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            {[
              ['Club', fighter.club],
              ['Location', fighter.location],
              ['Discipline', fighter.discipline],
              ['Weight', fighter.weight],
              ['Record', fighter.record],
              ['Organizer', fighter.organizer_name],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>{k}</span>
                <span style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 600, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
