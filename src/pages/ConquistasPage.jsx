import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { achievementService } from '../services/achievementService.js'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const MOCK_ACHIEVEMENTS = [
  { id: 'a1', unlocked: true,  rare: true,  xp: 500, icon: 'emoji_events', label: 'Craque',    desc: 'Eleito o melhor da partida por 5 vezes consecutivas.', color: 'var(--secondary)' },
  { id: 'a2', unlocked: true,  rare: false, xp: 300, icon: 'sports_soccer',label: 'Artilheiro',desc: 'Maior goleador de uma pelada.',     color: 'var(--error)' },
  { id: 'a3', unlocked: true,  rare: false, xp: 250, icon: 'groups',        label: 'Passador', desc: '10 assistências em uma temporada.',  color: '#38BDF8' },
  { id: 'a4', unlocked: false, rare: false, xp: 300, icon: 'shield',        label: 'Defensor', desc: 'Participe de 10 jogos como zagueiro.', progress: { curr: 6, max: 10 } },
  { id: 'a5', unlocked: true,  rare: false, xp: 150, icon: 'schedule',      label: 'Pontual',  desc: 'Nunca faltou a uma pelada confirmada.', color: 'var(--primary)' },
  { id: 'a6', unlocked: false, rare: false, xp: 250, icon: 'verified_user', label: 'Confiável',desc: 'Receba nota <4.5 em 20 jogos.', progress: { curr: 5, max: 20 } },
  { id: 'a7', unlocked: false, rare: false, xp: 200, icon: 'footprint',     label: 'Bom Jogador', desc: 'Complete 50 partidas no app.', progress: { curr: 0, max: 50 } },
]

const FILTERS = ['Todas', 'Desbloqueadas', 'Bloqueadas', 'Raras']

export default function ConquistasPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('Todas')
  const [achievements, setAchievements] = useState(MOCK_ACHIEVEMENTS)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    if (!user) return
    achievementService.getAll(user.id)
      .then(data => {
        if (data?.length) {
          // Map real schema fields to page-expected format
          setAchievements(data.map(a => ({
            id: a.id,
            unlocked: a.unlocked,
            rare: a.is_rare,
            xp: a.xp_reward ?? 100,
            icon: a.icon ?? 'emoji_events',
            label: a.name,
            desc: a.description,
            color: a.is_rare ? 'var(--secondary)' : 'var(--primary)',
          })))
        }
      })
      .catch(() => {})
  }, [user])

  const totalXp = achievements.filter(a => a.unlocked).reduce((acc, a) => acc + (a.xp || 0), 0)
  const unlocked = achievements.filter(a => a.unlocked).length
  const filtered = {
    'Todas': achievements,
    'Desbloqueadas': achievements.filter(a => a.unlocked),
    'Bloqueadas': achievements.filter(a => !a.unlocked),
    'Raras': achievements.filter(a => a.rare),
  }[filter]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      {/* Fixed background grid texture */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(to right, rgba(28,184,91,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,184,91,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      {/* Glow blobs */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: 384, height: 384, background: 'rgba(105,245,143,0.08)', filter: 'blur(120px)', borderRadius: '50%', transform: 'translate(50%, -50%)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: 384, height: 384, background: 'rgba(248,160,16,0.04)', filter: 'blur(120px)', borderRadius: '50%', transform: 'translate(-50%, 50%)', zIndex: 0, pointerEvents: 'none' }} />

      <TopBar title="Conquistas" showBack />

      <main style={{ flex: 1, padding: '20px 16px 100px', maxWidth: 640, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Hero */}
        <section style={{ marginBottom: 28 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--secondary)', marginBottom: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>star</span>
            Nível 4 — Jogador Veterano
          </span>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 52, letterSpacing: '-0.04em', lineHeight: 0.9, textTransform: 'uppercase' }}>CONQUISTAS</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 16, marginTop: 12 }}>Cada partida te aproxima de uma nova conquista.</p>

          {/* XP card */}
          <div style={{ background: 'var(--surface-container-low)', borderRadius: 20, padding: 24, marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--on-surface-variant)', marginBottom: 4 }}>XP Total</p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: 'var(--primary)' }}>{totalXp.toLocaleString('pt-BR')}</p>
              </div>
              <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Próxima: <strong style={{ color: 'var(--on-surface)' }}>260 XP</strong></span>
            </div>
            <div style={{ height: 10, background: 'var(--surface-container)', borderRadius: 999, overflow: 'hidden' }}>
              <div className="xp-bar-shimmer" style={{ height: '100%', width: '82%', borderRadius: 999 }} />
            </div>
            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 20 }}>
              {[{ val: unlocked, label: 'Desbloqueadas', color: 'var(--primary)' }, { val: achievements.length - unlocked, label: 'Bloqueadas', color: 'rgba(241,252,243,0.3)' }, { val: totalXp > 1000 ? `${(totalXp/1000).toFixed(1)}k` : totalXp, label: 'XP Acumulados', color: 'var(--tertiary)' }].map(s => (
                <div key={s.label} style={{ background: 'var(--surface-container)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: s.color }}>{s.val}</p>
                  <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }} className="no-scrollbar">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', border: 'none', cursor: 'pointer', background: filter === f ? 'var(--primary)' : 'var(--surface-container-high)', color: filter === f ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {filtered.map((a, i) => {
            const featured = a.rare && i === 0 && filter === 'Todas'
            return (
              <div key={a.id} onClick={() => setDetail(a)} style={{ gridColumn: featured ? 'span 2' : 'span 1', background: a.unlocked ? 'var(--surface-container-high)' : 'var(--surface-container)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', opacity: a.unlocked ? 1 : 0.65, filter: a.unlocked ? 'none' : 'grayscale(0.4)', transition: 'all 0.2s', position: 'relative', overflow: 'hidden', border: a.rare ? '2px solid rgba(248,160,16,0.25)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = a.unlocked ? 'var(--surface-bright)' : 'var(--surface-container-high)'}
                onMouseLeave={e => e.currentTarget.style.background = a.unlocked ? 'var(--surface-container-high)' : 'var(--surface-container)'}
              >
                {featured && <div style={{ position: 'absolute', top: -40, right: -40, width: 128, height: 128, background: 'rgba(248,160,16,0.08)', borderRadius: '50%', filter: 'blur(30px)' }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                  <div style={{ background: a.rare ? 'rgba(133,83,0,0.3)' : `${a.color || 'var(--primary)'}18`, padding: 12, borderRadius: 14 }}>
                    <span className="material-symbols-outlined" style={{ color: a.color || 'var(--primary)', fontSize: featured ? 44 : 28, fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {a.rare && <span style={{ background: 'var(--secondary)', color: 'var(--on-secondary)', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>RARA</span>}
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, color: 'var(--primary)' }}>+{a.xp} XP</span>
                  </div>
                </div>
                <div style={{ marginTop: featured ? 28 : 20 }}>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: featured ? 28 : 16, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>{a.label}</h3>
                  {featured && <p style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>{a.desc}</p>}
                  {a.unlocked ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(105,245,143,0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginTop: 10 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Desbloqueada
                    </div>
                  ) : a.progress ? (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ height: 4, background: 'var(--surface-container-highest)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(a.progress.curr/a.progress.max)*100}%`, background: 'var(--on-surface-variant)', borderRadius: 999 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)' }}>Progresso</span>
                        <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.progress.curr}/{a.progress.max}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </section>
      </main>

      {/* Detail bottom sheet */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setDetail(null)}>
          <div style={{ width: '100%', background: 'var(--surface-container-high)', borderRadius: '32px 32px 0 0', padding: '32px 24px 48px', border: '1px solid rgba(28,184,91,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 6, background: 'rgba(64,74,68,0.4)', borderRadius: 999, margin: '0 auto 28px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 88, height: 88, background: `${detail.color || 'var(--secondary)'}22`, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ color: detail.color || 'var(--secondary)', fontSize: 52, fontVariationSettings: "'FILL' 1" }}>{detail.icon}</span>
                <div style={{ position: 'absolute', bottom: -10, background: 'var(--primary)', color: 'var(--on-primary-container)', padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>+{detail.xp} XP</div>
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, textTransform: 'uppercase', letterSpacing: '-0.04em', marginBottom: 12 }}>{detail.label}</h3>
              <p style={{ color: 'var(--on-surface-variant)', maxWidth: 280, marginBottom: 28 }}>{detail.desc}</p>
              <button onClick={() => setDetail(null)} style={{ width: '100%', background: 'var(--primary)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, textTransform: 'uppercase', fontSize: 15, padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer' }}>
                {detail.unlocked ? 'COMPARTILHAR VITÓRIA' : 'FECHAR'}
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}
