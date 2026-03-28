import { useState } from "react";
import { MATCHES, POS_CFG, STATUS_CFG, NEARBY_PLAYERS, G, BG, CARD, CARD2, BORDER, TEXT, MUTED, FONT, TITLE, fmtDate } from "./hubData.js";

const S = {
  page:{padding:"20px 16px 24px"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20},
  eyebrow:{fontSize:11,color:G,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4},
  pageTitle:{fontFamily:TITLE,fontSize:28,fontWeight:800,letterSpacing:"-0.5px",color:TEXT},
  sectionRow:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10},
  sectionLabel:{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.06em"},
  sectionCount:{background:"rgba(255,255,255,0.07)",color:MUTED,fontSize:11,fontWeight:700,borderRadius:20,padding:"1px 8px"},
  matchCard:{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,overflow:"hidden",cursor:"pointer",position:"relative",transition:"border-color .2s"},
  accentBar:{height:3,background:`linear-gradient(90deg,${G},rgba(28,184,91,0.3))`,transition:"width .5s"},
  cardBody:{padding:"12px 14px",display:"flex",alignItems:"center",gap:8},
  cardMain:{flex:1,minWidth:0},
  cardTitle:{fontFamily:TITLE,fontWeight:700,fontSize:15,marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:TEXT},
  cardMeta:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8},
  metaChip:{fontSize:11,color:MUTED,display:"flex",alignItems:"center",gap:3},
  cardFooter:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8},
  playerAvatarRow:{display:"flex"},
  miniAvatar:{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,marginLeft:-4},
  statusPill:{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20},
  emptyBadge:{background:"rgba(245,158,11,0.15)",color:"#f59e0b",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20},
  cardArrow:{fontSize:20,color:MUTED,flexShrink:0},
  // dashboard
  dashHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},
  backBtn:{background:"none",border:"none",color:G,fontSize:14,fontWeight:600,cursor:"pointer",padding:0,fontFamily:FONT},
  redIconBtn:{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",borderRadius:8,padding:"5px 9px",cursor:"pointer",fontSize:14,lineHeight:1},
  progressBlock:{marginBottom:16},
  progressBar:{height:3,background:"rgba(255,255,255,0.07)",borderRadius:99,overflow:"hidden",marginBottom:5},
  progressFill:{height:"100%",borderRadius:99,transition:"width .4s"},
  progressLabel:{display:"flex",gap:8,alignItems:"center",fontSize:12,color:MUTED},
  tabRow:{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:3,marginBottom:16,gap:2},
  tabBtn:{flex:1,padding:"7px 0",border:"none",background:"transparent",color:MUTED,fontSize:12,fontWeight:500,borderRadius:8,cursor:"pointer",fontFamily:FONT,transition:"all .15s"},
  tabBtnActive:{background:CARD2,color:TEXT,fontWeight:600},
  teamsGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12},
  teamCol:{display:"flex",flexDirection:"column",gap:6},
  teamHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2},
  teamLabel:{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.06em"},
  teamScore:{fontSize:10,color:MUTED},
  playerRow:{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"6px 8px",border:`1px solid ${BORDER}`},
  playerRowBot:{border:"1px dashed rgba(167,139,250,0.3)",background:"rgba(167,139,250,0.04)"},
  playerAvatar:{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,flexShrink:0},
  playerName:{fontSize:11,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:TEXT},
  botTag:{fontSize:9,color:"#a78bfa",background:"rgba(167,139,250,0.12)",borderRadius:4,padding:"1px 4px",display:"inline-block"},
  posPill:{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4,flexShrink:0},
  removeBtn:{background:"rgba(248,113,113,0.1)",border:"none",color:"#f87171",borderRadius:4,fontSize:8,padding:"2px 4px",cursor:"pointer",flexShrink:0},
  emptySlotRow:{display:"flex",alignItems:"center",gap:8,border:`1px dashed ${BORDER}`,borderRadius:8,padding:"7px 8px",color:MUTED,justifyContent:"center"},
  actionRow:{display:"flex",gap:8,marginTop:8},
  actionGreen:{flex:1,padding:"10px 12px",background:"rgba(28,184,91,0.1)",border:"1px solid rgba(28,184,91,0.25)",color:G,borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT},
  actionPurple:{flex:1,padding:"10px 12px",background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",color:"#a78bfa",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT},
  infoCard:{display:"flex",gap:12,background:CARD2,borderRadius:12,padding:14,marginBottom:12,border:`1px solid ${BORDER}`},
  infoIcon:{fontSize:24,flexShrink:0},
  infoTitle:{fontWeight:700,fontSize:14,marginBottom:3,color:TEXT},
  infoSub:{fontSize:12,color:MUTED,marginBottom:8},
  mapLink:{background:"none",border:"none",color:G,fontSize:12,fontWeight:600,cursor:"pointer",padding:0,fontFamily:FONT},
  mockMap:{height:160,background:"rgba(28,184,91,0.05)",borderRadius:12,border:"1px solid rgba(28,184,91,0.1)",position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"},
  mockMapCenter:{position:"relative",zIndex:2},
  mapPulseOuter:{position:"absolute",width:40,height:40,borderRadius:"50%",background:"rgba(28,184,91,0.1)",top:"50%",left:"50%",transform:"translate(-50%,-50%)",animation:"ping 2s ease-out infinite"},
  mapPulseInner:{fontSize:24,position:"relative",zIndex:2},
  mapGrid:{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(28,184,91,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(28,184,91,0.05) 1px,transparent 1px)",backgroundSize:"24px 24px"},
  subNote:{background:"rgba(28,184,91,0.06)",border:"1px solid rgba(28,184,91,0.15)",borderRadius:10,padding:"10px 12px",fontSize:12,color:MUTED,marginBottom:14,lineHeight:1.5},
  subPlayers:{display:"flex",flexDirection:"column",gap:8,marginBottom:10},
  subPlayerRow:{display:"flex",alignItems:"center",gap:10,background:CARD2,borderRadius:10,padding:"10px 12px",border:`1px solid ${BORDER}`,cursor:"pointer"},
  subAvatar:{width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,flexShrink:0},
  subName:{fontWeight:600,fontSize:13,marginBottom:3,color:TEXT},
  subMeta:{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"},
  subDist:{fontSize:11,color:MUTED},
  subRating:{fontSize:11,color:"#f59e0b"},
  callBtn:{background:"rgba(28,184,91,0.12)",border:"1px solid rgba(28,184,91,0.25)",color:G,borderRadius:8,fontSize:12,fontWeight:600,padding:"7px 12px",cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:4},
  // modals
  modalBg:{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200,padding:"0 0 env(safe-area-inset-bottom)"},
  modal:{background:"#0c1e12",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"18px 18px 0 0",padding:"24px 20px 32px",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"},
  modalEmoji:{fontSize:32,textAlign:"center",marginBottom:10},
  modalTitle:{fontFamily:TITLE,fontWeight:800,fontSize:18,textAlign:"center",marginBottom:6,color:TEXT},
  modalText:{fontSize:13,color:MUTED,textAlign:"center",marginBottom:18,lineHeight:1.6},
  modalInput:{width:"100%",padding:"11px 12px",background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,borderRadius:8,color:TEXT,fontSize:14,fontFamily:FONT,outline:"none",marginBottom:12,boxSizing:"border-box"},
  posRow:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:18},
  posBtn:{padding:"8px 0",background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,color:MUTED,borderRadius:8,cursor:"pointer",fontFamily:FONT,fontSize:12,fontWeight:700,transition:"all .15s"},
  modalBtns:{display:"flex",gap:8},
  cancelBtn:{flex:1,padding:"11px 0",background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,color:MUTED,borderRadius:9,cursor:"pointer",fontFamily:FONT,fontSize:14},
  saveBtn:{flex:1,padding:"11px 0",background:G,border:"none",color:"#fff",borderRadius:9,cursor:"pointer",fontFamily:FONT,fontSize:14,fontWeight:700},
  dangerBtn:{flex:1,padding:"11px 0",background:"rgba(248,113,113,0.15)",border:"1px solid rgba(248,113,113,0.3)",color:"#f87171",borderRadius:9,cursor:"pointer",fontFamily:FONT,fontSize:14,fontWeight:700},
  linkBox:{display:"flex",background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,borderRadius:10,overflow:"hidden",marginBottom:12},
  linkText:{flex:1,fontSize:11,color:MUTED,padding:"10px 12px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  copyBtn:{padding:"10px 14px",background:G,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FONT,flexShrink:0},
  shareGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12},
  shareBtn:{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"10px",background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,borderRadius:10,color:TEXT,cursor:"pointer",fontFamily:FONT},
  botHint:{display:"flex",gap:8,background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:10,padding:"10px 12px",alignItems:"flex-start"},
  miniSpinner:{width:12,height:12,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",display:"inline-block",animation:"spin .7s linear infinite"},
};

// ── Shared sub-components ──────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div style={S.modalBg} onClick={onClose}>
      <div style={S.modal} onClick={e=>e.stopPropagation()} className="fade-up">{children}</div>
    </div>
  );
}

function MetaChip({icon,children}){return(<span style={S.metaChip}><span style={{fontSize:11}}>{icon}</span> {children}</span>);}

function PlayerRow({player:p,isOrg,onRemove}){
  const cfg=POS_CFG[p.pos]||POS_CFG.MF;
  return(<div style={{...S.playerRow,...(p.type==="bot"?S.playerRowBot:{})}}><div style={{...S.playerAvatar,background:cfg.bg,color:cfg.color}}>{p.avatar}</div><div style={{flex:1}}><div style={S.playerName}>{p.name}</div>{p.type==="bot"&&<div style={S.botTag}>convidado</div>}</div><span style={{...S.posPill,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>{isOrg&&<button style={S.removeBtn} onClick={onRemove}>✕</button>}</div>);
}

// ── Match List ─────────────────────────────────────────────────────────────────
function MatchCard({match:m,delay,onOpen}){
  const cfg=STATUS_CFG[m.status]||STATUS_CFG.open;
  const pct=Math.round((m.players.length/m.slots)*100);
  const empty=m.slots-m.players.length;
  return(
    <div className="fade-up" style={{...S.matchCard,animationDelay:delay+"ms"}} onClick={onOpen} role="button">
      <div style={{...S.accentBar,width:pct+"%"}}/>
      <div style={S.cardBody}>
        <div style={S.cardMain}>
          <div style={S.cardTitle}>{m.title}</div>
          <div style={S.cardMeta}><MetaChip icon="📅">{fmtDate(m.date)} às {m.time}</MetaChip>{m.venue&&<MetaChip icon="📍">{m.venue}</MetaChip>}</div>
          <div style={S.cardFooter}>
            <div style={S.playerAvatarRow}>
              {m.players.slice(0,5).map(p=><div key={p.id} style={{...S.miniAvatar,background:POS_CFG[p.pos]?.bg||"rgba(255,255,255,0.1)",color:POS_CFG[p.pos]?.color||"#fff",outline:p.type==="bot"?"1.5px dashed rgba(167,139,250,0.6)":"1.5px solid rgba(255,255,255,0.1)"}}>{p.avatar}</div>)}
              {m.players.length>5&&<div style={{...S.miniAvatar,background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.4)",fontSize:10}}>+{m.players.length-5}</div>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {empty>0&&<span style={S.emptyBadge}>{empty} vagas</span>}
              <span style={{...S.statusPill,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
            </div>
          </div>
        </div>
        <div style={S.cardArrow}>›</div>
      </div>
    </div>
  );
}

export function MatchList({onOpen}){
  const myMatches=MATCHES.filter(m=>m.organizerId==="me");
  const joined=MATCHES.filter(m=>m.organizerId!=="me");
  return(
    <div style={S.page}>
      <div style={S.header}><div><div style={S.eyebrow}>Minhas peladas</div><h1 style={S.pageTitle}>Partidas</h1></div></div>
      {[["Que eu organizo",myMatches],["Que participo",joined]].map(([label,list])=>(
        <div key={label} style={{marginBottom:28}}>
          <div style={S.sectionRow}><span style={S.sectionLabel}>{label}</span><span style={S.sectionCount}>{list.length}</span></div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {list.map((m,i)=><MatchCard key={m.id} match={m} delay={i*60} onOpen={()=>onOpen(m)}/>)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Match Dashboard ────────────────────────────────────────────────────────────
export function MatchDashboard({match:m,onBack}){
  const [tab,setTab]=useState("slots");
  const [showBot,setShowBot]=useState(false);
  const [showInvite,setShowInvite]=useState(false);
  const [showCancel,setShowCancel]=useState(false);
  const [botForm,setBotForm]=useState({name:"",pos:"MF"});
  const [copied,setCopied]=useState(false);
  const [players,setPlayers]=useState(m.players);

  const isOrg=m.organizerId==="me";
  const empty=m.slots-players.length;
  const pct=Math.round((players.length/m.slots)*100);

  const addBot=()=>{if(!botForm.name.trim())return;setPlayers(prev=>[...prev,{id:"b"+Date.now(),name:botForm.name,pos:botForm.pos,avatar:botForm.name[0].toUpperCase(),type:"bot"}]);setBotForm({name:"",pos:"MF"});setShowBot(false);};
  const removePlayer=id=>setPlayers(prev=>prev.filter(p=>p.id!==id));
  const copyLink=()=>{navigator.clipboard.writeText("https://peladaapp.com.br/convite?id="+m.id);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const teams=[players.filter((_,i)=>i%2===0),players.filter((_,i)=>i%2!==0)];
  const cfg=STATUS_CFG[m.status]||STATUS_CFG.open;

  return(
    <div style={S.page}>
      <div style={S.dashHeader}>
        <button style={S.backBtn} onClick={onBack}>← Voltar</button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{...S.statusPill,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
          {isOrg&&<button style={S.redIconBtn} onClick={()=>setShowCancel(true)}>🗑</button>}
        </div>
      </div>

      <h1 style={{...S.pageTitle,marginBottom:4}}>{m.title}</h1>
      <div style={S.cardMeta}><MetaChip icon="📅">{fmtDate(m.date)} às {m.time}</MetaChip><MetaChip icon="📍">{m.venue}</MetaChip><MetaChip icon="⚽">{m.format}</MetaChip></div>

      <div style={S.progressBlock}>
        <div style={S.progressBar}><div style={{...S.progressFill,width:pct+"%",background:pct===100?"#1cb85b":"#f59e0b"}}/></div>
        <div style={S.progressLabel}><span>{players.length}/{m.slots} jogadores</span>{empty>0&&<span style={S.emptyBadge}>{empty} vagas abertas</span>}</div>
      </div>

      <div style={S.tabRow}>
        {[["slots","Escalação"],["info","Local"],["substitute","Substituto"]].map(([k,l])=>(
          <button key={k} style={{...S.tabBtn,...(tab===k?S.tabBtnActive:{})}} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==="slots"&&(
        <div className="fade-up">
          <div style={S.teamsGrid}>
            {teams.map((team,ti)=>(
              <div key={ti} style={S.teamCol}>
                <div style={S.teamHeader}><span style={S.teamLabel}>Time {ti===0?"Verde":"Branco"}</span><span style={S.teamScore}>Nível {team.length?(team.length*2.8/team.length).toFixed(1):"–"}</span></div>
                {team.map(p=><PlayerRow key={p.id} player={p} isOrg={isOrg} onRemove={()=>removePlayer(p.id)}/>)}
                {Array.from({length:Math.max(0,Math.ceil(m.slots/2)-team.length)}).map((_,i)=>(
                  <div key={"e"+i} style={S.emptySlotRow}><span style={{fontSize:14,color:"rgba(255,255,255,0.15)"}}>+</span><span style={{fontSize:12,color:"rgba(255,255,255,0.15)"}}>Vaga aberta</span></div>
                ))}
              </div>
            ))}
          </div>
          {isOrg&&(<div style={S.actionRow}>{empty>0&&<button style={S.actionPurple} onClick={()=>setShowBot(true)}>🤖 Adicionar convidado</button>}<button style={S.actionGreen} onClick={()=>setShowInvite(true)}>🔗 Convidar</button></div>)}
        </div>
      )}

      {tab==="info"&&(
        <div className="fade-up">
          <div style={S.infoCard}><div style={S.infoIcon}>📍</div><div><div style={S.infoTitle}>{m.venue}</div><div style={S.infoSub}>{m.address}</div><button style={S.mapLink} onClick={()=>window.open(`https://maps.google.com/?q=${encodeURIComponent(m.venue+" "+m.address)}`,"_blank")}>Abrir no Google Maps →</button></div></div>
          <div style={S.mockMap}><div style={S.mockMapCenter}><div style={S.mapPulseOuter}/><div style={S.mapPulseInner}>📍</div></div><div style={S.mapGrid}/></div>
        </div>
      )}

      {tab==="substitute"&&(
        <div className="fade-up">
          <div style={S.subNote}>Quando um jogador cancelar, o sistema notifica automaticamente o próximo da fila de espera por posição e proximidade.</div>
          <div style={S.subPlayers}>
            {NEARBY_PLAYERS.slice(0,4).map(p=>(
              <div key={p.id} style={S.subPlayerRow}>
                <div style={{...S.subAvatar,background:POS_CFG[p.pos]?.bg,color:POS_CFG[p.pos]?.color}}>{p.name[0]}</div>
                <div style={{flex:1}}><div style={S.subName}>{p.name}</div><div style={S.subMeta}><span style={{...S.posPill,...POS_CFG[p.pos]}}>{POS_CFG[p.pos]?.label}</span><span style={S.subDist}>{p.dist} km</span><span style={S.subRating}>★ {p.rating}</span></div></div>
                <button style={S.callBtn}>Chamar</button>
              </div>
            ))}
          </div>
          <button style={{...S.actionGreen,width:"100%",marginTop:8}}>📡 Ver radar completo</button>
        </div>
      )}

      {showBot&&(<Modal onClose={()=>setShowBot(false)}><div style={S.modalEmoji}>🤖</div><h3 style={S.modalTitle}>Adicionar convidado</h3><p style={S.modalText}>Jogador sem conta no app.</p><input style={S.modalInput} placeholder="Nome do jogador *" value={botForm.name} onChange={e=>setBotForm(v=>({...v,name:e.target.value}))} autoFocus/><div style={S.posRow}>{["GK","DF","MF","FW"].map(pos=><button key={pos} style={{...S.posBtn,...(botForm.pos===pos?{background:POS_CFG[pos].bg,color:POS_CFG[pos].color,borderColor:POS_CFG[pos].color+"66"}:{})}} onClick={()=>setBotForm(v=>({...v,pos}))}>{POS_CFG[pos].label}</button>)}</div><div style={S.modalBtns}><button style={S.cancelBtn} onClick={()=>setShowBot(false)}>Cancelar</button><button style={S.saveBtn} onClick={addBot} disabled={!botForm.name.trim()}>Adicionar</button></div></Modal>)}

      {showInvite&&(<Modal onClose={()=>setShowInvite(false)}><div style={S.modalEmoji}>🔗</div><h3 style={S.modalTitle}>Convidar jogadores</h3><p style={S.modalText}>Compartilhe o link com seus amigos.</p><div style={S.linkBox}><span style={S.linkText}>peladaapp.com.br/convite?id={m.id}</span><button style={S.copyBtn} onClick={copyLink}>{copied?"✓":"Copiar"}</button></div><div style={S.shareGrid}><button style={S.shareBtn} onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent("Entra na pelada! "+m.title+" — peladaapp.com.br/convite?id="+m.id)}`,"_blank")}><span style={{fontSize:18}}>💬</span><span style={{fontSize:12}}>WhatsApp</span></button><button style={S.shareBtn} onClick={copyLink}><span style={{fontSize:18}}>📋</span><span style={{fontSize:12}}>Copiar</span></button></div><div style={S.botHint}><span style={{fontSize:14}}>🤖</span><span style={{fontSize:12,color:"rgba(232,245,239,0.5)",lineHeight:1.5}}>Sem conta? Use <b style={{color:"#a78bfa"}}>"Adicionar convidado"</b> para reservar o slot.</span></div><button style={{...S.saveBtn,width:"100%",marginTop:12}} onClick={()=>setShowInvite(false)}>Fechar</button></Modal>)}

      {showCancel&&(<Modal onClose={()=>setShowCancel(false)}><div style={S.modalEmoji}>🗑️</div><h3 style={S.modalTitle}>Cancelar pelada?</h3><p style={S.modalText}>Todos os {players.length} jogadores serão notificados. Esta ação não pode ser desfeita.</p><div style={S.modalBtns}><button style={S.cancelBtn} onClick={()=>setShowCancel(false)}>Voltar</button><button style={S.dangerBtn} onClick={onBack}>Sim, cancelar</button></div></Modal>)}
    </div>
  );
}
