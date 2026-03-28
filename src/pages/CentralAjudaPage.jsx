import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const FAQ = [
  { q: 'Como cancelar meu plano Pro?', a: 'Vá em Perfil > Assinaturas > Gerenciar Plano. Você pode cancelar a qualquer momento sem taxas ocultas.' },
  { q: 'O app aceita pagamentos via PIX?', a: 'Sim! Integrado diretamente. O organizador recebe a confirmação em tempo real e a vaga é liberada automaticamente.' },
  { q: 'Posso exportar os dados financeiros?', a: 'Sim, assinantes do plano SÉRIE A podem exportar relatórios mensais em PDF.' },
  { q: 'Como o Radar de Substitutos funciona?', a: 'O Radar localiza jogadores disponíveis próximos à quadra. Filtre por posição e avaliação mínima e chame diretamente pelo app.' },
  { q: 'Meus dados são seguros?', a: 'Sim. Todo o armazenamento usa o Supabase com criptografia em repouso e em trânsito.' },
]

const QUICK_LINKS = [
  { icon: 'account_circle', label: 'Meu Perfil e Conta', href: '/perfil' },
  { icon: 'groups',         label: 'Minhas Partidas',    href: '/partidas' },
  { icon: 'radar',          label: 'Radar de Substitutos', href: '/substituto' },
  { icon: 'emoji_events',   label: 'Conquistas',         href: '/conquistas' },
]

export default function CentralAjudaPage() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(16,28,22,1) 1px, transparent 0)', backgroundSize: '40px 40px', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Central de Ajuda" showBack />
      <main style={{ flex: 1, padding: '28px 20px 100px', maxWidth: 760, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* Hero */}
        <section style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: -40, left: -40, width: 240, height: 240, background: 'rgba(28,184,91,0.07)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
          <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(105,245,143,0.1)', color: 'var(--primary)', fontSize: 10, fontWeight: 700, borderRadius: 999, border: '1px solid rgba(105,245,143,0.2)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>VERSÃO 2.0 · MARÇO 2026</span>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 40, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 16 }}>
            Tudo que você precisa saber para <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>dominar</span> o app.
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 16, maxWidth: 560, lineHeight: 1.7 }}>Guias completos sobre como gerenciar suas partidas, encontrar novos jogadores e evoluir seu perfil.</p>

          {/* Contact cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 28 }}>
            {[
              { icon: 'mail', title: 'Suporte por E-mail', desc: 'Respostas em até 24h', link: 'ajuda@resenhai.com.br', color: 'var(--primary)' },
              { icon: 'chat', title: 'WhatsApp Suporte', desc: 'Seg–Sex, 9h–18h', link: '(11) 9 0000-0000', color: 'var(--secondary)' },
            ].map(c => (
              <div key={c.icon} style={{ background: 'var(--surface-container-high)', padding: 24, borderRadius: 20, border: '1px solid rgba(64,74,68,0.06)' }}>
                <span className="material-symbols-outlined" style={{ color: c.color, fontSize: 28, display: 'block', marginBottom: 10 }}>{c.icon}</span>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.title}</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, marginBottom: 10 }}>{c.desc}</p>
                <span style={{ color: c.color, fontWeight: 700, fontSize: 13 }}>{c.link}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick links bento */}
        <section>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 4, background: 'var(--primary)', display: 'inline-block', borderRadius: 2 }} />
            Acesso Rápido
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {QUICK_LINKS.map(ql => (
              <div key={ql.href} onClick={() => navigate(ql.href)} style={{ aspectRatio: '1', background: 'var(--surface-container)', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-highest)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--on-surface-variant)' }}>{ql.icon}</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{ql.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Accordion */}
        <section>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 20, textAlign: 'center' }}>Perguntas Frequentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 600, margin: '0 auto' }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ background: 'var(--surface-container)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(64,74,68,0.06)' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--on-surface)', fontFamily: 'DM Sans, sans-serif' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, textAlign: 'left' }}>{item.q}</span>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none', fontSize: 22 }}>expand_more</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 16px' }}>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, lineHeight: 1.65 }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ textAlign: 'center', paddingTop: 24, borderTop: '1px solid rgba(64,74,68,0.15)' }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, color: 'var(--primary)', marginBottom: 8 }}>⚽ <span>RESENH</span><span style={{ color: '#39ff14' }}>AI</span></p>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>© 2026 ResenhaAI · Onde a paixão encontra a organização.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
            {['Termos', 'Privacidade', 'Status'].map(t => (
              <span key={t} onClick={() => navigate(t === 'Termos' ? '/termos' : t === 'Privacidade' ? '/privacidade' : '#')} style={{ color: 'var(--on-surface-variant)', fontSize: 12, cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
              >{t}</span>
            ))}
          </div>
        </footer>
      </main>
      <BottomNav />
    </div>
  )
}
