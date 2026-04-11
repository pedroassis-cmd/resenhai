// Shared mock data for MatchesHub screens
export const MATCHES = [
  { id:"m1", title:"Fut Society - Vila Madalena", format:"7v7", date:"2026-03-27", time:"19:00", status:"open", venue:"Arena Society Plus", address:"R. Aspicuelta, 320", lat:-23.556, lng:-46.688, slots:14, organizerId:"me",
    players:[{id:"p1",name:"Carlos",pos:"GK",avatar:"C",type:"user"},{id:"p2",name:"Lucas",pos:"DF",avatar:"L",type:"user"},{id:"p3",name:"Rafael",pos:"MF",avatar:"R",type:"user"},{id:"p4",name:"Bruno",pos:"FW",avatar:"B",type:"user"},{id:"p5",name:"Zé bot",pos:"DF",avatar:"Z",type:"bot"},{id:"p6",name:"André",pos:"MF",avatar:"A",type:"user"}]},
  { id:"m2", title:"Futsal Sábado de Manhã", format:"5v5", date:"2026-03-29", time:"08:00", status:"open", venue:"Ginásio Clube Atlético Paulistano", address:"Al. Jaú, 450", lat:-23.565, lng:-46.672, slots:10, organizerId:"me",
    players:[{id:"p7",name:"Sérgio",pos:"GK",avatar:"S",type:"user"},{id:"p8",name:"Pedro",pos:"FW",avatar:"P",type:"user"},{id:"p9",name:"Convidado",pos:"MF",avatar:"?",type:"bot"}]},
  { id:"m3", title:"Pelada de Sexta - Pinheiros", format:"7v7", date:"2026-04-04", time:"20:00", status:"confirmed", venue:"Campo do Pinheiros", address:"R. Teodoro Sampaio, 744", lat:-23.560, lng:-46.680, slots:14, organizerId:"other",
    players:[{id:"p10",name:"Gabriel",pos:"GK",avatar:"G",type:"user"},{id:"p11",name:"Thiago",pos:"DF",avatar:"T",type:"user"},{id:"p12",name:"Felipe",pos:"MF",avatar:"F",type:"user"},{id:"p13",name:"Marcos",pos:"FW",avatar:"M",type:"user"}]},
];

export const NEARBY_PLAYERS = [
  {id:"n1",name:"João Silva",  pos:"FW",dist:0.8,rating:4.5,level:4,angle:25 },
  {id:"n2",name:"Mateus Costa",pos:"GK",dist:1.2,rating:4.8,level:5,angle:80 },
  {id:"n3",name:"Ricardo L.",  pos:"DF",dist:1.9,rating:4.1,level:3,angle:145},
  {id:"n4",name:"Felipe A.",   pos:"MF",dist:2.4,rating:3.9,level:3,angle:200},
  {id:"n5",name:"Bruno M.",    pos:"FW",dist:2.9,rating:4.6,level:4,angle:260},
  {id:"n6",name:"Caio S.",     pos:"DF",dist:3.5,rating:4.2,level:4,angle:310},
  {id:"n7",name:"André R.",    pos:"MF",dist:4.1,rating:3.7,level:3,angle:355},
];

export const OPEN_MATCHES = [
  {id:"o1",title:"Pelada do Centro",   venue:"Ginásio Municipal",      time:"Hoje 19h",   slots:14,filled:9, format:"7v7",  dist:1.4,needsPos:"GK"},
  {id:"o2",title:"Racha Vila Olímpia", venue:"Society Vila Olímpia",   time:"Amanhã 7h",  slots:10,filled:6, format:"5v5",  dist:2.1,needsPos:"FW"},
  {id:"o3",title:"Fut Empresarial",    venue:"Arena Empresarial",      time:"Sex 20h",    slots:14,filled:11,format:"7v7",  dist:3.0,needsPos:"DF"},
  {id:"o4",title:"Pelada do Parque",   venue:"Parque Ibirapuera",      time:"Dom 9h",     slots:22,filled:14,format:"11v11",dist:3.8,needsPos:"MF"},
  {id:"o5",title:"Futsal Rápido",      venue:"CT Mooca",               time:"Sex 18h",    slots:10,filled:8, format:"5v5",  dist:5.2,needsPos:"GK"},
];

export const SEEKING_PLAYERS = [
  {id:"s1",name:"Leonardo Paz",pos:"FW",level:4,dist:0.6,bio:"Disponível qualquer dia, amo futsal",         available:"Qualquer dia"},
  {id:"s2",name:"Gustavo M.",  pos:"GK",level:5,dist:1.1,bio:"Goleiro experiente buscando pelada fixa",     available:"Seg/Qua/Sex"},
  {id:"s3",name:"Henrique F.", pos:"DF",level:3,dist:1.8,bio:"Zagueiro, prefiro society 7v7",               available:"Fins de semana"},
  {id:"s4",name:"Tiago N.",    pos:"MF",level:4,dist:2.3,bio:"Meia criativo, busco time competitivo",       available:"Ter/Qui/Sáb"},
  {id:"s5",name:"Paulo C.",    pos:"FW",level:3,dist:3.0,bio:"Atacante, qualquer formato",                  available:"Qualquer dia"},
];

export const POS_CFG = {
  GK:{bg:"rgba(251,191,36,0.18)", color:"#fbbf24",label:"GOL"},
  DF:{bg:"rgba(56,189,248,0.18)", color:"#38bdf8",label:"ZAG"},
  MF:{bg:"rgba(167,139,250,0.18)",color:"#a78bfa",label:"MEI"},
  FW:{bg:"rgba(28,184,91,0.18)",  color:"#1cb85b",label:"ATA"},
};

export const STATUS_CFG = {
  open:     {label:"Aberta",     bg:"rgba(28,184,91,0.15)",   color:"#1cb85b"},
  confirmed:{label:"Confirmada", bg:"rgba(56,189,248,0.15)",  color:"#38bdf8"},
  cancelled:{label:"Cancelada",  bg:"rgba(248,113,113,0.15)", color:"#f87171"},
};

// Shared style tokens
export const G="rgba(28,184,91,1)", BG="#060f0a", CARD="#0b1c12", CARD2="#0f2318";
export const BORDER="rgba(255,255,255,0.07)", TEXT="#e8f5ef", MUTED="rgba(232,245,239,0.42)";
export const FONT="'DM Sans', sans-serif", TITLE="'Syne', sans-serif";

export function fmtDate(iso){
  return new Date(iso).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
}
