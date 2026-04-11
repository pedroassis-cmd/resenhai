/**
 * useUserLocation.js
 * Hook para obter e manter atualizada a localização do usuário.
 *
 * Uso:
 *   const { location, address, loading, error, refresh } = useUserLocation()
 *
 * - Atualiza a localização no banco (player_profiles) automaticamente.
 * - Usa reverseGeocode apenas uma vez (não consome chamadas de Places por sessão).
 * - Intervalo padrão: 5 minutos, configurável via `updateInterval`.
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { getUserLocation, geocodeAddress } from '../services/googleMapsService'
import { useAuth } from '../context/AuthContext'

export function useUserLocation({ autoUpdate = true, updateInterval = 5 * 60 * 1000 } = {}) {
  const { user } = useAuth()
  const [location, setLocation] = useState(null)   // { lat, lng }
  const [address, setAddress]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const { lat, lng } = await getUserLocation()

      // Persiste no Supabase (tabela player_profiles — colunas latitude/longitude)
      await supabase
        .from('player_profiles')
        .update({ latitude: lat, longitude: lng, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      setLocation({ lat, lng })

      // Reverse geocode em background — não incrementa Places counter porque
      // usa a Geocoding API (REST), não o Places SDK
      try {
        const reverseRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}` +
          `&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&language=pt-BR&result_type=locality|neighborhood`
        )
        const json = await reverseRes.json()
        if (json.status === 'OK' && json.results[0]) {
          setAddress(json.results[0].formatted_address)
        }
      } catch { /* silencia erro de reverse geocode */ }

    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!autoUpdate || !user) return
    refresh()
    const interval = setInterval(refresh, updateInterval)
    return () => clearInterval(interval)
  }, [autoUpdate, user, refresh, updateInterval])

  return { location, address, loading, error, refresh }
}

export default useUserLocation
