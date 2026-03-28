import { useState } from 'react'
import { radarService } from '../services/radarService.js'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const POSITIONS = [
  { id: 'ALL', label: 'Todos' }, { id: 'GOALKEEPER', label: 'Goleiro' },
  { id: 'DEFENDER', label: 'Zagueiro' }, { id: 'MIDFIELDER', label: 'Meia' }, { id: 'FORWARD', label: 'Atacante' }
]

const MOCK_PLAYERS = [
  { id: 'p1', profile: { display_name: 'Marcos Silva',   primary_position: 'FORWARD',     skill_score: 4.9, total_matches: 42 }, distance: 1.2, color: '#f8a010' },
  { id: 'p2', profile: { display_name: 'João Santos',    primary_position: 'GOALKEEPER',  skill_score: 4.5, total_matches: 28 }, distance: 2.8, color: '#69f58f' },
  { id: 'p3', profile: { display_name: 'Ricardo Melo',   primary_position: 'MIDFIELDER',  skill_score: 4.2, total_matches: 19 }, distance: 3.5, color: '#b299ff' },
  { id: 'p4', profile: { display_name: 'Felipe Duarte',  primary_position: 'DEFENDER',    skill_score: 3.8, total_matches: 31 }, distance: 4.0, color: '#38BDF8' },
  { id: 'p5', profile: { display_name: 'Bruno Costa',    primary_position: 'MIDFIELDER',  skill_score: 4.7, total_matches: 55 }, distance: 1.9, color: '#f8a010' },
]

const POS_LABEL = { GOALKEEPER: 'Goleiro', DEFENDER: 'Zagueiro', MIDFIELDER: 'Meia', FORWARD: 'Atacante', ANY: 'Geral' }

// status: idle | searching | done
export default function RadarDeSubstitutosPage() {
  const [position, setPosition] = useState('ALL')
  const [status, setStatus]     = useState('idle')   // idle | searching | done
  const [players, setPlayers]   = useState([])
  const [invited, setInvited]   = useState({})        // { [playerId]: boolean }

  async function handleSearch() {
    setStatus('searching')
    try {
      const data = await radarService.getAvailablePlayers({ position })
      setPlayers(data?.length ? data : MOCK_PLAYERS)
    } catch {
      setPlayers(MOCK_PLAYERS)
    } finally {
      setStatus('done')
    }
  }

  async function handleInvite(playerId) {
    setInvited(prev => ({ ...prev, [playerId]: 'sending' }))
    try {
      await radarService.sendRadarCall({ matchId: 'current', targetUserId: playerId, neededPosition: position })
    } catch { /* silent */ }
    setInvited(prev => ({ ...prev, [playerId]: 'sent' }))
  }

  const visible = position === 'ALL'
    ? players
    : players.filter(p => p.profile?.primary_position === position)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, padding: '20px 20px 100px', maxWidth: 640, margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1cb85b' }}>Radar de Jogadores</span>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>Substituto</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, marginTop: 4 }}>Encontre jogadores disponíveis para completar sua pelada</p>
        </div>

        {/* Position filter pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }} className="no-scrollbar">
          {POSITIONS.map(p => (
            <button key={p.id} onClick={() => setPosition(p.id)} style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', border: 'none', cursor: 'pointer', background: position === p.id ? 'var(--primary-container)' : 'var(--surface-container-high)', color: position === p.id ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* IDLE STATE — call-to-action */}
        {status === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 24 }}>
            {/* Decorative radar rings */}
            <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {[1, 0.72, 0.44].map((s, i) => (
                <div key={i} style={{ position: 'absolute', inset: 0, border: `1px solid rgba(28,184,91,${0.08 + i * 0.06})`, borderRadius: '50%', transform: `scale(${s})` }} />
              ))}
              <div className="animate-pulse" style={{ width: 16, height: 16, background: '#1cb85b', borderRadius: '50%', boxShadow: '0 0 24px rgba(105,245,143,0.7)' }} />
            </div>

            <div style={{ textAlign: 'center', maxWidth: 280 }}>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: 1.5 }}>
                Clique abaixo para buscar jogadores disponíveis para substituição na sua região.
              </p>
            </div>

            <button
              onClick={handleSearch}
              style={{ width: '100%', maxWidth: 320, background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '18px 0', borderRadius: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 32px rgba(28,184,91,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span className="material-symbols-outlined">radar</span>
              Procurar Substituto
            </button>
          </div>
        )}

        {/* SEARCHING STATE */}
        {status === 'searching' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 40 }}>
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(28,184,91,0.15)', borderRadius: '50%', animation: 'spin 2s linear infinite' }} />
              <div style={{ position: 'absolute', inset: 6, border: '2px solid rgba(28,184,91,0.3)', borderRadius: '50%', animation: 'spin 1.5s linear infinite reverse' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#1cb85b', fontSize: 28, fontVariationSettings: "'FILL' 1" }}>radar</span>
              </div>
            </div>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, fontWeight: 600 }}>Buscando jogadores próximos...</p>
          </div>
        )}

        {/* DONE STATE — results list */}
        {status === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Results header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                {visible.length} jogador{visible.length !== 1 ? 'es' : ''} encontrado{visible.length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={() => { setStatus('idle'); setPlayers([]); setInvited({}) }}
                style={{ background: 'var(--surface-container-high)', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}
              >
                Nova busca
              </button>
            </div>

            {visible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>😕</span>
                <p style={{ fontWeight: 600 }}>Nenhum jogador encontrado para esta posição</p>
              </div>
            ) : (
              visible.map(p => {
                const invState = invited[p.id]
                const initials = (p.profile?.display_name || 'J').substring(0, 2).toUpperCase()
                const score = Math.round((p.profile?.skill_score || 4.0) * 20)
                return (
                  <div key={p.id} style={{ background: 'var(--surface-container)', borderRadius: 20, padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: `${p.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: p.color, border: `1.5px solid ${p.color}30` }}>
                        {initials}
                      </div>
                      <div style={{ position: 'absolute', bottom: -6, right: -6, background: '#1cb85b', color: '#00290e', fontFamily: 'Syne', fontWeight: 800, fontSize: 10, width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {score}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.profile?.display_name || 'Jogador'}
                      </p>
                      <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, marginTop: 3 }}>
                        {POS_LABEL[p.profile?.primary_position] || '—'} · {p.profile?.total_matches || 0} jogos
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#f8a010', fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)' }}>{(p.profile?.skill_score || 4.0).toFixed(1)}</span>
                        <span style={{ fontSize: 11, color: 'var(--outline)', marginLeft: 8 }}>📍 {(p.distance || 1.0).toFixed(1)} km</span>
                      </div>
                    </div>

                    {/* Action */}
                    {invState === 'sent' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ color: '#1cb85b', fontSize: 28, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#1cb85b', textTransform: 'uppercase' }}>Enviado</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInvite(p.id)}
                        disabled={invState === 'sending'}
                        style={{ flexShrink: 0, background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', padding: '10px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', opacity: invState === 'sending' ? 0.6 : 1 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
                        {invState === 'sending' ? '...' : 'Chamar'}
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
