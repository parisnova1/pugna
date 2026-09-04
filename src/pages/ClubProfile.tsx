import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { NavFn } from '../App'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { apiFetch } from '../lib/api'
import Spinner from '../components/Spinner'
import CopyButton from '../components/CopyButton'
import BackButton from '../components/BackButton'

import { ACCENT as RED, ON_ACCENT, CARD, LINE as BORDER, MUTED, TEXT, BG, FONT_BODY as DISPLAY } from '../theme'

const COVER = 'https://images.unsplash.com/photo-1509563268479-0f004cf3f58b?w=1440&h=500&fit=crop&auto=format'

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
}

export default function ClubProfile({ nav: _nav }: { nav: NavFn }) {
  const { clubId } = useParams<{ clubId: string }>()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [following, setFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)

    apiFetch<{ club: Club }>(`/api/clubs/${clubId}`)
      .then(r => setClub(r.club))
      .catch(err => setError(err instanceof Error ? err.message : t('clubProfile.notFound')))
      .finally(() => setLoading(false))
  }, [clubId])

  useEffect(() => {
    if (user?.role !== 'viewer') return
    apiFetch<{ clubs: { id: number }[] }>('/api/clubs/following')
      .then(r => setFollowing(r.clubs.some(c => c.id === Number(clubId))))
      .catch(() => {})
  }, [clubId, user?.role])

  const toggleFollow = async () => {
    setFollowBusy(true)
    try {
      if (following) {
        await apiFetch(`/api/clubs/${clubId}/follow`, { method: 'DELETE' })
        setFollowing(false)
      } else {
        await apiFetch(`/api/clubs/${clubId}/follow`, { method: 'POST' })
        setFollowing(true)
      }
    } catch {
      /* leave state unchanged on failure */
    } finally {
      setFollowBusy(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 32px', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase' }}>
        <Spinner size={18} /> {t('common.loading')}
      </div>
    )
  }
  if (error || !club) {
    return <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 32px', fontFamily: DISPLAY, fontSize: '14px', color: RED }}>{error || t('clubProfile.notFound')}</div>
  }

  const initials = club.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 32px 0' }}>
        <BackButton />
      </div>

      {/* Cover */}
      <div style={{ position: 'relative', height: '360px', overflow: 'hidden' }}>
        <img src={club.cover_url || COVER} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.1) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: RED }} />
      </div>

      {/* Club header */}
      <div style={{ backgroundColor: BG, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 32px', display: 'flex', alignItems: 'flex-end', gap: '32px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: CARD, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {club.logo_url ? (
                <img src={club.logo_url} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontFamily: DISPLAY, fontSize: '28px', fontWeight: 900, color: RED }}>{initials || '?'}</span>
              )}
            </div>
            <div>
              {club.location && (
                <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '4px' }}>{club.location}</div>
              )}
              <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, marginBottom: '8px' }}>
                {club.name}
              </h1>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {club.disciplines.map(d => (
                  <span key={d} style={{ fontFamily: DISPLAY, fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${BORDER}` }}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <CopyButton text={window.location.href} />
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
                {following ? t('clubs.following') : t('clubs.followClub')}
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px', display: 'flex', gap: '0', borderTop: `1px solid ${BORDER}` }}>
          {[
            { v: String(club.member_count), l: t('clubs.members') },
            { v: club.founded_year ? String(club.founded_year) : '—', l: t('clubProfile.founded') },
            { v: String(club.disciplines.length), l: t('clubProfile.disciplines') },
          ].map((s, i) => (
            <div key={i} style={{ padding: '16px 32px', borderRight: i < 2 ? `1px solid ${BORDER}` : 'none', paddingLeft: i === 0 ? '0' : '32px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '28px', fontWeight: 900 }}>{s.v}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '48px 32px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '48px' }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase', marginBottom: '12px' }}>{t('clubProfile.about')}</div>
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: MUTED }}>
            {club.description || t('clubProfile.noDescription')}
          </p>
        </div>

        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, height: 'fit-content' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>{t('clubProfile.details')}</div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            {[
              [t('clubProfile.founded'), club.founded_year ? String(club.founded_year) : '—'],
              [t('eventDetail.location'), club.location || '—'],
              [t('clubProfile.disciplines'), club.disciplines.join(', ') || '—'],
              [t('clubs.members'), String(club.member_count)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>{k}</span>
                <span style={{ fontFamily: DISPLAY, fontSize: '13px', fontWeight: 600, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
