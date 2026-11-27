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
const MIN75=4*60000;   // „besetzt“: Lebenszeichen in den letzten 4 Minuten (seit 27.11.2026, vorher 75 Min.)
const vdb={
  lesen(){const d=lsGet("if5-vdb")||{kinder:[],staende:{},freigaben:{}};
    /* Erste Füllung der Vorschau: Klassen und Stundenplan aus START_KLASSEN / START_PLAN */
    if(!d.klassen){d.klassen={};START_KLASSEN.forEach(k=>d.klassen[k]={...STANDARD_REGEL,...((d.regeln||{})[k]||{})});d.plan=START_PLAN.map(x=>({...x}));delete d.regeln}
    return d},
  schreiben(d){lsSet("if5-vdb",d)},
};
const jetztMs=()=>Date.now();
const vBesetzt=k=>!!(k.token&&k.geraet&&jetztMs()-k.aktiv<MIN75);

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
  /* Klassen (mit Regel „Stationen öffnen“) und Stundenplan aller Klassen – ohne Namen, für die Anmeldeseite der Kinder */
  async plan(){
    if(CLOUD){const {data,error}=await sb.rpc("plan_alle");if(error)throw error;return data}
    const d=vdb.lesen();return{klassen:Object.entries(d.klassen).map(([klasse,r])=>({klasse,...r})),plan:d.plan};
  },
  /* Lebenszeichen (jede Minute, solange die Seite offen ist): hält das Tier besetzt */
  async lebt(token){
    if(CLOUD){const {data}=await sb.rpc("kind_lebt",{p_token:token,p_geraet:GERAET});return data}
    const d=vdb.lesen();const k=d.kinder.find(x=>x.token===token);if(k){k.aktiv=jetztMs();k.geraet=GERAET;vdb.schreiben(d)}return!!k;
  },
  /* Tab/Fenster wird geschlossen: Tier sofort frei (muss auch während des Schließens noch ankommen → keepalive) */
  pause(token){
    if(CLOUD){try{fetch(ONLINE.url+"/rest/v1/rpc/kind_pause",{method:"POST",keepalive:true,headers:{apikey:ONLINE.key,Authorization:"Bearer "+ONLINE.key,"Content-Type":"application/json"},body:JSON.stringify({p_token:token})})}catch(e){}return}
    const d=vdb.lesen();const k=d.kinder.find(x=>x.token===token);if(k){k.geraet=null;k.aktiv=0;vdb.schreiben(d)}
  },
  async abmelden(token){
    if(CLOUD){await sb.rpc("kind_abmelden",{p_token:token});return}
    const d=vdb.lesen();const k=d.kinder.find(x=>x.token===token);if(k){k.token=null;k.geraet=null;vdb.schreiben(d)}
  },

  /* --- Lehrkraft --- */
  async lSitzung(){if(!CLOUD)return true;const {data}=await sb.auth.getSession();return!!data.session},
  async lAnmelden(email,pw){const {error}=await sb.auth.signInWithPassword({email,password:pw});if(error)throw error;
    /* Aus dem Passwort entsteht ein Schlüssel, der nur in diesem Browser bleibt. Damit wird die Namensliste verschlüsselt,
       bevor sie zum Server geht: Dort liegt nur Zeichensalat, den ohne das Passwort niemand lesen kann. */
    try{const enc=new TextEncoder(),roh=await crypto.subtle.importKey("raw",enc.encode(pw),"PBKDF2",false,["deriveBits"]);
      const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:enc.encode("if5:"+email.toLowerCase()),iterations:250000,hash:"SHA-256"},roh,256);
      localStorage.setItem("if5-schluessel",btoa(String.fromCharCode(...new Uint8Array(bits))))}catch(e){}},
  hatSchluessel(){return!!localStorage.getItem("if5-schluessel")},
  async _key(){const b=localStorage.getItem("if5-schluessel");if(!b)return null;
    return crypto.subtle.importKey("raw",Uint8Array.from(atob(b),c=>c.charCodeAt(0)),"AES-GCM",false,["encrypt","decrypt"])},
  /* Verschlüsselte Namensliste der Lehrkraft holen / sichern (nur online) */
  async lGeheimLaden(){
    if(!CLOUD)return null;const key=await this._key();if(!key)return null;
    const {data,error}=await sb.from("lehrer_daten").select("inhalt").maybeSingle();if(error)throw error;if(!data)return null;
    const roh=Uint8Array.from(atob(data.inhalt),c=>c.charCodeAt(0));
    const klar=await crypto.subtle.decrypt({name:"AES-GCM",iv:roh.slice(0,12)},key,roh.slice(12));
    return JSON.parse(new TextDecoder().decode(klar));
  },
  /* Einmalige Übergabe: vorbereitete Namen-Zuordnung abholen; sie wird danach verschlüsselt gesichert und hier gelöscht */
  async lUebergabeHolen(){if(!CLOUD)return null;const {data,error}=await sb.from("lehrer_uebergabe").select("inhalt").maybeSingle();if(error)throw error;return data?data.inhalt:null},
  async lUebergabeLoeschen(){if(CLOUD)await sb.from("lehrer_uebergabe").delete().eq("id",1)},
  async lGeheimSpeichern(obj){
    if(!CLOUD)return false;const key=await this._key();if(!key)return false;
    const {data:u}=await sb.auth.getUser();if(!u?.user)return false;
    const iv=crypto.getRandomValues(new Uint8Array(12)),geh=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(obj))));
    const alles=new Uint8Array(12+geh.length);alles.set(iv);alles.set(geh,12);let s="";alles.forEach(b=>s+=String.fromCharCode(b));
    const {error}=await sb.from("lehrer_daten").upsert({user_id:u.user.id,inhalt:btoa(s),geaendert:new Date().toISOString()});if(error)throw error;return true;
  },
  async lAbmelden(){if(CLOUD)await sb.auth.signOut();localStorage.removeItem("if5-schluessel")},
  /* Ferien aus src/app.js zum Server bringen (beim Öffnen der Lehrer-Ansicht). Den Stundenplan pflegt jede Lehrkraft selbst. */
  async lPlanUebertragen(){
    if(!CLOUD)return;
    const r3=await sb.from("ferien").delete().gte("von","1900-01-01");if(r3.error)throw r3.error;
    const r4=await sb.from("ferien").insert(FERIEN.map(([von,bis])=>({von,bis})));if(r4.error)throw r4.error;
  },
  async lAlles(){
    if(CLOUD){
      const [k,s,f,a,rg]=await Promise.all([sb.from("kinder").select("*").order("erstellt"),sb.from("staende").select("kind_id,station,prog"),sb.from("freigaben").select("*"),sb.from("abschluesse").select("*").order("fertig_am"),sb.from("klassen").select("klasse,modus,start,stationen")]);
      const sp=await sb.from("stundenplan").select("klasse,tag,von,min,gruppe");
      if(rg.error)throw rg.error;if(sp.error)throw sp.error;
      const regeln={};rg.data.forEach(r=>regeln[r.klasse]={modus:r.modus,start:r.start,stationen:r.stationen||{}});
      const plan={klassen:rg.data,plan:sp.data};
      for(const r of [k,s,f])if(r.error)throw r.error;
      const staende={};s.data.forEach(r=>{(staende[r.kind_id]=staende[r.kind_id]||{})[r.station]=r.prog});
      const freigaben={};f.data.forEach(r=>freigaben[r.klasse]={offen_bis:r.offen_bis?new Date(r.offen_bis).getTime():0,zu_bis:r.zu_bis?new Date(r.zu_bis).getTime():0});
      return{kinder:k.data.map(r=>({id:r.id,klasse:r.klasse,tier:r.tier,gruppe:r.gruppe||null,
        besetzt:!!(r.token&&Date.now()-new Date(r.aktiv_seit).getTime()<MIN75),aktiv:r.aktiv_seit?new Date(r.aktiv_seit).getTime():0})),staende,freigaben,regeln,plan,abschluesse:a.error?[]:a.data};
    }
    const d=vdb.lesen();
    return{kinder:d.kinder.map(k=>({...k,besetzt:vBesetzt(k)})),staende:d.staende,freigaben:d.freigaben,regeln:d.klassen,
      plan:{klassen:Object.entries(d.klassen).map(([klasse,r])=>({klasse,...r})),plan:d.plan}};
  },
  /* Die Lehrkraft legt die Kinder an (Tier zuteilen); Kinder können sich nicht selbst neu anlegen */
  async lKindAnlegen(klasse,tier){
    if(CLOUD){const {data,error}=await sb.from("kinder").insert({klasse,tier}).select("id").single();if(error)throw error;return data.id}
    const d=vdb.lesen();const k={id:Math.random().toString(36).slice(2,12),klasse,tier,token:null,geraet:null,aktiv:0,erstellt:jetztMs()};
    d.kinder.push(k);vdb.schreiben(d);return k.id;
  },
  async lKindGruppe(id,g){
    if(CLOUD){const {error}=await sb.from("kinder").update({gruppe:g||null}).eq("id",id);if(error)throw error;return}
    const d=vdb.lesen();const k=d.kinder.find(x=>x.id===id);if(k){k.gruppe=g||null;vdb.schreiben(d)}},
  async lAbmeldenKind(id){
    if(CLOUD){const {error}=await sb.from("kinder").update({token:null,geraet:null}).eq("id",id);if(error)throw error;return}
    const d=vdb.lesen();const k=d.kinder.find(x=>x.id===id);if(k){k.token=null;k.geraet=null;vdb.schreiben(d)}
  },
  /* Mühe-Stern: steht im Stand der Station; nur die Lehrkraft setzt ihn (der Server übernimmt ihn beim Speichern des Kindes) */
  async lStern(id,station,an){
    if(CLOUD){const {data,error}=await sb.from("staende").select("prog").eq("kind_id",id).eq("station",station).single();if(error)throw error;
      const prog={...data.prog};if(an)prog.stern=true;else delete prog.stern;
      const r=await sb.from("staende").update({prog}).eq("kind_id",id).eq("station",station);if(r.error)throw r.error;return}
    const d=vdb.lesen();const pr=d.staende[id]?.[station];if(pr){if(an)pr.stern=true;else delete pr.stern;vdb.schreiben(d)}
  },
  /* Stand eines Kindes als Lehrkraft ändern (z. B. Lehrernote): lesen, fn(prog) anwenden, zurückschreiben */
  async lProg(id,station,fn){
    if(CLOUD){const {data,error}=await sb.from("staende").select("prog").eq("kind_id",id).eq("station",station).maybeSingle();if(error)throw error;
      const prog={schritt:0,punkte:{},daten:{},start:Date.now(),aktiv:0,...(data?.prog||{})};fn(prog);
      const r=data?await sb.from("staende").update({prog,geaendert:new Date().toISOString()}).eq("kind_id",id).eq("station",station)
        :await sb.from("staende").insert({kind_id:id,station,prog});if(r.error)throw r.error;return}
    const d=vdb.lesen();d.staende[id]=d.staende[id]||{};const pr=d.staende[id][station]=d.staende[id][station]||{schritt:0,punkte:{},daten:{},start:Date.now(),aktiv:0};fn(pr);vdb.schreiben(d)
  },
  async lStandLoeschen(id,station){
    if(CLOUD){const {error}=await sb.from("staende").delete().eq("kind_id",id).eq("station",station);if(error)throw error;return}
    const d=vdb.lesen();if(d.staende[id])delete d.staende[id][station];vdb.schreiben(d);
  },
  async lKindLoeschen(id){
    if(CLOUD){const {error}=await sb.from("kinder").delete().eq("id",id);if(error)throw error;return}
    const d=vdb.lesen();d.kinder=d.kinder.filter(x=>x.id!==id);delete d.staende[id];vdb.schreiben(d);
  },
  /* Schalter der Lehrkraft für einzelne Stationen: {stationId: true (offen) | false (zu)} */
  async lStationen(klasse,obj){
    if(CLOUD){const {error}=await sb.from("klassen").update({stationen:obj,geaendert:new Date().toISOString()}).eq("klasse",klasse);if(error)throw error;return}
    const d=vdb.lesen();d.klassen[klasse]={...d.klassen[klasse],stationen:obj};vdb.schreiben(d);
  },
  /* Klasse anlegen (neu=true) oder ihren Unterricht ändern. k={modus,start,stunden:[{tag,von,min,gruppe}]}.
     Antwort: true oder {fehler:"vergeben"} (Name gibt es schon, auch bei einer anderen Lehrkraft) */
  async lKlasseSpeichern(klasse,k,neu){
    const zeilen=k.stunden.map(x=>({klasse,tag:x.tag,von:x.von,min:x.min,gruppe:x.gruppe||null,puffer:PUFFER}));
    if(CLOUD){
      if(neu){const r=await sb.rpc("klasse_anlegen",{p_klasse:klasse,p_modus:k.modus,p_start:k.start||null,p_stunden:zeilen});if(r.error)throw r.error;return r.data===true?true:{fehler:"vergeben"}}
      const r=await sb.rpc("klasse_unterricht",{p_klasse:klasse,p_stunden:zeilen});if(r.error)throw r.error;return true}
    const d=vdb.lesen();
    if(neu){if(Object.keys(d.klassen).some(x=>x.toLowerCase()===klasse.toLowerCase()))return{fehler:"vergeben"};d.klassen[klasse]={modus:k.modus,start:k.start||null}}
    d.plan=d.plan.filter(x=>x.klasse!==klasse).concat(zeilen.map(({puffer,...x})=>({...x,gruppe:x.gruppe||0})));vdb.schreiben(d);return true;
  },
  /* Hand-Steuerung: {offen_bis} öffnet, {zu_bis} schließt, {} = wieder nach Stundenplan */
  async lFreigabe(klasse,f){
    const row={klasse,offen_bis:f.offen_bis?new Date(f.offen_bis).toISOString():null,zu_bis:f.zu_bis?new Date(f.zu_bis).toISOString():null};
    if(CLOUD){const r=await sb.from("freigaben").upsert(row);if(r.error)throw r.error;return}
    const d=vdb.lesen();d.freigaben[klasse]={offen_bis:f.offen_bis||0,zu_bis:f.zu_bis||0};vdb.schreiben(d);
  },
};
