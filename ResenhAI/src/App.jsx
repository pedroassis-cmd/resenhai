import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

// Pages
import LoginPage             from './pages/LoginPage.jsx'
import SetupPerfilPage       from './pages/SetupPerfilPage.jsx'
import HomePartidasPage      from './pages/HomePartidasPage.jsx'
import PainelStatsPage       from './pages/PainelStatsPage.jsx'
import CriarPeladaPage       from './pages/CriarPeladaPage.jsx'
import DashboardPartidaPage  from './pages/DashboardPartidaPage.jsx'
import RadarDeSubstitutosPage from './pages/RadarDeSubstitutosPage.jsx'
import BuscarJogoPage        from './pages/BuscarJogoPage.jsx'
import MeuPerfilPage         from './pages/MeuPerfilPage.jsx'
import ConquistasPage        from './pages/ConquistasPage.jsx'
import PlanosPage            from './pages/PlanosPage.jsx'
import ConfiguracoesPage     from './pages/ConfiguracoesPage.jsx'
import ChatPage              from './pages/ChatPage.jsx'
import CentralAjudaPage      from './pages/CentralAjudaPage.jsx'

// ── Protected wrapper ──────────────────────────────────────────────────────────
function ProtectedRoute({ children, requiresProfile = true }) {
  const { user, loading, isProfileComplete, IS_DEV_PLACEHOLDER } = useAuth()

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#07100b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: '#1cb85b', fontStyle: 'italic', letterSpacing: '-0.04em' }}>RESENH<span style={{ color: '#39ff14' }}>AI</span></div>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(28,184,91,0.2)', borderTop: '3px solid #1cb85b', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  // Dev mode without real Supabase — allow everything
  if (IS_DEV_PLACEHOLDER) return children

  if (!user) return <Navigate to="/login" replace />

  // Redirect to onboarding if profile is incomplete (first login)
  if (requiresProfile && !isProfileComplete) {
    return <Navigate to="/setup-perfil" replace />
  }

  return children
}

// ── Static text pages ──────────────────────────────────────────────────────────
function StaticPage({ title, content }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#07100b', color: '#f1fcf3', padding: '80px 24px 60px', maxWidth: 680, margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>
      <button onClick={() => history.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1cb85b', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, marginBottom: 32, padding: 0 }}>
        <span className="material-symbols-outlined">arrow_back</span>
        Voltar
      </button>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', textTransform: 'uppercase', marginBottom: 32, color: '#1cb85b' }}>{title}</h1>
      <div style={{ color: 'rgba(241,252,243,0.7)', lineHeight: 1.8, fontSize: 14, whiteSpace: 'pre-wrap' }}>{content}</div>
    </div>
  )
}

const TERMOS = `Ao usar o ResenhaAI você concorda com estes Termos de Uso.

1. SERVIÇO\nO ResenhaAI é uma plataforma para organização de partidas de futebol recreativo. Nos reservamos o direito de modificar funcionalidades sem aviso prévio.

2. USO ADEQUADO\nÉ proibido o uso do app para spam, assédio ou divulgação de informações falsas.

3. PLANOS PAGOS\nAs cobranças seguem o ciclo escolhido (mensal ou anual). Cancelamentos são aplicados ao final do período.

4. LIMITAÇÃO DE RESPONSABILIDADE\nO ResenhaAI não se responsabiliza por acidentes ocorridos durante partidas organizadas pela plataforma.

5. CONTATO\najuda@resenhai.com.br`

const PRIVACIDADE = `Sua privacidade é importante para nós.

1. DADOS COLETADOS\nColetamos nome, e-mail, localização aproximada e estatísticas de jogos para oferecer a melhor experiência.

2. USO DOS DADOS\nSeus dados são usados exclusivamente para melhorar o serviço e jamais são vendidos a terceiros.

3. ARMAZENAMENTO\nTodas as informações são armazenadas com criptografia no Supabase, em servidores seguros.

4. SEUS DIREITOS\nVocê pode solicitar exclusão de todos os seus dados a qualquer momento em Configurações > Excluir Conta.

5. COOKIES\nUsamos cookies essenciais para manter sua sessão ativa.

6. CONTATO\nprivacidade@resenhai.com.br`

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/termos"      element={<StaticPage title="Termos de Uso" content={TERMOS} />} />
          <Route path="/privacidade" element={<StaticPage title="Política de Privacidade" content={PRIVACIDADE} />} />

          {/* Onboarding */}
          <Route path="/setup-perfil" element={<ProtectedRoute requiresProfile={false}><SetupPerfilPage /></ProtectedRoute>} />

          {/* Main app */}
          <Route path="/partidas"     element={<ProtectedRoute><HomePartidasPage /></ProtectedRoute>} />
          <Route path="/stats"       element={<ProtectedRoute><PainelStatsPage /></ProtectedRoute>} />
          <Route path="/criar-partida" element={<ProtectedRoute><CriarPeladaPage /></ProtectedRoute>} />
          <Route path="/partida/:matchId" element={<ProtectedRoute><DashboardPartidaPage /></ProtectedRoute>} />
          <Route path="/substituto"  element={<ProtectedRoute><RadarDeSubstitutosPage /></ProtectedRoute>} />
          <Route path="/buscar"      element={<ProtectedRoute><BuscarJogoPage /></ProtectedRoute>} />
          <Route path="/perfil"      element={<ProtectedRoute><MeuPerfilPage /></ProtectedRoute>} />
          <Route path="/conquistas"  element={<ProtectedRoute><ConquistasPage /></ProtectedRoute>} />
          <Route path="/planos"      element={<ProtectedRoute><PlanosPage /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />
          <Route path="/chat/:matchId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/ajuda"       element={<ProtectedRoute><CentralAjudaPage /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/"    element={<Navigate to="/partidas" replace />} />
          <Route path="*"    element={<Navigate to="/partidas" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
