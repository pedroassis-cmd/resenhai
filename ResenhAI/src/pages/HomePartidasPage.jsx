import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { matchService } from '../services/matchService.js'
import { rsvpService } from '../services/rsvpService.js'
import TopBar from '../components/shared/TopBar.jsx'
import MatchCard from '../components/shared/MatchCard.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const MOCK_MATCHES = [
  { id: 'mock-1', title: 'Pelada do Sábado', format: 'SOCIETY_7V7', status: 'OPEN', organizer_id: 'dev-user', scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(), total_slots: 14, rsvps: [{ count: 9 }], venue: { name: 'Arena Gol de Placa' } },
  { id: 'mock-2', title: 'Racha da Quarta', format: 'FUTSAL_5V5', status: 'CONFIRMED', organizer_id: 'other-user', scheduled_at: new Date(Date.now() + 86400000 * 5).toISOString(), total_slots: 10, rsvps: [{ count: 10 }], venue: { name: 'Quadra do Parque' } },
]

const FILTERS = [
  { id: 'ALL',       label: 'Todas' },
  { id: 'OPEN',      label: 'Abertas' },
  { id: 'CONFIRMED', label: 'Confirmadas' },
  { id: 'FINISHED',  label: 'Finalizadas' },
]

export default function HomePartidasPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [matches, setMatches] = useState(MOCK_MATCHES)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter]   = useState('ALL')

  // ── Confirmation modal state ─────────────────────────────────────────────────
  const [modal, setModal] = useState(null) // { type: 'delete'|'leave', match }
  const [actionLoading, setActionLoading] = useState(false)

  const fetchMatches = useCallback(() => {
    if (!user) return
    setLoading(true)
    matchService.listMatches()
      .then(data => { if (data?.length) setMatches(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => { fetchMatches() }, [fetchMatches])

  // Remove canceladas e aplica filtro de status
  const visible  = matches.filter(m => m.status !== 'CANCELLED')
  const filtered = filter === 'ALL' ? visible : visible.filter(m => m.status === filter)

  // ── Separação: partidas que organizo vs. que participo ─────────────────────
  const myUserId  = user?.id || 'dev-user'
  const iOrganize = filtered.filter(m => m.organizer_id === myUserId)
  const iJoined   = filtered.filter(m => m.organizer_id !== myUserId)
  // ──────────────────────────────────────────────────────────────────────────

  function openDeleteModal(e, match) {
    e.stopPropagation()
    setModal({ type: 'delete', match })
  }

  function openLeaveModal(e, match) {
    e.stopPropagation()
    setModal({ type: 'leave', match })
  }

  async function handleConfirm() {
    if (!modal) return
    setActionLoading(true)
    try {
      if (modal.type === 'delete') {
        await matchService.deleteMatch(modal.match.id)
      } else {
        await rsvpService.remove(modal.match.id, myUserId)
      }
      setModal(null)
      fetchMatches()
    } catch (err) {
      console.error(err)
      alert('Erro ao executar a ação. Tente novamente.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, padding: '24px 20px 100px', maxWidth: 640, margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, fontWeight: 500 }}>
            Olá, {profile?.display_name || user?.user_metadata?.display_name || 'Jogador'} 👋
          </p>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', textTransform: 'uppercase', marginTop: 4 }}>
            Suas Partidas
          </h1>
        </section>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }} className="no-scrollbar">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: 'pointer', background: filter === f.id ? 'var(--primary-container)' : 'var(--surface-container-high)', color: filter === f.id ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Matches list */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: 40 }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>⚽</span>
            <p style={{ color: 'var(--on-surface-variant)', fontWeight: 600 }}>Nenhuma partida encontrada</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── Seção: Que eu organizo ──────────────────────────────────── */}
            {iOrganize.length > 0 && (
              <section>
                <SectionHeader label="Que eu organizo" count={iOrganize.length} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {iOrganize.map(m => (
                    <MatchCardWithAction
                      key={m.id}
                      match={m}
                      actionType="delete"
                      onAction={(e) => openDeleteModal(e, m)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Seção: Que participo ────────────────────────────────────── */}
            {iJoined.length > 0 && (
              <section>
                <SectionHeader label="Que participo" count={iJoined.length} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {iJoined.map(m => (
                    <MatchCardWithAction
                      key={m.id}
                      match={m}
                      actionType="leave"
                      onAction={(e) => openLeaveModal(e, m)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Fallback: sem organizer_id (dados legados sem separação) */}
            {iOrganize.length === 0 && iJoined.length === 0 && filtered.map(m => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </main>

      {/* FAB — criar partida */}
      <button
        onClick={() => navigate('/criar-partida')}
        style={{ position: 'fixed', bottom: 100, right: 20, width: 56, height: 56, borderRadius: '50%', background: '#1cb85b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(28,184,91,0.4)', zIndex: 40, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#5ae682'}
        onMouseLeave={e => e.currentTarget.style.background = '#1cb85b'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>add</span>
      </button>

      <BottomNav />

      {/* ── Confirmation Modal ────────────────────────────────────────────────── */}
      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface-container)',
              borderRadius: 24, padding: '32px 28px',
              maxWidth: 360, width: '100%',
              display: 'flex', flexDirection: 'column', gap: 16,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            {/* Icon */}
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: modal.type === 'delete' ? 'rgba(255,115,81,0.15)' : 'rgba(248,160,16,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: modal.type === 'delete' ? '#ff7351' : '#f8a010' }}>
                {modal.type === 'delete' ? 'delete_forever' : 'logout'}
              </span>
            </div>

            {/* Title */}
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, textAlign: 'center', letterSpacing: '-0.03em' }}>
              {modal.type === 'delete' ? 'Excluir partida?' : 'Sair da partida?'}
            </h2>

            {/* Body */}
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, textAlign: 'center', lineHeight: 1.5 }}>
              {modal.type === 'delete'
                ? <>Tem certeza que deseja excluir <strong style={{ color: 'var(--on-surface)' }}>{modal.match.title}</strong>? Esta ação não pode ser desfeita.</>
                : <>Tem certeza que deseja sair de <strong style={{ color: 'var(--on-surface)' }}>{modal.match.title}</strong>? Você poderá se inscrever novamente se houver vagas.</>
              }
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setModal(null)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'background 0.2s' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: modal.type === 'delete' ? '#ff7351' : '#f8a010', color: '#fff', fontWeight: 700, fontSize: 14, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1, transition: 'opacity 0.2s' }}
              >
                {actionLoading ? '...' : modal.type === 'delete' ? 'Excluir' : 'Sair'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-componente: cabeçalho de seção ──────────────────────────────────────
function SectionHeader({ label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)' }}>
        {label}
      </span>
      <span style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 999 }}>
        {count}
      </span>
    </div>
  )
}

// ── Sub-componente: MatchCard com botão de ação (lixeira / sair) ─────────────
const CARD_STATUS_COLORS = {
  OPEN:        '#1cb85b',
  CONFIRMED:   '#1cb85b',
  TEAMS_SET:   '#b299ff',
  IN_PROGRESS: '#f8a010',
  FINISHED:    '#a3aea5',
  CANCELLED:   '#ff7351',
  DRAFT:       '#6d7870',
}
const CARD_STATUS_LABELS = {
  OPEN:        'Aberta',
  CONFIRMED:   'Confirmada',
  TEAMS_SET:   'Times Definidos',
  IN_PROGRESS: 'Em Andamento',
  FINISHED:    'Finalizada',
  CANCELLED:   'Cancelada',
  DRAFT:       'Rascunho',
}
const CARD_FORMAT_LABELS = {
  FUTSAL_5V5:  '5v5 Futsal',
  SOCIETY_7V7: '7v7 Society',
  FIELD_11V11: '11v11 Campo',
  BEACH_SOCCER:'Beach Soccer',
  CUSTOM:      'Personalizado',
}

function MatchCardWithAction({ match, actionType, onAction }) {
  const navigate = useNavigate()

  const isDelete  = actionType === 'delete'
  const iconName  = isDelete ? 'delete' : 'logout'
  const iconColor = isDelete ? '#ff7351' : '#f8a010'
  const tooltip   = isDelete ? 'Excluir partida' : 'Sair da partida'

  const statusColor = CARD_STATUS_COLORS[match.status] || '#6d7870'
  const rsvpCount   = match.rsvps?.[0]?.count ?? match.rsvps?.length ?? 0
  const dt          = match.scheduled_at ? new Date(match.scheduled_at) : null
  const dateStr     = dt ? dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) : '—'
  const timeStr     = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
  const rgb         = statusColor.replace('#','').match(/.{2}/g).map(h => parseInt(h,16)).join(',')

  return (
    <div
      onClick={() => navigate(`/partida/${match.id}`)}
      style={{
        background: 'var(--surface-container)',
        borderRadius: 20, padding: '20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        cursor: 'pointer', transition: 'background 0.2s',
        outline: `2px solid rgba(${rgb},0.15)`,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--on-surface)' }}>{match.title}</h3>
          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
            {CARD_FORMAT_LABELS[match.format] || match.format}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            background: `${statusColor}20`,
            color: statusColor, fontSize: 10, fontWeight: 700,
            padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}>
            {CARD_STATUS_LABELS[match.status] || match.status}
          </span>
          {/* Trash / leave button */}
          <button
            title={tooltip}
            onClick={onAction}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: 'none', cursor: 'pointer',
              background: `${iconColor}18`,
              color: iconColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.18s, transform 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${iconColor}35`; e.currentTarget.style.transform = 'scale(1.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = `${iconColor}18`; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{iconName}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--on-surface-variant)', fontSize: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
          {dateStr} {timeStr && `• ${timeStr}`}
        </div>
        {(match.venue?.name || match.custom_address) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--on-surface-variant)', fontSize: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
            {match.venue?.name || match.custom_address}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1cb85b', fontSize: 12, fontWeight: 700 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
          {rsvpCount}/{match.total_slots} vagas
        </div>
      </div>
    </div>
  )
}
