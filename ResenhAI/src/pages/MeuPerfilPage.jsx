import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { authService } from '../services/authService.js'
import { profileService } from '../services/profileService.js'
import { achievementService } from '../services/achievementService.js'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const FALLBACK_ACHIEVEMENTS = [
  { icon: 'military_tech', label: 'Artilheiro', color: 'var(--primary)' },
  { icon: 'verified',      label: 'Confiável',  color: 'var(--secondary)' },
  { icon: 'history_edu',   label: 'Veterano',   color: 'var(--tertiary)' },
]

export default function MeuPerfilPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [seeking, setSeeking] = useState(false)
  const [seekingLoading, setSeekingLoading] = useState(false)
  const [previewAchievements, setPreviewAchievements] = useState(FALLBACK_ACHIEVEMENTS)

  // Initialize seeking toggle from real profile
  useEffect(() => {
    if (profile?.is_available != null) setSeeking(profile.is_available)
  }, [profile])

  // Load real achievements for preview (up to 3 unlocked)
  useEffect(() => {
    if (!user) return
    achievementService.getAll(user.id)
      .then(data => {
        if (data?.length) {
          const unlocked = data
            .filter(a => a.unlocked)
            .slice(0, 3)
            .map(a => ({
              icon: a.icon ?? 'emoji_events',
              label: a.name,
              color: a.is_rare ? 'var(--secondary)' : 'var(--primary)',
            }))
          if (unlocked.length > 0) setPreviewAchievements(unlocked)
        }
      })
      .catch(() => {})
  }, [user])

  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Jogador'
  const initials = displayName.substring(0, 2).toUpperCase()
  const position = { GOALKEEPER: 'GOLEIRO', DEFENDER: 'ZAGUEIRO', MIDFIELDER: 'MEIA', FORWARD: 'ATACANTE', ANY: 'GERAL' }[profile?.primary_position] || 'MEIA'
  const level = Math.max(1, Math.floor((profile?.total_matches || 0) / 5) + 1)
  const rating = ((profile?.skill_score != null ? Number(profile.skill_score) : 7.5) / 2).toFixed(1) // convert 0-10 score to 0-5 display
  const city = profile?.city || ''

  async function handleLogout() {
    await authService.signOut()
    navigate('/login')
  }

  async function toggleSeeking() {
    setSeekingLoading(true)
    const newVal = !seeking
    try {
      await profileService.setAvailable(user.id, newVal)
      setSeeking(newVal)
    } catch { /* revert optimistic update on error */ }
    finally { setSeekingLoading(false) }
  }

  const menuItems = [
    { icon: 'settings', label: 'Configurações da Conta', path: '/configuracoes' },
    { icon: 'history',  label: 'Histórico de Jogos',     path: '/stats' },
    { icon: 'help',     label: 'Suporte e FAQ',           path: '/ajuda' },
    { icon: 'workspace_premium', label: 'Planos Premium', path: '/planos' },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, padding: '24px 20px 100px', maxWidth: 640, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Profile header */}
        <section>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#1cb85b', outline: '4px solid rgba(105,245,143,0.1)', overflow: 'hidden' }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: '-0.04em', textTransform: 'uppercase', color: '#69f58f', lineHeight: 1 }}>{displayName}</h1>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, marginTop: 4 }}>Sempre pronto pro próximo racha.</p>
            </div>
          </div>
          {/* Stat badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { icon: 'sports_soccer', label: position, color: 'var(--primary)' },
              city ? { icon: 'location_on', label: city, color: 'var(--secondary)' } : null,
              { icon: 'star', label: `${rating}★`, color: 'var(--secondary)', fill: true },
            ].filter(Boolean).map(b => (
              <span key={b.label} style={{ background: 'var(--surface-container-high)', padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(64,74,68,0.1)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: b.color, fontVariationSettings: b.fill ? "'FILL' 1" : "'FILL' 0" }}>{b.icon}</span>
                {b.label}
              </span>
            ))}
          </div>
          <button onClick={() => navigate('/configuracoes')} style={{ width: '100%', background: 'rgba(64,74,68,0.25)', padding: '12px 0', borderRadius: 12, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s', border: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(64,74,68,0.4)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(64,74,68,0.25)'}
          >Editar Perfil</button>
        </section>

        {/* Seeking toggle */}
        <section style={{ background: 'rgba(105,245,143,0.06)', border: '1px solid rgba(105,245,143,0.15)', padding: 20, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--primary)', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.02em' }}>Buscando Partida</h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, fontWeight: 500, marginTop: 4 }}>Disponível para convites de substituição</p>
          </div>
          <button onClick={toggleSeeking} disabled={seekingLoading} style={{ width: 52, height: 30, background: seeking ? 'var(--primary)' : 'var(--surface-container-highest)', borderRadius: 999, position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, left: seeking ? 'calc(100% - 27px)' : 3, width: 24, height: 24, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
          </button>
        </section>

        {/* Achievements grid */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Conquistas</h2>
            <span onClick={() => navigate('/conquistas')} style={{ color: 'var(--primary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>Ver Todas</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {previewAchievements.map(a => (
              <div key={a.label} style={{ background: 'var(--surface-container-low)', padding: 16, borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: '1px solid rgba(64,74,68,0.06)' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: a.color, fontSize: 28, fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.01em', textAlign: 'center' }}>{a.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Menu links */}
        <section style={{ background: 'var(--surface-container)', borderRadius: 20, overflow: 'hidden' }}>
          {menuItems.map((item, i) => (
            <button key={item.path} onClick={() => navigate(item.path)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '18px 20px', background: 'transparent', borderTop: i > 0 ? '1px solid rgba(64,74,68,0.15)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-variant)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 22 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</span>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 20 }}>chevron_right</span>
            </button>
          ))}
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '18px 20px', background: 'transparent', borderTop: '1px solid rgba(64,74,68,0.15)', cursor: 'pointer', transition: 'background 0.15s', gap: 14 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,115,81,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--error-dim)' }}>logout</span>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--error-dim)' }}>Sair</span>
          </button>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}
