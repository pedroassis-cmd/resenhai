import { useState, useEffect } from 'react'
import { radarService } from '../services/radarService.js'
import {
  getUserLocation,
  findNearbySportVenues,
  sortPlayersByDistance,
} from '../services/googleMapsService.js'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

// ── Constantes ──────────────────────────────────────────────────────────────
const POSITIONS = [
  { id: 'ALL',        label: 'Todos'    },
  { id: 'GOALKEEPER', label: 'Goleiro'  },
  { id: 'DEFENDER',   label: 'Zagueiro' },
  { id: 'MIDFIELDER', label: 'Meia'     },
  { id: 'FORWARD',    label: 'Atacante' },
]

const POS_LABEL = { GOALKEEPER: 'Goleiro', DEFENDER: 'Zagueiro', MIDFIELDER: 'Meia', FORWARD: 'Atacante', ANY: 'Geral' }
const POS_COLOR = {
  GOALKEEPER: { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
  DEFENDER:   { bg: 'rgba(56,189,248,0.15)',   color: '#38bdf8' },
  MIDFIELDER: { bg: 'rgba(167,139,250,0.15)',  color: '#a78bfa' },
  FORWARD:    { bg: 'rgba(28,184,91,0.15)',    color: '#1cb85b' },
  ANY:        { bg: 'rgba(255,255,255,0.07)',  color: '#a3aea5' },
}

const RADIUS_OPTIONS = [5, 10, 20]

// Mocks enquanto o banco não tem dados
const MOCK_RADAR_PLAYERS = [
  { id: 'p1', profile: { display_name: 'Marcos Silva',  primary_position: 'FORWARD',    skill_score: 4.9, total_matches: 42 }, distance: 1.2 },
  { id: 'p2', profile: { display_name: 'João Santos',   primary_position: 'GOALKEEPER', skill_score: 4.5, total_matches: 28 }, distance: 2.8 },
  { id: 'p3', profile: { display_name: 'Ricardo Melo',  primary_position: 'MIDFIELDER', skill_score: 4.2, total_matches: 19 }, distance: 3.5 },
  { id: 'p4', profile: { display_name: 'Felipe Duarte', primary_position: 'DEFENDER',   skill_score: 3.8, total_matches: 31 }, distance: 4.0 },
  { id: 'p5', profile: { display_name: 'Bruno Costa',   primary_position: 'MIDFIELDER', skill_score: 4.7, total_matches: 55 }, distance: 1.9 },
]

const MOCK_SEEKING_PLAYERS = [
  { id: 's1', bio: 'Disponível qualquer dia, amo futsal', preferred_position: 'FORWARD',    search_radius: 'KM_5',  player_profiles: { display_name: 'Leonardo Paz', primary_position: 'FORWARD',    skill_score: 8, total_matches: 34, city: 'São Paulo' } },
  { id: 's2', bio: 'Goleiro experiente buscando pelada fixa', preferred_position: 'GOALKEEPER', search_radius: 'KM_10', player_profiles: { display_name: 'Gustavo M.',  primary_position: 'GOALKEEPER', skill_score: 9.6, total_matches: 67, city: 'São Paulo' } },
  { id: 's3', bio: 'Zagueiro, prefiro society 7v7', preferred_position: 'DEFENDER',   search_radius: 'KM_5',  player_profiles: { display_name: 'Henrique F.', primary_position: 'DEFENDER',   skill_score: 6.2, total_matches: 23, city: 'São Paulo' } },
  { id: 's4', bio: 'Meia criativo, busco time competitivo', preferred_position: 'MIDFIELDER', search_radius: 'KM_10', player_profiles: { display_name: 'Tiago N.',    primary_position: 'MIDFIELDER', skill_score: 7.4, total_matches: 41, city: 'São Paulo' } },
  { id: 's5', bio: 'Atacante, qualquer formato', preferred_position: 'FORWARD',    search_radius: 'KM_20', player_profiles: { display_name: 'Paulo C.',    primary_position: 'FORWARD',    skill_score: 5.8, total_matches: 18, city: 'São Paulo' } },
]

// ── Componente: card de jogador no radar ──────────────────────────────────
function RadarPlayerCard({ p, distanceLabel, invState, onInvite }) {
  const pos  = p.profile?.primary_position || 'ANY'
  const pc   = POS_COLOR[pos] || POS_COLOR.ANY
  const initials = (p.profile?.display_name || 'J').substring(0, 2).toUpperCase()
  const score = Math.round((p.profile?.skill_score || 5) * 10)

  return (
    <div style={{ background: 'var(--surface-container)', borderRadius: 20, padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: pc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: pc.color, border: `1.5px solid ${pc.color}30` }}>
          {initials}
        </div>
        <div style={{ position: 'absolute', bottom: -6, right: -6, background: '#1cb85b', color: '#00290e', fontFamily: 'Syne', fontWeight: 800, fontSize: 10, width: 22, height: 22, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {score}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.profile?.display_name || 'Jogador'}
        </p>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, marginTop: 3 }}>
          {POS_LABEL[pos]} · {p.profile?.total_matches || 0} jogos
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#f8a010', fontVariationSettings: "'FILL' 1" }}>star</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)' }}>{(p.profile?.skill_score || 5).toFixed(1)}</span>
          {distanceLabel && (
            <span style={{ fontSize: 11, color: '#1cb85b', marginLeft: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>near_me</span>
              {distanceLabel}
            </span>
          )}
        </div>
      </div>

      {invState === 'sent' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ color: '#1cb85b', fontSize: 28, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#1cb85b', textTransform: 'uppercase' }}>Enviado</span>
        </div>
      ) : (
        <button
          onClick={onInvite}
          disabled={invState === 'sending'}
          style={{ flexShrink: 0, background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: invState === 'sending' ? 0.6 : 1 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
          {invState === 'sending' ? '...' : 'Chamar'}
        </button>
      )}
    </div>
  )
}

// ── Componente: card de jogador buscando partida ───────────────────────────
function SeekingPlayerCard({ sp, onInvite, invState }) {
  const prof = sp.player_profiles || {}
  const pos  = prof.primary_position || sp.preferred_position || 'ANY'
  const pc   = POS_COLOR[pos] || POS_COLOR.ANY
  const initials = (prof.display_name || 'J').substring(0, 2).toUpperCase()
  const bio = sp.bio || prof.bio || ''

  return (
    <div style={{ background: 'var(--surface-container)', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: pc.bg, color: pc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{prof.display_name || 'Jogador'}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: pc.bg, color: pc.color }}>
            {POS_LABEL[pos]}
          </span>
          <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#f8a010', fontVariationSettings: "'FILL' 1" }}>star</span>
            {(prof.skill_score || 5).toFixed(1)}
          </span>
          {prof.city && (
            <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span>
              {prof.city}
            </span>
          )}
        </div>
        {bio ? <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{bio}</p> : null}
      </div>
      {invState === 'sent' ? (
        <span style={{ fontSize: 12, color: '#1cb85b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          Enviado
        </span>
      ) : (
        <button
          onClick={onInvite}
          disabled={invState === 'sending'}
          style={{ flexShrink: 0, alignSelf: 'flex-start', background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', opacity: invState === 'sending' ? 0.6 : 1 }}
        >
          {invState === 'sending' ? '...' : 'Convidar'}
        </button>
      )}
    </div>
  )
}

// ── Página principal ────────────────────────────────────────────────────────
export default function RadarDeSubstitutosPage() {
  // Shared state
  const [view, setView]       = useState('radar')    // 'radar' | 'seeking'
  const [position, setPosition] = useState('ALL')
  const [radiusKm, setRadiusKm] = useState(10)
  const [invited, setInvited]   = useState({})

  // Radar view state
  const [status, setStatus]           = useState('idle')
  const [players, setPlayers]         = useState([])
  const [nearbyVenues, setNearbyVenues] = useState([])
  const [userCoords, setUserCoords]   = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [showVenues, setShowVenues]   = useState(false)

  // Seeking view state
  const [seekSearch, setSeekSearch]       = useState('')
  const [seekPlayers, setSeekPlayers]     = useState(MOCK_SEEKING_PLAYERS)
  const [seekLoading, setSeekLoading]     = useState(false)

  // ── Carrega jogadores "buscando" ao entrar na view ───────────────────────
  useEffect(() => {
    if (view !== 'seeking') return
    setSeekLoading(true)
    radarService.getSeekingPlayers({ position, search: seekSearch })
      .then(data => { if (data?.length) setSeekPlayers(data) })
      .catch(() => {})
      .finally(() => setSeekLoading(false))
  }, [view, position, seekSearch])

  // ── Radar: busca por localização ─────────────────────────────────────────
  async function handleSearch() {
    setLocationError(null)
    setStatus('locating')

    let coords = userCoords
    if (!coords) {
      try {
        coords = await getUserLocation()
        setUserCoords(coords)
      } catch (err) {
        setLocationError(err.message)
        coords = null
      }
    }

    setStatus('searching')

    try {
      const [rawPlayers, venues] = await Promise.allSettled([
        radarService.getAvailablePlayers({ position, radiusKm }),
        coords ? findNearbySportVenues(coords, radiusKm * 1000) : Promise.resolve([]),
      ])

      let found = rawPlayers.status === 'fulfilled' && rawPlayers.value?.length
        ? rawPlayers.value
        : MOCK_RADAR_PLAYERS

      if (coords) found = sortPlayersByDistance(found, coords, radiusKm)

      setPlayers(found)
      setNearbyVenues(venues.status === 'fulfilled' ? venues.value : [])
    } catch {
      setPlayers(MOCK_RADAR_PLAYERS)
    } finally {
      setStatus('done')
    }
  }

  async function handleInvite(playerId) {
    setInvited(prev => ({ ...prev, [playerId]: 'sending' }))
    try {
      await radarService.sendRadarCall({ matchId: 'current', targetUserId: playerId, neededPosition: position })
    } catch { /* silent */ }
    setInvited(prev => ({ ...prev, [playerId]: 'sent' }))
  }

  const visibleRadar = position === 'ALL' ? players : players.filter(p => p.profile?.primary_position === position)

  const distanceLbl = (p) => {
    const km = p.distanceKm ?? p.distance
    if (!km) return ''
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
  }

  // Filtro client-side do seek por posição (o query já filtra, mas quando é mock precisamos filtrar localmente)
  const visibleSeeking = seekPlayers.filter(sp =>
    (position === 'ALL' || sp.preferred_position === position || sp.player_profiles?.primary_position === position) &&
    (seekSearch === '' ||
      (sp.player_profiles?.display_name || '').toLowerCase().includes(seekSearch.toLowerCase()) ||
      (sp.bio || '').toLowerCase().includes(seekSearch.toLowerCase()))
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, padding: '20px 20px 100px', maxWidth: 640, margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1cb85b' }}>
            Jogadores disponíveis
          </span>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
            Substituto
          </h1>
        </div>

        {/* ── Toggle: Radar ↔ Procurar Substituto ──────────────────────────── */}
        <div style={{ display: 'flex', background: 'var(--surface-container)', borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 }}>
          {[
            { id: 'radar',   label: '📡  Radar',              desc: 'Busca por localização' },
            { id: 'seeking', label: '🔎  Procurar substituto', desc: 'Jogadores disponíveis' },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{ flex: 1, padding: '10px 8px', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', transition: 'all 0.15s', background: view === v.id ? 'var(--primary-container)' : 'transparent', color: view === v.id ? 'var(--on-primary-container)' : 'var(--on-surface-variant)' }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Filtro de posição (compartilhado pelas duas views) */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }} className="no-scrollbar">
          {POSITIONS.map(p => (
            <button key={p.id} onClick={() => setPosition(p.id)} style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', border: 'none', cursor: 'pointer', background: position === p.id ? 'var(--primary-container)' : 'var(--surface-container-high)', color: position === p.id ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════ RADAR VIEW ════════════════════════════ */}
        {view === 'radar' && (
          <>
            {/* Raio de busca */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>social_distance</span>
              <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 600 }}>Raio:</span>
              {RADIUS_OPTIONS.map(r => (
                <button key={r} onClick={() => setRadiusKm(r)} style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: radiusKm === r ? 'var(--secondary-container, #1e3a2b)' : 'var(--surface-container-high)', color: radiusKm === r ? 'var(--on-secondary-container, #1cb85b)' : 'var(--on-surface-variant)' }}>
                  {r}km
                </button>
              ))}
            </div>

            {locationError && status === 'done' && (
              <div style={{ background: 'rgba(248,160,16,0.08)', border: '1px solid rgba(248,160,16,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#f8a010' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, flexShrink: 0 }}>location_off</span>
                <span>{locationError} Mostrando resultados sem filtro de distância.</span>
              </div>
            )}

            {/* IDLE */}
            {status === 'idle' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 24 }}>
                <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {[1, 0.72, 0.44].map((s, i) => (
                    <div key={i} style={{ position: 'absolute', inset: 0, border: `1px solid rgba(28,184,91,${0.08 + i * 0.06})`, borderRadius: '50%', transform: `scale(${s})` }} />
                  ))}
                  <div className="animate-pulse" style={{ width: 16, height: 16, background: '#1cb85b', borderRadius: '50%', boxShadow: '0 0 24px rgba(105,245,143,0.7)' }} />
                </div>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: 1.5, textAlign: 'center', maxWidth: 280 }}>
                  Usaremos sua localização para encontrar substitutos e quadras próximas.
                </p>
                <button onClick={handleSearch} style={{ width: '100%', maxWidth: 320, background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '18px 0', borderRadius: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 32px rgba(28,184,91,0.3)' }}>
                  <span className="material-symbols-outlined">my_location</span>
                  Buscar por Localização
                </button>
              </div>
            )}

            {/* LOADING */}
            {(status === 'locating' || status === 'searching') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 40 }}>
                <div style={{ position: 'relative', width: 80, height: 80 }}>
                  <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(28,184,91,0.15)', borderRadius: '50%', animation: 'spin 2s linear infinite' }} />
                  <div style={{ position: 'absolute', inset: 6, border: '2px solid rgba(28,184,91,0.3)', borderRadius: '50%', animation: 'spin 1.5s linear infinite reverse' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#1cb85b', fontSize: 28, fontVariationSettings: "'FILL' 1" }}>
                      {status === 'locating' ? 'my_location' : 'radar'}
                    </span>
                  </div>
                </div>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, fontWeight: 600 }}>
                  {status === 'locating' ? 'Obtendo sua localização...' : 'Buscando jogadores próximos...'}
                </p>
              </div>
            )}

            {/* DONE */}
            {status === 'done' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {userCoords && (
                  <div style={{ background: 'rgba(28,184,91,0.06)', border: '1px solid rgba(28,184,91,0.15)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#1cb85b', fontWeight: 700 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>my_location</span>
                    Localização obtida · Raio {radiusKm}km
                  </div>
                )}

                {/* Quadras próximas */}
                {nearbyVenues.length > 0 && (
                  <div>
                    <button onClick={() => setShowVenues(v => !v)} style={{ width: '100%', background: 'var(--surface-container)', borderRadius: 14, padding: '12px 16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#38BDF8', fontVariationSettings: "'FILL' 1" }}>stadium</span>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {nearbyVenues.length} quadras próximas
                        </span>
                      </div>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)', transition: 'transform 0.2s', transform: showVenues ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                    </button>
                    {showVenues && (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {nearbyVenues.map(venue => (
                          <a key={venue.place_id} href={`https://www.google.com/maps/place/?q=place_id:${venue.place_id}`} target="_blank" rel="noopener noreferrer" style={{ background: 'var(--surface-container-low)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#38BDF8', fontVariationSettings: "'FILL' 1" }}>sports_soccer</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{venue.name}</p>
                              <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>{venue.vicinity}</p>
                            </div>
                            {venue.rating && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#f8a010', fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span style={{ fontSize: 12, fontWeight: 700 }}>{venue.rating}</span>
                              </div>
                            )}
                            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--outline)' }}>open_in_new</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Resultados */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                    {visibleRadar.length} jogador{visibleRadar.length !== 1 ? 'es' : ''} encontrado{visibleRadar.length !== 1 ? 's' : ''}
                  </h2>
                  <button onClick={() => { setStatus('idle'); setPlayers([]); setInvited({}); setNearbyVenues([]); setUserCoords(null); setLocationError(null) }}
                    style={{ background: 'var(--surface-container-high)', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
                    Nova busca
                  </button>
                </div>

                {visibleRadar.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
                    <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>😕</span>
                    <p style={{ fontWeight: 600 }}>Nenhum jogador encontrado no raio de {radiusKm}km</p>
                    <p style={{ fontSize: 13, marginTop: 6 }}>Tente aumentar o raio ou outra posição</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {visibleRadar.map(p => (
                      <RadarPlayerCard key={p.id} p={p} distanceLabel={distanceLbl(p)} invState={invited[p.id]} onInvite={() => handleInvite(p.id)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════ PROCURAR SUBSTITUTO VIEW ══════════════════════ */}
        {view === 'seeking' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, lineHeight: 1.6 }}>
              Jogadores que estão buscando partida e podem cobrir uma vaga na sua pelada.
            </p>

            {/* Busca por nome/bio */}
            <input
              style={{ width: '100%', padding: '11px 14px', background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: 'var(--on-surface)', fontSize: 14, fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              placeholder="🔍  Buscar por nome ou descrição…"
              value={seekSearch}
              onChange={e => setSeekSearch(e.target.value)}
            />

            {/* Contagem */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>
                {visibleSeeking.length} disponíve{visibleSeeking.length !== 1 ? 'is' : 'l'}
              </span>
              {seekLoading && <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Atualizando…</span>}
            </div>

            {/* Lista */}
            {visibleSeeking.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🔍</span>
                <p style={{ fontWeight: 600 }}>Nenhum jogador encontrado</p>
                <p style={{ fontSize: 13, marginTop: 6 }}>Tente outro filtro ou termo de busca</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visibleSeeking.map(sp => (
                  <SeekingPlayerCard key={sp.id} sp={sp} invState={invited[sp.id]} onInvite={() => handleInvite(sp.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
