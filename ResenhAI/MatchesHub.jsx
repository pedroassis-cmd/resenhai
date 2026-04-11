import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MATCHES = [
  {
    id: "m1", title: "Fut Society - Vila Madalena", format: "7v7",
    date: "2026-03-27", time: "19:00", status: "open",
    venue: "Arena Society Plus", address: "R. Aspicuelta, 320",
    lat: -23.556, lng: -46.688,
    slots: 14, organizerId: "me",
    players: [
      { id:"p1", name:"Carlos", pos:"GK", avatar:"C", type:"user" },
      { id:"p2", name:"Lucas",  pos:"DF", avatar:"L", type:"user" },
      { id:"p3", name:"Rafael", pos:"MF", avatar:"R", type:"user" },
      { id:"p4", name:"Bruno",  pos:"FW", avatar:"B", type:"user" },
      { id:"p5", name:"Zé bot", pos:"DF", avatar:"Z", type:"bot" },
      { id:"p6", name:"André",  pos:"MF", avatar:"A", type:"user" },
    ],
  },
  {
    id: "m2", title: "Futsal Sábado de Manhã", format: "5v5",
    date: "2026-03-29", time: "08:00", status: "open",
    venue: "Ginásio Clube Atlético Paulistano", address: "Al. Jaú, 450",
    lat: -23.565, lng: -46.672,
    slots: 10, organizerId: "me",
    players: [
      { id:"p7", name:"Sérgio", pos:"GK", avatar:"S", type:"user" },
      { id:"p8", name:"Pedro",  pos:"FW", avatar:"P", type:"user" },
      { id:"p9", name:"Convidado", pos:"MF", avatar:"?", type:"bot" },
    ],
  },
  {
    id: "m3", title: "Pelada de Sexta - Pinheiros", format: "7v7",
    date: "2026-04-04", time: "20:00", status: "confirmed",
    venue: "Campo do Pinheiros", address: "R. Teodoro Sampaio, 744",
    lat: -23.560, lng: -46.680,
    slots: 14, organizerId: "other",
    players: [
      { id:"p10", name:"Gabriel", pos:"GK", avatar:"G", type:"user" },
      { id:"p11", name:"Thiago",  pos:"DF", avatar:"T", type:"user" },
      { id:"p12", name:"Felipe",  pos:"MF", avatar:"F", type:"user" },
      { id:"p13", name:"Marcos",  pos:"FW", avatar:"M", type:"user" },
      { id:"p14", name:"Diego",   pos:"DF", avatar:"D", type:"user" },
      { id:"p15", name:"André",   pos:"MF", avatar:"A", type:"user" },
      { id:"p16", name:"Renato",  pos:"FW", avatar:"R", type:"user" },
      { id:"p17", name:"Igor",    pos:"DF", avatar:"I", type:"user" },
      { id:"p18", name:"Vitor",   pos:"GK", avatar:"V", type:"user" },
      { id:"p19", name:"Paulo",   pos:"MF", avatar:"P", type:"user" },
      { id:"p20", name:"Leo",     pos:"FW", avatar:"L", type:"user" },
      { id:"p21", name:"Caio",    pos:"DF", avatar:"C", type:"user" },
    ],
  },
];

const NEARBY_PLAYERS = [
  { id:"n1", name:"João Silva",   pos:"FW", dist:0.8,  rating:4.5, level:4, angle:25  },
  { id:"n2", name:"Mateus Costa", pos:"GK", dist:1.2,  rating:4.8, level:5, angle:80  },
  { id:"n3", name:"Ricardo L.",   pos:"DF", dist:1.9,  rating:4.1, level:3, angle:145 },
  { id:"n4", name:"Felipe A.",    pos:"MF", dist:2.4,  rating:3.9, level:3, angle:200 },
  { id:"n5", name:"Bruno M.",     pos:"FW", dist:2.9,  rating:4.6, level:4, angle:260 },
  { id:"n6", name:"Caio S.",      pos:"DF", dist:3.5,  rating:4.2, level:4, angle:310 },
  { id:"n7", name:"André R.",     pos:"MF", dist:4.1,  rating:3.7, level:3, angle:355 },
];

const OPEN_MATCHES = [
  { id:"o1", title:"Pelada do Centro",  venue:"Ginásio Municipal", time:"Hoje 19h",  slots:14, filled:9,  format:"7v7",  dist:1.4, needsPos:"GK" },
  { id:"o2", title:"Racha Vila Olímpia",venue:"Society Vila Olímpia",time:"Amanhã 7h",slots:10, filled:6,  format:"5v5",  dist:2.1, needsPos:"FW" },
  { id:"o3", title:"Fut Empresarial",   venue:"Arena Empresarial",  time:"Sex 20h",  slots:14, filled:11, format:"7v7",  dist:3.0, needsPos:"DF" },
  { id:"o4", title:"Pelada do Parque",  venue:"Parque Ibirapuera",  time:"Dom 9h",   slots:22, filled:14, format:"11v11",dist:3.8, needsPos:"MF" },
  { id:"o5", title:"Futsal Rápido",     venue:"CT Mooca",           time:"Sex 18h",  slots:10, filled:8,  format:"5v5",  dist:5.2, needsPos:"GK" },
];

const SEEKING_PLAYERS = [
  { id:"s1", name:"Leonardo Paz", pos:"FW", level:4, dist:0.6, bio:"Disponível qualquer dia, amo futsal", available:"Qualquer dia" },
  { id:"s2", name:"Gustavo M.",   pos:"GK", level:5, dist:1.1, bio:"Goleiro experiente buscando pelada fixa", available:"Seg/Qua/Sex" },
  { id:"s3", name:"Henrique F.",  pos:"DF", level:3, dist:1.8, bio:"Zagueiro, prefiro society 7v7", available:"Fins de semana" },
  { id:"s4", name:"Tiago N.",     pos:"MF", level:4, dist:2.3, bio:"Meia criativo, busco time competitivo", available:"Ter/Qui/Sáb" },
  { id:"s5", name:"Paulo C.",     pos:"FW", level:3, dist:3.0, bio:"Atacante, qualquer formato", available:"Qualquer dia" },
];

const POS_CFG = {
  GK: { bg:"rgba(251,191,36,0.18)",  color:"#fbbf24", label:"GOL" },
  DF: { bg:"rgba(56,189,248,0.18)",  color:"#38bdf8", label:"ZAG" },
  MF: { bg:"rgba(167,139,250,0.18)", color:"#a78bfa", label:"MEI" },
  FW: { bg:"rgba(28,184,91,0.18)",   color:"#1cb85b", label:"ATA" },
};

const STATUS_CFG = {
  open:      { label:"Aberta",     bg:"rgba(28,184,91,0.15)",   color:"#1cb85b" },
  confirmed: { label:"Confirmada", bg:"rgba(56,189,248,0.15)",  color:"#38bdf8" },
  cancelled: { label:"Cancelada",  bg:"rgba(248,113,113,0.15)", color:"#f87171" },
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("list"); // list | dashboard | radar | find
  const [activeMatch, setActiveMatch] = useState(null);
  const [activeTab, setActiveTab] = useState("matches"); // matches | radar | find

  const navigate = (v, match = null) => {
    setActiveMatch(match);
    setView(v);
  };

  const tabChange = (t) => {
    setActiveTab(t);
    if (t === "matches") setView("list");
    if (t === "radar")   setView("radar");
    if (t === "find")    setView("find");
  };

  return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input,button,select{font-family:inherit;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
        @keyframes ping{0%{transform:scale(1);opacity:.8;}100%{transform:scale(2.4);opacity:0;}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes ripple{0%{transform:scale(0.8);opacity:.6;}100%{transform:scale(3);opacity:0;}}
        .fade-up{animation:fadeUp .3s ease forwards;}
      `}</style>

      {/* CONTENT */}
      <div style={S.content}>
        {view === "list"      && <MatchList onOpen={(m) => navigate("dashboard", m)} />}
        {view === "dashboard" && <MatchDashboard match={activeMatch} onBack={() => navigate("list")} />}
        {view === "radar"     && <SubstituteRadar />}
        {view === "find"      && <FindMatch />}
      </div>

      {/* BOTTOM NAV */}
      {view !== "dashboard" && (
        <nav style={S.nav}>
          {[
            { id:"matches", icon:"⚽", label:"Peladas" },
            { id:"radar",   icon:"📡", label:"Substituto" },
            { id:"find",    icon:"🔍", label:"Buscar Jogo" },
          ].map(t => (
            <button key={t.id} style={{ ...S.navBtn, ...(activeTab===t.id ? S.navBtnActive : {}) }}
              onClick={() => tabChange(t.id)}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <span style={S.navLabel}>{t.label}</span>
              {activeTab===t.id && <div style={S.navDot}/>}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

// ─── MATCH LIST ───────────────────────────────────────────────────────────────

const VISIBLE_STATUSES = ["open", "confirmed"];

function MatchList({ onOpen }) {
  const myMatches = MATCHES.filter(m => m.organizerId === "me" && VISIBLE_STATUSES.includes(m.status));
  const joined    = MATCHES.filter(m => m.organizerId !== "me" && VISIBLE_STATUSES.includes(m.status));

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={S.eyebrow}>Minhas peladas</div>
          <h1 style={S.pageTitle}>Partidas</h1>
        </div>
      </div>

      <Section label="Que eu organizo" count={myMatches.length}>
        {myMatches.map((m,i) => <MatchCard key={m.id} match={m} delay={i*60} onOpen={() => onOpen(m)}/>)}
      </Section>

      <Section label="Que participo" count={joined.length}>
        {joined.map((m,i) => <MatchCard key={m.id} match={m} delay={i*60} onOpen={() => onOpen(m)}/>)}
      </Section>
    </div>
  );
}

function Section({ label, count, children }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={S.sectionRow}>
        <span style={S.sectionLabel}>{label}</span>
        <span style={S.sectionCount}>{count}</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {children}
      </div>
    </div>
  );
}

function MatchCard({ match: m, delay, onOpen }) {
  const cfg   = STATUS_CFG[m.status] || STATUS_CFG.open;
  const pct   = Math.round((m.players.length / m.slots) * 100);
  const empty = m.slots - m.players.length;

  return (
    <div className="fade-up" style={{ ...S.matchCard, animationDelay: delay+"ms" }}
      onClick={onOpen} role="button">
      {/* Accent bar */}
      <div style={{ ...S.accentBar, width: pct+"%" }}/>

      <div style={S.cardBody}>
        <div style={S.cardMain}>
          <div style={S.cardTitle}>{m.title}</div>
          <div style={S.cardMeta}>
            <MetaChip icon="📅">{fmtDate(m.date)} às {m.time}</MetaChip>
            {m.venue && <MetaChip icon="📍">{m.venue}</MetaChip>}
          </div>
          <div style={S.cardFooter}>
            <div style={S.playerAvatarRow}>
              {m.players.slice(0,5).map(p => (
                <div key={p.id} style={{
                  ...S.miniAvatar,
                  background: POS_CFG[p.pos]?.bg || "rgba(255,255,255,0.1)",
                  color: POS_CFG[p.pos]?.color || "#fff",
                  outline: p.type==="bot" ? "1.5px dashed rgba(167,139,250,0.6)" : "1.5px solid rgba(255,255,255,0.1)",
                }}>
                  {p.avatar}
                </div>
              ))}
              {m.players.length > 5 && (
                <div style={{ ...S.miniAvatar, background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)", fontSize:10 }}>
                  +{m.players.length - 5}
                </div>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {empty > 0 && (
                <span style={S.emptyBadge}>{empty} vagas</span>
              )}
              <span style={{ ...S.statusPill, background: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
          </div>
        </div>
        <div style={S.cardArrow}>›</div>
      </div>
    </div>
  );
}

function MetaChip({ icon, children }) {
  return (
    <span style={S.metaChip}>
      <span style={{ fontSize:11 }}>{icon}</span> {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SORTEIO AUTOMÁTICO DE TIMES
// Regras:
//  1. Só acontece quando players.length === m.slots (todos os slots preenchidos)
//  2. Acontece apenas UMA vez — flag timesJaDefinidos protege re-execução
//  3. Distribui GKs primeiro (um por time), depois equilibra por posição via
//     snake-draft do nível (assume nível 3 se não definido)
//  4. Bots e usuários reais são tratados da mesma forma
//  5. Disparo automático via useEffect monitorando players
// ═══════════════════════════════════════════════════════════════════════════════

/** Embaralha array (Fisher-Yates) — puro, sem mutação */
function embaralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Verifica se todos os slots estão preenchidos.
 * @param {Array}  players  Lista atual de jogadores
 * @param {number} slots    Capacidade total da partida
 * @returns {boolean}
 */
function partidaEstaCompleta(players, slots) {
  // Deduplica por ID antes de contar (proteção extra)
  const unique = [...new Map(players.map(p => [p.id, p])).values()];
  return unique.length >= slots;
}

/**
 * Sorteia e distribui jogadores em dois times equilibrados.
 *
 * Algoritmo:
 *  1. Separa goleiros (GK) dos demais
 *  2. Embaralha goleiros → distribui um por time (se disponível)
 *  3. Ordena restantes por nível DESC → snake-draft entre os times
 *     (alternância: Time A, Time B, Time B, Time A, ...)
 *  4. Retorna { timeA, timeB }
 *
 * @param {Array} participantes  Lista completa (deduplicated)
 * @returns {{ timeA: Array, timeB: Array }}
 */
function sortearTimes(participantes) {
  // 1. Deduplica por ID
  const unicos = [...new Map(participantes.map(p => [p.id, p])).values()];

  // 2. Separa goleiros e linha
  const gks   = embaralhar(unicos.filter(p => p.pos === "GK"));
  const linha  = embaralhar(unicos.filter(p => p.pos !== "GK"));

  const timeA = [];
  const timeB = [];

  // 3. Distribui goleiros (máx 1 por time)
  if (gks[0]) timeA.push(gks[0]);
  if (gks[1]) timeB.push(gks[1]);
  // GKs excedentes vão para linha
  const gksExtras = gks.slice(2);

  // 4. Todos os não-goleiros + GKs excedentes, ordenados por nível DESC
  const todos = [...linha, ...gksExtras].sort(
    (a, b) => (b.level ?? 3) - (a.level ?? 3)
  );

  // 5. Snake draft: A, B, B, A, A, B, B, A, ...
  todos.forEach((p, i) => {
    const snake = Math.floor(i / 2) % 2 === 0;
    const vai_a = (i % 2 === 0 && snake) || (i % 2 !== 0 && !snake);
    if (vai_a) timeA.push(p); else timeB.push(p);
  });

  return { timeA, timeB };
}

// ─── MATCH DASHBOARD ─────────────────────────────────────────────────────────

function MatchDashboard({ match: m, onBack }) {
  const [tab, setTab]         = useState("slots");
  const [showBot, setShowBot] = useState(false);
  const [showInvite, setShowInvite]   = useState(false);
  const [showCancel, setShowCancel]   = useState(false);
  const [botForm, setBotForm] = useState({ name:"", pos:"MF" });
  const [copied, setCopied]   = useState(false);
  const [players, setPlayers] = useState(m.players);

  // ── Estado do sorteio ────────────────────────────────────────────────────
  // timesJaDefinidos evita re-sorteio se um jogador for removido e re-adicionado
  const [timesJaDefinidos, setTimesJaDefinidos] = useState(false);
  const [teams, setTeams] = useState({ timeA: [], timeB: [] });
  const [sorteandoAnimacao, setSorteandoAnimacao] = useState(false); // loading visual
  const [partidaIniciada, setPartidaIniciada]     = useState(false);
  // ────────────────────────────────────────────────────────────────────────

  const isOrg = m.organizerId === "me";
  const empty = m.slots - players.length;
  const pct   = Math.round((players.length / m.slots) * 100);

  // ── useEffect: disparo automático do sorteio ─────────────────────────────
  useEffect(() => {
    // Guarda: só sorteia uma vez e só quando completo
    if (timesJaDefinidos) return;
    if (!partidaEstaCompleta(players, m.slots)) return;

    // Animação de loading (750ms) antes de revelar os times
    setSorteandoAnimacao(true);
    const timer = setTimeout(() => {
      const resultado = sortearTimes(players);
      setTeams(resultado);
      setTimesJaDefinidos(true);
      setSorteandoAnimacao(false);
      setPartidaIniciada(true);

      // TODO: persistir no backend
      // await fetch(`/api/matches/${m.id}/teams`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(resultado),
      // });
    }, 750);

    return () => clearTimeout(timer);
  }, [players, m.slots, timesJaDefinidos]);
  // ────────────────────────────────────────────────────────────────────────

  /** Adiciona bot e dispara verificação de completude automaticamente */
  const addBot = () => {
    if (!botForm.name.trim()) return;
    if (timesJaDefinidos) return; // partida já fechada
    const novoBot = {
      id: "b" + Date.now(),
      name: botForm.name,
      pos: botForm.pos,
      avatar: botForm.name[0].toUpperCase(),
      type: "bot",
      level: 3, // nível padrão para bots
    };
    setPlayers(prev => {
      // Evita duplicação por nome+pos
      if (prev.some(p => p.name === novoBot.name && p.pos === novoBot.pos)) return prev;
      return [...prev, novoBot];
    });
    setBotForm({ name:"", pos:"MF" });
    setShowBot(false);
    // O useEffect acima detecta a mudança em players e dispara o sorteio se completo
  };

  /** Remove jogador — só permitido antes do sorteio */
  const removePlayer = (id) => {
    if (timesJaDefinidos) return;
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  /** Refaz o sorteio manualmente (apenas o organizador, apenas antes de iniciar) */
  const refazerSorteio = () => {
    if (partidaIniciada) return;
    setTimesJaDefinidos(false);
    // O useEffect dispara automaticamente no próximo render pois players está completo
  };

  const copyLink = () => {
    navigator.clipboard.writeText("https://peladaapp.com.br/convite?id=" + m.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Enquanto o sorteio ainda não aconteceu, mostra times provisórios (par/ímpar)
  const teamsDisplay = timesJaDefinidos
    ? [teams.timeA, teams.timeB]
    : [
        players.filter((_,i) => i % 2 === 0),
        players.filter((_,i) => i % 2 !== 0),
      ];

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.dashHeader}>
        <button style={S.backBtn} onClick={onBack}>← Voltar</button>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ ...S.statusPill, ...(partidaIniciada ? { background:"rgba(56,189,248,0.15)", color:"#38bdf8" } : STATUS_CFG[m.status]) }}>
            {partidaIniciada ? "Em andamento" : STATUS_CFG[m.status]?.label}
          </span>
          {isOrg && (
            <button style={S.redIconBtn} onClick={() => setShowCancel(true)}>🗑</button>
          )}
        </div>
      </div>

      <h1 style={{ ...S.pageTitle, marginBottom:4 }}>{m.title}</h1>
      <div style={S.cardMeta}>
        <MetaChip icon="📅">{fmtDate(m.date)} às {m.time}</MetaChip>
        <MetaChip icon="📍">{m.venue}</MetaChip>
        <MetaChip icon="⚽">{m.format}</MetaChip>
      </div>

      {/* Progress */}
      <div style={S.progressBlock}>
        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width:pct+"%", background: pct===100?"#1cb85b":"#f59e0b" }}/>
        </div>
        <div style={S.progressLabel}>
          <span>{players.length}/{m.slots} jogadores</span>
          {empty > 0 && <span style={S.emptyBadge}>{empty} vagas abertas</span>}
          {pct === 100 && !timesJaDefinidos && !sorteandoAnimacao && (
            <span style={S.fullBadge}>✓ Completo</span>
          )}
        </div>
      </div>

      {/* ── SORTEIO EM ANDAMENTO ── */}
      {sorteandoAnimacao && (
        <div style={S.drawingOverlay}>
          <div style={S.drawingSpinner}/>
          <div style={S.drawingTitle}>Sorteando times…</div>
          <div style={S.drawingSubtitle}>Distribuindo jogadores por posição</div>
        </div>
      )}

      {/* ── BANNER: times definidos ── */}
      {timesJaDefinidos && !sorteandoAnimacao && (
        <div style={S.teamsReadyBanner}>
          <span style={{ fontSize:18 }}>🎉</span>
          <div style={{ flex:1 }}>
            <div style={S.teamsReadyTitle}>Times definidos!</div>
            <div style={S.teamsReadySubtitle}>
              {teams.timeA.length}v{teams.timeB.length} · Sorteio automático concluído
            </div>
          </div>
          {isOrg && !partidaIniciada && (
            <button style={S.redrawBtn} onClick={refazerSorteio}>↺ Refazer</button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={S.tabRow}>
        {[["slots","Escalação"],["info","Local"],["substitute","Substituto"]].map(([k,l]) => (
          <button key={k} style={{ ...S.tabBtn, ...(tab===k ? S.tabBtnActive:{}) }} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>

      {/* ── SLOTS TAB ── */}
      {tab === "slots" && !sorteandoAnimacao && (
        <div style={S.fadeUp}>
          <div style={S.teamsGrid}>
            {teamsDisplay.map((team, ti) => (
              <div key={ti} style={S.teamCol}>
                <div style={S.teamHeader}>
                  <span style={S.teamLabel}>Time {ti===0?"Verde":"Branco"}</span>
                  <span style={S.teamScore}>
                    {timesJaDefinidos
                      ? `${team.length} jog.`
                      : `Nível ${team.length ? (team.reduce((s,p)=>(s+(p.level??3)),0)/team.length).toFixed(1) : "–"}`
                    }
                  </span>
                </div>
                {team.map(p => (
                  <PlayerRow key={p.id} player={p} isOrg={isOrg && !timesJaDefinidos} onRemove={() => removePlayer(p.id)}/>
                ))}
                {!timesJaDefinidos && Array.from({ length: Math.max(0, Math.ceil(m.slots/2) - team.length) }).map((_,i) => (
                  <div key={"e"+i} style={S.emptySlotRow}>
                    <span style={{ fontSize:14, color:"rgba(255,255,255,0.15)" }}>+</span>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.15)" }}>Vaga aberta</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Ações do organizador — ocultas após sorteio */}
          {isOrg && !timesJaDefinidos && (
            <div style={S.actionRow}>
              {empty > 0 && (
                <button style={S.actionPurple} onClick={() => setShowBot(true)}>
                  🤖 Adicionar convidado
                </button>
              )}
              <button style={S.actionGreen} onClick={() => setShowInvite(true)}>
                🔗 Convidar
              </button>
            </div>
          )}

          {/* Aviso: aguardando completar partida */}
          {!timesJaDefinidos && empty > 0 && (
            <div style={S.waitingNote}>
              ⏳ O sorteio automático será feito quando todos os {m.slots} slots estiverem preenchidos.
            </div>
          )}
        </div>
      )}

      {/* ── INFO TAB ── */}
      {tab === "info" && (
        <div style={S.fadeUp}>
          <div style={S.infoCard}>
            <div style={S.infoIcon}>📍</div>
            <div>
              <div style={S.infoTitle}>{m.venue}</div>
              <div style={S.infoSub}>{m.address}</div>
              <button style={S.mapLink}
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(m.venue+" "+m.address)}`, "_blank")}>
                Abrir no Google Maps →
              </button>
            </div>
          </div>
          <div style={S.mockMap}>
            <div style={S.mockMapCenter}>
              <div style={S.mapPulseOuter}/>
              <div style={S.mapPulseInner}>📍</div>
            </div>
            <div style={S.mapGrid}/>
          </div>
        </div>
      )}

      {/* ── SUBSTITUTE TAB ── */}
      {tab === "substitute" && (
        <div style={S.fadeUp}>
          <div style={S.subNote}>
            Quando um jogador cancelar, o sistema notifica automaticamente o próximo da fila de espera por posição e proximidade.
          </div>
          <div style={S.subPlayers}>
            {NEARBY_PLAYERS.slice(0,4).map(p => (
              <div key={p.id} style={S.subPlayerRow}>
                <div style={{ ...S.subAvatar, background: POS_CFG[p.pos]?.bg, color: POS_CFG[p.pos]?.color }}>
                  {p.name[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={S.subName}>{p.name}</div>
                  <div style={S.subMeta}>
                    <span style={{ ...S.posPill, ...POS_CFG[p.pos] }}>{POS_CFG[p.pos]?.label}</span>
                    <span style={S.subDist}>{p.dist} km</span>
                    <span style={S.subRating}>★ {p.rating}</span>
                  </div>
                </div>
                <button style={S.callBtn}>Chamar</button>
              </div>
            ))}
          </div>
          <button style={{ ...S.actionGreen, width:"100%", marginTop:8 }}>
            📡 Ver radar completo
          </button>
        </div>
      )}

      {/* ── MODALS ── */}
      {showBot && (
        <Modal onClose={() => setShowBot(false)}>
          <div style={S.modalEmoji}>🤖</div>
          <h3 style={S.modalTitle}>Adicionar convidado</h3>
          <p style={S.modalText}>Jogador sem conta no app. Você poderá enviar o link de download depois.</p>
          <input style={S.modalInput} placeholder="Nome do jogador *"
            value={botForm.name} onChange={e => setBotForm(v => ({...v, name:e.target.value}))} autoFocus/>
          <div style={S.posRow}>
            {["GK","DF","MF","FW"].map(pos => (
              <button key={pos} style={{
                ...S.posBtn,
                ...(botForm.pos===pos ? { background: POS_CFG[pos].bg, color: POS_CFG[pos].color, borderColor: POS_CFG[pos].color+"66" } : {})
              }} onClick={() => setBotForm(v => ({...v, pos}))}>
                {POS_CFG[pos].label}
              </button>
            ))}
          </div>
          <div style={S.modalBtns}>
            <button style={S.cancelBtn} onClick={() => setShowBot(false)}>Cancelar</button>
            <button style={S.saveBtn} onClick={addBot} disabled={!botForm.name.trim()}>Adicionar</button>
          </div>
        </Modal>
      )}

      {showInvite && (
        <Modal onClose={() => setShowInvite(false)}>
          <div style={S.modalEmoji}>🔗</div>
          <h3 style={S.modalTitle}>Convidar jogadores</h3>
          <p style={S.modalText}>Compartilhe o link. Quem não tem o app será redirecionado para o download.</p>
          <div style={S.linkBox}>
            <span style={S.linkText}>peladaapp.com.br/convite?id={m.id}</span>
            <button style={S.copyBtn} onClick={copyLink}>{copied ? "✓" : "Copiar"}</button>
          </div>
          <div style={S.shareGrid}>
            <ShareBtn icon="💬" label="WhatsApp"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Entra na pelada! "+m.title+" — peladaapp.com.br/convite?id="+m.id)}`, "_blank")}/>
            <ShareBtn icon="📋" label="Copiar" onClick={copyLink}/>
          </div>
          <div style={S.botHint}>
            <span style={{ fontSize:14 }}>🤖</span>
            <span style={{ fontSize:12, color:"rgba(232,245,239,0.5)", lineHeight:1.5 }}>
              Sem conta? Use <b style={{ color:"#a78bfa" }}>"Adicionar convidado"</b> para reservar o slot enquanto o jogador baixa o app.
            </span>
          </div>
          <button style={{ ...S.saveBtn, width:"100%", marginTop:12 }} onClick={() => setShowInvite(false)}>Fechar</button>
        </Modal>
      )}

      {showCancel && (
        <Modal onClose={() => setShowCancel(false)}>
          <div style={S.modalEmoji}>🗑️</div>
          <h3 style={S.modalTitle}>Cancelar pelada?</h3>
          <p style={S.modalText}>Todos os {players.length} jogadores confirmados serão notificados. Esta ação não pode ser desfeita.</p>
          <div style={S.modalBtns}>
            <button style={S.cancelBtn} onClick={() => setShowCancel(false)}>Voltar</button>
            <button style={S.dangerBtn} onClick={onBack}>Sim, cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PlayerRow({ player: p, isOrg, onRemove }) {
  const cfg = POS_CFG[p.pos] || POS_CFG.MF;
  return (
    <div style={{ ...S.playerRow, ...(p.type==="bot" ? S.playerRowBot : {}) }}>
      <div style={{ ...S.playerAvatar, background:cfg.bg, color:cfg.color }}>{p.avatar}</div>
      <div style={{ flex:1 }}>
        <div style={S.playerName}>{p.name}</div>
        {p.type==="bot" && <div style={S.botTag}>convidado</div>}
      </div>
      <span style={{ ...S.posPill, background:cfg.bg, color:cfg.color }}>{cfg.label}</span>
      {isOrg && (
        <button style={S.removeBtn} onClick={onRemove}>✕</button>
      )}
    </div>
  );
}

// ─── SUBSTITUTE RADAR ────────────────────────────────────────────────────────

function SubstituteRadar() {
  const [selected, setSelected]   = useState(null);
  const [calling, setCalling]     = useState(null);
  const [accepted, setAccepted]   = useState(null);
  const [posFilter, setPosFilter] = useState("ALL");
  const [seekingView, setSeekingView] = useState(false); // toggle: radar ↔ jogadores buscando
  const [seekSearch, setSeekSearch]   = useState("");
  const size = 280;
  const cx = size / 2, cy = size / 2;

  const visible = NEARBY_PLAYERS.filter(p => posFilter==="ALL" || p.pos===posFilter);

  const seekingVisible = SEEKING_PLAYERS.filter(p =>
    (posFilter==="ALL" || p.pos===posFilter) &&
    (seekSearch === "" ||
      p.name.toLowerCase().includes(seekSearch.toLowerCase()) ||
      p.bio.toLowerCase().includes(seekSearch.toLowerCase()))
  );

  const dotPos = (p) => {
    const r = (p.dist / 5) * (size * 0.44);
    const rad = (p.angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const callPlayer = (p) => {
    setCalling(p.id);
    setTimeout(() => {
      setCalling(null);
      setAccepted(p.id);
      setTimeout(() => setAccepted(null), 3000);
    }, 2500);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={S.eyebrow}>Radar de jogadores</div>
          <h1 style={S.pageTitle}>Substituto</h1>
        </div>
      </div>

      {/* ── View toggle: Radar ↔ Procurar substituto ── */}
      <div style={S.radarToggleRow}>
        <button
          style={{ ...S.radarToggleBtn, ...(seekingView===false ? S.radarToggleBtnActive : {}) }}
          onClick={() => { setSeekingView(false); setSelected(null); }}
        >
          📡 Radar
        </button>
        <button
          style={{ ...S.radarToggleBtn, ...(seekingView===true ? S.radarToggleBtnActive : {}) }}
          onClick={() => setSeekingView(true)}
        >
          🔎 Procurar substituto
        </button>
      </div>

      {/* Position filter (shared between views) */}
      <div style={S.filterRow}>
        {["ALL","GK","DF","MF","FW"].map(pos => (
          <button key={pos} style={{
            ...S.filterBtn,
            ...(posFilter===pos ? (POS_CFG[pos] ? { background:POS_CFG[pos].bg, color:POS_CFG[pos].color, borderColor:POS_CFG[pos].color+"66" } : S.filterBtnActive) : {})
          }} onClick={() => setPosFilter(pos)}>
            {pos==="ALL" ? "Todos" : POS_CFG[pos]?.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════ RADAR VIEW ══════════════════════════ */}
      {!seekingView && (
        <>
          <p style={S.radarDesc}>
            Encontre jogadores disponíveis perto do local da sua partida, como chamar um carro.
          </p>

          {accepted && (
            <div style={S.acceptedToast}>
              ✅ {NEARBY_PLAYERS.find(p=>p.id===accepted)?.name} aceitou! Chegando em ~15 min.
            </div>
          )}

          <div style={S.radarWrap}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow:"visible" }}>
              {[0.25,0.5,0.75,1].map(r => (
                <circle key={r} cx={cx} cy={cy} r={r*size*0.44}
                  fill="none" stroke="rgba(28,184,91,0.12)" strokeWidth="1"/>
              ))}
              <line x1={cx} y1={4} x2={cx} y2={size-4} stroke="rgba(28,184,91,0.1)" strokeWidth="1"/>
              <line x1={4} y1={cy} x2={size-4} y2={cy} stroke="rgba(28,184,91,0.1)" strokeWidth="1"/>
              {[1,2,3,4].map((km,i) => (
                <text key={km} x={cx+4} y={cy - (i+1)*size*0.44/4 - 2}
                  fontSize="8" fill="rgba(28,184,91,0.35)" fontFamily="DM Sans">
                  {km} km
                </text>
              ))}
              <line x1={cx} y1={cy} x2={cx} y2={cy - size*0.44}
                stroke="rgba(28,184,91,0.4)" strokeWidth="1.5"
                style={{ transformOrigin:`${cx}px ${cy}px`, animation:"spin 4s linear infinite" }}/>
              {visible.map(p => {
                const {x,y} = dotPos(p);
                const cfg = POS_CFG[p.pos];
                const isSel = selected?.id === p.id;
                return (
                  <g key={p.id} style={{ cursor:"pointer" }} onClick={() => setSelected(isSel ? null : p)}>
                    {isSel && (
                      <circle cx={x} cy={y} r={14} fill={cfg.color} opacity={0.15}
                        style={{ animation:"ping 1.5s ease-out infinite" }}/>
                    )}
                    <circle cx={x} cy={y} r={isSel ? 9 : 7}
                      fill={cfg.bg} stroke={cfg.color} strokeWidth={isSel ? 2 : 1}/>
                    <text x={x} y={y+1} textAnchor="middle" dominantBaseline="central"
                      fontSize="7" fontWeight="700" fill={cfg.color} fontFamily="DM Sans">
                      {POS_CFG[p.pos].label}
                    </text>
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r={8} fill="#1cb85b" opacity={0.9}/>
              <circle cx={cx} cy={cy} r={12} fill="none" stroke="#1cb85b" strokeWidth="1"
                style={{ animation:"ping 2s ease-out infinite" }}/>
            </svg>
            <div style={S.radarDist1}>2 km</div>
            <div style={S.radarDist2}>4 km</div>
          </div>

          {selected && (
            <div style={S.selectedCard} className="fade-up">
              <div style={{ ...S.subAvatar, background:POS_CFG[selected.pos].bg, color:POS_CFG[selected.pos].color, width:44, height:44, fontSize:18 }}>
                {selected.name[0]}
              </div>
              <div style={{ flex:1 }}>
                <div style={S.subName}>{selected.name}</div>
                <div style={S.subMeta}>
                  <span style={{ ...S.posPill, ...POS_CFG[selected.pos] }}>{POS_CFG[selected.pos].label}</span>
                  <span style={S.subDist}>{selected.dist} km</span>
                  <span style={S.subRating}>★ {selected.rating}</span>
                  <span style={{ ...S.subDist, color:"#a78bfa" }}>Nível {selected.level}</span>
                </div>
              </div>
              <button
                style={{ ...S.callBtn, padding:"9px 18px", fontSize:13,
                  background: calling===selected.id ? "rgba(28,184,91,0.2)" : "#1cb85b",
                  color: "#fff" }}
                onClick={() => callPlayer(selected)}
                disabled={!!calling}>
                {calling === selected.id
                  ? <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={S.miniSpinner}/> Chamando…
                    </span>
                  : "⚡ Chamar"}
              </button>
            </div>
          )}

          <div style={S.sectionRow}>
            <span style={S.sectionLabel}>Jogadores disponíveis</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {visible.map(p => (
              <div key={p.id} style={S.subPlayerRow} onClick={() => setSelected(selected?.id===p.id ? null : p)}>
                <div style={{ ...S.subAvatar, background:POS_CFG[p.pos].bg, color:POS_CFG[p.pos].color }}>
                  {p.name[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={S.subName}>{p.name}</div>
                  <div style={S.subMeta}>
                    <span style={{ ...S.posPill, ...POS_CFG[p.pos] }}>{POS_CFG[p.pos].label}</span>
                    <span style={S.subDist}>{p.dist} km</span>
                    <span style={S.subRating}>★ {p.rating}</span>
                  </div>
                </div>
                <button style={S.callBtn} onClick={e => { e.stopPropagation(); callPlayer(p); }}>
                  {calling===p.id ? <span style={S.miniSpinner}/> : "Chamar"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══════════════════ PROCURAR SUBSTITUTO VIEW ══════════════════ */}
      {seekingView && (
        <>
          <p style={S.radarDesc}>
            Jogadores que estão buscando partida e podem cobrir uma vaga na sua pelada.
          </p>

          {/* Search */}
          <input
            style={{ ...S.searchInput, marginBottom:14 }}
            placeholder="🔍  Buscar por nome ou descrição…"
            value={seekSearch}
            onChange={e => setSeekSearch(e.target.value)}
          />

          <div style={S.sectionRow}>
            <span style={S.sectionLabel}>
              {seekingVisible.length} jogador{seekingVisible.length !== 1 ? "es" : ""} disponíve{seekingVisible.length !== 1 ? "is" : "l"}
            </span>
          </div>

          {seekingVisible.length === 0 ? (
            <div style={S.seekingEmpty}>
              Nenhum jogador encontrado com esse filtro.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {seekingVisible.map((p, i) => {
                const cfg = POS_CFG[p.pos];
                return (
                  <div key={p.id} className="fade-up"
                    style={{ ...S.seekingCard, animationDelay: i*50+"ms" }}>
                    <div style={{ ...S.subAvatar, background:cfg.bg, color:cfg.color, width:44, height:44, fontSize:18, flexShrink:0 }}>
                      {p.name[0]}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={S.subName}>{p.name}</div>
                      <div style={{ ...S.subMeta, marginBottom:4 }}>
                        <span style={{ ...S.posPill, background:cfg.bg, color:cfg.color }}>{cfg.label}</span>
                        <span style={S.subDist}>Nível {p.level}</span>
                        <span style={S.subDist}>{p.dist} km</span>
                        <span style={{ ...S.subDist, color:"rgba(232,245,239,0.3)" }}>📅 {p.available}</span>
                      </div>
                      <div style={S.seekingBio}>{p.bio}</div>
                    </div>
                    <button style={{ ...S.callBtn, alignSelf:"flex-start", flexShrink:0 }}>
                      Convidar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── FIND MATCH ───────────────────────────────────────────────────────────────

function FindMatch() {
  const [tab, setTab]     = useState("matches"); // matches | players
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");

  const filteredMatches = OPEN_MATCHES.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.venue.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPlayers = SEEKING_PLAYERS.filter(p =>
    (posFilter==="ALL" || p.pos===posFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.bio.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={S.eyebrow}>Rede de jogadores</div>
          <h1 style={S.pageTitle}>Buscar Jogo</h1>
        </div>
      </div>

      <input style={S.searchInput} placeholder="🔍  Buscar partida ou jogador…"
        value={search} onChange={e => setSearch(e.target.value)}/>

      <div style={S.tabRow}>
        {[["matches","Partidas abertas"],["players","Jogadores buscando"]].map(([k,l]) => (
          <button key={k} style={{ ...S.tabBtn, ...(tab===k ? S.tabBtnActive:{}) }} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>

      {tab === "matches" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filteredMatches.map((m,i) => {
            const pct = Math.round((m.filled/m.slots)*100);
            const posColor = POS_CFG[m.needsPos];
            return (
              <div key={m.id} className="fade-up" style={{ ...S.findCard, animationDelay:i*50+"ms" }}>
                <div style={S.findCardTop}>
                  <div style={{ flex:1 }}>
                    <div style={S.findTitle}>{m.title}</div>
                    <div style={S.findSub}>{m.venue} · {m.time}</div>
                  </div>
                  <div style={S.findDist}>{m.dist} km</div>
                </div>
                <div style={S.findMeta}>
                  <span style={S.formatBadge}>{m.format}</span>
                  <span style={{ fontSize:12, color:"rgba(232,245,239,0.4)" }}>{m.filled}/{m.slots} jogadores</span>
                  <span style={{ ...S.emptyBadge, background:posColor?.bg, color:posColor?.color }}>
                    Precisa: {POS_CFG[m.needsPos]?.label}
                  </span>
                </div>
                <div style={S.findProgress}>
                  <div style={{ ...S.progressFill, width:pct+"%", background: pct>=80?"#1cb85b":"#f59e0b" }}/>
                </div>
                <button style={S.joinBtn}>Quero entrar</button>
              </div>
            );
          })}
          {filteredMatches.length === 0 && (
            <Empty msg="Nenhuma partida encontrada com esse filtro."/>
          )}
        </div>
      )}

      {tab === "players" && (
        <>
          <div style={S.filterRow}>
            {["ALL","GK","DF","MF","FW"].map(pos => (
              <button key={pos} style={{
                ...S.filterBtn,
                ...(posFilter===pos ? (POS_CFG[pos] ? { background:POS_CFG[pos].bg, color:POS_CFG[pos].color, borderColor:POS_CFG[pos].color+"66" } : S.filterBtnActive) : {})
              }} onClick={() => setPosFilter(pos)}>
                {pos==="ALL" ? "Todos" : POS_CFG[pos]?.label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filteredPlayers.map((p,i) => {
              const cfg = POS_CFG[p.pos];
              return (
                <div key={p.id} className="fade-up" style={{ ...S.playerCard, animationDelay:i*50+"ms" }}>
                  <div style={{ ...S.subAvatar, background:cfg.bg, color:cfg.color, width:44, height:44, fontSize:18, flexShrink:0 }}>
                    {p.name[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={S.findTitle}>{p.name}</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", margin:"4px 0 5px" }}>
                      <span style={{ ...S.posPill, background:cfg.bg, color:cfg.color }}>{cfg.label}</span>
                      <span style={{ ...S.subDist }}>Nível {p.level}</span>
                      <span style={S.subDist}>{p.dist} km</span>
                      <span style={{ ...S.subDist, color:"rgba(232,245,239,0.35)" }}>📅 {p.available}</span>
                    </div>
                    <div style={S.playerBio}>{p.bio}</div>
                  </div>
                  <button style={{ ...S.callBtn, alignSelf:"flex-start" }}>Convidar</button>
                </div>
              );
            })}
            {filteredPlayers.length === 0 && (
              <Empty msg="Nenhum jogador com essa posição disponível."/>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Empty({ msg }) {
  return (
    <div style={{ textAlign:"center", padding:"32px 16px", color:"rgba(232,245,239,0.3)", fontSize:13 }}>
      {msg}
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function Modal({ children, onClose }) {
  return (
    <div style={S.modalBg} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()} className="fade-up">
        {children}
      </div>
    </div>
  );
}

function ShareBtn({ icon, label, onClick }) {
  return (
    <button style={S.shareBtn} onClick={onClick}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <span style={{ fontSize:12 }}>{label}</span>
    </button>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day:"2-digit", month:"short" });
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const G="#1cb85b", BG="#060f0a", CARD="#0b1c12", CARD2="#0f2318";
const BORDER="rgba(255,255,255,0.07)", TEXT="#e8f5ef", MUTED="rgba(232,245,239,0.42)";
const FONT="'DM Sans', sans-serif", TITLE="'Syne', sans-serif";

const S = {
  root:{ minHeight:"100vh", background:BG, fontFamily:FONT, color:TEXT, display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", position:"relative" },
  content:{ flex:1, overflowY:"auto", paddingBottom:80 },
  page:{ padding:"20px 16px 24px" },
  header:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 },
  eyebrow:{ fontSize:11, color:G, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 },
  pageTitle:{ fontFamily:TITLE, fontSize:28, fontWeight:800, letterSpacing:"-0.5px" },
  dashHeader:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 },
  backBtn:{ background:"none", border:"none", color:G, fontSize:14, fontWeight:600, cursor:"pointer", padding:0, fontFamily:FONT },
  redIconBtn:{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", borderRadius:8, padding:"5px 9px", cursor:"pointer", fontSize:14, lineHeight:1 },

  // Match cards
  matchCard:{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, overflow:"hidden", cursor:"pointer", position:"relative", transition:"border-color .2s", opacity:0 },
  accentBar:{ height:3, background:`linear-gradient(90deg, ${G}, rgba(28,184,91,0.3))`, transition:"width .5s" },
  cardBody:{ padding:"12px 14px", display:"flex", alignItems:"center", gap:8 },
  cardMain:{ flex:1, minWidth:0 },
  cardTitle:{ fontFamily:TITLE, fontWeight:700, fontSize:15, marginBottom:5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  cardMeta:{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 },
  metaChip:{ fontSize:11, color:MUTED, display:"flex", alignItems:"center", gap:3 },
  cardFooter:{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 },
  playerAvatarRow:{ display:"flex", gap:-2 },
  miniAvatar:{ width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, marginLeft:-4, firstChild:{ marginLeft:0 } },
  statusPill:{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 },
  emptyBadge:{ background:"rgba(245,158,11,0.15)", color:"#f59e0b", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20 },
  cardArrow:{ fontSize:20, color:MUTED, flexShrink:0 },

  // Progress
  progressBlock:{ marginBottom:16 },
  progressBar:{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:99, overflow:"hidden", marginBottom:5 },
  progressFill:{ height:"100%", borderRadius:99, transition:"width .4s" },
  progressLabel:{ display:"flex", gap:8, alignItems:"center", fontSize:12, color:MUTED },

  // Section
  sectionRow:{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  sectionLabel:{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.06em" },
  sectionCount:{ background:"rgba(255,255,255,0.07)", color:MUTED, fontSize:11, fontWeight:700, borderRadius:20, padding:"1px 8px" },

  // Tabs
  tabRow:{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:10, padding:3, marginBottom:16, gap:2 },
  tabBtn:{ flex:1, padding:"7px 0", border:"none", background:"transparent", color:MUTED, fontSize:12, fontWeight:500, borderRadius:8, cursor:"pointer", fontFamily:FONT, transition:"all .15s" },
  tabBtnActive:{ background:CARD2, color:TEXT, fontWeight:600 },
  fadeUp:{ animation:"fadeUp .25s ease forwards" },

  // Teams grid
  teamsGrid:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 },
  teamCol:{ display:"flex", flexDirection:"column", gap:6 },
  teamHeader:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 },
  teamLabel:{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.06em" },
  teamScore:{ fontSize:10, color:MUTED },
  playerRow:{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"6px 8px", border:`1px solid ${BORDER}` },
  playerRowBot:{ border:"1px dashed rgba(167,139,250,0.3)", background:"rgba(167,139,250,0.04)" },
  playerAvatar:{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:11, flexShrink:0 },
  playerName:{ fontSize:11, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  botTag:{ fontSize:9, color:"#a78bfa", background:"rgba(167,139,250,0.12)", borderRadius:4, padding:"1px 4px", display:"inline-block" },
  posPill:{ fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:4, flexShrink:0 },
  removeBtn:{ background:"rgba(248,113,113,0.1)", border:"none", color:"#f87171", borderRadius:4, fontSize:8, padding:"2px 4px", cursor:"pointer", flexShrink:0 },
  emptySlotRow:{ display:"flex", alignItems:"center", gap:8, border:`1px dashed ${BORDER}`, borderRadius:8, padding:"7px 8px", color:MUTED, justifyContent:"center" },

  // Actions
  actionRow:{ display:"flex", gap:8, marginTop:8 },
  actionGreen:{ flex:1, padding:"10px 12px", background:"rgba(28,184,91,0.1)", border:"1px solid rgba(28,184,91,0.25)", color:G, borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT },
  actionPurple:{ flex:1, padding:"10px 12px", background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", color:"#a78bfa", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT },

  // Info tab
  infoCard:{ display:"flex", gap:12, background:CARD2, borderRadius:12, padding:14, marginBottom:12, border:`1px solid ${BORDER}` },
  infoIcon:{ fontSize:24, flexShrink:0 },
  infoTitle:{ fontWeight:700, fontSize:14, marginBottom:3 },
  infoSub:{ fontSize:12, color:MUTED, marginBottom:8 },
  mapLink:{ background:"none", border:"none", color:G, fontSize:12, fontWeight:600, cursor:"pointer", padding:0, fontFamily:FONT },
  mockMap:{ height:160, background:"rgba(28,184,91,0.05)", borderRadius:12, border:`1px solid rgba(28,184,91,0.1)`, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" },
  mockMapCenter:{ position:"relative", zIndex:2 },
  mapPulseOuter:{ position:"absolute", width:40, height:40, borderRadius:"50%", background:"rgba(28,184,91,0.1)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", animation:"ping 2s ease-out infinite" },
  mapPulseInner:{ fontSize:24, position:"relative", zIndex:2 },
  mapGrid:{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(28,184,91,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(28,184,91,0.05) 1px, transparent 1px)", backgroundSize:"24px 24px" },

  // Substitute tab
  subNote:{ background:"rgba(28,184,91,0.06)", border:"1px solid rgba(28,184,91,0.15)", borderRadius:10, padding:"10px 12px", fontSize:12, color:MUTED, marginBottom:14, lineHeight:1.5 },
  subPlayers:{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 },
  subPlayerRow:{ display:"flex", alignItems:"center", gap:10, background:CARD2, borderRadius:10, padding:"10px 12px", border:`1px solid ${BORDER}`, cursor:"pointer" },
  subAvatar:{ width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0 },
  subName:{ fontWeight:600, fontSize:13, marginBottom:3 },
  subMeta:{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" },
  subDist:{ fontSize:11, color:MUTED },
  subRating:{ fontSize:11, color:"#f59e0b" },
  callBtn:{ background:"rgba(28,184,91,0.12)", border:"1px solid rgba(28,184,91,0.25)", color:G, borderRadius:8, fontSize:12, fontWeight:600, padding:"7px 12px", cursor:"pointer", fontFamily:FONT, display:"flex", alignItems:"center", gap:4 },

  // Radar
  radarDesc:{ fontSize:13, color:MUTED, marginBottom:14, lineHeight:1.6 },
  filterRow:{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 },
  filterBtn:{ padding:"5px 12px", borderRadius:20, border:`1px solid ${BORDER}`, background:"rgba(255,255,255,0.04)", color:MUTED, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:FONT },
  filterBtnActive:{ background:"rgba(28,184,91,0.15)", color:G, borderColor:"rgba(28,184,91,0.4)" },
  radarWrap:{ display:"flex", justifyContent:"center", position:"relative", marginBottom:16 },
  radarDist1:{ position:"absolute", bottom:"50%", left:"50%", transform:"translate(-50%, 50%) translateY(-38px)", fontSize:9, color:"rgba(28,184,91,0.3)" },
  radarDist2:{ position:"absolute", bottom:"50%", left:"50%", transform:"translate(-50%, 50%) translateY(-76px)", fontSize:9, color:"rgba(28,184,91,0.3)" },
  selectedCard:{ background:CARD2, border:`1px solid rgba(28,184,91,0.3)`, borderRadius:12, padding:"12px 14px", marginBottom:16, display:"flex", gap:10, alignItems:"center" },
  acceptedToast:{ background:"rgba(28,184,91,0.15)", border:"1px solid rgba(28,184,91,0.3)", borderRadius:10, padding:"10px 14px", fontSize:13, color:G, fontWeight:600, marginBottom:12 },
  miniSpinner:{ width:12, height:12, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", display:"inline-block", animation:"spin .7s linear infinite" },

  // Find match
  searchInput:{ width:"100%", padding:"11px 14px", background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, color:TEXT, fontSize:14, fontFamily:FONT, outline:"none", marginBottom:14, boxSizing:"border-box" },
  findCard:{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"12px 14px", opacity:0 },
  findCardTop:{ display:"flex", gap:8, marginBottom:8 },
  findTitle:{ fontWeight:700, fontSize:14, marginBottom:2 },
  findSub:{ fontSize:11, color:MUTED },
  findDist:{ fontSize:13, color:G, fontWeight:700, flexShrink:0 },
  findMeta:{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", marginBottom:8 },
  formatBadge:{ background:"rgba(255,255,255,0.07)", color:TEXT, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20 },
  findProgress:{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:99, overflow:"hidden", marginBottom:10 },
  joinBtn:{ width:"100%", padding:"9px 0", background:"rgba(28,184,91,0.1)", border:"1px solid rgba(28,184,91,0.25)", color:G, borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT },
  playerCard:{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start", opacity:0 },
  playerBio:{ fontSize:11, color:MUTED, lineHeight:1.5 },

  // Nav
  nav:{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"rgba(6,15,10,0.95)", backdropFilter:"blur(12px)", borderTop:`1px solid ${BORDER}`, display:"flex", padding:"8px 0 max(8px, env(safe-area-inset-bottom))", zIndex:50 },
  navBtn:{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"none", border:"none", cursor:"pointer", padding:"4px 0", position:"relative", fontFamily:FONT },
  navBtnActive:{ color:G },
  navLabel:{ fontSize:10, fontWeight:600, color:MUTED },
  navDot:{ position:"absolute", bottom:-2, width:4, height:4, borderRadius:"50%", background:G },

  // Modals
  modalBg:{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200, padding:"0 0 env(safe-area-inset-bottom)" },
  modal:{ background:"#0c1e12", border:`1px solid rgba(255,255,255,0.1)`, borderRadius:"18px 18px 0 0", padding:"24px 20px 32px", width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" },
  modalEmoji:{ fontSize:32, textAlign:"center", marginBottom:10 },
  modalTitle:{ fontFamily:TITLE, fontWeight:800, fontSize:18, textAlign:"center", marginBottom:6 },
  modalText:{ fontSize:13, color:MUTED, textAlign:"center", marginBottom:18, lineHeight:1.6 },
  modalInput:{ width:"100%", padding:"11px 12px", background:"rgba(255,255,255,0.06)", border:`1px solid ${BORDER}`, borderRadius:8, color:TEXT, fontSize:14, fontFamily:FONT, outline:"none", marginBottom:12, boxSizing:"border-box" },
  posRow:{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:18 },
  posBtn:{ padding:"8px 0", background:"rgba(255,255,255,0.05)", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:8, cursor:"pointer", fontFamily:FONT, fontSize:12, fontWeight:700, transition:"all .15s" },
  modalBtns:{ display:"flex", gap:8 },
  cancelBtn:{ flex:1, padding:"11px 0", background:"rgba(255,255,255,0.05)", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:9, cursor:"pointer", fontFamily:FONT, fontSize:14 },
  saveBtn:{ flex:1, padding:"11px 0", background:G, border:"none", color:"#fff", borderRadius:9, cursor:"pointer", fontFamily:FONT, fontSize:14, fontWeight:700 },
  dangerBtn:{ flex:1, padding:"11px 0", background:"rgba(248,113,113,0.15)", border:"1px solid rgba(248,113,113,0.3)", color:"#f87171", borderRadius:9, cursor:"pointer", fontFamily:FONT, fontSize:14, fontWeight:700 },
  linkBox:{ display:"flex", background:"rgba(255,255,255,0.05)", border:`1px solid ${BORDER}`, borderRadius:10, overflow:"hidden", marginBottom:12 },
  linkText:{ flex:1, fontSize:11, color:MUTED, padding:"10px 12px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  copyBtn:{ padding:"10px 14px", background:G, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, flexShrink:0 },
  shareGrid:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 },
  shareBtn:{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, padding:"10px", background:"rgba(255,255,255,0.04)", border:`1px solid ${BORDER}`, borderRadius:10, color:TEXT, cursor:"pointer", fontFamily:FONT },
  botHint:{ display:"flex", gap:8, background:"rgba(167,139,250,0.07)", border:"1px solid rgba(167,139,250,0.18)", borderRadius:10, padding:"10px 12px", alignItems:"flex-start" },

  // Radar toggle row (Radar ↔ Procurar substituto)
  radarToggleRow:{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:10, padding:3, marginBottom:14, gap:2 },
  radarToggleBtn:{ flex:1, padding:"8px 0", border:"none", background:"transparent", color:MUTED, fontSize:12, fontWeight:600, borderRadius:8, cursor:"pointer", fontFamily:FONT, transition:"all .15s", whiteSpace:"nowrap" },
  radarToggleBtnActive:{ background:G, color:"#fff" },

  // Seeking players view
  seekingCard:{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start", opacity:0 },
  seekingBio:{ fontSize:11, color:MUTED, lineHeight:1.5 },
  seekingEmpty:{ textAlign:"center", padding:"32px 16px", color:MUTED, fontSize:13 },

  // Search input (shared with FindMatch)
  searchInput:{ width:"100%", padding:"11px 14px", background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, color:TEXT, fontSize:14, fontFamily:FONT, outline:"none", boxSizing:"border-box" },

  // ── Sorteio automático ───────────────────────────────────────────────────
  fullBadge:{ background:"rgba(28,184,91,0.15)", color:G, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 },

  // Overlay de animação enquanto sorteia
  drawingOverlay:{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, background:"rgba(7,19,12,0.95)", borderRadius:14, padding:"28px 20px", marginBottom:8, border:`1px solid rgba(28,184,91,0.2)` },
  drawingSpinner:{ width:32, height:32, border:"3px solid rgba(28,184,91,0.2)", borderTopColor:G, borderRadius:"50%", animation:"spin 0.7s linear infinite" },
  drawingTitle:{ fontFamily:TITLE, fontSize:18, fontWeight:800, color:TEXT },
  drawingSubtitle:{ fontSize:12, color:MUTED },

  // Banner de times definidos
  teamsReadyBanner:{ display:"flex", alignItems:"center", gap:10, background:"rgba(28,184,91,0.08)", border:"1px solid rgba(28,184,91,0.25)", borderRadius:12, padding:"12px 14px", marginBottom:8 },
  teamsReadyTitle:{ fontSize:14, fontWeight:700, color:G, marginBottom:2 },
  teamsReadySubtitle:{ fontSize:11, color:MUTED },
  redrawBtn:{ background:"none", border:`1px solid ${BORDER}`, color:MUTED, borderRadius:8, fontSize:11, padding:"5px 10px", cursor:"pointer", fontFamily:FONT, flexShrink:0 },

  // Nota de aguardo
  waitingNote:{ background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.18)", borderRadius:10, padding:"10px 12px", fontSize:12, color:"rgba(245,158,11,0.8)", lineHeight:1.5, marginTop:8 },
};
