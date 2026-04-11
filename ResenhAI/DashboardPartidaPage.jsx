import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import {
  getMatchRsvps,
  getRsvpSummary,
  confirmPresence,
  markPlayerAbsent,
  revertAbsent,
  promoteSubstitute,
  removeFromMatch,
  subscribeToRsvpChanges,
} from '../services/rsvpService';
import { getMapsDirectionsUrl } from '../services/googleMapsService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  confirmado: { label: 'Confirmado', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: '✓' },
  pendente:   { label: 'Pendente',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '⏳' },
  ausente:    { label: 'Ausente',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '✗' },
};

function Avatar({ url, name, size = 40 }) {
  const initials = name?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';
  return url ? (
    <img
      src={url}
      alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#15803d)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── Modal de confirmação de falta ───────────────────────────────────────────

function AbsentModal({ player, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <span style={{ fontSize: 32 }}>⚠️</span>
          <h3 style={styles.modalTitle}>Registrar Falta</h3>
          <p style={styles.modalSubtitle}>
            Confirme a ausência de <strong>{player?.profiles?.full_name}</strong>
          </p>
        </div>

        <div style={styles.modalBody}>
          <label style={styles.label}>Motivo (opcional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: não avisou, apareceu tarde demais..."
            style={styles.textarea}
            rows={3}
          />
        </div>

        <div style={styles.modalFooter}>
          <button onClick={onCancel} style={styles.btnSecondary} disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason)}
            style={{ ...styles.btnDanger, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Confirmar Falta'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card do jogador ─────────────────────────────────────────────────────────

function PlayerCard({ rsvp, isAdmin, currentUserId, onAction, matchLocation }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const player = rsvp.profiles;
  const statusCfg = STATUS_CONFIG[rsvp.status] || STATUS_CONFIG.pendente;
  const isMe = currentUserId === rsvp.player_id;

  const handleDirections = () => {
    if (!matchLocation) return;
    window.open(getMapsDirectionsUrl(matchLocation, 'Local da Partida'), '_blank');
  };

  return (
    <div style={{ ...styles.playerCard, borderLeft: `3px solid ${statusCfg.color}` }}>
      {/* Avatar + info */}
      <div style={styles.playerLeft}>
        <div style={{ position: 'relative' }}>
          <Avatar url={player?.avatar_url} name={player?.full_name} size={46} />
          {rsvp.role === 'suplente' && (
            <span style={styles.suplenteTag}>S</span>
          )}
        </div>
        <div>
          <div style={styles.playerName}>
            {player?.full_name || 'Jogador'}
            {isMe && <span style={styles.meTag}>Você</span>}
          </div>
          <div style={styles.playerMeta}>
            {player?.position || 'Campo'} · {player?.rating ? `⭐ ${player.rating}` : ''}
          </div>
          {rsvp.status === 'ausente' && rsvp.absent_reason && (
            <div style={styles.absentReason}>"{rsvp.absent_reason}"</div>
          )}
          {rsvp.status === 'confirmado' && rsvp.confirmed_at && (
            <div style={styles.confirmedAt}>
              Confirmou às {new Date(rsvp.confirmed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* Status + ações */}
      <div style={styles.playerRight}>
        <span style={{ ...styles.statusBadge, color: statusCfg.color, background: statusCfg.bg }}>
          {statusCfg.icon} {statusCfg.label}
        </span>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Jogador confirma a própria presença */}
          {isMe && rsvp.status === 'pendente' && (
            <button
              onClick={() => onAction('confirm', rsvp)}
              style={styles.btnConfirm}
            >
              ✓ Confirmar
            </button>
          )}

          {/* Botão de direções */}
          {matchLocation && (
            <button onClick={handleDirections} style={styles.btnIcon} title="Ver rota no Maps">
              📍
            </button>
          )}

          {/* Menu admin */}
          {isAdmin && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={styles.btnIcon}
                title="Ações do admin"
              >
                ⋯
              </button>
              {menuOpen && (
                <div style={styles.dropdown} onMouseLeave={() => setMenuOpen(false)}>
                  {rsvp.status !== 'confirmado' && (
                    <button onClick={() => { onAction('confirm', rsvp); setMenuOpen(false); }} style={styles.dropdownItem}>
                      ✓ Marcar como confirmado
                    </button>
                  )}
                  {rsvp.status !== 'ausente' && (
                    <button onClick={() => { onAction('absent', rsvp); setMenuOpen(false); }} style={{ ...styles.dropdownItem, color: '#ef4444' }}>
                      ✗ Registrar falta
                    </button>
                  )}
                  {rsvp.status === 'ausente' && (
                    <button onClick={() => { onAction('revert', rsvp); setMenuOpen(false); }} style={styles.dropdownItem}>
                      ↩ Reverter falta
                    </button>
                  )}
                  {rsvp.role === 'suplente' && rsvp.status === 'confirmado' && (
                    <button onClick={() => { onAction('promote', rsvp); setMenuOpen(false); }} style={{ ...styles.dropdownItem, color: '#16a34a' }}>
                      ↑ Promover a titular
                    </button>
                  )}
                  <div style={styles.dropdownDivider} />
                  <button onClick={() => { onAction('remove', rsvp); setMenuOpen(false); }} style={{ ...styles.dropdownItem, color: '#ef4444' }}>
                    🗑 Remover da partida
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Painel de resumo ─────────────────────────────────────────────────────────

function SummaryBar({ summary }) {
  const total = summary.total || 1;
  return (
    <div style={styles.summaryBar}>
      {[
        { key: 'confirmado', label: 'Confirmados', color: '#22c55e', icon: '✓' },
        { key: 'pendente',   label: 'Pendentes',   color: '#f59e0b', icon: '⏳' },
        { key: 'ausente',    label: 'Ausentes',    color: '#ef4444', icon: '✗' },
      ].map(({ key, label, color, icon }) => (
        <div key={key} style={styles.summaryItem}>
          <div style={{ ...styles.summaryCount, color }}>{icon} {summary[key] || 0}</div>
          <div style={styles.summaryLabel}>{label}</div>
          <div style={styles.summaryBar2}>
            <div style={{ ...styles.summaryFill, background: color, width: `${((summary[key] || 0) / total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DashboardPartidaPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match, setMatch]         = useState(null);
  const [rsvps, setRsvps]         = useState([]);
  const [summary, setSummary]     = useState({});
  const [isAdmin, setIsAdmin]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [absentTarget, setAbsentTarget] = useState(null);
  const [absentLoading, setAbsentLoading] = useState(false);
  const [toast, setToast]         = useState(null);
  const [activeTab, setActiveTab] = useState('titulares');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch match data
  useEffect(() => {
    if (!matchId) return;
    (async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();
      if (!error && data) {
        setMatch(data);
        setIsAdmin(data.created_by === user?.id);
      }
    })();
  }, [matchId, user]);

  // Fetch RSVPs
  const loadRsvps = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const [rsvpData, summaryData] = await Promise.all([
        getMatchRsvps(matchId),
        getRsvpSummary(matchId),
      ]);
      setRsvps(rsvpData || []);
      setSummary(summaryData);
    } catch (e) {
      showToast('Erro ao carregar jogadores.', 'error');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => { loadRsvps(); }, [loadRsvps]);

  // Realtime
  useEffect(() => {
    if (!matchId) return;
    const sub = subscribeToRsvpChanges(matchId, () => loadRsvps());
    return () => sub.unsubscribe();
  }, [matchId, loadRsvps]);

  // Ações
  const handleAction = async (action, rsvp) => {
    try {
      if (action === 'confirm') {
        await confirmPresence(matchId, rsvp.player_id);
        showToast('Presença confirmada! ✓');
      } else if (action === 'absent') {
        setAbsentTarget(rsvp);
        return;
      } else if (action === 'revert') {
        await revertAbsent(matchId, rsvp.player_id);
        showToast('Falta revertida.');
      } else if (action === 'promote') {
        await promoteSubstitute(matchId, rsvp.player_id);
        showToast('Jogador promovido a titular! ↑');
      } else if (action === 'remove') {
        if (!window.confirm('Remover este jogador da partida?')) return;
        await removeFromMatch(matchId, rsvp.player_id);
        showToast('Jogador removido.');
      }
      await loadRsvps();
    } catch (e) {
      showToast(e.message || 'Erro ao executar ação.', 'error');
    }
  };

  const handleAbsentConfirm = async (reason) => {
    setAbsentLoading(true);
    try {
      await markPlayerAbsent(matchId, absentTarget.player_id, reason);
      showToast(`Falta de ${absentTarget.profiles?.full_name} registrada.`);
      setAbsentTarget(null);
      await loadRsvps();
    } catch (e) {
      showToast(e.message || 'Erro ao registrar falta.', 'error');
    } finally {
      setAbsentLoading(false);
    }
  };

  const matchLocation = match?.location_lat && match?.location_lng
    ? { lat: match.location_lat, lng: match.location_lng }
    : null;

  const titulares  = rsvps.filter((r) => r.role === 'titular');
  const suplentes  = rsvps.filter((r) => r.role === 'suplente');
  const displayed  = activeTab === 'titulares' ? titulares : suplentes;

  const pendentesCount = rsvps.filter((r) => r.status === 'pendente').length;

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === 'error' ? '#ef4444' : '#16a34a' }}>
          {toast.msg}
        </div>
      )}

      {/* Modal falta */}
      {absentTarget && (
        <AbsentModal
          player={absentTarget}
          onConfirm={handleAbsentConfirm}
          onCancel={() => setAbsentTarget(null)}
          loading={absentLoading}
        />
      )}

      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>←</button>
        <div>
          <h1 style={styles.title}>{match?.name || 'Dashboard da Partida'}</h1>
          {match && (
            <p style={styles.subtitle}>
              {match.location_name || 'Local não definido'} ·{' '}
              {match.date ? new Date(match.date).toLocaleDateString('pt-BR', {
                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              }) : ''}
            </p>
          )}
        </div>
        {matchLocation && (
          <a
            href={getMapsDirectionsUrl(matchLocation, match?.location_name)}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.mapsBtn}
          >
            📍 Ver no Maps
          </a>
        )}
      </div>

      {/* Alerta admin: há pendentes */}
      {isAdmin && pendentesCount > 0 && (
        <div style={styles.alertBanner}>
          ⚠️ <strong>{pendentesCount} jogador{pendentesCount > 1 ? 'es' : ''}</strong> ainda não confirmaram presença.
          Use o menu ⋯ para registrar falta ou confirmar manualmente.
        </div>
      )}

      {/* Resumo */}
      {!loading && <SummaryBar summary={summary} />}

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: 'titulares', label: `Titulares (${titulares.length})` },
          { key: 'suplentes', label: `Suplentes (${suplentes.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{ ...styles.tab, ...(activeTab === key ? styles.tabActive : {}) }}
          >
            {label}
          </button>
        ))}
        {isAdmin && (
          <button
            onClick={() => navigate(`/radar-substitutos/${matchId}`)}
            style={styles.btnRadar}
          >
            🔍 Buscar Suplente
          </button>
        )}
      </div>

      {/* Lista de jogadores */}
      <div style={styles.list}>
        {loading ? (
          <div style={styles.loadingState}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={styles.skeleton} />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 48 }}>{activeTab === 'suplentes' ? '🪑' : '⚽'}</span>
            <p style={{ margin: '12px 0 0', color: '#6b7280' }}>
              {activeTab === 'suplentes'
                ? 'Nenhum suplente convidado ainda.'
                : 'Nenhum titular na partida.'}
            </p>
            {isAdmin && activeTab === 'suplentes' && (
              <button
                onClick={() => navigate(`/radar-substitutos/${matchId}`)}
                style={{ ...styles.btnConfirm, marginTop: 16 }}
              >
                Buscar Suplente no Radar
              </button>
            )}
          </div>
        ) : (
          displayed.map((rsvp) => (
            <PlayerCard
              key={rsvp.id}
              rsvp={rsvp}
              isAdmin={isAdmin}
              currentUserId={user?.id}
              onAction={handleAction}
              matchLocation={matchLocation}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0f0a',
    color: '#f1f5f1',
    fontFamily: "'Sora', 'Segoe UI', sans-serif",
    paddingBottom: 80,
  },
  header: {
    padding: '20px 16px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    background: 'rgba(22,163,74,0.04)',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: 'none',
    color: '#f1f5f1',
    borderRadius: 8,
    width: 36,
    height: 36,
    cursor: 'pointer',
    fontSize: 18,
    flexShrink: 0,
    marginTop: 2,
  },
  title: { margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' },
  subtitle: { margin: '4px 0 0', fontSize: 13, color: '#9ca3af' },
  mapsBtn: {
    marginLeft: 'auto',
    marginTop: 2,
    padding: '8px 12px',
    background: 'rgba(22,163,74,0.15)',
    border: '1px solid rgba(22,163,74,0.3)',
    borderRadius: 8,
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 600,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  alertBanner: {
    margin: '12px 16px 0',
    padding: '10px 14px',
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 10,
    fontSize: 13,
    color: '#fbbf24',
    lineHeight: 1.5,
  },
  summaryBar: {
    display: 'flex',
    gap: 8,
    padding: '16px 16px 12px',
  },
  summaryItem: { flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' },
  summaryCount: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  summaryLabel: { fontSize: 11, color: '#6b7280', marginBottom: 6 },
  summaryBar2: { height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99 },
  summaryFill: { height: '100%', borderRadius: 99, transition: 'width 0.4s ease' },
  tabs: {
    display: 'flex',
    gap: 8,
    padding: '0 16px 12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '8px 16px',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    background: 'transparent',
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'rgba(22,163,74,0.15)',
    border: '1px solid rgba(22,163,74,0.35)',
    color: '#4ade80',
    fontWeight: 600,
  },
  btnRadar: {
    marginLeft: 'auto',
    padding: '8px 14px',
    background: 'linear-gradient(135deg,#16a34a,#15803d)',
    border: 'none',
    borderRadius: 20,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  list: { padding: '0 16px' },
  playerCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
    transition: 'background 0.15s',
  },
  playerLeft: { display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  suplenteTag: {
    position: 'absolute', bottom: -2, right: -2,
    width: 16, height: 16, borderRadius: '50%',
    background: '#f59e0b', color: '#000', fontSize: 9, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1.5px solid #0a0f0a',
  },
  playerName: { fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  playerMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  absentReason: { fontSize: 11, color: '#ef4444', marginTop: 3, fontStyle: 'italic' },
  confirmedAt: { fontSize: 11, color: '#22c55e', marginTop: 3 },
  meTag: {
    fontSize: 10, fontWeight: 700, background: 'rgba(22,163,74,0.2)',
    color: '#4ade80', padding: '1px 6px', borderRadius: 99,
  },
  playerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 },
  statusBadge: {
    fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
  },
  btnConfirm: {
    padding: '6px 12px', background: 'rgba(22,163,74,0.2)',
    border: '1px solid rgba(22,163,74,0.4)', borderRadius: 8,
    color: '#4ade80', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  btnIcon: {
    width: 30, height: 30, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)', borderRadius: 8, cursor: 'pointer',
    color: '#9ca3af', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50,
    background: '#1a2a1a', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, minWidth: 200, padding: 4,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  dropdownItem: {
    display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
    background: 'transparent', border: 'none', borderRadius: 7,
    color: '#e5e7eb', fontSize: 13, cursor: 'pointer',
    transition: 'background 0.1s',
  },
  dropdownDivider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' },
  loadingState: { display: 'flex', flexDirection: 'column', gap: 8 },
  skeleton: {
    height: 70, borderRadius: 12,
    background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  emptyState: {
    padding: '48px 16px', textAlign: 'center', color: '#4b5563',
  },
  toast: {
    position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
    padding: '12px 20px', borderRadius: 10, color: '#fff', fontWeight: 600,
    fontSize: 14, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    animation: 'fadeIn 0.2s ease',
  },
  // Modal
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    padding: 16,
  },
  modal: {
    background: '#111b11', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, width: '100%', maxWidth: 400, overflow: 'hidden',
  },
  modalHeader: { padding: '24px 24px 16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  modalTitle: { margin: '8px 0 4px', fontSize: 18, fontWeight: 700 },
  modalSubtitle: { margin: 0, fontSize: 14, color: '#9ca3af' },
  modalBody: { padding: '16px 24px' },
  modalFooter: { padding: '12px 24px 20px', display: 'flex', gap: 10 },
  label: { display: 'block', fontSize: 13, color: '#9ca3af', marginBottom: 8, fontWeight: 500 },
  textarea: {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#f1f5f1', padding: '10px 12px', fontSize: 14,
    fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
  },
  btnSecondary: {
    flex: 1, padding: '11px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    color: '#e5e7eb', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  btnDanger: {
    flex: 1, padding: '11px', background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10,
    color: '#f87171', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
};
