/**
 * googleMapsService.js
 * Serviço de integração com Google Maps API
 *
 * CONFIGURAÇÃO NECESSÁRIA no .env:
 *   VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
 *
 * APIs necessárias no Google Cloud Console:
 *   • Maps JavaScript API
 *   • Places API
 *   • Geocoding API
 *   • Distance Matrix API
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

// ─── Loader do SDK ────────────────────────────────────────────────────────────

let mapsLoadPromise = null;

export function loadGoogleMapsSDK() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('Falha ao carregar Google Maps SDK'));
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

// ─── Geolocalização ───────────────────────────────────────────────────────────

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada neste navegador.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const msgs = { 1: 'Permissão negada.', 2: 'Localização indisponível.', 3: 'Tempo esgotado.' };
        reject(new Error(msgs[err.code] || 'Erro de geolocalização.'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

// ─── Geocoding ────────────────────────────────────────────────────────────────

export async function geocodeAddress(address) {
  const params = new URLSearchParams({ address, key: GOOGLE_MAPS_API_KEY, language: 'pt-BR', region: 'BR' });
  const res = await fetch(`${MAPS_BASE_URL}/geocode/json?${params}`);
  const data = await res.json();
  if (data.status !== 'OK' || !data.results.length) throw new Error(`Geocoding falhou: ${data.status}`);
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng, formatted_address: data.results[0].formatted_address };
}

export async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({ latlng: `${lat},${lng}`, key: GOOGLE_MAPS_API_KEY, language: 'pt-BR' });
  const res = await fetch(`${MAPS_BASE_URL}/geocode/json?${params}`);
  const data = await res.json();
  if (data.status !== 'OK' || !data.results.length) return `${lat}, ${lng}`;
  return data.results[0].formatted_address;
}

// ─── Distância ────────────────────────────────────────────────────────────────

function toRad(deg) { return (deg * Math.PI) / 180; }

export function haversineDistance(from, to) {
  const R = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getRouteDistance(origin, destination) {
  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lng}`,
    destinations: `${destination.lat},${destination.lng}`,
    mode: 'driving',
    language: 'pt-BR',
    key: GOOGLE_MAPS_API_KEY,
  });
  const res = await fetch(`${MAPS_BASE_URL}/distancematrix/json?${params}`);
  const data = await res.json();
  if (data.status !== 'OK') throw new Error(`Distance Matrix falhou: ${data.status}`);
  const element = data.rows[0].elements[0];
  if (element.status !== 'OK') throw new Error('Rota não encontrada.');
  return {
    distance_km: element.distance.value / 1000,
    duration_min: Math.ceil(element.duration.value / 60),
    distance_text: element.distance.text,
    duration_text: element.duration.text,
  };
}

// ─── Busca de substitutos ─────────────────────────────────────────────────────

export function filterSubstitutesByProximity(players, matchLocation, radiusKm = 20) {
  return players
    .map((player) => {
      if (!player.location?.lat || !player.location?.lng) return null;
      const distance_km = haversineDistance(player.location, matchLocation);
      return { ...player, distance_km };
    })
    .filter((p) => p !== null && p.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
}

export async function findNearbySubstitutes(supabase, matchId, matchLocation, radiusKm = 20) {
  const { data: availablePlayers, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, position, rating, location_lat, location_lng, last_location_update')
    .eq('available_as_substitute', true)
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null);

  if (error) throw error;

  const playersWithLocation = availablePlayers.map((p) => ({
    id: p.id,
    name: p.full_name,
    avatar_url: p.avatar_url,
    position: p.position,
    rating: p.rating,
    location: { lat: p.location_lat, lng: p.location_lng },
    last_location_update: p.last_location_update,
  }));

  return filterSubstitutesByProximity(playersWithLocation, matchLocation, radiusKm);
}

// ─── Atualização de localização ───────────────────────────────────────────────

export async function updateUserLocation(supabase, userId) {
  const { lat, lng } = await getCurrentPosition();
  const { error } = await supabase
    .from('profiles')
    .update({ location_lat: lat, location_lng: lng, last_location_update: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
  return { lat, lng };
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

export function getMapsDirectionsUrl(destination, label = '') {
  const dest = `${destination.lat},${destination.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving${label ? `&destination_name=${encodeURIComponent(label)}` : ''}`;
}

export function getMapsEmbedUrl(location, zoom = 15) {
  return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${location.lat},${location.lng}&zoom=${zoom}`;
}

export function getMatchShareUrl(location, matchName) {
  const query = encodeURIComponent(`${matchName} ${location.lat},${location.lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
