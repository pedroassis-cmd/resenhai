import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { matchService } from '../services/matchService.js'
import TopBar from '../components/shared/TopBar.jsx'
import MatchCard from '../components/shared/MatchCard.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const MOCK_MATCHES = [
  { id: 'mock-1', title: 'Pelada do Sábado', format: 'SOCIETY_7V7', status: 'OPEN', scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(), total_slots: 14, rsvps: [{ count: 9 }], venue: { name: 'Arena Gol de Placa' } },
  { id: 'mock-2', title: 'Racha da Quarta', format: 'FUTSAL_5V5', status: 'CONFIRMED', scheduled_at: new Date(Date.now() + 86400000 * 5).toISOString(), total_slots: 10, rsvps: [{ count: 10 }], venue: { name: 'Quadra do Parque' } },
]

export default function HomePartidasPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [matches, setMatches] = useState(MOCK_MATCHES)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    matchService.listMatches()
      .then(data => { if (data?.length) setMatches(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const filters = [
    { id: 'ALL', label: 'Todas' },
    { id: 'OPEN', label: 'Abertas' },
    { id: 'CONFIRMED', label: 'Confirmadas' },
    { id: 'FINISHED', label: 'Finalizadas' },
  ]

  // Never show CANCELLED matches regardless of active filter
  const visible = matches.filter(m => m.status !== 'CANCELLED')
  const filtered = filter === 'ALL' ? visible : visible.filter(m => m.status === filter)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, padding: '24px 20px 100px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, fontWeight: 500 }}>
            Olá, {profile?.display_name || user?.user_metadata?.display_name || 'Jogador'} 👋
          </p>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', textTransform: 'uppercase', marginTop: 4 }}>Suas Partidas</h1>
        </section>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }} className="no-scrollbar">
          {filters.map(f => (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </main>

      {/* FAB */}
      <button onClick={() => navigate('/criar-partida')} style={{ position: 'fixed', bottom: 100, right: 20, width: 56, height: 56, borderRadius: '50%', background: '#1cb85b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(28,184,91,0.4)', zIndex: 40, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#5ae682'}
        onMouseLeave={e => e.currentTarget.style.background = '#1cb85b'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>add</span>
      </button>

      <BottomNav />
    </div>
  )
}
