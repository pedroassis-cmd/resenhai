import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { subscriptionService } from '../services/subscriptionService.js'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const ALL_PLANS = [
  {
    id: 'FREE', name: 'JOGADOR SÉRIE C', price: { monthly: 0, yearly: 0 }, recommended: false,
    features: ['Histórico de partidas', 'Perfil de atleta básico', 'Busca por grupos locais'],
    stars: false, cta: 'PLANO ATUAL'
  },
  {
    id: 'PREMIUM', name: 'JOGADOR SÉRIE A', price: { monthly: 9.90, yearly: 7.92 }, recommended: true,
    features: ['Prioridade de busca', 'Sem anúncios', 'Vagas ilimitadas para convidados', 'Radar de substitutos ilimitado', 'Estatísticas avançadas'],
    stars: true, cta: 'ASSINAR SÉRIE A'
  }
]

export default function PlanosPage() {
  const { user } = useAuth()
  const [billing, setBilling] = useState('monthly')
  const [currentPlan, setCurrentPlan] = useState('FREE')

  useEffect(() => {
    if (!user) return
    subscriptionService.getUserPlan(user.id)
      .then(sub => { if (sub?.plan) setCurrentPlan(sub.plan) })
      .catch(() => {})
  }, [user])

  const PLANS = ALL_PLANS.map(p => ({ ...p, isCurrent: p.id === currentPlan }))

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', paddingBottom: 90, position: 'relative', overflow: 'hidden' }} className="kinetic-gradient">
      {/* Glow */}
      <div style={{ position: 'fixed', top: '25%', right: 0, width: 384, height: 384, background: 'rgba(28,184,91,0.08)', filter: 'blur(120px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '25%', right: 0, width: 256, height: 256, background: 'rgba(248,160,16,0.05)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

      <TopBar title="Planos" showBack />

      <main style={{ position: 'relative', zIndex: 1, padding: '28px 24px 48px', maxWidth: 640, margin: '0 auto' }}>
        {/* Hero */}
        <section style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 56, textTransform: 'uppercase', letterSpacing: '-0.04em', lineHeight: 0.9 }}>
            PLANOS<br />
            <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>PREMIUM</span>
          </h1>
          <p style={{ fontSize: 20, color: 'var(--on-surface-variant)', fontWeight: 500, marginTop: 16 }}>Suba de nível na sua pelada.</p>
        </section>

        {/* Billing toggle */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', background: 'var(--surface-container)', borderRadius: 12, padding: 4 }}>
            <button onClick={() => setBilling('monthly')} style={{ padding: '8px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', border: 'none', cursor: 'pointer', background: billing === 'monthly' ? 'var(--primary)' : 'transparent', color: billing === 'monthly' ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>MENSAL</button>
            <button onClick={() => setBilling('yearly')} style={{ padding: '8px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', border: 'none', cursor: 'pointer', background: billing === 'yearly' ? 'var(--primary)' : 'transparent', color: billing === 'yearly' ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}>
              ANUAL <span style={{ fontSize: 10, color: billing === 'yearly' ? 'var(--on-primary-container)' : 'var(--primary-dim)' }}>-20%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {PLANS.map(plan => {
            const price = billing === 'monthly' ? plan.price.monthly : plan.price.yearly
            return (
              <div key={plan.id} style={{ background: plan.recommended ? 'var(--surface-container-highest)' : 'var(--surface-container-low)', borderRadius: 20, padding: '32px', position: 'relative', overflow: 'hidden', outline: plan.recommended ? '2px solid var(--primary)' : '1px solid rgba(64,74,68,0.25)', boxShadow: plan.recommended ? '0 0 40px rgba(28,184,91,0.15)' : 'none' }}>
                {plan.recommended && (
                  <>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(28,184,91,0.04), transparent)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'var(--on-primary-container)', padding: '4px 16px', borderRadius: 999, fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', zIndex: 2 }}>
                      Recomendado
                    </div>
                  </>
                )}
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: plan.recommended ? 26 : 22, textTransform: 'uppercase', letterSpacing: '-0.02em', color: plan.recommended ? 'var(--primary)' : 'var(--on-surface)', fontStyle: plan.recommended ? 'italic' : 'normal', marginBottom: 12, position: 'relative', zIndex: 1 }}>
                  {plan.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28, position: 'relative', zIndex: 1 }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: price === 0 ? 36 : 44, letterSpacing: '-0.03em' }}>R$ {price === 0 ? '0' : price.toFixed(2).replace('.', ',')}</span>
                  <span style={{ color: 'var(--on-surface-variant)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>/mês</span>
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, position: 'relative', zIndex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)', fontVariationSettings: plan.stars ? "'FILL' 1" : "'FILL' 0" }}>{plan.stars ? 'stars' : 'check_circle'}</span>
                      <span style={{ fontWeight: plan.stars ? 700 : 500, color: plan.stars ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button disabled={plan.isCurrent} style={{ position: 'relative', zIndex: 2, width: '100%', background: plan.isCurrent ? 'rgba(64,74,68,0.25)' : 'var(--primary)', color: plan.isCurrent ? 'var(--on-surface-variant)' : 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 0', borderRadius: 12, border: 'none', cursor: plan.isCurrent ? 'default' : 'pointer', boxShadow: plan.isCurrent ? 'none' : '0 8px 24px rgba(28,184,91,0.3)', transition: 'all 0.2s' }}>
                  {plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        {/* Trial CTA */}
        <section style={{ marginTop: 48, textAlign: 'center' }}>
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '20px 0', borderRadius: 20, background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', letterSpacing: '-0.01em', border: 'none', cursor: 'pointer', boxShadow: '0 16px 48px rgba(28,184,91,0.3)', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dim)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--primary-container)'}
          >
            EXPERIMENTAR 7 DIAS GRÁTIS
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, fontWeight: 500, marginTop: 16 }}>Cancele a qualquer momento. Sujeito aos termos de serviço.</p>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}
