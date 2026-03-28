import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { authService } from '../services/authService.js'
import { profileService } from '../services/profileService.js'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const POSITIONS = [
  { id: 'GOALKEEPER', label: 'Goleiro' },
  { id: 'DEFENDER',   label: 'Zagueiro' },
  { id: 'MIDFIELDER', label: 'Meia' },
  { id: 'FORWARD',    label: 'Atacante' },
  { id: 'ANY',        label: 'Geral' },
]

const SKILL_LEVELS = [
  { id: 'BEGINNER',     label: 'Iniciante' },
  { id: 'INTERMEDIATE', label: 'Intermediário' },
  { id: 'ADVANCED',     label: 'Avançado' },
  { id: 'PROFESSIONAL', label: 'Profissional' },
]

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} style={{ width: 44, height: 24, background: checked ? 'var(--primary-container)' : 'var(--surface-container-high)', borderRadius: 999, position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0, padding: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: checked ? 'calc(100% - 22px)' : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
    </button>
  )
}

export default function ConfiguracoesPage() {
  const navigate = useNavigate()
  const { user, profile, setProfile } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'success' | 'error'
  const [notifications, setNotifications] = useState({ push: true, marketing: false })
  const [privacy, setPrivacy] = useState({ publicProfile: true, location: false })
  const [twoFactor, setTwoFactor] = useState(true)

  // Form state initialised from real profile
  const [form, setForm] = useState({
    display_name:     '',
    city:             '',
    primary_position: 'MIDFIELDER',
    skill_level:      'INTERMEDIATE',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        display_name:     profile.display_name     || '',
        city:             profile.city             || '',
        primary_position: profile.primary_position || 'MIDFIELDER',
        skill_level:      profile.skill_level      || 'INTERMEDIATE',
      })
    }
  }, [profile])

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSaveProfile() {
    setSaveStatus('saving')
    try {
      const updated = await profileService.updateProfile(user.id, {
        display_name:     form.display_name,
        city:             form.city || null,
        primary_position: form.primary_position,
        skill_level:      form.skill_level,
      })
      setProfile(updated)
      setSaveStatus('success')
      setEditMode(false)
      setTimeout(() => setSaveStatus(null), 3000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  async function handleLogout() {
    await authService.signOut()
    navigate('/login')
  }

  const S = {
    section: { background: 'var(--surface-container)', borderRadius: 20, overflow: 'hidden' },
    row: (border) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderTop: border ? '1px solid rgba(64,74,68,0.15)' : 'none' }),
    rowIcon: { width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container)' },
    chevron: { display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' },
    fieldLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', display: 'block', marginBottom: 6 },
    input: { width: '100%', background: 'var(--surface-container-lowest)', border: '1.5px solid rgba(28,184,91,0.3)', borderRadius: 10, padding: '11px 14px', color: 'var(--on-surface)', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' },
    select: { width: '100%', background: 'var(--surface-container-lowest)', border: '1.5px solid rgba(28,184,91,0.3)', borderRadius: 10, padding: '11px 14px', color: 'var(--on-surface)', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' },
  }

  const avatarInitials = (form.display_name || profile?.display_name || 'U').substring(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Configurações" showBack />
      <main style={{ flex: 1, padding: '28px 20px 100px', maxWidth: 640, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Save feedback toast */}
        {saveStatus === 'success' && (
          <div style={{ background: 'rgba(28,184,91,0.1)', border: '1px solid rgba(28,184,91,0.25)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, color: '#1cb85b', fontWeight: 700, fontSize: 14 }}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Perfil atualizado com sucesso!
          </div>
        )}
        {saveStatus === 'error' && (
          <div style={{ background: 'rgba(255,115,81,0.08)', border: '1px solid rgba(255,115,81,0.2)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--error)', fontWeight: 700, fontSize: 14 }}>
            <span className="material-symbols-outlined">error</span>
            Erro ao salvar. Tente novamente.
          </div>
        )}

        {/* Section: Perfil */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginLeft: 4 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em', color: 'var(--primary)', textTransform: 'uppercase' }}>Perfil</h2>
            {!editMode ? (
              <button onClick={() => setEditMode(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-container-high)', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                Editar
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setEditMode(false); setSaveStatus(null) }} style={{ background: 'var(--surface-container-high)', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
                  Cancelar
                </button>
                <button onClick={handleSaveProfile} disabled={saveStatus === 'saving'} style={{ background: 'var(--primary)', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-primary-container)', boxShadow: '0 4px 16px rgba(28,184,91,0.3)' }}>
                  {saveStatus === 'saving' ? '...' : 'Salvar'}
                </button>
              </div>
            )}
          </div>
          <div style={S.section}>
            <div style={{ padding: 24, display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 88, height: 88, borderRadius: 18, background: 'var(--surface-container-highest)', border: '2px solid rgba(28,184,91,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: '#1cb85b', overflow: 'hidden' }}>
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarInitials}
                </div>
                <button style={{ position: 'absolute', bottom: -8, right: -8, background: 'var(--primary)', color: 'var(--on-primary-container)', width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(28,184,91,0.3)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>photo_camera</span>
                </button>
              </div>

              {/* Fields */}
              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Nome */}
                <div>
                  <label style={S.fieldLabel}>Nome</label>
                  {editMode ? (
                    <input style={S.input} value={form.display_name} onChange={e => setF('display_name', e.target.value)} placeholder="Seu nome" />
                  ) : (
                    <p style={{ color: 'var(--on-surface)', fontSize: 14, fontWeight: 600, paddingLeft: 2 }}>{form.display_name || '—'}</p>
                  )}
                </div>

                {/* Cidade */}
                <div>
                  <label style={S.fieldLabel}>Cidade</label>
                  {editMode ? (
                    <input style={S.input} value={form.city} onChange={e => setF('city', e.target.value)} placeholder="Ex: São Paulo" />
                  ) : (
                    <p style={{ color: 'var(--on-surface)', fontSize: 14, fontWeight: 600, paddingLeft: 2 }}>{form.city || '—'}</p>
                  )}
                </div>

                {/* Posição */}
                <div>
                  <label style={S.fieldLabel}>Posição</label>
                  {editMode ? (
                    <select style={S.select} value={form.primary_position} onChange={e => setF('primary_position', e.target.value)}>
                      {POSITIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  ) : (
                    <p style={{ color: 'var(--on-surface)', fontSize: 14, fontWeight: 600, paddingLeft: 2 }}>
                      {POSITIONS.find(p => p.id === form.primary_position)?.label || '—'}
                    </p>
                  )}
                </div>

                {/* Nível */}
                <div>
                  <label style={S.fieldLabel}>Nível</label>
                  {editMode ? (
                    <select style={S.select} value={form.skill_level} onChange={e => setF('skill_level', e.target.value)}>
                      {SKILL_LEVELS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  ) : (
                    <p style={{ color: 'var(--on-surface)', fontSize: 14, fontWeight: 600, paddingLeft: 2 }}>
                      {SKILL_LEVELS.find(s => s.id === form.skill_level)?.label || '—'}
                    </p>
                  )}
                </div>

                {/* E-mail (read-only) */}
                <div>
                  <label style={S.fieldLabel}>E-mail</label>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, paddingLeft: 2 }}>{user?.email || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Segurança */}
        <section>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 }}>Segurança</h2>
          <div style={S.section}>
            <div style={{ ...S.row(false), cursor: 'pointer' }}>
              <div style={S.chevron}>
                <div style={{ ...S.rowIcon, background: 'var(--surface-container)' }}><span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>lock_reset</span></div>
                <div><p style={{ fontWeight: 700, fontSize: 14 }}>Alterar Senha</p><p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Enviar link de redefinição por e-mail</p></div>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 20 }}>chevron_right</span>
            </div>
            <div style={S.row(true)}>
              <div style={S.chevron}>
                <div style={{ ...S.rowIcon, background: 'var(--surface-container)' }}><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>enhanced_encryption</span></div>
                <div><p style={{ fontWeight: 700, fontSize: 14 }}>Autenticação em 2 Etapas</p><p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Proteção extra para sua conta</p></div>
              </div>
              <Toggle checked={twoFactor} onChange={setTwoFactor} />
            </div>
          </div>
        </section>

        {/* Section: Privacidade */}
        <section>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 }}>Privacidade</h2>
          <div style={{ ...S.section, background: 'var(--surface-container)', borderRadius: 20, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { key: 'publicProfile', label: 'Perfil Público', desc: 'Permitir que outros vejam suas estatísticas' },
              { key: 'location', label: 'Dados de Localização', desc: 'Sugestões de partidas baseadas na sua posição' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface-container-high)', borderRadius: 14 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{item.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{item.desc}</p>
                </div>
                <Toggle checked={privacy[item.key]} onChange={v => setPrivacy(p => ({ ...p, [item.key]: v }))} />
              </div>
            ))}
          </div>
        </section>

        {/* Section: Notificações */}
        <section>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 }}>Notificações</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'push', label: 'Push', icon: 'notifications_active', color: 'var(--primary)', borderColor: 'var(--primary)' },
              { key: 'marketing', label: 'Marketing', icon: 'mail', color: 'var(--tertiary)', borderColor: 'var(--tertiary)' },
            ].map(n => (
              <div key={n.key} style={{ background: 'var(--surface-container)', padding: 20, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${n.borderColor}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ color: n.color }}>{n.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{n.label}</span>
                </div>
                <Toggle checked={notifications[n.key]} onChange={v => setNotifications(p => ({ ...p, [n.key]: v }))} />
              </div>
            ))}
          </div>
        </section>

        {/* Section: Área Crítica */}
        <section>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em', color: 'var(--error)', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 }}>Área Crítica</h2>
          <div style={{ background: 'rgba(185,41,2,0.06)', border: '1px solid rgba(255,115,81,0.2)', borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <button style={{ background: 'rgba(64,74,68,0.35)', color: 'var(--on-surface)', padding: '12px 0', borderRadius: 10, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>Desativar Conta</button>
              <button style={{ background: 'var(--error)', color: 'var(--on-error)', padding: '12px 0', borderRadius: 10, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>Excluir Conta</button>
            </div>
            <p style={{ fontSize: 10, textAlign: 'center', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Esta ação é permanente e removerá todos os seus dados.</p>
          </div>
        </section>

        {/* Logout */}
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 0', background: 'transparent', border: '1px solid rgba(64,74,68,0.3)', borderRadius: 14, color: 'var(--error-dim)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(213,61,24,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span className="material-symbols-outlined">logout</span>
          Sair da conta
        </button>
      </main>
      <BottomNav />
    </div>
  )
}
