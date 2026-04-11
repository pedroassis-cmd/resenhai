/**
 * googleMapsService.js
 * Integração com Google Maps Platform para o ResenhAI.
 *
 * APIs utilizadas:
 *  - Maps JavaScript API  → embed interativo no tab "Local"
 *  - Geocoding API        → converter endereço da quadra em lat/lng
 *  - Places Nearby Search → buscar quadras próximas
 *  - Distance Matrix      → distância de rota real
 *
 * Configuração no .env:
 *   VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
 *
 * ── Economias de API (3 camadas) ────────────────────────────────────────────
 *  1. Coordenadas de venues já salvas no banco → nunca faz geocoding redundante
 *  2. sessionStorage → cacheia resultados de busca por 30 minutos
 *  3. Rate limiter → máximo de GEOCODING_LIMIT chamadas de geocoding por sessão
 */

import { supabase } from '../supabase'

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// ─── Rate limiter ────────────────────────────────────────────────────────────
const SESSION_KEY         = 'gmaps_session'
const GEOCODING_LIMIT     = 30   // max chamadas de geocoding por sessão
const PLACES_LIMIT        = 10   // max chamadas de Places Nearby por sessão
const CACHE_TTL_MS        = 30 * 60 * 1000  // 30 minutos

function getSessionCounters() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : { geocoding: 0, places: 0 }
  } catch { return { geocoding: 0, places: 0 } }
}

function incrementCounter(type) {
  const c = getSessionCounters()
  c[type] = (c[type] || 0) + 1
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(c)) } catch { /* ignore */ }
  return c[type]
}

function canCallGeocoding() {
  return getSessionCounters().geocoding < GEOCODING_LIMIT
}

function canCallPlaces() {
  return getSessionCounters().places < PLACES_LIMIT
}

// ─── sessionStorage cache genérico ──────────────────────────────────────────

function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem(`gmaps_cache_${key}`)
    if (!raw) return null
    const { value, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(`gmaps_cache_${key}`)
      return null
    }
    return value
  } catch { return null }
}

function cacheSet(key, value) {
  try {
    sessionStorage.setItem(`gmaps_cache_${key}`, JSON.stringify({ value, ts: Date.now() }))
  } catch { /* quota exceeded - ignore */ }
}

// ─── Loader do SDK ───────────────────────────────────────────────────────────
let _mapsLoaded   = false
let _loadPromise  = null

/**
 * Carrega o SDK do Google Maps uma única vez (singleton).
 */
export function loadGoogleMapsScript() {
  if (_mapsLoaded) return Promise.resolve()
  if (_loadPromise) return _loadPromise

  _loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      _mapsLoaded = true
      resolve()
      return
    }
    if (!MAPS_API_KEY) {
      console.warn('[GoogleMaps] Chave não configurada. Usando placeholders.')
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&language=pt-BR&region=BR`
    script.async = true
    script.defer = true
    script.onload = () => { _mapsLoaded = true; resolve() }
    script.onerror = () => reject(new Error('Falha ao carregar Google Maps SDK'))
    document.head.appendChild(script)
  })

  return _loadPromise
}

// ─── Geolocalização do usuário ───────────────────────────────────────────────

/**
 * Obtém a posição atual via browser geolocation (não consome API do Google).
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada neste dispositivo.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(new Error(getGeolocationError(err))),
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
    )
  })
}

function getGeolocationError(err) {
  switch (err.code) {
    case 1: return 'Permissão de localização negada.'
    case 2: return 'Posição indisponível.'
    case 3: return 'Tempo esgotado ao obter localização.'
    default: return 'Erro ao obter localização.'
  }
}

// ─── Geocoding com cache em DB + sessionStorage ──────────────────────────────

/**
 * Converte endereço em lat/lng.
 * Fluxo de cache:
 *   1. sessionStorage (TTL 30 min)
 *   2. Chamada REST à API (se dentro do limite da sessão)
 *   3. Se fora do limite, retorna null
 *
 * @param {string} address
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function geocodeAddress(address) {
  if (!address) return null

  const cacheKey = `geo_${address.toLowerCase().replace(/\s+/g, '_')}`

  // 1. Cache local (sessionStorage)
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  // 2. Limite de chamadas
  if (!canCallGeocoding()) {
    console.warn('[GoogleMaps] Limite de geocoding atingido para esta sessão.')
    return null
  }
  if (!MAPS_API_KEY) return null

  try {
    incrementCounter('geocoding')
    const encoded = encodeURIComponent(address)
    const res  = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${MAPS_API_KEY}&region=BR&language=pt-BR`
    )
    const json = await res.json()
    if (json.status === 'OK' && json.results[0]) {
      const loc = json.results[0].geometry.location
      const result = { lat: loc.lat, lng: loc.lng }
      cacheSet(cacheKey, result)
      return result
    }
    return null
  } catch (err) {
    console.error('[GoogleMaps] geocodeAddress error:', err)
    return null
  }
}

/**
 * Geocodifica um venue e salva as coordenadas no banco para uso futuro.
 * Se o venue já tiver lat/lng no banco, retorna imediatamente.
 *
 * @param {string} venueId   UUID do venue no Supabase
 * @param {string} address   Endereço completo para geocodificar
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function geocodeAndCacheVenue(venueId, address) {
  if (!venueId || !address) return null

  // 1. Busca coordinates existentes no banco
  const { data: venue } = await supabase
    .from('venues')
    .select('latitude, longitude, geocoded_at')
    .eq('id', venueId)
    .maybeSingle()

  if (venue?.latitude && venue?.longitude) {
    return { lat: Number(venue.latitude), lng: Number(venue.longitude) }
  }

  // 2. Se não tem, geocodifica e persiste
  const coords = await geocodeAddress(address)
  if (!coords) return null

  await supabase
    .from('venues')
    .update({ latitude: coords.lat, longitude: coords.lng, geocoded_at: new Date().toISOString() })
    .eq('id', venueId)

  return coords
}

// ─── Busca de quadras próximas ───────────────────────────────────────────────

/**
 * Busca quadras esportivas próximas via Places Nearby Search.
 * Usa sessionStorage para cachear resultados (chave = coords arredondadas).
 *
 * @param {{ lat: number, lng: number }} coords
 * @param {number} radiusMeters  Padrão 5000m
 * @returns {Promise<Array>}
 */
export async function findNearbySportVenues(coords, radiusMeters = 5000) {
  if (!MAPS_API_KEY) return getMockVenues(coords)

  // Cache key com precisão de 2 casas (≈1km)
  const cacheKey = `venues_${coords.lat.toFixed(2)}_${coords.lng.toFixed(2)}_${radiusMeters}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  if (!canCallPlaces()) {
    console.warn('[GoogleMaps] Limite de Places atingido para esta sessão.')
    return getMockVenues(coords)
  }

  try {
    incrementCounter('places')
    const { lat, lng } = coords
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}` +
      `&radius=${radiusMeters}` +
      `&type=stadium|gym|park` +
      `&keyword=quadra+futebol+society` +
      `&key=${MAPS_API_KEY}` +
      `&language=pt-BR`
    )
    const json = await res.json()
    if (json.status === 'OK') {
      const results = json.results.slice(0, 8)
      cacheSet(cacheKey, results)
      return results
    }
    return getMockVenues(coords)
  } catch (err) {
    console.error('[GoogleMaps] findNearbySportVenues error:', err)
    return getMockVenues(coords)
  }
}

// ─── Cálculo de distância (Haversine — sem custo de API) ─────────────────────

/**
 * Calcula distância em km entre dois pontos geográficos (sem chamar API).
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) { return deg * (Math.PI / 180) }

/**
 * Ordena e filtra jogadores por distância (sem chamadas de API).
 */
export function sortPlayersByDistance(players, userCoords, radiusKm = 15) {
  if (!userCoords) return players
  return players
    .map(p => {
      const playerLat = p.latitude ?? p.lat ?? null
      const playerLng = p.longitude ?? p.lng ?? null
      const distanceKm = (playerLat && playerLng)
        ? haversineKm(userCoords.lat, userCoords.lng, playerLat, playerLng)
        : null
      return { ...p, distanceKm }
    })
    .filter(p => p.distanceKm === null || p.distanceKm <= radiusKm)
    .sort((a, b) => {
      if (a.distanceKm === null) return 1
      if (b.distanceKm === null) return -1
      return a.distanceKm - b.distanceKm
    })
}

// ─── Relatório de uso da sessão ──────────────────────────────────────────────

/**
 * Retorna o status de consumo de chamadas da sessão atual.
 * Use para debug ou exibição de informação ao usuário.
 */
export function getApiUsageStatus() {
  const c = getSessionCounters()
  return {
    geocoding: { used: c.geocoding, limit: GEOCODING_LIMIT, remaining: GEOCODING_LIMIT - c.geocoding },
    places:    { used: c.places,    limit: PLACES_LIMIT,    remaining: PLACES_LIMIT - c.places },
  }
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

export function getMapEmbedUrl(address) {
  const encoded = encodeURIComponent(address)
  const key = MAPS_API_KEY ? `&key=${MAPS_API_KEY}` : ''
  return `https://www.google.com/maps/embed/v1/place?q=${encoded}${key}`
}

export function getMapEmbedUrlByCoords(lat, lng, zoom = 15) {
  const key = MAPS_API_KEY ? `&key=${MAPS_API_KEY}` : ''
  return `https://www.google.com/maps/embed/v1/view?center=${lat},${lng}&zoom=${zoom}${key}`
}

export function getDirectionsUrl(address) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`
}

export function getDirectionsUrlByCoords(lat, lng, label = '') {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving${label ? `&destination_name=${encodeURIComponent(label)}` : ''}`
}

export function getShareLocationUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

// ─── Mock data (sem chave ou sem permissão) ───────────────────────────────────

function getMockVenues(coords) {
  return [
    { place_id: 'mock1', name: 'Arena Society Plus',  vicinity: 'Rua das Palmeiras, 123', geometry: { location: coords }, rating: 4.5 },
    { place_id: 'mock2', name: 'Quadra Central Sport', vicinity: 'Av. Brasil, 450',        geometry: { location: coords }, rating: 4.2 },
    { place_id: 'mock3', name: 'CT Esportes',          vicinity: 'Rua do Gol, 78',          geometry: { location: coords }, rating: 4.8 },
  ]
}
