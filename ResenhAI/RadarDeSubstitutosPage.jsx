import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { inviteSubstitute } from '../services/rsvpService';
import {
  findNearbySubstitutes,
  getCurrentPosition,
  updateUserLocation,
  getMapsDirectionsUrl,
  haversineDistance,
} from '../services/googleMapsService';

// ─── Components ───────────────────────────────────────────────────────────────

function Avatar({ url, name, size = 48 }) {
  const initials = name?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';
  return url ? (
    <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#0284c7,#0369a1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
}

function DistanceBadge({ km }) {
  const color = km < 2 ? '#22c55e' : km < 5 ? '#f59e0b' : km < 10 ? '#f97316' : '#ef4444';
  const label = km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color, padding: '2px 8px',
      background: `${color}18`, borderRadius: 99 }}>
      📍 {label}
    </span>
  );
}

function SubstituteCard({ player, onInvite, inviting, invited }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLeft}>
        <Avatar url={player.avatar_url} name={player.name} size={50} />
        <div style={{ minWidth: 0 }}>
          <div style={styles.cardName}>{player.name}</div>
          <div style={styles.cardMeta}>
            {player.position || 'Campo'}
            {player.rating ? ` · ⭐ ${player.rating}` : ''}
          </div>
          <DistanceBadge km={player.distance_km} />
        </div>
      </div>
      <div style={styles.cardRight}>
        {invited ? (
          <span style={styles.invitedBadge}>✓ Convidado</span>
        ) : (
          <button
            onClick={() => onInvite(player)}
            disabled={inviting}
            style={{ ...styles.btnInvite, opacity: inviting ? 0.6 : 1 }}
          >
            {inviting ? '...' : 'Convidar'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Mapa estático simples (sem SDK) ─────────────────────────────────────────

function StaticMapPreview({ location, players }) {
  if (!location) return null;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Monta os markers dos jogadores
  const playerMarkers = players.slice(0, 5).map(
    (p) => `markers=color:blue|${p.location.lat},${p.location.lng}`
  ).join('&');

  const url = `https://maps.googleapis.com/maps/api/staticmap?`
    + `center=${location.lat},${location.lng}`
    + `&zoom=12&size=600x200&scale=2`
    + `&markers=color:green|label:P|${location.lat},${location.lng}`
    + (playerMarkers ? `&${playerMarkers}` : '')
    + `&style=element:geometry|color:0x1a2a1a`
    + `&style=element:labels.text.fill|color:0x9ca3af`
    + `&key=${apiKey}`;

  return (
    <div style={styles.mapContainer}>
      <img src={url} alt="Mapa da partida" style={styles.mapImg} />
      <div style={styles.mapOverlay}>
        <span style={styles.mapLabel}>⚽ Partida</span>
        {players.length > 0 && (
          <span style={styles.mapLabel2}>🔵 {players.length} suplente{players.length > 1 ? 's' : ''} próximos</span>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function RadarDeSubstitutosPage() {
  const { matchId } = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [match, setMatch]             = useState(null);
  const [matchLocation, setMatchLocation] = useState(null);
  const [players, setPlayers]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [locating, setLocating]       = useState(false);
  const [radiusKm, setRadiusKm]       = useState(10);
  const [filter, setFilter]           = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [invitingId, setInvitingId]   = useState(null);
  const [invitedIds, setInvitedIds]   = useState(new Set());
  const [toast, setToast]             = useState(null);
  const [locationError, setLocationError] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Carrega dados da partida
  useEffect(() => {
    if (!matchId) return;
    (async () => {
      const { data } = await supabase.from('matches').select('*').eq('id', matchId).single();
      if (data) {
        setMatch(data);
        if (data.location_lat && data.location_lng) {
          setMatchLocation({ lat: data.location_lat, lng: data.location_lng });
        }
      }
    })();
  }, [matchId]);

  // Busca substitutos
  const searchSubstitutes = useCallback(async (location) => {
    const loc = location || matchLocation;
    if (!loc) { showToast('Localização da partida não definida.', 'error'); return; }

    setLoading(true);
    try {
      const results = await findNearbySubstitutes(supabase, matchId, loc, radiusKm);
      setPlayers(results);
      if (results.length === 0) showToast(`Nenhum substituto em ${radiusKm}km.`, 'info');
    } catch (e) {
      showToast(e.message || 'Erro ao buscar substitutos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [matchId, matchLocation, radiusKm]);

  // Atualiza localização do usuário e refaz busca
  const handleLocateMe = async () => {
    setLocating(true);
    setLocationError('');
    try {
      await updateUserLocation(supabase, user.id);
      showToast('Sua localização foi atualizada!');
      await searchSubstitutes();
    } catch (e) {
      setLocationError(e.message);
      showToast(e.message, 'error');
    } finally {
      setLocating(false);
    }
  };

  // Convida substituto
  const handleInvite = async (player) => {
    setInvitingId(player.id);
    try {
      await inviteSubstitute(matchId, player.id);
      setInvitedIds((prev) => new Set([...prev, player.id]));
      showToast(`${player.name} foi convidado como suplente! ✓`);
    } catch (e) {
      showToast(e.message || 'Erro ao convidar.', 'error');
    } finally {
      setInvitingId(null);
    }
  };

  const filtered = players.filter((p) => {
    const nameMatch = !filter || p.name.toLowerCase().includes(filter.toLowerCase());
    const posMatch  = !positionFilter || p.position === positionFilter;
    return nameMatch && posMatch;
  });

  const positions = [...new Set(players.map((p) => p.position).filter(Boolean))];

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#0284c7' : '#16a34a' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>←</button>
        <div>
          <h1 style={styles.title}>Radar de Suplentes</h1>
          <p style={styles.subtitle}>{match?.name || 'Buscando substitutos próximos...'}</p>
        </div>
      </div>

      {/* Mapa estático */}
      {matchLocation && <StaticMapPreview location={matchLocation} players={filtered} />}

      {/* Configurações de busca */}
      <div style={styles.searchPanel}>
        <div style={styles.searchRow}>
          <div style={styles.radiusGroup}>
            <label style={styles.label}>Raio de busca</label>
            <div style={styles.radiusBtns}>
              {[5, 10, 20, 50].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  style={{ ...styles.radiusBtn, ...(radiusKm === r ? styles.radiusBtnActive : {}) }}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => searchSubstitutes()}
            disabled={loading || !matchLocation}
            style={{ ...styles.btnSearch, opacity: loading || !matchLocation ? 0.6 : 1 }}
          >
            {loading ? '🔍 Buscando...' : '🔍 Buscar'}
          </button>
        </div>

        <button onClick={handleLocateMe} disabled={locating} style={styles.btnLocate}>
          {locating ? '📡 Localizando...' : '📍 Atualizar minha localização'}
        </button>
        {locationError && <p style={styles.errorText}>{locationError}</p>}
      </div>

      {/* Filtros */}
      {players.length > 0 && (
        <div style={styles.filters}>
          <input
            placeholder="🔎 Buscar por nome..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.searchInput}
          />
          {positions.length > 0 && (
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              style={styles.select}
            >
              <option value="">Todas posições</option>
              {positions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Lista */}
      <div style={styles.list}>
        {loading ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6b7280' }}>
            <div style={styles.spinner} />
            <p style={{ marginTop: 16 }}>Buscando substitutos via Google Maps...</p>
          </div>
        ) : filtered.length === 0 && players.length > 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 40 }}>🔎</span>
            <p>Nenhum resultado para esse filtro.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 64 }}>📡</span>
            <p style={{ margin: '12px 0 4px', fontWeight: 600 }}>Radar pronto</p>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              {!matchLocation
                ? 'A partida não tem localização definida.'
                : 'Clique em "Buscar" para encontrar suplentes próximos via Google Maps.'}
            </p>
          </div>
        ) : (
          <>
            <div style={styles.resultsHeader}>
              <span style={styles.resultsCount}>{filtered.length} suplente{filtered.length > 1 ? 's' : ''} encontrado{filtered.length > 1 ? 's' : ''}</span>
              <span style={styles.resultsRadius}>em raio de {radiusKm}km</span>
            </div>
            {filtered.map((player) => (
              <SubstituteCard
                key={player.id}
                player={player}
                onInvite={handleInvite}
                inviting={invitingId === player.id}
                invited={invitedIds.has(player.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    background: '#080f14',
    color: '#f1f5f1',
    fontFamily: "'Sora', 'Segoe UI', sans-serif",
    paddingBottom: 80,
  },
  header: {
    padding: '20px 16px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(2,132,199,0.04)',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.06)', border: 'none', color: '#f1f5f1',
    borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 18, flexShrink: 0, marginTop: 2,
  },
  title: { margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' },
  subtitle: { margin: '4px 0 0', fontSize: 13, color: '#9ca3af' },
  mapContainer: { position: 'relative', margin: '0', height: 160, overflow: 'hidden' },
  mapImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.7)' },
  mapOverlay: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end',
    justifyContent: 'space-between', padding: '12px 16px',
    background: 'linear-gradient(to top, rgba(8,15,20,0.8) 0%, transparent 60%)',
  },
  mapLabel: { fontSize: 13, fontWeight: 700, color: '#4ade80', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: 20 },
  mapLabel2: { fontSize: 13, fontWeight: 700, color: '#60a5fa', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: 20 },
  searchPanel: { padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  searchRow: { display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' },
  radiusGroup: { flex: 1 },
  label: { display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 8, fontWeight: 500 },
  radiusBtns: { display: 'flex', gap: 6 },
  radiusBtn: {
    padding: '7px 14px', border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)', borderRadius: 8,
    color: '#9ca3af', fontSize: 13, cursor: 'pointer', fontWeight: 500,
  },
  radiusBtnActive: {
    background: 'rgba(2,132,199,0.2)', border: '1px solid rgba(2,132,199,0.4)', color: '#38bdf8',
  },
  btnSearch: {
    padding: '10px 18px', background: 'linear-gradient(135deg,#0284c7,#0369a1)',
    border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  btnLocate: {
    marginTop: 10, width: '100%', padding: '10px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#e5e7eb', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  },
  errorText: { margin: '8px 0 0', fontSize: 12, color: '#f87171' },
  filters: { padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' },
  searchInput: {
    flex: 1, minWidth: 160, padding: '9px 12px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#f1f5f1', fontSize: 14, outline: 'none',
  },
  select: {
    padding: '9px 12px', background: '#111b22', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#f1f5f1', fontSize: 13, outline: 'none',
  },
  list: { padding: '0 16px', paddingTop: 8 },
  resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 12px' },
  resultsCount: { fontSize: 14, fontWeight: 600, color: '#e5e7eb' },
  resultsRadius: { fontSize: 12, color: '#6b7280' },
  card: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px', background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 8,
    transition: 'background 0.15s',
  },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  cardName: { fontSize: 14, fontWeight: 600, marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#6b7280', marginBottom: 5 },
  cardRight: { flexShrink: 0, marginLeft: 8 },
  btnInvite: {
    padding: '8px 14px', background: 'rgba(2,132,199,0.15)',
    border: '1px solid rgba(2,132,199,0.35)', borderRadius: 8,
    color: '#38bdf8', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  invitedBadge: {
    padding: '6px 12px', background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8,
    color: '#4ade80', fontSize: 12, fontWeight: 600,
  },
  emptyState: { padding: '48px 16px', textAlign: 'center', color: '#6b7280' },
  spinner: {
    width: 32, height: 32, border: '3px solid rgba(2,132,199,0.2)',
    borderTop: '3px solid #0284c7', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite', margin: '0 auto',
  },
  toast: {
    position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
    padding: '12px 20px', borderRadius: 10, color: '#fff', fontWeight: 600,
    fontSize: 14, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    whiteSpace: 'nowrap',
  },
};
