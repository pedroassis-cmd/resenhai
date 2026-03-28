import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { authService } from '../../services/authService.js'

export default function TopBar({ title, showBack = false, extra }) {
  const navigate = useNavigate()
  const { profile } = useAuth()

  async function handleLogout() {
    await authService.signOut()
    navigate('/login')
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px',
      background: 'rgba(27,41,33,0.72)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showBack && (
          <button onClick={() => navigate(-1)} style={{ color: '#1cb85b', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        {!showBack && (
          <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(28,184,91,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,184,91,0.1)', color: '#1cb85b', fontWeight: 800, fontSize: 14, fontFamily: 'Syne, sans-serif' }}>
            {(profile?.display_name?.[0] || '?').toUpperCase()}
          </div>
        )}
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontStyle: 'italic', color: '#1cb85b', letterSpacing: '-0.04em', textTransform: 'uppercase', fontSize: title ? 18 : 20 }}>
          {title || <><span>RESENH</span><span style={{ color: '#39ff14', textShadow: '0 0 12px rgba(57,255,20,0.70)' }}>AI</span></>}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {extra}
        <button onClick={() => navigate('/notificacoes')} style={{ color: 'rgba(255,255,255,0.6)', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>
    </header>
  )
}
