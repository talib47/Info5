/* =====================================================================
   Datenschicht. Zwei Modi mit denselben Funktionen:
   - ONLINE (talib47.github.io + Schlüssel eingetragen): Supabase, Kinder nur über RPC-Funktionen.
   - VORSCHAU (sonst): alles in diesem Browser – zum Ausprobieren und solange die Schule noch nicht zugestimmt hat.
   In beiden Modi: KEINE Namen in der Datenbank. Vornamen nur im Browser der Lehrkraft („if5-namen“).
   ===================================================================== */

/* Nach dem Okay der Schule hier eintragen (Supabase → Project Settings → API). Nur der anon-Schlüssel! */
const ONLINE={url:"https://dqopymysowroicfdwwhv.supabase.co",key:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxb3B5bXlzb3dyb2ljZmR3d2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyNTk5NzMsImV4cCI6MjEwOTgzNTk3M30.-0X9oc6t_ezyPQLW-t6u6EWM02ETB8crrlHkb1RpJqs"};

const CLOUD=!!(ONLINE.url&&ONLINE.key&&/github\.io$/.test(location.hostname)&&window.supabase);
const sb=CLOUD?window.supabase.createClient(ONLINE.url,ONLINE.key):null;

/* Tiere: Jedes Kind sucht sich beim ersten Mal ein Tier aus (in der Klasse einmalig) */
/* Tiere: bewusst nur solche, die kein Schimpfwort und keine Angriffsfläche sind (kein Schwein, Hund, Esel, Affe, Schnecke …) */
const TIERE=[["🦊","Fuchs"],["🐼","Panda"],["🦁","Löwe"],["🐯","Tiger"],["🐨","Koala"],["🐧","Pinguin"],["🦉","Eule"],["🦈","Hai"],
  ["🐬","Delfin"],["🦜","Papagei"],["🦅","Adler"],["🐺","Wolf"],["🐻","Bär"],["🦔","Igel"],["🦦","Otter"],["🐆","Leopard"],
  ["🦌","Hirsch"],["🦎","Gecko"],["🐊","Krokodil"],["🦘","Känguru"],["🦖","Dino"],["🐉","Drache"],["🦓","Zebra"],["🐿️","Eichhörnchen"],
  ["🦇","Fledermaus"],["🦢","Schwan"],["🐙","Krake"],["🦂","Skorpion"],["🐴","Pferd"],["🦡","Dachs"],["🦝","Waschbär"],["🦞","Hummer"],["🦀","Krabbe"]];
const tierInfo=n=>{const t=TIERE.find(x=>x[1]===n);return t?{emoji:t[0],name:t[1]}:{emoji:"❓",name:n}};
const WEIBLICH=new Set(["Eule","Krake","Fledermaus","Krabbe"]),SAECHLICH=new Set(["Zebra","Känguru","Eichhörnchen","Krokodil","Pferd"]);
const artikel=n=>WEIBLICH.has(n)?"die":SAECHLICH.has(n)?"das":"der";

/* Gerätekennung (für „besetzt“): bleibt auf dem PC, auch nach dem Abmelden */
const GERAET=(()=>{let g=lsGet("if5-geraet");if(!g){g=Math.random().toString(36).slice(2,12);lsSet("if5-geraet",g)}return g})();

/* ---------- Stundenplan: Ist die Klasse gerade offen? (deutsche Zeit, Sommer-/Winterzeit automatisch) ---------- */
function berlin(ms=Date.now()){
  const p=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",weekday:"short",hourCycle:"h23"})
    .formatToParts(new Date(ms)).map(x=>[x.type,x.value]));
  return{datum:`${p.year}-${p.month}-${p.day}`,tag:{Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7}[p.weekday],min:+p.hour*60+ +p.minute};
}
const hm=s=>{const [h,m]=s.split(":").map(Number);return h*60+m};
function planOffen(klasse,ms=Date.now()){
  const b=berlin(ms);
  if(FERIEN.some(([v,z])=>b.datum>=v&&b.datum<=z))return false;
  return STUNDENPLAN.some(s=>s.klasse===klasse&&s.tag===b.tag&&b.min>=hm(s.von)-PUFFER&&b.min<hm(s.von)+s.min);
}
/* Nächste geplante Stunde (für die Anzeige) */
function naechsteStunde(klasse){
  for(let d=0;d<21;d++){const ms=Date.now()+d*864e5,b=berlin(ms);
    if(FERIEN.some(([v,z])=>b.datum>=v&&b.datum<=z))continue;
    const s=STUNDENPLAN.filter(x=>x.klasse===klasse&&x.tag===b.tag&&(d>0||hm(x.von)+x.min>b.min)).sort((a,c)=>hm(a.von)-hm(c.von))[0];
    if(s)return`${d===0?"heute":d===1?"morgen":new Date(ms).toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"2-digit"})} um ${s.von} Uhr`}
  return null;
}
function offenAus(klasse,fg){const n=Date.now();fg=fg||{};
  if((fg.zu_bis||0)>n)return false;if((fg.offen_bis||0)>n)return true;return planOffen(klasse)}

/* ---------- Vorschau-Datenbank im Browser (bildet die Supabase-Funktionen nach) ---------- */
const MIN75=75*60000;
const vdb={
  lesen(){return lsGet("if5-vdb")||{kinder:[],staende:{},freigaben:{}}},
  schreiben(d){lsSet("if5-vdb",d)},
};
const jetztMs=()=>Date.now();
const vBesetzt=k=>!!(k.token&&jetztMs()-k.aktiv<MIN75);

const db={
  online:CLOUD,

  /* --- Kinder --- */
  async offeneKlassen(){
    if(CLOUD){const {data,error}=await sb.rpc("offene_klassen",{p_klassen:KLASSEN});if(error)throw error;return data||[]}
    const d=vdb.lesen();return KLASSEN.filter(k=>offenAus(k,d.freigaben[k]));
  },
  async tiere(klasse){
    if(CLOUD){const {data,error}=await sb.rpc("kind_tiere",{p_klasse:klasse});if(error)throw error;return data}
    const d=vdb.lesen();
    return{offen:offenAus(klasse,d.freigaben[klasse]),
      liste:d.kinder.filter(k=>k.klasse===klasse).map(k=>({tier:k.tier,besetzt:vBesetzt(k)&&k.geraet!==GERAET}))};
  },
  async neu(klasse,tier){
    if(CLOUD){const {data,error}=await sb.rpc("kind_neu",{p_klasse:klasse,p_tier:tier,p_geraet:GERAET});if(error)throw error;return data}
    const d=vdb.lesen();
    if(!offenAus(klasse,d.freigaben[klasse]))return{fehler:"zu"};
    if(d.kinder.some(x=>x.klasse===klasse&&x.tier===tier))return{fehler:"vergeben"};
    const k={id:Math.random().toString(36).slice(2,12),klasse,tier,token:Math.random().toString(36).slice(2),geraet:GERAET,aktiv:jetztMs(),erstellt:jetztMs()};
    d.kinder.push(k);vdb.schreiben(d);return{token:k.token,staende:{}};
  },
  async anmelden(klasse,tier){
    if(CLOUD){const {data,error}=await sb.rpc("kind_anmelden",{p_klasse:klasse,p_tier:tier,p_geraet:GERAET});if(error)throw error;return data}
    const d=vdb.lesen();
    if(!offenAus(klasse,d.freigaben[klasse]))return{fehler:"zu"};
    const k=d.kinder.find(x=>x.klasse===klasse&&x.tier===tier);
    if(!k)return{fehler:"unbekannt"};
    if(vBesetzt(k)&&k.geraet!==GERAET)return{fehler:"besetzt"};
    k.token=Math.random().toString(36).slice(2);k.geraet=GERAET;k.aktiv=jetztMs();vdb.schreiben(d);
    return{token:k.token,staende:d.staende[k.id]||{}};
  },
  async speichern(token,station,prog){
    if(CLOUD){const {data,error}=await sb.rpc("kind_speichern",{p_token:token,p_station:station,p_prog:prog});if(error)throw error;return data}
    const d=vdb.lesen();const k=d.kinder.find(x=>x.token===token);if(!k)return false;
    (d.staende[k.id]=d.staende[k.id]||{})[station]=prog;k.aktiv=jetztMs();vdb.schreiben(d);return true;
  },
  async abmelden(token){
    if(CLOUD){await sb.rpc("kind_abmelden",{p_token:token});return}
    const d=vdb.lesen();const k=d.kinder.find(x=>x.token===token);if(k){k.token=null;k.geraet=null;vdb.schreiben(d)}
  },

  /* --- Lehrkraft --- */
  async lSitzung(){if(!CLOUD)return true;const {data}=await sb.auth.getSession();return!!data.session},
  async lAnmelden(email,pw){const {error}=await sb.auth.signInWithPassword({email,password:pw});if(error)throw error},
  async lAbmelden(){if(CLOUD)await sb.auth.signOut()},
  /* Stundenplan und Ferien aus src/app.js zum Server bringen (beim Öffnen der Lehrer-Ansicht) */
  async lPlanUebertragen(){
    if(!CLOUD)return;
    const r1=await sb.from("stundenplan").delete().neq("tag",-1);if(r1.error)throw r1.error;
    const r2=await sb.from("stundenplan").insert(STUNDENPLAN.map(s=>({klasse:s.klasse,tag:s.tag,von:s.von,min:s.min,puffer:PUFFER})));if(r2.error)throw r2.error;
    const r3=await sb.from("ferien").delete().gte("von","1900-01-01");if(r3.error)throw r3.error;
    const r4=await sb.from("ferien").insert(FERIEN.map(([von,bis])=>({von,bis})));if(r4.error)throw r4.error;
  },
  async lAlles(){
    if(CLOUD){
      const [k,s,f]=await Promise.all([sb.from("kinder").select("*").order("erstellt"),sb.from("staende").select("kind_id,station,prog"),sb.from("freigaben").select("*")]);
      for(const r of [k,s,f])if(r.error)throw r.error;
      const staende={};s.data.forEach(r=>{(staende[r.kind_id]=staende[r.kind_id]||{})[r.station]=r.prog});
      const freigaben={};f.data.forEach(r=>freigaben[r.klasse]={offen_bis:r.offen_bis?new Date(r.offen_bis).getTime():0,zu_bis:r.zu_bis?new Date(r.zu_bis).getTime():0});
      return{kinder:k.data.map(r=>({id:r.id,klasse:r.klasse,tier:r.tier,
        besetzt:!!(r.token&&Date.now()-new Date(r.aktiv_seit).getTime()<MIN75),aktiv:r.aktiv_seit?new Date(r.aktiv_seit).getTime():0})),staende,freigaben};
    }
    const d=vdb.lesen();
    return{kinder:d.kinder.map(k=>({...k,besetzt:vBesetzt(k)})),staende:d.staende,freigaben:d.freigaben};
  },
  /* Die Lehrkraft legt die Kinder an (Tier zuteilen); Kinder können sich nicht selbst neu anlegen */
  async lKindAnlegen(klasse,tier){
    if(CLOUD){const {data,error}=await sb.from("kinder").insert({klasse,tier}).select("id").single();if(error)throw error;return data.id}
    const d=vdb.lesen();const k={id:Math.random().toString(36).slice(2,12),klasse,tier,token:null,geraet:null,aktiv:0,erstellt:jetztMs()};
    d.kinder.push(k);vdb.schreiben(d);return k.id;
  },
  async lAbmeldenKind(id){
    if(CLOUD){const {error}=await sb.from("kinder").update({token:null,geraet:null}).eq("id",id);if(error)throw error;return}
    const d=vdb.lesen();const k=d.kinder.find(x=>x.id===id);if(k){k.token=null;k.geraet=null;vdb.schreiben(d)}
  },
  async lStandLoeschen(id,station){
    if(CLOUD){const {error}=await sb.from("staende").delete().eq("kind_id",id).eq("station",station);if(error)throw error;return}
    const d=vdb.lesen();if(d.staende[id])delete d.staende[id][station];vdb.schreiben(d);
  },
  async lKindLoeschen(id){
    if(CLOUD){const {error}=await sb.from("kinder").delete().eq("id",id);if(error)throw error;return}
    const d=vdb.lesen();d.kinder=d.kinder.filter(x=>x.id!==id);delete d.staende[id];vdb.schreiben(d);
  },
  /* Hand-Steuerung: {offen_bis} öffnet, {zu_bis} schließt, {} = wieder nach Stundenplan */
  async lFreigabe(klasse,f){
    const row={klasse,offen_bis:f.offen_bis?new Date(f.offen_bis).toISOString():null,zu_bis:f.zu_bis?new Date(f.zu_bis).toISOString():null};
    if(CLOUD){const r=await sb.from("freigaben").upsert(row);if(r.error)throw r.error;return}
    const d=vdb.lesen();d.freigaben[klasse]={offen_bis:f.offen_bis||0,zu_bis:f.zu_bis||0};vdb.schreiben(d);
  },
};
