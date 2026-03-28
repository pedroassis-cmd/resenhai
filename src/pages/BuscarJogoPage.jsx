import { useState, useEffect } from 'react'
import { matchService } from '../services/matchService.js'
import { joinRequestService } from '../services/radarService.js'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const FORMAT_FILTERS = [
  { id: 'ALL', label: 'Todos' }, { id: 'FUTSAL_5V5', label: '5v5' },
  { id: 'SOCIETY_7V7', label: '7v7' }, { id: 'FIELD_11V11', label: '11v11' }
]

const FORMAT_LABEL = { FUTSAL_5V5: '5v5 Futsal', SOCIETY_7V7: '7v7 Society', FIELD_11V11: '11v11 Campo', BEACH_SOCCER: 'Beach Soccer', CUSTOM: 'Personalizado' }

const MOCK_PUBLIC = [
  { id: 'pub1', title: 'Racha Aberto da Quarta', format: 'FUTSAL_5V5', status: 'OPEN', scheduled_at: new Date(Date.now() + 86400000).toISOString(), total_slots: 10, rsvps: [{ count: 7 }], venue: { name: 'Quadra Central' }, distance: 0.8 },
  { id: 'pub2', title: 'Society da Comunidade', format: 'SOCIETY_7V7', status: 'OPEN', scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(), total_slots: 14, rsvps: [{ count: 11 }], custom_address: 'Society do Vale', distance: 2.1 },
  { id: 'pub3', title: 'Pelada do Parque', format: 'FIELD_11V11', status: 'OPEN', scheduled_at: new Date(Date.now() + 86400000 * 5).toISOString(), total_slots: 22, rsvps: [{ count: 19 }], venue: { name: 'Pacaembu Field' }, distance: 4.3 },
]

export default function BuscarJogoPage() {
  const [format, setFormat] = useState('ALL')
  const [matches, setMatches] = useState(MOCK_PUBLIC)
  const [loading, setLoading] = useState(false)
  const [sentRequests, setSentRequests] = useState({})

  useEffect(() => {
    setLoading(true)
    matchService.listPublicMatches({ formatFilter: format })
      .then(data => { if (data?.length) setMatches(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [format])

  async function handleRequest(matchId) {
    setSentRequests(prev => ({ ...prev, [matchId]: 'loading' }))
    try {
      await joinRequestService.sendJoinRequest(matchId, 'Quero participar!')
      setSentRequests(prev => ({ ...prev, [matchId]: 'sent' }))
    } catch {
      setSentRequests(prev => ({ ...prev, [matchId]: 'sent' }))
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, padding: '24px 20px 100px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', textTransform: 'uppercase', marginBottom: 8 }}>Buscar Jogo</h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginBottom: 24 }}>Partidas abertas perto de você</p>

        {/* Format filter */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }} className="no-scrollbar">
          {FORMAT_FILTERS.map(f => (
            <button key={f.id} onClick={() => setFormat(f.id)} style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', border: 'none', cursor: 'pointer', background: format === f.id ? 'var(--primary-container)' : 'var(--surface-container-high)', color: format === f.id ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Match list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {matches.map(m => {
            const dt = m.scheduled_at ? new Date(m.scheduled_at) : null
            const dateStr = dt ? dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) : '—'
            const timeStr = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
            const count = m.rsvps?.[0]?.count ?? m.rsvps?.length ?? 0
            const available = m.total_slots - count
            const reqState = sentRequests[m.id]
            return (
              <div key={m.id} style={{ background: 'var(--surface-container)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>{m.title}</h3>
                    <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>{FORMAT_LABEL[m.format] || m.format}</p>
                  </div>
                  {m.distance && (
                    <span style={{ background: 'rgba(28,184,91,0.1)', color: '#69f58f', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(105,245,143,0.2)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {m.distance.toFixed(1)} km
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--on-surface-variant)', fontSize: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                    {dateStr} · {timeStr}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--on-surface-variant)', fontSize: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                    {m.venue?.name || m.custom_address}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ height: 6, width: 80, background: 'var(--surface-container-high)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(count/m.total_slots)*100}%`, background: available > 3 ? '#1cb85b' : '#f8a010', borderRadius: 999, transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: available > 3 ? '#1cb85b' : '#f8a010' }}>{available} vagas</span>
                  </div>
                  {reqState === 'sent' ? (
                    <span style={{ fontSize: 12, color: '#1cb85b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                      Solicitado
                    </span>
                  ) : (
                    <button onClick={() => handleRequest(m.id)} disabled={reqState === 'loading' || available <= 0} style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', opacity: available <= 0 ? 0.5 : 1 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                      {reqState === 'loading' ? '...' : 'Solicitar'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
