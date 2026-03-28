import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { matchService } from '../services/matchService.js'
import { rsvpService } from '../services/rsvpService.js'
import { useAuth } from '../context/AuthContext.jsx'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const MOCK_MATCH = {
  id: 'mock-1', title: 'Pelada do Sábado', format: 'SOCIETY_7V7', status: 'OPEN',
  scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(), total_slots: 14,
  estimated_duration_min: 90, invite_code: 'abc123',
  venue: { name: 'Arena Gol de Placa', address: 'Rua das Palmeiras, 123', city: 'São Paulo' },
  organizer: { player_profiles: [{ display_name: 'Bruno Silva' }] },
  rsvps: Array.from({ length: 9 }, (_, i) => ({ id: `r${i}`, status: 'CONFIRMED', user: { player_profiles: [{ display_name: `Jogador ${i+1}`, primary_position: 'MIDFIELDER' }] } })),
}

const STATUS_COLOR = { OPEN: '#1cb85b', CONFIRMED: '#1cb85b', TEAMS_SET: '#b299ff', IN_PROGRESS: '#f8a010', FINISHED: '#a3aea5', CANCELLED: '#ff7351' }
const STATUS_LABEL = { OPEN: 'Aberta', CONFIRMED: 'Confirmada', TEAMS_SET: 'Times Definidos', IN_PROGRESS: 'Em Andamento', FINISHED: 'Finalizada', CANCELLED: 'Cancelada' }
const POS_LABEL = { GOALKEEPER: 'GL', DEFENDER: 'ZG', MIDFIELDER: 'MEI', FORWARD: 'AT', ANY: '—' }

export default function DashboardPartidaPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [match, setMatch] = useState(MOCK_MATCH)
  const [tab, setTab] = useState('escala')
  const [rsvpLoading, setRsvpLoading] = useState(false)
  // rsvpStatus: null | 'CONFIRMED' | 'DECLINED'
  const [rsvpStatus, setRsvpStatus] = useState(null)

  useEffect(() => {
    matchService.getMatch(matchId)
      .then(data => { if (data) setMatch(data) })
      .catch(() => {})
  }, [matchId])

  // Load user's existing RSVP status on mount
  useEffect(() => {
    if (!user || !matchId) return
    rsvpService.getMyRsvp(matchId, user.id)
      .then(rsvp => {
        if (rsvp?.status === 'CONFIRMED') setRsvpStatus('CONFIRMED')
        else if (rsvp?.status === 'DECLINED') setRsvpStatus('DECLINED')
      })
      .catch(() => {})
  }, [user, matchId])

  const dt = match.scheduled_at ? new Date(match.scheduled_at) : null
  const dateStr = dt ? dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : '—'
  const timeStr = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
  const confirmedRsvps = match.rsvps?.filter(r => r.status === 'CONFIRMED') ?? []
  const statusColor = STATUS_COLOR[match.status] || '#a3aea5'

  async function handleConfirm() {
    if (!user) return
    setRsvpLoading(true)
    try {
      await rsvpService.confirm(match.id, user.id)
      setRsvpStatus('CONFIRMED')
    } catch { setRsvpStatus('CONFIRMED') }
    finally { setRsvpLoading(false) }
  }

  async function handleDecline() {
    if (!user) return
    setRsvpLoading(true)
    try {
      await rsvpService.decline(match.id, user.id)
      setRsvpStatus('DECLINED')
    } catch { setRsvpStatus('DECLINED') }
    finally { setRsvpLoading(false) }
  }

  const tabs = [
    { id: 'escala', label: 'Escalação', icon: 'groups' },
    { id: 'local',  label: 'Local',     icon: 'location_on' },
    { id: 'sub',    label: 'Substituto',icon: 'person_add' },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title={match.title} showBack />

      <main style={{ flex: 1, maxWidth: 640, margin: '0 auto', width: '100%', paddingBottom: 100 }}>
        {/* Hero header */}
        <div style={{ background: 'var(--surface-container-low)', padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1.1, flex: 1, paddingRight: 12 }}>{match.title}</h1>
            <span style={{ background: `${statusColor}20`, color: statusColor, fontSize: 10, fontWeight: 700, padding: '6px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', border: `1px solid ${statusColor}30` }}>
              {STATUS_LABEL[match.status] || match.status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--on-surface-variant)', fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
              {dateStr} · {timeStr}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1cb85b', fontSize: 13, fontWeight: 700 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
              {confirmedRsvps.length}/{match.total_slots} confirmados
            </span>
          </div>

          {/* RSVP buttons */}
          {rsvpStatus === 'CONFIRMED' ? (
            <div style={{ background: 'rgba(28,184,91,0.1)', border: '1px solid rgba(28,184,91,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: '#1cb85b', fontWeight: 700, fontSize: 14 }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Presença confirmada!
            </div>
          ) : rsvpStatus === 'DECLINED' ? (
            <div style={{ background: 'rgba(255,115,81,0.08)', border: '1px solid rgba(255,115,81,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--error)', fontWeight: 700, fontSize: 14 }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
              Presença recusada
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <button onClick={handleConfirm} disabled={rsvpLoading} style={{ flex: 1, background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}>
                <span className="material-symbols-outlined">check_circle</span>
                {rsvpLoading ? '...' : 'Confirmar'}
              </button>
              <button onClick={handleDecline} disabled={rsvpLoading} style={{ flex: 1, background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
                {rsvpLoading ? '...' : 'Recusar'}
              </button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '12px 0', background: tab === t.id ? 'var(--surface)' : 'transparent', borderRadius: '12px 12px 0 0', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: tab === t.id ? 'var(--primary)' : 'var(--on-surface-variant)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: '20px' }}>
          {tab === 'escala' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, textTransform: 'uppercase', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                Confirmados ({confirmedRsvps.length}/{match.total_slots})
              </h3>
              {confirmedRsvps.map((r, i) => {
                // Support both join shapes: via getMatch (player_profiles direct) or listMatchRsvps
                const prof = r.player_profiles || r.user?.player_profiles?.[0] || {}
                const initials = (prof.display_name || 'J').substring(0, 2).toUpperCase()
                return (
                  <div key={r.id || i} style={{ background: 'var(--surface-container)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(28,184,91,0.15)', color: '#1cb85b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14 }}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{prof.display_name || 'Jogador'}</p>
                      <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{POS_LABEL[r.preferred_position || prof.primary_position] || '—'}</p>
                    </div>
                    <span style={{ background: 'rgba(28,184,91,0.1)', color: '#1cb85b', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase' }}>✓</span>
                  </div>
                )
              })}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, match.total_slots - confirmedRsvps.length) }).map((_, i) => (
                <div key={`empty-${i}`} style={{ background: 'var(--surface-container-low)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, opacity: 0.4, border: '1px dashed rgba(64,74,68,0.4)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--outline)' }}>person_outline</span>
                  </div>
                  <p style={{ color: 'var(--outline)', fontSize: 13 }}>Vaga disponível</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'local' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--surface-container)', borderRadius: 20, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(28,184,91,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ color: '#1cb85b', fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>{match.venue?.name || 'Local definido pelo organizador'}</h3>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, marginTop: 4 }}>{match.venue?.address || match.custom_address || 'Endereço não informado'}</p>
                  </div>
                </div>
                {/* Map placeholder */}
                <div style={{ width: '100%', height: 180, background: 'var(--surface-container-highest)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.4 }}>map</span>
                  <p style={{ fontSize: 12, fontWeight: 600 }}>Ver no mapa</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ flex: 1, background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined">directions</span>
                  Como chegar
                </button>
                <button style={{ flex: 1, background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined">share</span>
                  Compartilhar
                </button>
              </div>
            </div>
          )}

          {tab === 'sub' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(28,184,91,0.06)', border: '1px solid rgba(28,184,91,0.15)', borderRadius: 20, padding: 20 }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#1cb85b', marginBottom: 8 }}>Radar de Substitutos</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>Encontre jogadores disponíveis próximos à quadra em tempo real.</p>
              </div>
              <button onClick={() => navigate('/substituto')} style={{ width: '100%', background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 24px rgba(28,184,91,0.25)' }}>
                <span className="material-symbols-outlined">radar</span>
                Abrir Radar
              </button>
              <button onClick={() => navigate(`/chat/${match.id}`)} style={{ width: '100%', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span className="material-symbols-outlined">chat</span>
                Chat da Pelada
              </button>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
