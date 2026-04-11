import { useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/partidas',   icon: 'sports_soccer', label: 'Partidas' },
  { path: '/substituto',icon: 'person_add',    label: 'Substituto' },
  { path: '/buscar',    icon: 'search',         label: 'Buscar Jogo' },
  { path: '/perfil',    icon: 'person',         label: 'Perfil' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '12px 16px 20px',
      background: 'rgba(27,41,33,0.75)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTopLeftRadius: 16, borderTopRightRadius: 16,
      boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
    }}>
      {NAV_ITEMS.map(item => {
        const active = location.pathname.startsWith(item.path)
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '6px 16px', borderRadius: 12,
              background: active ? 'rgba(28,184,91,0.12)' : 'transparent',
              color: active ? '#1cb85b' : 'rgba(255,255,255,0.4)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0", fontSize: 24 }}
            >{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'DM Sans, sans-serif' }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
