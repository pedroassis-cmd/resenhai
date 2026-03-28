import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService.js'

// ─── FONTES (carregadas inline para não depender do index.html) ───────────────
// Lexend · Manrope · Space Grotesk · Material Symbols
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [showPass, setShowPass]           = useState(false)
  const [loading, setLoading]             = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]                 = useState('')

  // ── Auth handlers ────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }
    setLoading(true)
    try {
      await authService.signIn({ email, password })
      navigate('/partidas')
    } catch (err) {
      setError(err.message || 'E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await authService.signInWithGoogle()
      // O redirect OAuth cuida da navegação — não precisamos de navigate() aqui
    } catch (err) {
      setError(err.message || 'Erro ao entrar com Google.')
      setGoogleLoading(false)
    }
  }

  const handleNavigate = (route) => {
    const map = {
      'register':       '/login',      // sem rota de cadastro separada — usa aba
      'forgot-password': '/login',     // sem rota própria ainda
      'terms':          '/termos',
      'privacy':        '/privacidade',
    }
    navigate(map[route] ?? '/login')
  }
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={S.root}>
      {/* Fontes */}
      <link
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;700;800;900&family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        rel="stylesheet"
      />

      {/* Keyframes */}
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .login-input::placeholder{color:rgba(255,255,255,0.28)!important}
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus{
          -webkit-box-shadow:0 0 0 1000px transparent inset!important;
          -webkit-text-fill-color:#f7f6f4!important;
          transition:background-color 5000s ease-in-out 0s;
        }
        .login-submit:hover{box-shadow:0 0 32px rgba(117,243,156,0.50)!important;transform:scale(1.01)}
        .login-submit:active{transform:scale(0.97)}
        .login-google:hover{background:rgba(255,255,255,0.09)!important}
        .login-forgot:hover{color:rgba(255,255,255,0.75)!important}
        .login-create-link:hover{text-decoration:underline}
        .login-footer-link:hover{color:#75f39c!important}
        .login-field-row input:focus{outline:none}
      `}</style>

      {/* Radial glow overlay */}
      <div style={S.radialGlow} />

      {/* Bottom neon line */}
      <div style={S.bottomLine} />

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={S.main}>

        {/* LOGO */}
        <header style={S.header}>
          <h1 style={S.logo}>
            RESENH<span style={S.logoAI}>AI</span>
          </h1>
          <p style={S.tagline}>Crie, organize e complete seu futebol</p>
        </header>

        {/* FORM AREA */}
        <div style={S.formArea}>
          <form onSubmit={handleLogin} style={S.form}>

            {/* E-mail */}
            <UnderlineField icon="mail">
              <input
                className="login-input"
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={S.input}
                autoComplete="email"
                required
              />
            </UnderlineField>

            {/* Senha */}
            <UnderlineField icon="lock">
              <input
                className="login-input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  ...S.input,
                  letterSpacing: showPass ? 'normal' : '0.22em',
                }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={S.eyeBtn}
                tabIndex={-1}
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <span className="material-symbols-outlined" style={S.eyeIcon}>
                  {showPass ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </UnderlineField>

            {/* Erro */}
            {error && <p style={S.errorMsg} role="alert">{error}</p>}

            {/* Botão principal */}
            <div style={{ paddingTop: 12 }}>
              <button
                type="submit"
                className="login-submit"
                style={S.submitBtn}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? <BtnSpinner color="#002911" /> : 'ENTRAR'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 22 }}>
                <button
                  type="button"
                  className="login-forgot"
                  style={S.forgotBtn}
                  onClick={() => handleNavigate('forgot-password')}
                >
                  Esqueceu a senha?
                </button>
              </div>
            </div>
          </form>

          {/* Divisor */}
          <div style={S.divRow}>
            <div style={S.divLine} />
            <span style={S.divText}>OU</span>
            <div style={S.divLine} />
          </div>

          {/* Google */}
          <button
            type="button"
            className="login-google"
            style={S.googleBtn}
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            aria-busy={googleLoading}
          >
            {googleLoading ? (
              <BtnSpinner color="#75f39c" />
            ) : (
              <>
                <GoogleSVG />
                <span style={S.googleLabel}>ENTRAR COM GOOGLE</span>
              </>
            )}
          </button>
        </div>

        {/* Criar conta */}
        <div style={S.createRow}>
          <p style={S.createText}>
            Novo por aqui?{' '}
            <button
              type="button"
              className="login-create-link"
              style={S.createLink}
              onClick={() => handleNavigate('register')}
            >
              Criar Conta
            </button>
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <button
            type="button"
            className="login-footer-link"
            style={S.footerLink}
            onClick={() => handleNavigate('terms')}
          >
            TERMOS
          </button>
          <div style={S.footerDot} />
          <button
            type="button"
            className="login-footer-link"
            style={S.footerLink}
            onClick={() => handleNavigate('privacy')}
          >
            PRIVACIDADE
          </button>
        </div>
      </footer>
    </div>
  )
}

// ─── COMPONENTES AUXILIARES ───────────────────────────────────────────────────

function UnderlineField({ icon, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <div
      className="login-field-row"
      style={{
        ...S.fieldRow,
        borderBottomColor: focused ? '#75f39c' : 'rgba(255,255,255,0.20)',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <span
        className="material-symbols-outlined"
        style={{
          ...S.fieldIcon,
          color: focused ? '#75f39c' : 'rgba(255,255,255,0.38)',
        }}
      >
        {icon}
      </span>
      {children}
    </div>
  )
}

function BtnSpinner({ color = '#002911' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 20,
        height: 20,
        border: `2.5px solid ${color}33`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

function GoogleSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

// ─── ESTILOS ───────────────────────────────────────────────────────────────────

const S = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#0d0f0e',
    backgroundImage: [
      'linear-gradient(rgba(0,0,0,0.70), rgba(0,0,0,0.88))',
      'url(https://lh3.googleusercontent.com/aida-public/AB6AXuAC7MTdwEt6zTrvkVQEMXl5qH5pk0Gag3WaxAN3eacDELDIoT6PveNYwrSeXodhfhDtwSEqEt_FoGu6oi_RVgF8US48USDcv4M-J7OyRXry5Tyh94sdkrUsVitNoVQ1r741biAbTza5HpneYjU0TO-oakt3hF0x_F9X7MCRHHDpHFIwOOKHAfnD-oiXPvEkt2iZKaXW3__xSur2iEccQGT4fdvA4EnG9qNDIICJ9MxovG4HuWk0sQk1dTJlxNnZL9zzTMjQ4aJQ3K9d)',
    ].join(', '),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    fontFamily: "'Manrope', sans-serif",
    color: '#f7f6f4',
    position: 'relative',
  },

  radialGlow: {
    position: 'fixed',
    inset: 0,
    background: 'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(117,243,156,0.05) 0%, transparent 65%)',
    pointerEvents: 'none',
    zIndex: 1,
  },

  bottomLine: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    background: 'linear-gradient(90deg, transparent, rgba(117,243,156,0.42), transparent)',
    pointerEvents: 'none',
    zIndex: 30,
  },

  main: {
    position: 'relative',
    zIndex: 10,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 480,
    padding: '56px 28px 24px',
    boxSizing: 'border-box',
  },

  header: { marginBottom: 60, textAlign: 'center' },
  logo: {
    fontFamily: "'Lexend', sans-serif",
    fontSize: 'clamp(2.2rem, 9vw, 3rem)',
    fontWeight: 900,
    letterSpacing: '-0.04em',
    color: '#ffffff',
    margin: 0,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoAI: {
    color: '#39ff14',
    textShadow: '0 0 20px rgba(57,255,20,0.80)',
    marginLeft: 3,
  },
  tagline: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 10,
    letterSpacing: '0.48em',
    textTransform: 'uppercase',
    color: '#75f39c',
    opacity: 0.88,
    margin: '16px 0 0',
    lineHeight: 1.6,
  },

  formArea: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 36,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 40,
  },

  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    borderBottom: '1px solid rgba(255,255,255,0.20)',
    paddingBottom: 12,
    transition: 'border-color 0.2s ease',
  },
  fieldIcon: {
    fontSize: 22,
    transition: 'color 0.2s ease',
    userSelect: 'none',
    lineHeight: 1,
    fontVariationSettings: "'FILL' 0, 'wght' 400",
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#f7f6f4',
    fontSize: 17,
    fontWeight: 500,
    fontFamily: "'Manrope', sans-serif",
    padding: 0,
    width: '100%',
    minWidth: 0,
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
    color: 'rgba(255,255,255,0.30)',
    flexShrink: 0,
  },
  eyeIcon: {
    fontSize: 18,
    lineHeight: 1,
    fontVariationSettings: "'FILL' 0, 'wght' 400",
  },

  errorMsg: {
    margin: '0',
    fontSize: 13,
    color: '#ff716c',
    fontFamily: "'Space Grotesk', sans-serif",
    textAlign: 'center',
    background: 'rgba(255,113,108,0.08)',
    borderRadius: 8,
    padding: '9px 14px',
  },

  submitBtn: {
    width: '100%',
    background: '#75f39c',
    color: '#ffffff',
    border: 'none',
    borderRadius: 9999,
    fontFamily: "'Lexend', sans-serif",
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: '0.06em',
    padding: '20px 0',
    cursor: 'pointer',
    boxShadow: '0 0 22px rgba(117,243,156,0.30)',
    transition: 'box-shadow 0.2s, transform 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    boxSizing: 'border-box',
  },

  forgotBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.38)',
    fontSize: 14,
    fontFamily: "'Manrope', sans-serif",
    fontWeight: 500,
    padding: 0,
    transition: 'color 0.2s',
  },

  divRow: { display: 'flex', alignItems: 'center', gap: 16 },
  divLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' },
  divText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.48em',
    color: 'rgba(255,255,255,0.28)',
    flexShrink: 0,
  },

  googleBtn: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 9999,
    color: '#f7f6f4',
    fontFamily: "'Lexend', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: '0.05em',
    padding: '17px 0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    minHeight: 56,
    transition: 'background 0.2s',
    boxSizing: 'border-box',
  },
  googleLabel: {
    fontFamily: "'Lexend', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: '0.05em',
  },

  createRow: { marginTop: 'auto', paddingTop: 52, textAlign: 'center' },
  createText: {
    margin: 0,
    fontSize: 14,
    color: 'rgba(255,255,255,0.48)',
    fontFamily: "'Manrope', sans-serif",
  },
  createLink: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#75f39c',
    fontWeight: 700,
    fontSize: 14,
    fontFamily: "'Manrope', sans-serif",
    padding: 0,
    transition: 'opacity 0.2s',
  },

  footer: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '20px 0 36px',
  },
  footerInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 28,
  },
  footerLink: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.48em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.28)',
    padding: 0,
    transition: 'color 0.2s',
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.10)',
    flexShrink: 0,
  },
}
