import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { matchService } from '../services/matchService.js'
import { rsvpService } from '../services/rsvpService.js'
import { teamService } from '../services/teamService.js'
import { drawTeams, isMatchFull } from '../utils/teamDraw.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getMapEmbedUrl, getDirectionsUrl, getShareLocationUrl } from '../services/googleMapsService.js'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const MOCK_MATCH = {
  id: 'mock-1', title: 'Pelada do Sábado', format: 'SOCIETY_7V7', status: 'OPEN',
  scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(), total_slots: 14,
  estimated_duration_min: 90, invite_code: 'abc123',
  organizer_id: 'dev-user',
  venue: { name: 'Arena Gol de Placa', address: 'Rua das Palmeiras, 123, São Paulo, SP', city: 'São Paulo' },
  organizer: { player_profiles: [{ display_name: 'Bruno Silva' }] },
  rsvps: [
    ...Array.from({ length: 7 }, (_, i) => ({
      id: `r${i}`, status: 'CONFIRMED', user_id: `u${i}`,
      player_profiles: { display_name: `Jogador ${i + 1}`, primary_position: 'MIDFIELDER', skill_score: 5 + (i % 3) },
    })),
    { id: 'r-s1', status: 'INVITED', user_id: 'sub-1', is_substitute: true,
      player_profiles: { display_name: 'Carlos Suplente', primary_position: 'FORWARD', skill_score: 4 } },
    { id: 'r-s2', status: 'INVITED', user_id: 'sub-2', is_substitute: true,
      player_profiles: { display_name: 'Diego Reserva', primary_position: 'DEFENDER', skill_score: 6 } },
  ],
}

const STATUS_COLOR = { OPEN: '#1cb85b', CONFIRMED: '#1cb85b', TEAMS_SET: '#b299ff', IN_PROGRESS: '#f8a010', FINISHED: '#a3aea5', CANCELLED: '#ff7351' }
const STATUS_LABEL = { OPEN: 'Aberta', CONFIRMED: 'Confirmada', TEAMS_SET: 'Times Definidos', IN_PROGRESS: 'Em Andamento', FINISHED: 'Finalizada', CANCELLED: 'Cancelada' }
const POS_LABEL   = { GOALKEEPER: 'GL', DEFENDER: 'ZG', MIDFIELDER: 'MEI', FORWARD: 'AT', ANY: '—' }
const POS_COLOR   = {
  GOALKEEPER: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  DEFENDER:   { bg: 'rgba(56,189,248,0.15)',  color: '#38bdf8' },
  MIDFIELDER: { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
  FORWARD:    { bg: 'rgba(28,184,91,0.15)',   color: '#1cb85b' },
  ANY:        { bg: 'rgba(255,255,255,0.07)', color: '#a3aea5' },
}

// ─── Sub-componente: linha de jogador no time sorteado ─────────────────────
function TeamPlayerRow({ rsvp }) {
  const prof = rsvp.player_profiles || {}
  const pos  = prof.primary_position || rsvp.preferred_position || 'ANY'
  const pc   = POS_COLOR[pos] || POS_COLOR.ANY
  const initials = (prof.display_name || 'J').substring(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-container)', borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: pc.bg, color: pc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prof.display_name || 'Jogador'}</p>
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: pc.bg, color: pc.color, flexShrink: 0 }}>
        {POS_LABEL[pos] || '—'}
      </span>
    </div>
  )
}

// ─── Sub-componente: controle de presença de 1 jogador (admin) ────────────
function PlayerPresenceRow({ rsvp, isAdmin, onMarkNoShow, onConfirmGuest, loadingId }) {
  const prof = rsvp.player_profiles || rsvp.user?.player_profiles?.[0] || {}
  const initials = (prof.display_name || 'J').substring(0, 2).toUpperCase()
  const isLoading = loadingId === rsvp.id

  const isInvited   = rsvp.status === 'INVITED'
  const isNoShow    = rsvp.status === 'NO_SHOW'
  const isConfirmed = rsvp.status === 'CONFIRMED'

  const avatarBg    = isNoShow ? 'rgba(255,115,81,0.12)' : isInvited ? 'rgba(248,160,16,0.12)' : 'rgba(28,184,91,0.15)'
  const avatarColor = isNoShow ? '#ff7351' : isInvited ? '#f8a010' : '#1cb85b'

  return (
    <div style={{
      background: isNoShow ? 'rgba(255,115,81,0.04)' : 'var(--surface-container)',
      borderRadius: 14, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
      border: isInvited ? '1px solid rgba(248,160,16,0.3)' : isNoShow ? '1px solid rgba(255,115,81,0.2)' : 'none',
      opacity: isNoShow ? 0.7 : 1,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: avatarBg, color: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {prof.display_name || 'Jogador'}
          </p>
          {isInvited && (
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(248,160,16,0.15)', color: '#f8a010', padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>
              Suplente
            </span>
          )}
          {isNoShow && (
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,115,81,0.12)', color: '#ff7351', padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>
              Faltou
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
          {POS_LABEL[rsvp.preferred_position || prof.primary_position] || '—'}
          {isInvited && ' · Aguardando presença'}
          {isNoShow  && ' · Não compareceu'}
        </p>
      </div>

      {isAdmin && !isNoShow && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {isInvited && (
            <button
              onClick={() => onConfirmGuest(rsvp)}
              disabled={isLoading}
              style={{ background: 'rgba(28,184,91,0.12)', color: '#1cb85b', border: '1px solid rgba(28,184,91,0.25)', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
              {isLoading ? '...' : 'Chegou'}
            </button>
          )}
          <button
            onClick={() => onMarkNoShow(rsvp)}
            disabled={isLoading}
            style={{ background: 'rgba(255,115,81,0.08)', color: '#ff7351', border: '1px solid rgba(255,115,81,0.2)', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person_off</span>
            {isLoading ? '...' : 'Faltou'}
          </button>
        </div>
      )}

      {(!isAdmin || isNoShow) && isConfirmed && (
        <span style={{ background: 'rgba(28,184,91,0.1)', color: '#1cb85b', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', flexShrink: 0 }}>
          ✓
        </span>
      )}
    </div>
  )
}

// ─── Sub-componente: tab "Local" com Google Maps ───────────────────────────
function LocalTab({ match }) {
  const address = match.venue?.address || match.custom_address || ''
  const fullAddress = address
    ? `${match.venue?.name ? match.venue.name + ', ' : ''}${address}`
    : null

  const embedUrl      = fullAddress ? getMapEmbedUrl(fullAddress) : null
  const directionsUrl = fullAddress ? getDirectionsUrl(fullAddress) : '#'
  const shareUrl      = fullAddress ? getShareLocationUrl(fullAddress) : '#'

  function handleShare() {
    if (navigator.share && fullAddress) {
      navigator.share({ title: match.title, text: `Local da pelada: ${match.venue?.name}`, url: shareUrl })
        .catch(() => window.open(shareUrl, '_blank'))
    } else {
      window.open(shareUrl, '_blank')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--surface-container)', borderRadius: 20, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(28,184,91,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ color: '#1cb85b', fontVariationSettings: "'FILL' 1" }}>location_on</span>
          </div>
          <div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>
              {match.venue?.name || 'Local definido pelo organizador'}
            </h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, marginTop: 4 }}>
              {address || 'Endereço não informado'}
            </p>
          </div>
        </div>

        {embedUrl ? (
          <div style={{ width: '100%', height: 200, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--surface-container-highest)' }}>
            <iframe title="Localização da pelada" src={embedUrl} width="100%" height="200" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        ) : (
          <div style={{ width: '100%', height: 180, background: 'var(--surface-container-highest)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--on-surface-variant)', cursor: 'pointer' }}
            onClick={() => address && window.open(getShareLocationUrl(address), '_blank')}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.4 }}>map</span>
            <p style={{ fontSize: 12, fontWeight: 600 }}>{address ? 'Toque para abrir no Maps' : 'Endereço não informado'}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
          <span className="material-symbols-outlined">directions</span>
          Como chegar
        </a>
        <button onClick={handleShare}
          style={{ flex: 1, background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span className="material-symbols-outlined">share</span>
          Compartilhar
        </button>
      </div>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function DashboardPartidaPage() {
  const { matchId } = useParams()
  const navigate    = useNavigate()
  const { user }    = useAuth()

  const [match, setMatch]             = useState(MOCK_MATCH)
  const [tab, setTab]                 = useState('escala')
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [rsvpStatus, setRsvpStatus]   = useState(null)
  const [presenceLoading, setPresenceLoading] = useState(null)
  const [presenceFeedback, setPresenceFeedback] = useState(null)
  const [copied, setCopied] = useState(false)

  // ── Estados do sorteio automático ─────────────────────────────────────────
  const [teamsDrawn, setTeamsDrawn]           = useState(false)   // flag: sorteio já feito
  const [drawingAnim, setDrawingAnim]         = useState(false)   // overlay animado
  const [teams, setTeams]                     = useState({ teamA: [], teamB: [] })
  // ─────────────────────────────────────────────────────────────────────────

  const isAdmin = user && match.organizer_id && user.id === match.organizer_id

  useEffect(() => {
    matchService.getMatch(matchId)
      .then(data => {
        if (data) setMatch(data)
        // Se a partida já tem times definidos no banco, não sorteia de novo
        if (data?.status === 'TEAMS_SET' || data?.status === 'IN_PROGRESS') {
          setTeamsDrawn(true)
        }
      })
      .catch(() => {})
  }, [matchId])

  // Carrega times já sorteados do banco (se existirem)
  useEffect(() => {
    if (!matchId || matchId === 'mock-1') return
    teamService.getTeams(matchId)
      .then(({ teamA, teamB, hasTeams }) => {
        if (hasTeams) {
          // Normaliza slots para o formato de exibição
          const normalize = (team) =>
            (team.team_slots || []).map(slot => ({
              ...slot,
              user_id: slot.user_id,
              player_profiles: slot.player_profiles || {},
              preferred_position: slot.position,
              status: 'CONFIRMED',
            }))
          setTeams({ teamA: normalize(teamA), teamB: normalize(teamB) })
          setTeamsDrawn(true)
        }
      })
      .catch(() => {})
  }, [matchId])

  useEffect(() => {
    if (!user || !matchId) return
    rsvpService.getMyRsvp(matchId, user.id)
      .then(rsvp => {
        if (rsvp?.status === 'CONFIRMED') setRsvpStatus('CONFIRMED')
        else if (rsvp?.status === 'DECLINED') setRsvpStatus('DECLINED')
      })
      .catch(() => {})
  }, [user, matchId])

  // ── useEffect: sorteio automático quando a partida fica completa ──────────
  useEffect(() => {
    if (teamsDrawn) return
    const confirmed = (match.rsvps || []).filter(r => r.status === 'CONFIRMED')
    if (!isMatchFull(confirmed, match.total_slots)) return

    // Animação de loading (750ms) antes de revelar
    setDrawingAnim(true)
    const timer = setTimeout(async () => {
      const result = drawTeams(confirmed)
      setTeams(result)
      setTeamsDrawn(true)
      setDrawingAnim(false)

      // Persiste no banco (não bloqueia UI se falhar)
      if (matchId && matchId !== 'mock-1') {
        teamService.saveTeams(matchId, result).catch(console.warn)
      }
    }, 750)

    return () => clearTimeout(timer)
  }, [match.rsvps, match.total_slots, teamsDrawn, matchId])
  // ─────────────────────────────────────────────────────────────────────────

  const dt = match.scheduled_at ? new Date(match.scheduled_at) : null
  const dateStr = dt ? dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : '—'
  const timeStr = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
  const confirmedRsvps = (match.rsvps || []).filter(r => ['CONFIRMED', 'INVITED', 'NO_SHOW'].includes(r.status))
  const confirmedCount = (match.rsvps || []).filter(r => r.status === 'CONFIRMED').length
  const pct = Math.round((confirmedCount / match.total_slots) * 100)
  const statusColor = STATUS_COLOR[match.status] || '#a3aea5'

  // Times para exibição: se sorteio feito usa resultado real, senão divide par/ímpar
  const displayTeams = teamsDrawn
    ? [teams.teamA, teams.teamB]
    : [
        confirmedRsvps.filter((_, i) => i % 2 === 0),
        confirmedRsvps.filter((_, i) => i % 2 !== 0),
      ]

  async function handleConfirm() {
    if (!user) return
    setRsvpLoading(true)
    try { await rsvpService.confirm(match.id, user.id); setRsvpStatus('CONFIRMED') }
    catch { setRsvpStatus('CONFIRMED') }
    finally { setRsvpLoading(false) }
  }

  async function handleDecline() {
    if (!user) return
    setRsvpLoading(true)
    try { await rsvpService.decline(match.id, user.id); setRsvpStatus('DECLINED') }
    catch { setRsvpStatus('DECLINED') }
    finally { setRsvpLoading(false) }
  }

  async function handleMarkNoShow(rsvp) {
    setPresenceLoading(rsvp.id)
    try {
      await rsvpService.markNoShow(match.id, rsvp.user_id)
      setMatch(prev => ({ ...prev, rsvps: prev.rsvps.map(r => r.id === rsvp.id ? { ...r, status: 'NO_SHOW' } : r) }))
      showFeedback(`Falta registrada para ${rsvp.player_profiles?.display_name || 'jogador'}.`, 'error')
    } catch {
      showFeedback('Erro ao registrar falta. Tente novamente.', 'error')
    } finally { setPresenceLoading(null) }
  }

  async function handleConfirmGuest(rsvp) {
    setPresenceLoading(rsvp.id)
    try {
      await rsvpService.confirmGuestPresence(match.id, rsvp.user_id)
      setMatch(prev => ({ ...prev, rsvps: prev.rsvps.map(r => r.id === rsvp.id ? { ...r, status: 'CONFIRMED', is_substitute: true } : r) }))
      showFeedback(`${rsvp.player_profiles?.display_name || 'Suplente'} confirmado! ✅`, 'success')
    } catch {
      showFeedback('Erro ao confirmar presença. Tente novamente.', 'error')
    } finally { setPresenceLoading(null) }
  }

  function handleRedraw() {
    if (!isAdmin) return
    setTeamsDrawn(false)
    setTeams({ teamA: [], teamB: [] })
    // O useEffect acima irá re-sorteio automaticamente
  }

  function handleCopyInvite() {
    navigator.clipboard.writeText(`https://resenhai.com.br/convite?code=${match.invite_code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function showFeedback(message, type) {
    setPresenceFeedback({ message, type })
    setTimeout(() => setPresenceFeedback(null), 3500)
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
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1.1, flex: 1, paddingRight: 12 }}>
              {match.title}
            </h1>
            <span style={{ background: `${statusColor}20`, color: statusColor, fontSize: 10, fontWeight: 700, padding: '6px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', border: `1px solid ${statusColor}30` }}>
              {STATUS_LABEL[match.status] || match.status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--on-surface-variant)', fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
              {dateStr} · {timeStr}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1cb85b', fontSize: 13, fontWeight: 700 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
              {confirmedCount}/{match.total_slots} confirmados
            </span>
          </div>

          {/* Barra de progresso */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', width: pct + '%', background: pct === 100 ? '#1cb85b' : '#f59e0b', borderRadius: 99, transition: 'width 0.5s' }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
              {pct}% preenchido · {match.total_slots - confirmedCount} vagas restantes
            </p>
          </div>

          {/* RSVP buttons */}
          {rsvpStatus === 'CONFIRMED' ? (
            <div style={{ background: 'rgba(28,184,91,0.1)', border: '1px solid rgba(28,184,91,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#1cb85b', fontWeight: 700, fontSize: 14 }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Presença confirmada!
            </div>
          ) : rsvpStatus === 'DECLINED' ? (
            <div style={{ background: 'rgba(255,115,81,0.08)', border: '1px solid rgba(255,115,81,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--error)', fontWeight: 700, fontSize: 14 }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
              Presença recusada
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button onClick={handleConfirm} disabled={rsvpLoading} style={{ flex: 1, background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="material-symbols-outlined">check_circle</span>
                {rsvpLoading ? '...' : 'Confirmar'}
              </button>
              <button onClick={handleDecline} disabled={rsvpLoading} style={{ flex: 1, background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
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

          {/* ════════════════════════════════ ESCALAÇÃO ════════════════════════════════ */}
          {tab === 'escala' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Overlay animado: sorteio em andamento */}
              {drawingAnim && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'rgba(7,16,10,0.96)', borderRadius: 16, padding: '28px 20px', border: '1px solid rgba(28,184,91,0.2)', animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ width: 36, height: 36, border: '3px solid rgba(28,184,91,0.2)', borderTopColor: '#1cb85b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#f1fcf3' }}>Sorteando times…</p>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Distribuindo jogadores por posição e nível</p>
                </div>
              )}

              {/* Banner: times definidos */}
              {teamsDrawn && !drawingAnim && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(28,184,91,0.08)', border: '1px solid rgba(28,184,91,0.25)', borderRadius: 14, padding: '12px 16px' }}>
                  <span style={{ fontSize: 20 }}>🎉</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#1cb85b', marginBottom: 2 }}>Times definidos!</p>
                    <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                      {teams.teamA.length}v{teams.teamB.length} · Sorteio automático por posição e nível
                    </p>
                  </div>
                  {isAdmin && (
                    <button onClick={handleRedraw} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--on-surface-variant)', borderRadius: 8, fontSize: 11, padding: '5px 10px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>
                      ↺ Refazer
                    </button>
                  )}
                </div>
              )}

              {/* Feedback admin (toast inline) */}
              {presenceFeedback && (
                <div style={{ background: presenceFeedback.type === 'success' ? 'rgba(28,184,91,0.1)' : 'rgba(255,115,81,0.1)', border: `1px solid ${presenceFeedback.type === 'success' ? 'rgba(28,184,91,0.25)' : 'rgba(255,115,81,0.25)'}`, color: presenceFeedback.type === 'success' ? '#1cb85b' : '#ff7351', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>{presenceFeedback.type === 'success' ? 'check_circle' : 'info'}</span>
                  {presenceFeedback.message}
                </div>
              )}

              {/* Banner admin */}
              {isAdmin && (
                <div style={{ background: 'rgba(178,153,255,0.08)', border: '1px solid rgba(178,153,255,0.2)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, color: '#b299ff', fontSize: 12, fontWeight: 700 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                  Modo admin — controle de presença ativo
                </div>
              )}

              {/* ── GRID DE TIMES (quando sorteio foi feito) ── */}
              {teamsDrawn && !drawingAnim && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
                  {displayTeams.map((team, ti) => (
                    <div key={ti}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: ti === 0 ? '#1cb85b' : '#e8f5ef', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {ti === 0 ? '🟢 Verde' : '⚪ Branco'}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>{team.length} jog.</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {team.map((p, i) => <TeamPlayerRow key={p.id || p.user_id || i} rsvp={p} />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── ESCALAÇÃO NORMAL (antes do sorteio) ── */}
              {!teamsDrawn && !drawingAnim && (
                <>
                  {/* Nota aguardando completar */}
                  {confirmedCount < match.total_slots && (
                    <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: 'rgba(245,158,11,0.9)', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>hourglass_empty</span>
                      O sorteio automático de times acontecerá quando todos os {match.total_slots} slots forem preenchidos.
                    </div>
                  )}

                  {/* Suplentes pendentes */}
                  {(() => {
                    const pendingSubs = confirmedRsvps.filter(r => r.status === 'INVITED')
                    if (!pendingSubs.length) return null
                    return (
                      <div>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f8a010', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>pending</span>
                          Suplentes convidados ({pendingSubs.length})
                        </h3>
                        {pendingSubs.map((r, i) => (
                          <div key={r.id || `sub-${i}`} style={{ marginBottom: 6 }}>
                            <PlayerPresenceRow rsvp={r} isAdmin={isAdmin} onMarkNoShow={handleMarkNoShow} onConfirmGuest={handleConfirmGuest} loadingId={presenceLoading} />
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Confirmados */}
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>groups</span>
                    Confirmados ({confirmedRsvps.filter(r => r.status === 'CONFIRMED').length}/{match.total_slots})
                  </h3>

                  {confirmedRsvps.filter(r => r.status === 'CONFIRMED' || r.status === 'NO_SHOW').map((r, i) => (
                    <PlayerPresenceRow key={r.id || i} rsvp={r} isAdmin={isAdmin} onMarkNoShow={handleMarkNoShow} onConfirmGuest={handleConfirmGuest} loadingId={presenceLoading} />
                  ))}

                  {/* Vagas vazias */}
                  {Array.from({ length: Math.max(0, match.total_slots - confirmedRsvps.filter(r => r.status === 'CONFIRMED').length) }).map((_, i) => (
                    <div key={`empty-${i}`} style={{ background: 'var(--surface-container-low)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, opacity: 0.4, border: '1px dashed rgba(64,74,68,0.4)' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--outline)' }}>person_outline</span>
                      </div>
                      <p style={{ color: 'var(--outline)', fontSize: 13 }}>Vaga disponível</p>
                    </div>
                  ))}

                  {/* Ações admin */}
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button onClick={handleCopyInvite} style={{ flex: 1, background: 'rgba(28,184,91,0.1)', border: '1px solid rgba(28,184,91,0.25)', color: '#1cb85b', borderRadius: 10, fontSize: 12, fontWeight: 700, padding: '10px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>link</span>
                        {copied ? 'Link copiado!' : 'Copiar convite'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ════════════════════════════════ LOCAL ════════════════════════════════ */}
          {tab === 'local' && <LocalTab match={match} />}

          {/* ════════════════════════════════ SUBSTITUTO ════════════════════════════════ */}
          {tab === 'sub' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(28,184,91,0.06)', border: '1px solid rgba(28,184,91,0.15)', borderRadius: 20, padding: 20 }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#1cb85b', marginBottom: 8 }}>
                  Radar de Substitutos
                </h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>
                  Encontre jogadores disponíveis próximos à quadra via Google Maps em tempo real.
                </p>
              </div>
              <button
                onClick={() => navigate('/substituto')}
                style={{ width: '100%', background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 24px rgba(28,184,91,0.25)' }}
              >
                <span className="material-symbols-outlined">radar</span>
                Abrir Radar
              </button>
              <button
                onClick={() => navigate(`/chat/${match.id}`)}
                style={{ width: '100%', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              >
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
