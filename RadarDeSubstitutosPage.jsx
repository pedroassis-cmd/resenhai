import { useState, useEffect } from 'react'
import { radarService } from '../services/radarService.js'
import {
  getUserLocation,
  findNearbySportVenues,
  sortPlayersByDistance,
} from '../services/googleMapsService.js'
import TopBar from '../components/shared/TopBar.jsx'
import BottomNav from '../components/shared/BottomNav.jsx'

const POSITIONS = [
  { id: 'ALL',        label: 'Todos'    },
  { id: 'GOALKEEPER', label: 'Goleiro'  },
  { id: 'DEFENDER',   label: 'Zagueiro' },
  { id: 'MIDFIELDER', label: 'Meia'     },
  { id: 'FORWARD',    label: 'Atacante' },
]

const MOCK_PLAYERS = [
  { id: 'p1', profile: { display_name: 'Marcos Silva',  primary_position: 'FORWARD',    skill_score: 4.9, total_matches: 42 }, distance: 1.2, color: '#f8a010' },
  { id: 'p2', profile: { display_name: 'João Santos',   primary_position: 'GOALKEEPER', skill_score: 4.5, total_matches: 28 }, distance: 2.8, color: '#69f58f' },
  { id: 'p3', profile: { display_name: 'Ricardo Melo',  primary_position: 'MIDFIELDER', skill_score: 4.2, total_matches: 19 }, distance: 3.5, color: '#b299ff' },
  { id: 'p4', profile: { display_name: 'Felipe Duarte', primary_position: 'DEFENDER',   skill_score: 3.8, total_matches: 31 }, distance: 4.0, color: '#38BDF8' },
  { id: 'p5', profile: { display_name: 'Bruno Costa',   primary_position: 'MIDFIELDER', skill_score: 4.7, total_matches: 55 }, distance: 1.9, color: '#f8a010' },
]

const POS_LABEL = { GOALKEEPER: 'Goleiro', DEFENDER: 'Zagueiro', MIDFIELDER: 'Meia', FORWARD: 'Atacante', ANY: 'Geral' }
const RADIUS_OPTIONS = [5, 10, 20] // km

export default function RadarDeSubstitutosPage() {
  const [position, setPosition] = useState('ALL')
  const [radiusKm, setRadiusKm] = useState(10)
  const [status, setStatus]     = useState('idle')   // idle | locating | searching | done | error
  const [players, setPlayers]   = useState([])
  const [nearbyVenues, setNearbyVenues]   = useState([])
  const [invited, setInvited]   = useState({})
  const [userCoords, setUserCoords]       = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [showVenues, setShowVenues]       = useState(false)

  async function handleSearch() {
    setLocationError(null)
    setStatus('locating')

    // 1. Tentar obter localização do usuário
    let coords = userCoords
    if (!coords) {
      try {
        coords = await getUserLocation()
        setUserCoords(coords)
      } catch (err) {
        // Geolocalização falhou — continua sem filtro de distância
        setLocationError(err.message)
        coords = null
      }
    }

    setStatus('searching')

    // 2. Busca paralela: jogadores + quadras próximas
    try {
      const [rawPlayers, venues] = await Promise.allSettled([
        radarService.getAvailablePlayers({ position, radiusKm }),
        coords ? findNearbySportVenues(coords, radiusKm * 1000) : Promise.resolve([]),
      ])

      let foundPlayers = rawPlayers.status === 'fulfilled' && rawPlayers.value?.length
        ? rawPlayers.value
        : MOCK_PLAYERS

      // 3. Ordenar por distância real (se tiver coords)
      if (coords) {
        foundPlayers = sortPlayersByDistance(foundPlayers, coords, radiusKm)
      }

      setPlayers(foundPlayers)
      setNearbyVenues(venues.status === 'fulfilled' ? venues.value : [])
    } catch {
      setPlayers(MOCK_PLAYERS)
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

  const visible = position === 'ALL'
    ? players
    : players.filter(p => p.profile?.primary_position === position)

  const distanceLabel = (p) => {
    const km = p.distanceKm ?? p.distance
    if (!km) return ''
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, padding: '20px 20px 100px', maxWidth: 640, margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1cb85b' }}>Radar de Jogadores</span>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>Substituto</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, marginTop: 4 }}>
            Encontre jogadores disponíveis para completar sua pelada
          </p>
        </div>

        {/* Position filter pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }} className="no-scrollbar">
          {POSITIONS.map(p => (
            <button key={p.id} onClick={() => setPosition(p.id)} style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', border: 'none', cursor: 'pointer', background: position === p.id ? 'var(--primary-container)' : 'var(--surface-container-high)', color: position === p.id ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Raio de busca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>social_distance</span>
          <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 600 }}>Raio:</span>
          {RADIUS_OPTIONS.map(r => (
            <button key={r} onClick={() => setRadiusKm(r)} style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: radiusKm === r ? 'var(--secondary-container, #1e3a2b)' : 'var(--surface-container-high)', color: radiusKm === r ? 'var(--on-secondary-container, #1cb85b)' : 'var(--on-surface-variant)', transition: 'all 0.15s' }}>
              {r}km
            </button>
          ))}
        </div>

        {/* Erro de localização (aviso não bloqueante) */}
        {locationError && status === 'done' && (
          <div style={{ background: 'rgba(248,160,16,0.08)', border: '1px solid rgba(248,160,16,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#f8a010' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>location_off</span>
            <span>{locationError} Mostrando resultados sem filtro de distância.</span>
          </div>
        )}

        {/* ── IDLE STATE ── */}
        {status === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 24 }}>
            {/* Decorative radar rings */}
            <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {[1, 0.72, 0.44].map((s, i) => (
                <div key={i} style={{ position: 'absolute', inset: 0, border: `1px solid rgba(28,184,91,${0.08 + i * 0.06})`, borderRadius: '50%', transform: `scale(${s})` }} />
              ))}
              <div className="animate-pulse" style={{ width: 16, height: 16, background: '#1cb85b', borderRadius: '50%', boxShadow: '0 0 24px rgba(105,245,143,0.7)' }} />
            </div>

            <div style={{ textAlign: 'center', maxWidth: 280 }}>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, lineHeight: 1.5 }}>
                Usaremos sua localização para encontrar substitutos e quadras próximas via Google Maps.
              </p>
            </div>

            <button
              onClick={handleSearch}
              style={{ width: '100%', maxWidth: 320, background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '18px 0', borderRadius: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 32px rgba(28,184,91,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span className="material-symbols-outlined">my_location</span>
              Buscar por Localização
            </button>
          </div>
        )}

        {/* ── LOCATING / SEARCHING STATE ── */}
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

        {/* ── DONE STATE — resultados ── */}
        {status === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Localização obtida */}
            {userCoords && (
              <div style={{ background: 'rgba(28,184,91,0.06)', border: '1px solid rgba(28,184,91,0.15)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#1cb85b', fontWeight: 700 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>my_location</span>
                Localização obtida · Raio {radiusKm}km
              </div>
            )}

            {/* Quadras próximas (Google Maps Places) */}
            {nearbyVenues.length > 0 && (
              <div>
                <button
                  onClick={() => setShowVenues(v => !v)}
                  style={{ width: '100%', background: 'var(--surface-container)', borderRadius: 14, padding: '12px 16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#38BDF8', fontVariationSettings: "'FILL' 1" }}>stadium</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {nearbyVenues.length} quadras próximas
                    </span>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)', transition: 'transform 0.2s', transform: showVenues ? 'rotate(180deg)' : 'none' }}>
                    expand_more
                  </span>
                </button>

                {showVenues && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {nearbyVenues.map(venue => (
                      <a
                        key={venue.place_id}
                        href={`https://www.google.com/maps/place/?q=place_id:${venue.place_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: 'var(--surface-container-low)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}
                      >
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

            {/* Header de resultados de jogadores */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                {visible.length} jogador{visible.length !== 1 ? 'es' : ''} encontrado{visible.length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={() => { setStatus('idle'); setPlayers([]); setInvited({}); setNearbyVenues([]); setUserCoords(null); setLocationError(null) }}
                style={{ background: 'var(--surface-container-high)', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}
              >
                Nova busca
              </button>
            </div>

            {visible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>😕</span>
                <p style={{ fontWeight: 600 }}>Nenhum jogador encontrado para esta posição no raio de {radiusKm}km</p>
                <p style={{ fontSize: 13, marginTop: 6 }}>Tente aumentar o raio ou buscar outra posição</p>
              </div>
            ) : (
              visible.map(p => {
                const invState = invited[p.id]
                const initials = (p.profile?.display_name || 'J').substring(0, 2).toUpperCase()
                const score    = Math.round((p.profile?.skill_score || 4.0) * 20)
                const dist     = distanceLabel(p)
                return (
                  <div key={p.id} style={{ background: 'var(--surface-container)', borderRadius: 20, padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: `${p.color || '#1cb85b'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: p.color || '#1cb85b', border: `1.5px solid ${p.color || '#1cb85b'}30` }}>
                        {initials}
                      </div>
                      <div style={{ position: 'absolute', bottom: -6, right: -6, background: '#1cb85b', color: '#00290e', fontFamily: 'Syne', fontWeight: 800, fontSize: 10, width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {score}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.profile?.display_name || 'Jogador'}
                      </p>
                      <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, marginTop: 3 }}>
                        {POS_LABEL[p.profile?.primary_position] || '—'} · {p.profile?.total_matches || 0} jogos
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#f8a010', fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)' }}>{(p.profile?.skill_score || 4.0).toFixed(1)}</span>
                        {dist && (
                          <span style={{ fontSize: 11, color: '#1cb85b', marginLeft: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>near_me</span>
                            {dist}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    {invState === 'sent' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ color: '#1cb85b', fontSize: 28, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#1cb85b', textTransform: 'uppercase' }}>Enviado</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInvite(p.id)}
                        disabled={invState === 'sending'}
                        style={{ flexShrink: 0, background: 'var(--primary-container)', color: 'var(--on-primary-container)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', padding: '10px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', opacity: invState === 'sending' ? 0.6 : 1 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
                        {invState === 'sending' ? '...' : 'Chamar'}
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
