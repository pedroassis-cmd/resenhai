import { useAuth } from '../context/AuthContext.jsx'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const MOCK_STATS = { total_matches: 0, total_goals: 0, total_assists: 0, total_wins: 0, skill_score: 0 }

const BAR_DATA = [
  { day: 'Seg', pct: 40, active: false, amber: false },
  { day: 'Ter', pct: 70, active: false, amber: true },
  { day: 'Qua', pct: 55, active: false, amber: false },
  { day: 'Qui', pct: 90, active: true,  amber: false },
  { day: 'Sex', pct: 30, active: false, amber: false },
  { day: 'Sáb', pct: 80, active: false, amber: true },
  { day: 'Dom', pct: 20, active: false, amber: false },
]

const MOCK_HISTORY = [
  { id: 1, venue: 'Arena Gol de Placa', date: '22 Mar', time: '19h', score: '3×1', result: 'V', label: 'Vitória',  color: '#1cb85b' },
  { id: 2, venue: 'Quadra do Parque',   date: '19 Mar', time: '20h', score: '1×2', result: 'D', label: 'Derrota',  color: '#ff7351' },
  { id: 3, venue: 'Society Arena',      date: '15 Mar', time: '18h', score: '2×2', result: 'E', label: 'Empate',   color: '#f8a010' },
]

export default function PainelStatsPage() {
  const { user, profile } = useAuth()

  const stats = profile
    ? {
        total_matches: profile.total_matches ?? 0,
        total_goals:   profile.total_goals   ?? 0,
        total_assists: profile.total_assists  ?? 0,
        total_wins:    profile.total_wins     ?? 0,
        skill_score:   profile.skill_score    ?? 0,
      }
    : MOCK_STATS

  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Jogador'

  const statCards = [
    { label: 'Partidas',      value: stats.total_matches, color: 'var(--primary)',   icon: 'sports_soccer' },
    { label: 'Gols',          value: stats.total_goals,   color: 'var(--secondary)', icon: 'workspace_premium' },
    { label: 'Assistências',  value: stats.total_assists, color: '#38BDF8',          icon: 'handshake' },
    { label: 'Vitórias',      value: stats.total_wins,    color: 'var(--tertiary)',  icon: 'military_tech' },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', paddingBottom: 90, display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, padding: '24px 20px 0', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        {/* Welcome */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, fontWeight: 500 }}>Bom jogo, {displayName} ⚡</p>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>Seu Painel</h1>
        </section>

        {/* Stats grid 2x2 */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: 'var(--surface-container-high)', borderRadius: 20, padding: 20, borderTop: `4px solid ${s.color}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -16, bottom: -16, opacity: 0.05 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 80, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{s.label}</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 48, color: s.color, marginTop: 8, lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </section>

        {/* Performance section */}
        <section style={{ background: 'var(--surface-container-highest)', borderRadius: 24, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Desempenho Geral</h2>
              <span style={{ background: 'rgba(105,245,143,0.1)', color: 'var(--primary)', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Top 5% Rank</span>
            </div>

            {/* Bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, gap: 8 }}>
              {BAR_DATA.map(b => (
                <div key={b.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${b.pct}%`, background: b.active ? 'var(--primary)' : b.amber ? 'var(--secondary)' : 'var(--surface-container)', borderRadius: '6px 6px 0 0', transition: 'height 0.6s ease' }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: (b.active || b.amber) ? 'var(--on-surface)' : 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.day}</span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Match history */}
        <section style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.03em' }}>Partidas passadas</h2>
            <button style={{ color: 'var(--primary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}>Ver tudo</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MOCK_HISTORY.map(h => (
              <div key={h.id} style={{ background: 'var(--surface-container)', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${h.color}40`, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${h.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, color: h.color }}>{h.result}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{h.venue}</p>
                    <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{h.date} · {h.time}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: h.color }}>{h.score}</p>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h.label}</p>
                  </div>
                  <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 20 }}>chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}
