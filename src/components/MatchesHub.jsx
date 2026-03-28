import { useState } from "react";
import { MatchList, MatchDashboard } from "./MatchListDash.jsx";
import { SubstituteRadar, FindMatch } from "./RadarFind.jsx";
import { G, BG, BORDER, MUTED, FONT } from "./hubData.js";

export default function MatchesHub() {
  const [view, setView] = useState("list"); // list | dashboard | radar | find
  const [activeMatch, setActiveMatch] = useState(null);
  const [activeTab, setActiveTab] = useState("matches");

  const navigate = (v, match = null) => { setActiveMatch(match); setView(v); };

  const tabChange = (t) => {
    setActiveTab(t);
    if (t === "matches") setView("list");
    if (t === "radar")   setView("radar");
    if (t === "find")    setView("find");
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.4);opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .3s ease forwards; }
      `}</style>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {view === "list"      && <MatchList onOpen={(m) => navigate("dashboard", m)} />}
        {view === "dashboard" && <MatchDashboard match={activeMatch} onBack={() => navigate("list")} />}
        {view === "radar"     && <SubstituteRadar />}
        {view === "find"      && <FindMatch />}
      </div>

      {/* Bottom nav */}
      {view !== "dashboard" && (
        <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "rgba(6,15,10,0.95)", backdropFilter: "blur(12px)", borderTop: `1px solid ${BORDER}`, display: "flex", padding: "8px 0 max(8px,env(safe-area-inset-bottom))", zIndex: 50 }}>
          {[
            { id: "matches", icon: "⚽", label: "Peladas" },
            { id: "radar",   icon: "📡", label: "Substituto" },
            { id: "find",    icon: "🔍", label: "Buscar Jogo" },
          ].map(t => (
            <button
              key={t.id}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 0", position: "relative", fontFamily: FONT, color: activeTab === t.id ? G : MUTED }}
              onClick={() => tabChange(t.id)}
            >
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{t.label}</span>
              {activeTab === t.id && <div style={{ position: "absolute", bottom: -2, width: 4, height: 4, borderRadius: "50%", background: G }} />}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
