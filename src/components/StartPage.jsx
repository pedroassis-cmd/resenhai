import { useState } from "react";

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_MATCHES = [
  {
    id: "1",
    title: "Pelada da Sexta",
    date: "2026-03-14",
    venue: "Arena Society Plus",
    address: "R. das Acácias, 320 — Jardim das Flores",
    format: "7v7",
    result: { teamA: 4, teamB: 3 },
    myTeam: "A",
    goals: 2,
    assists: 1,
    players: 14,
    highlights: [
      { id: "h1", title: "Golaço de voleio", timestamp: "00:32", url: "" },
    ],
  },
  {
    id: "2",
    title: "Racha do Bairro",
    date: "2026-03-07",
    venue: "Campo Sintético Central",
    address: "Av. Brasil, 1450 — Centro",
    format: "5v5",
    result: { teamA: 2, teamB: 2 },
    myTeam: "B",
    goals: 1,
    assists: 0,
    players: 10,
    highlights: [],
  },
  {
    id: "3",
    title: "Pelada dos Amigos",
    date: "2026-02-28",
    venue: "Quadra do Clube",
    address: "R. Ipanema, 88 — Vila Nova",
    format: "7v7",
    result: { teamA: 5, teamB: 2 },
    myTeam: "A",
    goals: 0,
    assists: 3,
    players: 14,
    highlights: [],
  },
  {
    id: "4",
    title: "Pelada da Empresa",
    date: "2026-02-21",
    venue: "Society Park",
    address: "R. Engenheiro Álvaro, 500 — Moema",
    format: "7v7",
    result: { teamA: 3, teamB: 1 },
    myTeam: "A",
    goals: 1,
    assists: 2,
    players: 14,
    highlights: [
      { id: "h2", title: "Assistência em profundidade", timestamp: "01:15", url: "" },
      { id: "h3", title: "Defesa do goleiro", timestamp: "02:47", url: "" },
    ],
  },
];

const TOTAL_GOALS   = MOCK_MATCHES.reduce((a, m) => a + m.goals, 0);
const TOTAL_ASSISTS = MOCK_MATCHES.reduce((a, m) => a + m.assists, 0);
const TOTAL_MATCHES = MOCK_MATCHES.length;
const WINS = MOCK_MATCHES.filter(
  (m) => (m.myTeam === "A" ? m.result.teamA > m.result.teamB : m.result.teamB > m.result.teamA)
).length;

// ── Main Component ────────────────────────────────────────────────────────────
export default function StartPage({ user, onGoToHub }) {
  const [selected, setSelected] = useState(null);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [newHighlight, setNewHighlight] = useState({ title: "", timestamp: "", url: "" });
  const [matches, setMatches] = useState(MOCK_MATCHES);
  const [filterVenue, setFilterVenue] = useState("all");

  const venues = ["all", ...new Set(matches.map((m) => m.venue))];
  const filtered = filterVenue === "all" ? matches : matches.filter((m) => m.venue === filterVenue);

  const addHighlight = (matchId) => {
    if (!newHighlight.title.trim()) return;
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, highlights: [...m.highlights, { id: "h" + Date.now(), ...newHighlight }] }
          : m
      )
    );
    setNewHighlight({ title: "", timestamp: "", url: "" });
    setShowHighlightModal(false);
  };

  const removeHighlight = (matchId, hId) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, highlights: m.highlights.filter((h) => h.id !== hId) }
          : m
      )
    );
  };

  const displayName = user?.name || "Jogador";

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.greeting}>Bem-vindo de volta, {displayName.split(" ")[0]} 👋</p>
          <h1 style={s.pageTitle}>Seu painel</h1>
        </div>
        <button style={s.hubBtn} onClick={onGoToHub}>
          ⚽ Minhas partidas →
        </button>
      </div>

      {/* Stats row */}
      <div style={s.statsRow}>
        <StatCard label="Peladas"      value={TOTAL_MATCHES} icon="🏟️" color="#1cb85b" />
        <StatCard label="Gols"         value={TOTAL_GOALS}   icon="⚽" color="#f59e0b" />
        <StatCard label="Assistências" value={TOTAL_ASSISTS} icon="🎯" color="#38bdf8" />
        <StatCard label="Vitórias"     value={WINS}          icon="🏆" color="#a78bfa" />
      </div>

      {/* Section header + filter */}
      <div style={s.sectionHeader}>
        <h2 style={s.sectionTitle}>Peladas passadas</h2>
        <select
          style={s.select}
          value={filterVenue}
          onChange={(e) => setFilterVenue(e.target.value)}
        >
          {venues.map((v) => (
            <option key={v} value={v}>
              {v === "all" ? "Todos os locais" : v}
            </option>
          ))}
        </select>
      </div>

      {/* Match list */}
      <div style={s.list}>
        {filtered.map((m) => {
          const won  = m.myTeam === "A" ? m.result.teamA > m.result.teamB : m.result.teamB > m.result.teamA;
          const drew = m.result.teamA === m.result.teamB;

          return (
            <div
              key={m.id}
              style={{ ...s.matchCard, ...(selected === m.id ? s.matchCardOpen : {}) }}
            >
              {/* Card header */}
              <div style={s.cardHeader} onClick={() => setSelected(selected === m.id ? null : m.id)}>
                <div style={s.cardLeft}>
                  <ResultBadge won={won} drew={drew} />
                  <div>
                    <div style={s.matchTitle}>{m.title}</div>
                    <div style={s.matchMeta}>
                      <span>📅 {formatDate(m.date)}</span>
                      <span style={{ opacity: 0.4 }}>•</span>
                      <span>👥 {m.players} jogadores</span>
                      <span style={{ opacity: 0.4 }}>•</span>
                      <span>🏟 {m.format}</span>
                    </div>
                  </div>
                </div>
                <div style={s.score}>
                  <span style={won ? s.winScore : drew ? s.drawScore : s.loseScore}>
                    {m.result.teamA} — {m.result.teamB}
                  </span>
                  <span style={s.chevron}>{selected === m.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {selected === m.id && (
                <div style={s.detail}>
                  {/* Location */}
                  <div style={s.detailSection}>
                    <h4 style={s.detailLabel}>📍 Local</h4>
                    <div style={s.venueCard}>
                      <div style={s.venueName}>{m.venue}</div>
                      <div style={s.venueAddr}>{m.address}</div>
                      <button
                        style={s.mapBtn}
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/search/${encodeURIComponent(m.venue + " " + m.address)}`,
                            "_blank"
                          )
                        }
                      >
                        Ver no mapa →
                      </button>
                    </div>
                  </div>

                  {/* Performance */}
                  <div style={s.detailSection}>
                    <h4 style={s.detailLabel}>📊 Sua performance</h4>
                    <div style={s.perfRow}>
                      <PerfChip icon="⚽" label="Gols"         value={m.goals}   color="#f59e0b" />
                      <PerfChip icon="🎯" label="Assistências" value={m.assists} color="#38bdf8" />
                      <PerfChip
                        icon={won ? "🏆" : drew ? "🤝" : "😔"}
                        label="Resultado"
                        value={won ? "Vitória" : drew ? "Empate" : "Derrota"}
                        color={won ? "#1cb85b" : drew ? "#94a3b8" : "#f87171"}
                      />
                    </div>
                  </div>

                  {/* Highlights */}
                  <div style={s.detailSection}>
                    <div style={s.highlightHeader}>
                      <h4 style={s.detailLabel}>🎬 Lances salvos</h4>
                      <button
                        style={s.addHighlightBtn}
                        onClick={() => {
                          setShowHighlightModal(m.id);
                          setNewHighlight({ title: "", timestamp: "", url: "" });
                        }}
                      >
                        + Adicionar lance
                      </button>
                    </div>

                    {m.highlights.length === 0 ? (
                      <div style={s.emptyHighlight}>
                        Nenhum lance salvo. Registre um momento especial!
                      </div>
                    ) : (
                      <div style={s.highlightList}>
                        {m.highlights.map((h) => (
                          <div key={h.id} style={s.highlightItem}>
                            <div style={s.highlightIcon}>▶</div>
                            <div style={s.highlightInfo}>
                              <div style={s.highlightTitle}>{h.title}</div>
                              {h.timestamp && (
                                <div style={s.highlightTimestamp}>⏱ {h.timestamp}</div>
                              )}
                              {h.url && (
                                <a href={h.url} target="_blank" rel="noreferrer" style={s.highlightLink}>
                                  Ver vídeo →
                                </a>
                              )}
                            </div>
                            <button
                              style={s.removeHighlight}
                              onClick={() => removeHighlight(m.id, h.id)}
                              title="Remover lance"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Highlight modal */}
      {showHighlightModal && (
        <div style={s.modalBg} onClick={() => setShowHighlightModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>🎬 Salvar lance</h3>
            <div style={s.modalField}>
              <label style={s.modalLabel}>Título do lance *</label>
              <input
                style={s.modalInput}
                placeholder="Ex: Golaço de bicicleta"
                value={newHighlight.title}
                onChange={(e) => setNewHighlight((v) => ({ ...v, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div style={s.modalField}>
              <label style={s.modalLabel}>Timestamp (opcional)</label>
              <input
                style={s.modalInput}
                placeholder="Ex: 00:42"
                value={newHighlight.timestamp}
                onChange={(e) => setNewHighlight((v) => ({ ...v, timestamp: e.target.value }))}
              />
            </div>
            <div style={s.modalField}>
              <label style={s.modalLabel}>Link do vídeo (opcional)</label>
              <input
                style={s.modalInput}
                placeholder="https://..."
                value={newHighlight.url}
                onChange={(e) => setNewHighlight((v) => ({ ...v, url: e.target.value }))}
              />
            </div>
            <div style={s.modalBtns}>
              <button style={s.cancelBtn} onClick={() => setShowHighlightModal(false)}>
                Cancelar
              </button>
              <button style={s.saveBtn} onClick={() => addHighlight(showHighlightModal)}>
                Salvar lance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ ...s.statCard, borderTop: `3px solid ${color}` }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ ...s.statValue, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function ResultBadge({ won, drew }) {
  const cfg = won
    ? { bg: "rgba(28,184,91,0.15)",  color: "#1cb85b", text: "V" }
    : drew
    ? { bg: "rgba(148,163,184,0.15)", color: "#94a3b8", text: "E" }
    : { bg: "rgba(248,113,113,0.15)", color: "#f87171", text: "D" };
  return (
    <div style={{ width: 32, height: 32, borderRadius: "50%", background: cfg.bg, color: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
      {cfg.text}
    </div>
  );
}

function PerfChip({ icon, label, value, color }) {
  return (
    <div style={{ ...s.perfChip, borderColor: color + "40" }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ ...s.perfValue, color }}>{value}</div>
        <div style={s.perfLabel}>{label}</div>
      </div>
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Styles ────────────────────────────────────────────────────────────────────
const G = "#1cb85b";
const BG = "#07130d";
const CARD = "#0e1f16";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#e8f5ef";
const MUTED = "rgba(232,245,239,0.45)";
const FONT = "'Figtree', sans-serif";

const s = {
  page: {
    minHeight: "100vh",
    background: BG,
    padding: "24px 16px 80px",
    fontFamily: FONT,
    maxWidth: 680,
    margin: "0 auto",
    color: TEXT,
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  greeting: { margin: 0, fontSize: 13, color: MUTED, marginBottom: 2 },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-0.5px" },
  hubBtn: {
    padding: "8px 14px",
    background: "rgba(28,184,91,0.1)",
    border: "1px solid rgba(28,184,91,0.3)",
    borderRadius: 10,
    color: G,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: FONT,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    background: CARD,
    borderRadius: 12,
    padding: "14px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    border: `1px solid ${BORDER}`,
  },
  statValue: { fontSize: 22, fontWeight: 900, lineHeight: 1 },
  statLabel: { fontSize: 11, color: MUTED, fontWeight: 500 },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: TEXT },
  select: {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    color: TEXT,
    fontSize: 12,
    padding: "6px 10px",
    fontFamily: FONT,
    cursor: "pointer",
    outline: "none",
  },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  matchCard: {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 14,
    overflow: "hidden",
    transition: "border-color 0.2s",
  },
  matchCardOpen: { borderColor: "rgba(28,184,91,0.35)" },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    cursor: "pointer",
    gap: 12,
  },
  cardLeft: { display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  matchTitle: { fontWeight: 700, fontSize: 14, marginBottom: 3 },
  matchMeta: { display: "flex", gap: 6, fontSize: 11, color: MUTED, flexWrap: "wrap" },
  score: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  winScore:  { fontWeight: 800, fontSize: 15, color: G },
  drawScore: { fontWeight: 800, fontSize: 15, color: "#94a3b8" },
  loseScore: { fontWeight: 800, fontSize: 15, color: "#f87171" },
  chevron: { fontSize: 10, color: MUTED },
  detail: { padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 16, borderTop: `1px solid ${BORDER}`, paddingTop: 16 },
  detailSection: {},
  detailLabel: { margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em" },
  venueCard: { background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" },
  venueName: { fontWeight: 700, fontSize: 14, marginBottom: 3 },
  venueAddr: { fontSize: 12, color: MUTED, marginBottom: 8 },
  mapBtn: { background: "none", border: "none", color: G, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: FONT },
  perfRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  perfChip: { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid transparent", borderRadius: 10, padding: "8px 12px", flex: 1, minWidth: 90 },
  perfValue: { fontWeight: 800, fontSize: 16, lineHeight: 1 },
  perfLabel: { fontSize: 11, color: MUTED },
  highlightHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  addHighlightBtn: { background: "rgba(28,184,91,0.12)", border: "1px solid rgba(28,184,91,0.25)", color: G, borderRadius: 8, fontSize: 12, fontWeight: 600, padding: "5px 10px", cursor: "pointer", fontFamily: FONT },
  emptyHighlight: { fontSize: 12, color: MUTED, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "12px 14px", textAlign: "center", border: `1px dashed ${BORDER}` },
  highlightList: { display: "flex", flexDirection: "column", gap: 6 },
  highlightItem: { display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px" },
  highlightIcon: { width: 28, height: 28, background: "rgba(28,184,91,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: G, flexShrink: 0 },
  highlightInfo: { flex: 1, minWidth: 0 },
  highlightTitle: { fontSize: 13, fontWeight: 600, marginBottom: 2 },
  highlightTimestamp: { fontSize: 11, color: MUTED },
  highlightLink: { fontSize: 11, color: G },
  removeHighlight: { background: "rgba(248,113,113,0.1)", border: "none", color: "#f87171", borderRadius: 6, fontSize: 10, padding: "4px 7px", cursor: "pointer", flexShrink: 0 },
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 },
  modal: { background: "#0e1f16", border: "1px solid rgba(28,184,91,0.2)", borderRadius: 16, padding: "24px 20px", width: "100%", maxWidth: 400 },
  modalTitle: { margin: "0 0 18px", fontSize: 18, fontWeight: 800 },
  modalField: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 },
  modalLabel: { fontSize: 12, color: MUTED, fontWeight: 600 },
  modalInput: { padding: "10px 12px", background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 14, fontFamily: FONT, outline: "none", boxSizing: "border-box", width: "100%" },
  modalBtns: { display: "flex", gap: 8, marginTop: 18 },
  cancelBtn: { flex: 1, padding: "10px 0", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 8, cursor: "pointer", fontFamily: FONT, fontSize: 14 },
  saveBtn: { flex: 1, padding: "10px 0", background: G, border: "none", color: "#fff", borderRadius: 8, cursor: "pointer", fontFamily: FONT, fontSize: 14, fontWeight: 700 },
};
