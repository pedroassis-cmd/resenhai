/**
 * googleMapsService.js
 * Integração com Google Maps Platform para o PeladaApp.
 *
 * APIs utilizadas:
 *  - Maps JavaScript API  → embed interativo no tab "Local"
 *  - Geocoding API        → converter endereço da quadra em lat/lng
 *  - Places Nearby Search → buscar quadras e jogadores próximos
 *  - Directions (deep link)→ abrir rotas no app Google Maps
 *
 * Configuração no .env:
 *   VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
 */

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// ─── Loader ────────────────────────────────────────────────────────────────
let _mapsLoaded = false
let _loadPromise = null

/**
 * Carrega o script do Google Maps uma única vez.
 * Retorna uma Promise que resolve quando a API estiver pronta.
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
      console.warn('[googleMapsService] VITE_GOOGLE_MAPS_API_KEY não definida. Usando modo placeholder.')
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&language=pt-BR&region=BR`
    script.async = true
    script.defer = true
    script.onload = () => { _mapsLoaded = true; resolve() }
    script.onerror = () => reject(new Error('Falha ao carregar Google Maps'))
    document.head.appendChild(script)
  })

  return _loadPromise
}

// ─── Geocoding ─────────────────────────────────────────────────────────────

/**
 * Converte um endereço texto em coordenadas { lat, lng }.
 * Usa a Geocoding REST API (não precisa do script JS carregado).
 *
 * @param {string} address  Ex: "Rua das Palmeiras 123, São Paulo"
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function geocodeAddress(address) {
  if (!MAPS_API_KEY) return null

  try {
    const encoded = encodeURIComponent(address)
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${MAPS_API_KEY}&region=BR`
    )
    const json = await res.json()
    if (json.status === 'OK' && json.results[0]) {
      const loc = json.results[0].geometry.location
      return { lat: loc.lat, lng: loc.lng }
    }
    return null
  } catch (err) {
    console.error('[googleMapsService] geocodeAddress error:', err)
    return null
  }
}

// ─── Embed Map ─────────────────────────────────────────────────────────────

/**
 * Monta um iframe embed do Google Maps para um endereço.
 * Alternativa ao Maps JS API – não precisa de chave de faturamento ativa.
 *
 * @param {string} address
 * @returns {string}  URL para usar em <iframe src={...}>
 */
export function getMapEmbedUrl(address) {
  const encoded = encodeURIComponent(address)
  const key = MAPS_API_KEY ? `&key=${MAPS_API_KEY}` : ''
  return `https://www.google.com/maps/embed/v1/place?q=${encoded}${key}`
}

/**
 * Monta a URL para abrir o Google Maps (app ou web) com rota até o destino.
 *
 * @param {string} address
 * @returns {string}
 */
export function getDirectionsUrl(address) {
  const encoded = encodeURIComponent(address)
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`
}

/**
 * Compartilhar localização: URL do Google Maps para o endereço.
 *
 * @param {string} address
 * @returns {string}
 */
export function getShareLocationUrl(address) {
  const encoded = encodeURIComponent(address)
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`
}

// ─── Geolocalização do usuário ─────────────────────────────────────────────

/**
 * Obtém a posição atual do dispositivo via navigator.geolocation.
 *
 * @returns {Promise<{lat: number, lng: number}>}
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
      { timeout: 10000, enableHighAccuracy: true }
    )
  })
}

function getGeolocationError(err) {
  switch (err.code) {
    case 1: return 'Permissão de localização negada. Ative nas configurações do navegador.'
    case 2: return 'Posição indisponível. Tente novamente.'
    case 3: return 'Tempo esgotado ao obter localização.'
    default: return 'Erro ao obter localização.'
  }
}

// ─── Places Nearby Search ──────────────────────────────────────────────────

/**
 * Busca quadras de futebol/esportes próximas a uma coordenada.
 * Usa Places Nearby Search REST API.
 *
 * @param {{ lat: number, lng: number }} coords
 * @param {number} radiusMeters  Padrão 5000m (5km)
 * @returns {Promise<Array<{place_id, name, vicinity, geometry, rating, photos}>>}
 */
export async function findNearbySportVenues(coords, radiusMeters = 5000) {
  if (!MAPS_API_KEY) return getMockVenues(coords)

  try {
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
    if (json.status === 'OK') return json.results.slice(0, 8)
    return getMockVenues(coords)
  } catch (err) {
    console.error('[googleMapsService] findNearbySportVenues error:', err)
    return getMockVenues(coords)
  }
}

/**
 * Busca substitutos no Supabase filtrando por raio geográfico.
 * Complementa o radarService com distância real calculada.
 *
 * @param {{ lat: number, lng: number }} userCoords
 * @param {Array}  players  Lista de jogadores do radarService (com lat/lng se disponível)
 * @param {number} radiusKm
 * @returns {Array} Jogadores ordenados por distância, com campo `distanceKm`
 */
export function sortPlayersByDistance(players, userCoords, radiusKm = 15) {
  if (!userCoords) return players

  return players
    .map(p => {
      const playerLat = p.lat ?? p.user?.lat ?? null
      const playerLng = p.lng ?? p.user?.lng ?? null
      const distanceKm = (playerLat && playerLng)
        ? haversineKm(userCoords.lat, userCoords.lng, playerLat, playerLng)
        : (p.distance || Math.random() * 8 + 0.5) // fallback para mock
      return { ...p, distanceKm }
    })
    .filter(p => p.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

// Fórmula de Haversine para distância entre dois pontos (km)
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) { return deg * (Math.PI / 180) }

// ─── Mock data (sem chave de API) ──────────────────────────────────────────

function getMockVenues(coords) {
  return [
    { place_id: 'mock1', name: 'Arena Society Plus', vicinity: 'Rua das Palmeiras, 123', geometry: { location: coords }, rating: 4.5 },
    { place_id: 'mock2', name: 'Quadra Central Sport',  vicinity: 'Av. Brasil, 450',       geometry: { location: coords }, rating: 4.2 },
    { place_id: 'mock3', name: 'CT Esportes',            vicinity: 'Rua do Gol, 78',         geometry: { location: coords }, rating: 4.8 },
  ]
}
