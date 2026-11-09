/* =====================================================================
   Datenschicht. Zwei Modi mit denselben Funktionen:
   - ONLINE (talib47.github.io + Schlüssel eingetragen): Supabase, Kinder nur über RPC-Funktionen.
   - VORSCHAU (sonst): alles in diesem Browser – zum Ausprobieren und solange die Schule noch nicht zugestimmt hat.
   In beiden Modi: KEINE Namen in der Datenbank. Vornamen nur im Browser der Lehrkraft („if5-namen“).
   ===================================================================== */

/* Nach dem Okay der Schule hier eintragen (Supabase → Project Settings → API). Nur der anon-Schlüssel! */
const ONLINE={url:"",key:""};

const CLOUD=!!(ONLINE.url&&ONLINE.key&&/github\.io$/.test(location.hostname)&&window.supabase);
const sb=CLOUD?window.supabase.createClient(ONLINE.url,ONLINE.key):null;

/* Tiere: Jedes Kind hat ein Tier (in der Klasse einmalig, alle sehen es) und ein Geheimtier (weiß nur es selbst) */
const TIERE=[["🦊","Fuchs"],["🐼","Panda"],["🐸","Frosch"],["🦁","Löwe"],["🐯","Tiger"],["🐨","Koala"],["🐧","Pinguin"],["🦉","Eule"],
  ["🐙","Krake"],["🦈","Hai"],["🐢","Schildkröte"],["🦒","Giraffe"],["🦓","Zebra"],["🐘","Elefant"],["🦔","Igel"],["🐝","Biene"],
  ["🦋","Schmetterling"],["🐬","Delfin"],["🦜","Papagei"],["🦩","Flamingo"],["🐊","Krokodil"],["🦘","Känguru"],["🐿️","Eichhörnchen"],["🦦","Otter"],
  ["🐞","Marienkäfer"],["🦄","Einhorn"],["🐉","Drache"],["🐳","Wal"],["🦀","Krabbe"],["🐌","Schnecke"],["🐺","Wolf"],["🐻","Bär"],
  ["🐰","Hase"],["🐴","Pferd"],["🦅","Adler"],["🦖","Dino"]];
const tierInfo=n=>{const t=TIERE.find(x=>x[1]===n);return t?{emoji:t[0],name:t[1]}:{emoji:"❓",name:n}};

/* Gerätekennung (für „besetzt“): bleibt auf dem PC, auch nach dem Abmelden */
const GERAET=(()=>{let g=lsGet("if5-geraet");if(!g){g=Math.random().toString(36).slice(2,12);lsSet("if5-geraet",g)}return g})();

/* ---------- Vorschau-Datenbank im Browser (bildet die Supabase-Funktionen nach) ---------- */
const MIN75=75*60000;
const vdb={
  lesen(){return lsGet("if5-vdb")||{kinder:[],staende:{},freigaben:{}}},
  schreiben(d){lsSet("if5-vdb",d)},
};
const jetztMs=()=>Date.now();

const db={
  online:CLOUD,

  /* --- Kinder --- */
  async tiere(klasse){
    if(CLOUD){const {data,error}=await sb.rpc("kind_tiere",{p_klasse:klasse});if(error)throw error;
      return{offen:data.length?data[0].offen:await db._offenOhneKinder(klasse),liste:data.map(r=>({tier:r.tier,besetzt:r.besetzt,gesperrt:r.gesperrt,neuGeheim:r.neu_geheim}))}}
    const d=vdb.lesen();
    return{offen:(d.freigaben[klasse]||0)>jetztMs(),
      liste:d.kinder.filter(k=>k.klasse===klasse).map(k=>({tier:k.tier,besetzt:!!(k.token&&jetztMs()-k.aktiv<MIN75&&k.geraet!==GERAET),gesperrt:k.gesperrt,neuGeheim:k.geheim==null}))};
  },
  async _offenOhneKinder(){return false},
  async neu(klasse,tier,geheim){
    if(CLOUD){const {data,error}=await sb.rpc("kind_neu",{p_klasse:klasse,p_tier:tier,p_geheim:geheim,p_geraet:GERAET});if(error)throw error;return data}
    const d=vdb.lesen();
    if(!((d.freigaben[klasse]||0)>jetztMs()))return{fehler:"zu"};
    if(d.kinder.some(x=>x.klasse===klasse&&x.tier===tier))return{fehler:"vergeben"};
    const k={id:Math.random().toString(36).slice(2,12),klasse,tier,geheim,gesperrt:false,fehlversuche:0,token:Math.random().toString(36).slice(2),geraet:GERAET,aktiv:jetztMs(),erstellt:jetztMs()};
    d.kinder.push(k);vdb.schreiben(d);return{token:k.token,staende:{}};
  },
  async anmelden(klasse,tier,geheim){
    if(CLOUD){const {data,error}=await sb.rpc("kind_anmelden",{p_klasse:klasse,p_tier:tier,p_geheim:geheim,p_geraet:GERAET});if(error)throw error;return data}
    const d=vdb.lesen();
    if(!((d.freigaben[klasse]||0)>jetztMs()))return{fehler:"zu"};
    const k=d.kinder.find(x=>x.klasse===klasse&&x.tier===tier);
    if(!k)return{fehler:"unbekannt"};
    if(k.gesperrt)return{fehler:"gesperrt"};
    if(k.token&&jetztMs()-k.aktiv<MIN75&&k.geraet!==GERAET)return{fehler:"besetzt"};
    if(k.geheim==null)k.geheim=geheim;
    else if(k.geheim!==geheim){k.fehlversuche=(k.fehlversuche||0)+1;if(k.fehlversuche>=2)k.gesperrt=true;vdb.schreiben(d);return{fehler:k.gesperrt?"gesperrt":"falsch"}}
    k.token=Math.random().toString(36).slice(2);k.geraet=GERAET;k.aktiv=jetztMs();k.fehlversuche=0;vdb.schreiben(d);
    return{token:k.token,staende:d.staende[k.id]||{}};
  },
  async speichern(token,station,prog){
    if(CLOUD){const {data,error}=await sb.rpc("kind_speichern",{p_token:token,p_station:station,p_prog:prog});if(error)throw error;return data}
    const d=vdb.lesen();const k=d.kinder.find(x=>x.token===token&&!x.gesperrt);if(!k)return false;
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
  async lAlles(){
    if(CLOUD){
      const [k,s,f]=await Promise.all([sb.from("kinder").select("*").order("erstellt"),sb.from("staende").select("kind_id,station,prog,geaendert"),sb.from("freigaben").select("*")]);
      for(const r of [k,s,f])if(r.error)throw r.error;
      const staende={};s.data.forEach(r=>{(staende[r.kind_id]=staende[r.kind_id]||{})[r.station]=r.prog});
      const freigaben={};f.data.forEach(r=>freigaben[r.klasse]=new Date(r.bis).getTime());
      return{kinder:k.data.map(r=>({id:r.id,klasse:r.klasse,tier:r.tier,geheim:r.geheim,gesperrt:r.gesperrt,
        besetzt:!!(r.token&&Date.now()-new Date(r.aktiv_seit).getTime()<MIN75),angemeldet:!!r.token,aktiv:r.aktiv_seit?new Date(r.aktiv_seit).getTime():0})),staende,freigaben};
    }
    const d=vdb.lesen();
    return{kinder:d.kinder.map(k=>({...k,besetzt:!!(k.token&&jetztMs()-k.aktiv<MIN75),angemeldet:!!k.token})),staende:d.staende,freigaben:d.freigaben};
  },
  async lKindAendern(id,p){ /* p: {entsperren} | {freigeben} | {geheimNeu} */
    if(CLOUD){const u={};if(p.entsperren){u.gesperrt=false;u.fehlversuche=0}if(p.freigeben){u.token=null;u.geraet=null}if(p.geheimNeu){u.geheim=null;u.gesperrt=false;u.fehlversuche=0}
      const {error}=await sb.from("kinder").update(u).eq("id",id);if(error)throw error;return}
    const d=vdb.lesen();const k=d.kinder.find(x=>x.id===id);if(!k)return;
    if(p.entsperren){k.gesperrt=false;k.fehlversuche=0}if(p.freigeben){k.token=null;k.geraet=null}if(p.geheimNeu){k.geheim=null;k.gesperrt=false;k.fehlversuche=0}vdb.schreiben(d);
  },
  async lStandLoeschen(id,station){
    if(CLOUD){const {error}=await sb.from("staende").delete().eq("kind_id",id).eq("station",station);if(error)throw error;return}
    const d=vdb.lesen();if(d.staende[id])delete d.staende[id][station];vdb.schreiben(d);
  },
  async lKindLoeschen(id){
    if(CLOUD){const {error}=await sb.from("kinder").delete().eq("id",id);if(error)throw error;return}
    const d=vdb.lesen();d.kinder=d.kinder.filter(x=>x.id!==id);delete d.staende[id];vdb.schreiben(d);
  },
  async lFreigabe(klasse,bisMs){
    if(CLOUD){const r=bisMs?await sb.from("freigaben").upsert({klasse,bis:new Date(bisMs).toISOString()}):await sb.from("freigaben").delete().eq("klasse",klasse);if(r.error)throw r.error;return}
    const d=vdb.lesen();if(bisMs)d.freigaben[klasse]=bisMs;else delete d.freigaben[klasse];vdb.schreiben(d);
  },
};
