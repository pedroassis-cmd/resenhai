import { useState } from "react";
import { NEARBY_PLAYERS, OPEN_MATCHES, SEEKING_PLAYERS, POS_CFG, G, CARD, CARD2, BORDER, TEXT, MUTED, FONT, TITLE } from "./hubData.js";

const S2 = {
  page:{padding:"20px 16px 24px"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20},
  eyebrow:{fontSize:11,color:G,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4},
  pageTitle:{fontFamily:TITLE,fontSize:28,fontWeight:800,letterSpacing:"-0.5px",color:TEXT},
  sectionRow:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10},
  sectionLabel:{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.06em"},
  radarDesc:{fontSize:13,color:MUTED,marginBottom:14,lineHeight:1.6},
  filterRow:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16},
  filterBtn:{padding:"5px 12px",borderRadius:20,border:`1px solid ${BORDER}`,background:"rgba(255,255,255,0.04)",color:MUTED,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FONT},
  filterBtnActive:{background:"rgba(28,184,91,0.15)",color:G,borderColor:"rgba(28,184,91,0.4)"},
  radarWrap:{display:"flex",justifyContent:"center",position:"relative",marginBottom:16},
  selectedCard:{background:CARD2,border:"1px solid rgba(28,184,91,0.3)",borderRadius:12,padding:"12px 14px",marginBottom:16,display:"flex",gap:10,alignItems:"center"},
  acceptedToast:{background:"rgba(28,184,91,0.15)",border:"1px solid rgba(28,184,91,0.3)",borderRadius:10,padding:"10px 14px",fontSize:13,color:G,fontWeight:600,marginBottom:12},
  subPlayerRow:{display:"flex",alignItems:"center",gap:10,background:CARD2,borderRadius:10,padding:"10px 12px",border:`1px solid ${BORDER}`,cursor:"pointer",marginBottom:8},
  subAvatar:{width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,flexShrink:0},
  subName:{fontWeight:600,fontSize:13,marginBottom:3,color:TEXT},
  subMeta:{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"},
  subDist:{fontSize:11,color:MUTED},
  subRating:{fontSize:11,color:"#f59e0b"},
  posPill:{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4,flexShrink:0},
  callBtn:{background:"rgba(28,184,91,0.12)",border:"1px solid rgba(28,184,91,0.25)",color:G,borderRadius:8,fontSize:12,fontWeight:600,padding:"7px 12px",cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:4},
  miniSpinner:{width:12,height:12,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",display:"inline-block",animation:"spin .7s linear infinite"},
  // FindMatch
  tabRow:{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:3,marginBottom:16,gap:2},
  tabBtn:{flex:1,padding:"7px 0",border:"none",background:"transparent",color:MUTED,fontSize:12,fontWeight:500,borderRadius:8,cursor:"pointer",fontFamily:FONT,transition:"all .15s"},
  tabBtnActive:{background:CARD2,color:TEXT,fontWeight:600},
  searchInput:{width:"100%",padding:"11px 14px",background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,color:TEXT,fontSize:14,fontFamily:FONT,outline:"none",marginBottom:14,boxSizing:"border-box"},
  findCard:{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:"12px 14px",marginBottom:10},
  findCardTop:{display:"flex",gap:8,marginBottom:8},
  findTitle:{fontWeight:700,fontSize:14,marginBottom:2,color:TEXT},
  findSub:{fontSize:11,color:MUTED},
  findDist:{fontSize:13,color:G,fontWeight:700,flexShrink:0},
  findMeta:{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:8},
  formatBadge:{background:"rgba(255,255,255,0.07)",color:TEXT,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20},
  emptyBadge:{background:"rgba(245,158,11,0.15)",color:"#f59e0b",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20},
  findProgress:{height:3,background:"rgba(255,255,255,0.07)",borderRadius:99,overflow:"hidden",marginBottom:10},
  progressFill:{height:"100%",borderRadius:99,transition:"width .4s"},
  joinBtn:{width:"100%",padding:"9px 0",background:"rgba(28,184,91,0.1)",border:"1px solid rgba(28,184,91,0.25)",color:G,borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT},
  playerCard:{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start",marginBottom:10},
  playerBio:{fontSize:11,color:MUTED,lineHeight:1.5},
};

// ── Substitute Radar ───────────────────────────────────────────────────────────
export function SubstituteRadar(){
  const [selected,setSelected]=useState(null);
  const [calling,setCalling]=useState(null);
  const [accepted,setAccepted]=useState(null);
  const [posFilter,setPosFilter]=useState("ALL");
  const size=280,cx=140,cy=140;

  const visible=NEARBY_PLAYERS.filter(p=>posFilter==="ALL"||p.pos===posFilter);

  const dotPos=p=>{const r=(p.dist/5)*(size*0.44);const rad=(p.angle*Math.PI)/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};};

  const callPlayer=p=>{setCalling(p.id);setTimeout(()=>{setCalling(null);setAccepted(p.id);setTimeout(()=>setAccepted(null),3000);},2500);};

  return(
    <div style={S2.page}>
      <div style={S2.header}><div><div style={S2.eyebrow}>Radar de jogadores</div><h1 style={S2.pageTitle}>Substituto</h1></div></div>
      <p style={S2.radarDesc}>Encontre jogadores disponíveis perto do local da sua partida, como chamar um carro.</p>

      <div style={S2.filterRow}>
        {["ALL","GK","DF","MF","FW"].map(pos=>(
          <button key={pos} style={{...S2.filterBtn,...(posFilter===pos?(POS_CFG[pos]?{background:POS_CFG[pos].bg,color:POS_CFG[pos].color,borderColor:POS_CFG[pos].color+"66"}:S2.filterBtnActive):{})}} onClick={()=>setPosFilter(pos)}>
            {pos==="ALL"?"Todos":POS_CFG[pos]?.label}
          </button>
        ))}
      </div>

      {accepted&&<div style={S2.acceptedToast}>✅ {NEARBY_PLAYERS.find(p=>p.id===accepted)?.name} aceitou! Chegando em ~15 min.</div>}

      <div style={S2.radarWrap}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow:"visible"}}>
          {[0.25,0.5,0.75,1].map(r=><circle key={r} cx={cx} cy={cy} r={r*size*0.44} fill="none" stroke="rgba(28,184,91,0.12)" strokeWidth="1"/>)}
          <line x1={cx} y1={4} x2={cx} y2={size-4} stroke="rgba(28,184,91,0.1)" strokeWidth="1"/>
          <line x1={4} y1={cy} x2={size-4} y2={cy} stroke="rgba(28,184,91,0.1)" strokeWidth="1"/>
          {[1,2,3,4].map((km,i)=><text key={km} x={cx+4} y={cy-(i+1)*size*0.44/4-2} fontSize="8" fill="rgba(28,184,91,0.35)" fontFamily="DM Sans">{km} km</text>)}
          <line x1={cx} y1={cy} x2={cx} y2={cy-size*0.44} stroke="rgba(28,184,91,0.4)" strokeWidth="1.5" style={{transformOrigin:`${cx}px ${cy}px`,animation:"spin 4s linear infinite"}}/>
          {visible.map(p=>{const {x,y}=dotPos(p);const cfg=POS_CFG[p.pos];const isSel=selected?.id===p.id;return(
            <g key={p.id} style={{cursor:"pointer"}} onClick={()=>setSelected(isSel?null:p)}>
              {isSel&&<circle cx={x} cy={y} r={14} fill={cfg.color} opacity={0.15} style={{animation:"ping 1.5s ease-out infinite"}}/>}
              <circle cx={x} cy={y} r={isSel?9:7} fill={cfg.bg} stroke={cfg.color} strokeWidth={isSel?2:1}/>
              <text x={x} y={y+1} textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="700" fill={cfg.color} fontFamily="DM Sans">{POS_CFG[p.pos].label}</text>
            </g>
          );})}
          <circle cx={cx} cy={cy} r={8} fill="#1cb85b" opacity={0.9}/>
          <circle cx={cx} cy={cy} r={12} fill="none" stroke="#1cb85b" strokeWidth="1" style={{animation:"ping 2s ease-out infinite"}}/>
        </svg>
      </div>

      {selected&&(
        <div style={S2.selectedCard} className="fade-up">
          <div style={{...S2.subAvatar,background:POS_CFG[selected.pos].bg,color:POS_CFG[selected.pos].color,width:44,height:44,fontSize:18}}>{selected.name[0]}</div>
          <div style={{flex:1}}>
            <div style={S2.subName}>{selected.name}</div>
            <div style={S2.subMeta}>
              <span style={{...S2.posPill,...POS_CFG[selected.pos]}}>{POS_CFG[selected.pos].label}</span>
              <span style={S2.subDist}>{selected.dist} km</span>
              <span style={S2.subRating}>★ {selected.rating}</span>
              <span style={{...S2.subDist,color:"#a78bfa"}}>Nível {selected.level}</span>
            </div>
          </div>
          <button style={{...S2.callBtn,padding:"9px 18px",fontSize:13,background:calling===selected.id?"rgba(28,184,91,0.2)":"#1cb85b",color:"#fff"}} onClick={()=>callPlayer(selected)} disabled={!!calling}>
            {calling===selected.id?<span style={{display:"flex",alignItems:"center",gap:6}}><span style={S2.miniSpinner}/> Chamando…</span>:"⚡ Chamar"}
          </button>
        </div>
      )}

      <div style={S2.sectionRow}><span style={S2.sectionLabel}>Jogadores disponíveis</span></div>
      {visible.map(p=>(
        <div key={p.id} style={S2.subPlayerRow} onClick={()=>setSelected(selected?.id===p.id?null:p)}>
          <div style={{...S2.subAvatar,background:POS_CFG[p.pos].bg,color:POS_CFG[p.pos].color}}>{p.name[0]}</div>
          <div style={{flex:1}}><div style={S2.subName}>{p.name}</div><div style={S2.subMeta}><span style={{...S2.posPill,...POS_CFG[p.pos]}}>{POS_CFG[p.pos].label}</span><span style={S2.subDist}>{p.dist} km</span><span style={S2.subRating}>★ {p.rating}</span></div></div>
          <button style={S2.callBtn} onClick={e=>{e.stopPropagation();callPlayer(p);}}>{calling===p.id?<span style={S2.miniSpinner}/>:"Chamar"}</button>
        </div>
      ))}
    </div>
  );
}

// ── Find Match ─────────────────────────────────────────────────────────────────
export function FindMatch(){
  const [tab,setTab]=useState("matches");
  const [search,setSearch]=useState("");
  const [posFilter,setPosFilter]=useState("ALL");

  const filteredMatches=OPEN_MATCHES.filter(m=>m.title.toLowerCase().includes(search.toLowerCase())||m.venue.toLowerCase().includes(search.toLowerCase()));
  const filteredPlayers=SEEKING_PLAYERS.filter(p=>(posFilter==="ALL"||p.pos===posFilter)&&(p.name.toLowerCase().includes(search.toLowerCase())||p.bio.toLowerCase().includes(search.toLowerCase())));

  return(
    <div style={S2.page}>
      <div style={S2.header}><div><div style={S2.eyebrow}>Rede de jogadores</div><h1 style={S2.pageTitle}>Buscar Jogo</h1></div></div>
      <input style={S2.searchInput} placeholder="🔍  Buscar partida ou jogador…" value={search} onChange={e=>setSearch(e.target.value)}/>

      <div style={S2.tabRow}>
        {[["matches","Partidas abertas"],["players","Jogadores buscando"]].map(([k,l])=>(
          <button key={k} style={{...S2.tabBtn,...(tab===k?S2.tabBtnActive:{})}} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==="matches"&&(
        <div>
          {filteredMatches.map((m,i)=>{
            const pct=Math.round((m.filled/m.slots)*100);
            const posColor=POS_CFG[m.needsPos];
            return(
              <div key={m.id} className="fade-up" style={{...S2.findCard,animationDelay:i*50+"ms"}}>
                <div style={S2.findCardTop}><div style={{flex:1}}><div style={S2.findTitle}>{m.title}</div><div style={S2.findSub}>{m.venue} · {m.time}</div></div><div style={S2.findDist}>{m.dist} km</div></div>
                <div style={S2.findMeta}><span style={S2.formatBadge}>{m.format}</span><span style={{fontSize:12,color:"rgba(232,245,239,0.4)"}}>{m.filled}/{m.slots} jogadores</span><span style={{...S2.emptyBadge,background:posColor?.bg,color:posColor?.color}}>Precisa: {POS_CFG[m.needsPos]?.label}</span></div>
                <div style={S2.findProgress}><div style={{...S2.progressFill,width:pct+"%",background:pct>=80?"#1cb85b":"#f59e0b"}}/></div>
                <button style={S2.joinBtn}>Quero entrar</button>
              </div>
            );
          })}
          {filteredMatches.length===0&&<div style={{textAlign:"center",padding:"32px 16px",color:MUTED,fontSize:13}}>Nenhuma partida encontrada.</div>}
        </div>
      )}

      {tab==="players"&&(
        <div>
          <div style={S2.filterRow}>
            {["ALL","GK","DF","MF","FW"].map(pos=>(
              <button key={pos} style={{...S2.filterBtn,...(posFilter===pos?(POS_CFG[pos]?{background:POS_CFG[pos].bg,color:POS_CFG[pos].color,borderColor:POS_CFG[pos].color+"66"}:S2.filterBtnActive):{})}} onClick={()=>setPosFilter(pos)}>
                {pos==="ALL"?"Todos":POS_CFG[pos]?.label}
              </button>
            ))}
          </div>
          {filteredPlayers.map((p,i)=>{const cfg=POS_CFG[p.pos];return(
            <div key={p.id} className="fade-up" style={{...S2.playerCard,animationDelay:i*50+"ms"}}>
              <div style={{...S2.subAvatar,background:cfg.bg,color:cfg.color,width:44,height:44,fontSize:18,flexShrink:0}}>{p.name[0]}</div>
              <div style={{flex:1}}>
                <div style={S2.findTitle}>{p.name}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",margin:"4px 0 5px"}}>
                  <span style={{...S2.posPill,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
                  <span style={S2.subDist}>Nível {p.level}</span>
                  <span style={S2.subDist}>{p.dist} km</span>
                  <span style={{...S2.subDist,color:"rgba(232,245,239,0.35)"}}>📅 {p.available}</span>
                </div>
                <div style={S2.playerBio}>{p.bio}</div>
              </div>
              <button style={{...S2.callBtn,alignSelf:"flex-start"}}>Convidar</button>
            </div>
          );})}
          {filteredPlayers.length===0&&<div style={{textAlign:"center",padding:"32px 16px",color:MUTED,fontSize:13}}>Nenhum jogador com essa posição disponível.</div>}
        </div>
      )}
    </div>
  );
}
