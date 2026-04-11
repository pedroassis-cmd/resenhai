/**
 * useUserLocation.js
 * Hook para atualizar e acompanhar a localização do usuário no app.
 *
 * Uso:
 *   const { location, loading, error, refresh } = useUserLocation();
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { getCurrentPosition, reverseGeocode } from '../services/googleMapsService';

export function useUserLocation({ autoUpdate = true, updateInterval = 5 * 60 * 1000 } = {}) {
  const { user } = useAuth();
  const [location, setLocation]     = useState(null);
  const [address, setAddress]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { lat, lng } = await getCurrentPosition();

      // Salva no Supabase
      await supabase
        .from('profiles')
        .update({ location_lat: lat, location_lng: lng, last_location_update: new Date().toISOString() })
        .eq('id', user.id);

      setLocation({ lat, lng });

      // Reverse geocode em background
      reverseGeocode(lat, lng).then(setAddress).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!autoUpdate || !user) return;
    refresh();
    const interval = setInterval(refresh, updateInterval);
    return () => clearInterval(interval);
  }, [autoUpdate, user, refresh, updateInterval]);

  return { location, address, loading, error, refresh };
}
