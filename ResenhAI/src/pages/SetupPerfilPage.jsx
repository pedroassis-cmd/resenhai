import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { profileService } from '../services/profileService.js'

const POSITIONS = [
  { id: 'GOALKEEPER', label: 'Goleiro', icon: 'sports_handball' },
  { id: 'DEFENDER', label: 'Zagueiro', icon: 'shield' },
  { id: 'MIDFIELDER', label: 'Meia', icon: 'sports_soccer' },
  { id: 'FORWARD', label: 'Atacante', icon: 'bolt' },
]

const LEVELS = [
  { id: 'BEGINNER', label: 'Iniciante' },
  { id: 'RECREATIONAL', label: 'Recreativo' },
  { id: 'INTERMEDIATE', label: 'Intermediário' },
  { id: 'ADVANCED', label: 'Avançado' },
  { id: 'COMPETITIVE', label: 'Competitivo' },
]

export default function SetupPerfilPage() {
  const navigate = useNavigate()
  const { user, setProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', city: '', position: 'MIDFIELDER', level: 'RECREATIONAL' })
  const [loading, setLoading] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleFinish() {
    setLoading(true)
    try {
      const profile = await profileService.completeOnboarding(user.id, {
        displayName: form.name,
        primaryPosition: form.position,
        skillLevel: form.level,
        city: form.city || null,
        state: null,
      })
      setProfile(profile)
      navigate('/peladas')
    } catch {
      navigate('/peladas')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Background grid */}
      <div className="football-grid" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ background: 'rgba(28,184,91,0.1)', border: '1px solid rgba(28,184,91,0.2)', borderRadius: 999, padding: '6px 16px', display: 'inline-block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', marginBottom: 16 }}>
            Passo {step} de 3
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
            {step === 1 ? 'Seu nome' : step === 2 ? 'Sua posição' : 'Nível técnico'}
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', marginTop: 8, fontSize: 14 }}>
            {step === 1 ? 'Como os outros jogadores te conhecem?' : step === 2 ? 'Onde você prefere jogar?' : 'Seja honesto, isso ajuda a encontrar peladas melhores.'}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--surface-container)', borderRadius: 999, marginBottom: 32, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(step / 3) * 100}%`, background: 'var(--primary)', borderRadius: 999, transition: 'width 0.4s ease' }} />
        </div>

        {/* Step 1: Name + City */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Seu apelido no campo" style={{ width: '100%', background: 'var(--surface-container-lowest)', border: 'none', borderRadius: 14, padding: '18px 20px', color: 'var(--on-surface)', fontSize: 20, fontFamily: 'Syne, sans-serif', fontWeight: 700, outline: 'none', letterSpacing: '-0.02em', boxSizing: 'border-box' }} />
            <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Sua cidade (ex: São Paulo)" style={{ width: '100%', background: 'var(--surface-container)', border: 'none', borderRadius: 14, padding: '16px 18px', color: 'var(--on-surface)', fontSize: 15, fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        )}

        {/* Step 2: Position */}
        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {POSITIONS.map(pos => (
              <button key={pos.id} onClick={() => set('position', pos.id)} style={{ padding: '24px 16px', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: '2px solid', cursor: 'pointer', transition: 'all 0.2s', background: form.position === pos.id ? 'rgba(28,184,91,0.12)' : 'var(--surface-container)', borderColor: form.position === pos.id ? 'var(--primary)' : 'transparent' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: form.position === pos.id ? 'var(--primary)' : 'var(--on-surface-variant)', fontVariationSettings: form.position === pos.id ? "'FILL' 1" : "'FILL' 0" }}>{pos.icon}</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '-0.01em', color: form.position === pos.id ? 'var(--primary)' : 'var(--on-surface)' }}>{pos.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Level */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LEVELS.map(lvl => (
              <button key={lvl.id} onClick={() => set('level', lvl.id)} style={{ padding: '16px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px solid', cursor: 'pointer', transition: 'all 0.2s', background: form.level === lvl.id ? 'rgba(28,184,91,0.1)' : 'var(--surface-container)', borderColor: form.level === lvl.id ? 'var(--primary)' : 'transparent' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: form.level === lvl.id ? 'var(--primary)' : 'var(--on-surface)' }}>{lvl.label}</span>
                {form.level === lvl.id && <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
              </button>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '16px 0', borderRadius: 14, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', background: 'var(--surface-container-high)', color: 'var(--on-surface)', border: 'none', cursor: 'pointer' }}>
              Voltar
            </button>
          )}
          <button
            onClick={step < 3 ? () => setStep(s => s + 1) : handleFinish}
            disabled={(step === 1 && !form.name.trim()) || loading}
            style={{ flex: 2, padding: '16px 0', borderRadius: 14, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', background: 'var(--primary-container)', color: 'var(--on-primary-container)', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(28,184,91,0.3)', opacity: ((step === 1 && !form.name.trim()) || loading) ? 0.5 : 1, transition: 'all 0.2s' }}
          >
            {loading ? 'Salvando...' : step < 3 ? 'Continuar →' : 'Entrar no app ⚽'}
          </button>
        </div>
      </div>
    </div>
  )
}
