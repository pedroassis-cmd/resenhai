import { useState, useEffect } from 'react'
import { matchService } from '../services/matchService.js'
import { radarService, joinRequestService } from '../services/radarService.js'
import { getUserLocation, haversineKm } from '../services/googleMapsService.js'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const FORMAT_FILTERS = [
  { id: 'ALL', label: 'Todos' }, { id: 'FUTSAL_5V5', label: '5v5' },
  { id: 'SOCIETY_7V7', label: '7v7' }, { id: 'FIELD_11V11', label: '11v11' }
]
const FORMAT_LABEL = { FUTSAL_5V5: '5v5 Futsal', SOCIETY_7V7: '7v7 Society', FIELD_11V11: '11v11 Campo', BEACH_SOCCER: 'Beach Soccer', CUSTOM: 'Personalizado' }

const POS_LABEL_SHORT = { GOALKEEPER: 'GL', DEFENDER: 'ZG', MIDFIELDER: 'MEI', FORWARD: 'AT', ANY: '—' }
const POS_FILTERS = [
  { id: 'ALL',        label: 'Todos'    },
  { id: 'GOALKEEPER', label: 'Goleiro'  },
  { id: 'DEFENDER',   label: 'Zagueiro' },
  { id: 'MIDFIELDER', label: 'Meia'     },
  { id: 'FORWARD',    label: 'Atacante' },
]
const POS_COLOR = {
  GOALKEEPER: { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
  DEFENDER:   { bg: 'rgba(56,189,248,0.15)',   color: '#38bdf8' },
  MIDFIELDER: { bg: 'rgba(167,139,250,0.15)',  color: '#a78bfa' },
  FORWARD:    { bg: 'rgba(28,184,91,0.15)',    color: '#1cb85b' },
  ANY:        { bg: 'rgba(255,255,255,0.07)',  color: '#a3aea5' },
}

// Mocks
const MOCK_PUBLIC = [
  { id: 'pub1', title: 'Racha Aberto da Quarta', format: 'FUTSAL_5V5', status: 'OPEN', scheduled_at: new Date(Date.now() + 86400000).toISOString(), total_slots: 10, rsvps: [{ count: 7 }], venue: { name: 'Quadra Central' }, distance: 0.8 },
  { id: 'pub2', title: 'Society da Comunidade', format: 'SOCIETY_7V7', status: 'OPEN', scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(), total_slots: 14, rsvps: [{ count: 11 }], custom_address: 'Society do Vale', distance: 2.1 },
  { id: 'pub3', title: 'Pelada do Parque', format: 'FIELD_11V11', status: 'OPEN', scheduled_at: new Date(Date.now() + 86400000 * 5).toISOString(), total_slots: 22, rsvps: [{ count: 19 }], venue: { name: 'Pacaembu Field' }, distance: 4.3 },
]
const MOCK_SEEKERS = [
  { id: 's1', bio: 'Disponível qualquer dia, amo futsal', preferred_position: 'FORWARD',    player_profiles: { display_name: 'Leonardo Paz', primary_position: 'FORWARD',    skill_score: 8,   total_matches: 34, city: 'Vila Madalena' } },
  { id: 's2', bio: 'Goleiro experiente buscando pelada fixa', preferred_position: 'GOALKEEPER', player_profiles: { display_name: 'Gustavo M.',  primary_position: 'GOALKEEPER', skill_score: 9.6, total_matches: 67, city: 'Pinheiros' } },
  { id: 's3', bio: 'Zagueiro, prefiro society 7v7', preferred_position: 'DEFENDER',   player_profiles: { display_name: 'Henrique F.', primary_position: 'DEFENDER',   skill_score: 6.2, total_matches: 23, city: 'Moema' } },
  { id: 's4', bio: 'Meia criativo, busco time competitivo', preferred_position: 'MIDFIELDER', player_profiles: { display_name: 'Tiago N.',    primary_position: 'MIDFIELDER', skill_score: 7.4, total_matches: 41, city: 'Itaim Bibi' } },
  { id: 's5', bio: 'Atacante, qualquer formato', preferred_position: 'FORWARD',    player_profiles: { display_name: 'Paulo C.',    primary_position: 'FORWARD',    skill_score: 5.8, total_matches: 18, city: 'Tatuapé' } },
]

export default function BuscarJogoPage() {
  const [tab, setTab]           = useState('matches')  // 'matches' | 'players'
  const [search, setSearch]     = useState('')
  const [format, setFormat]     = useState('ALL')
  const [posFilter, setPosFilter] = useState('ALL')
  const [matches, setMatches]   = useState(MOCK_PUBLIC)
  const [seekers, setSeekers]   = useState(MOCK_SEEKERS)
  const [loadingM, setLoadingM] = useState(false)
  const [loadingP, setLoadingP] = useState(false)
  const [sentReqs, setSentReqs] = useState({})
  const [userCoords, setUserCoords] = useState(null)  // { lat, lng } do dispositivo

  // Obtém localização do usuário uma única vez (sem chamar API do Google — usa browser)
  useEffect(() => {
    getUserLocation()
      .then(setUserCoords)
      .catch(() => { /* permissão negada — sem distâncias */ })
  }, [])

  // Carrega partidas públicas
  useEffect(() => {
    setLoadingM(true)
    matchService.listPublicMatches({ formatFilter: format })
      .then(data => { if (data?.length) setMatches(data) })
      .catch(() => {})
      .finally(() => setLoadingM(false))
  }, [format])

  // Carrega jogadores buscando
  useEffect(() => {
    if (tab !== 'players') return
    setLoadingP(true)
    radarService.getSeekingPlayers({ position: posFilter, search })
      .then(data => { if (data?.length) setSeekers(data) })
      .catch(() => {})
      .finally(() => setLoadingP(false))
  }, [tab, posFilter, search])

  async function handleMatchRequest(matchId) {
    setSentReqs(prev => ({ ...prev, [matchId]: 'loading' }))
    try {
      await joinRequestService.sendJoinRequest(matchId, 'Quero participar!')
      setSentReqs(prev => ({ ...prev, [matchId]: 'sent' }))
    } catch {
      setSentReqs(prev => ({ ...prev, [matchId]: 'sent' }))
    }
  }

  async function handleInvitePlayer(playerId) {
    setSentReqs(prev => ({ ...prev, [playerId]: 'loading' }))
    try {
      await radarService.sendRadarCall({ matchId: null, targetUserId: playerId, neededPosition: posFilter })
      setSentReqs(prev => ({ ...prev, [playerId]: 'sent' }))
    } catch {
      setSentReqs(prev => ({ ...prev, [playerId]: 'sent' }))
    }
  }

  // Filtra partidas por busca textual + calcula distância real
  const filteredMatches = matches
    .filter(m =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.venue?.name || m.custom_address || '').toLowerCase().includes(search.toLowerCase())
    )
    .map(m => {
      const vLat = m.venue?.latitude ?? m.location_lat ?? null
      const vLng = m.venue?.longitude ?? m.location_lng ?? null
      const distanceKm = (userCoords && vLat && vLng)
        ? haversineKm(userCoords.lat, userCoords.lng, Number(vLat), Number(vLng))
        : m.distance ?? null
      return { ...m, distanceKm }
    })
    .sort((a, b) => {
      if (a.distanceKm === null) return 1
      if (b.distanceKm === null) return -1
      return a.distanceKm - b.distanceKm
    })

  // Filtra jogadores por posição + busca + calcula distância real
  const filteredSeekers = seekers
    .filter(sp =>
      (posFilter === 'ALL' || sp.preferred_position === posFilter || sp.player_profiles?.primary_position === posFilter) &&
      (search === '' ||
        (sp.player_profiles?.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (sp.bio || '').toLowerCase().includes(search.toLowerCase()))
    )
    .map(sp => {
      const sLat = sp.player_profiles?.latitude ?? sp.latitude ?? null
      const sLng = sp.player_profiles?.longitude ?? sp.longitude ?? null
      const distanceKm = (userCoords && sLat && sLng)
        ? haversineKm(userCoords.lat, userCoords.lng, Number(sLat), Number(sLng))
        : null
      return { ...sp, distanceKm }
    })

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, padding: '24px 20px 100px', maxWidth: 640, margin: '0 auto', width: '100%' }}>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, letterSpacing: '-0.04em', textTransform: 'uppercase', marginBottom: 4 }}>Buscar Jogo</h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginBottom: 20 }}>Partidas abertas e jogadores disponíveis perto de você</p>

        {/* Barra de busca compartilhada */}
        <input
          style={{ width: '100%', padding: '11px 14px', background: 'var(--surface-container)', border: 'none', borderRadius: 12, color: 'var(--on-surface)', fontSize: 14, fontFamily: 'DM Sans, sans-serif', outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
          placeholder="🔍  Buscar partida ou jogador…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* ── Tab switcher ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', background: 'var(--surface-container)', borderRadius: 12, padding: 4, gap: 4, marginBottom: 20 }}>
          {[
            { id: 'matches', label: '⚽  Partidas abertas' },
            { id: 'players', label: '🙋  Jogadores buscando' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '10px 8px', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', transition: 'all 0.15s', background: tab === t.id ? 'var(--primary-container)' : 'transparent', color: tab === t.id ? 'var(--on-primary-container)' : 'var(--on-surface-variant)' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════ TAB: PARTIDAS ABERTAS ════════════════════════ */}
        {tab === 'matches' && (
          <>
            {/* Filtro de formato */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }} className="no-scrollbar">
              {FORMAT_FILTERS.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)} style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', border: 'none', cursor: 'pointer', background: format === f.id ? 'var(--primary-container)' : 'var(--surface-container-high)', color: format === f.id ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
                  {f.label}
                </button>
              ))}
            </div>

            {loadingM ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--on-surface-variant)' }}>Carregando…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredMatches.map(m => {
                  const dt = m.scheduled_at ? new Date(m.scheduled_at) : null
                  const dateStr = dt ? dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) : '—'
                  const timeStr = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
                  const count     = m.rsvps?.[0]?.count ?? m.rsvps?.length ?? 0
                  const available = m.total_slots - count
                  const reqState  = sentReqs[m.id]
                  return (
                    <div key={m.id} style={{ background: 'var(--surface-container)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>{m.title}</h3>
                          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>{FORMAT_LABEL[m.format] || m.format}</p>
                        </div>
                        {m.distanceKm != null && (
                          <span style={{ background: 'rgba(28,184,91,0.1)', color: '#69f58f', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(105,245,143,0.2)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                            {m.distanceKm.toFixed(1)} km
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--on-surface-variant)', fontSize: 12 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                          {dateStr} · {timeStr}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--on-surface-variant)', fontSize: 12 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                          {m.venue?.name || m.custom_address}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ height: 6, width: 80, background: 'var(--surface-container-high)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(count / m.total_slots) * 100}%`, background: available > 3 ? '#1cb85b' : '#f8a010', borderRadius: 999, transition: 'width 0.4s ease' }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: available > 3 ? '#1cb85b' : '#f8a010' }}>{available} vagas</span>
                        </div>
                        {reqState === 'sent' ? (
                          <span style={{ fontSize: 12, color: '#1cb85b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                            Solicitado
                          </span>
                        ) : (
                          <button onClick={() => handleMatchRequest(m.id)} disabled={reqState === 'loading' || available <= 0} style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: available <= 0 ? 0.5 : 1 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                            {reqState === 'loading' ? '...' : 'Solicitar'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {filteredMatches.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 60, color: 'var(--on-surface-variant)' }}>
                    <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>⚽</span>
                    <p style={{ fontWeight: 600 }}>Nenhuma partida encontrada</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ════════════════════════ TAB: JOGADORES BUSCANDO ════════════════════════ */}
        {tab === 'players' && (
          <>
            {/* Filtro de posição */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }} className="no-scrollbar">
              {POS_FILTERS.map(p => (
                <button key={p.id} onClick={() => setPosFilter(p.id)} style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', border: 'none', cursor: 'pointer', background: posFilter === p.id ? 'var(--primary-container)' : 'var(--surface-container-high)', color: posFilter === p.id ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>
                {filteredSeekers.length} disponíve{filteredSeekers.length !== 1 ? 'is' : 'l'}
              </span>
              {loadingP && <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Atualizando…</span>}
            </div>

            {filteredSeekers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--on-surface-variant)' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🙋</span>
                <p style={{ fontWeight: 600 }}>Nenhum jogador encontrado</p>
                <p style={{ fontSize: 13, marginTop: 6 }}>Tente outro filtro ou termo de busca</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredSeekers.map(sp => {
                  const prof = sp.player_profiles || {}
                  const pos  = prof.primary_position || sp.preferred_position || 'ANY'
                  const pc   = POS_COLOR[pos] || POS_COLOR.ANY
                  const initials = (prof.display_name || 'J').substring(0, 2).toUpperCase()
                  const bio = sp.bio || prof.bio || ''
                  const reqState = sentReqs[sp.id]
                  return (
                    <div key={sp.id} style={{ background: 'var(--surface-container)', borderRadius: 16, padding: '16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: pc.bg, color: pc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 5 }}>{prof.display_name || 'Jogador'}</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: pc.bg, color: pc.color }}>
                            {POS_LABEL_SHORT[pos]}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#f8a010', fontVariationSettings: "'FILL' 1" }}>star</span>
                            {(prof.skill_score || 5).toFixed(1)}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{prof.total_matches || 0} jogos</span>
                          {prof.city && (
                            <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 2 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span>
                              {prof.city}
                            </span>
                          )}
                        </div>
                        {bio && <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{bio}</p>}
                      </div>
                      {reqState === 'sent' ? (
                        <span style={{ fontSize: 12, color: '#1cb85b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          Convidado
                        </span>
                      ) : (
                        <button onClick={() => handleInvitePlayer(sp.id)} disabled={reqState === 'loading'} style={{ flexShrink: 0, alignSelf: 'flex-start', background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', opacity: reqState === 'loading' ? 0.6 : 1 }}>
                          {reqState === 'loading' ? '...' : 'Convidar'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
