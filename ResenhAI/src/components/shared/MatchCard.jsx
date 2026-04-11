import { useNavigate } from 'react-router-dom'

const STATUS_COLORS = {
  OPEN:        '#1cb85b',
  CONFIRMED:   '#1cb85b',
  TEAMS_SET:   '#b299ff',
  IN_PROGRESS: '#f8a010',
  FINISHED:    '#a3aea5',
  CANCELLED:   '#ff7351',
  DRAFT:       '#6d7870',
}

const STATUS_LABELS = {
  OPEN:        'Aberta',
  CONFIRMED:   'Confirmada',
  TEAMS_SET:   'Times Definidos',
  IN_PROGRESS: 'Em Andamento',
  FINISHED:    'Finalizada',
  CANCELLED:   'Cancelada',
  DRAFT:       'Rascunho',
}

const FORMAT_LABELS = {
  FUTSAL_5V5:  '5v5 Futsal',
  SOCIETY_7V7: '7v7 Society',
  FIELD_11V11: '11v11 Campo',
  BEACH_SOCCER:'Beach Soccer',
  CUSTOM:      'Personalizado',
}

export default function MatchCard({ match }) {
  const navigate = useNavigate()
  const statusColor = STATUS_COLORS[match.status] || '#6d7870'
  const rsvpCount = match.rsvps?.[0]?.count ?? match.rsvps?.length ?? 0

  const dt = match.scheduled_at ? new Date(match.scheduled_at) : null
  const dateStr = dt ? dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) : '—'
  const timeStr = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div
      onClick={() => navigate(`/partida/${match.id}`)}
      style={{
        background: 'var(--surface-container)',
        borderRadius: 20, padding: '20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        cursor: 'pointer', transition: 'background 0.2s',
        outline: `2px solid rgba(${statusColor.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')},0.15)`,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--on-surface)' }}>{match.title}</h3>
          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
            {FORMAT_LABELS[match.format] || match.format}
          </p>
        </div>
        <span style={{
          background: `${statusColor}20`,
          color: statusColor, fontSize: 10, fontWeight: 700,
          padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
        }}>
          {STATUS_LABELS[match.status] || match.status}
        </span>
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
