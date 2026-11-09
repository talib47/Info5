/* =====================================================================
   Informatik 5 — eigene Stunden-Seite für Jahrgang 5 (EKG Homberg, GNDO)
   Ohne Login, ohne Datenbank: Vorname eintippen, Station wählen, Schritte
   lösen, am Ende Ergebniskarte der Lehrkraft zeigen.
   Alles bleibt nur auf diesem Gerät (localStorage, Präfix „if5-“).
   Neue Stunde = neue Datei in src/stationen/ (siehe README).
   ===================================================================== */
const VERSION="__VERSION__";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=q=>document.querySelector(q);
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const lsClear=()=>{try{Object.keys(localStorage).filter(k=>k.startsWith("if5-")).forEach(k=>localStorage.removeItem(k))}catch(e){}};
function toast(t){document.querySelectorAll(".toast").forEach(x=>x.remove());const el=document.createElement("div");el.className="toast";el.setAttribute("role","status");el.textContent=t;document.body.append(el);setTimeout(()=>el.remove(),2200)}

/* Klassen: hier jedes Schuljahr anpassen */
const KLASSEN=["5A","5B","5C","5D","5E"];

/* Alle Stationen tragen sich selbst hier ein (Dateien in src/stationen/) */
const STATIONEN=[];
function station(s){STATIONEN.push(s)}

/* Geplante Stunden, die noch nicht gebaut sind (erscheinen grau) */
const BALD=[
  {ico:"🔐",titel:"Passwort-Werkstatt",kurz:"Starke Passwörter bauen und knacken lassen"},
  {ico:"⌨️",titel:"Tasten-Tricks",kurz:"Kopieren, Einfügen, Rückgängig – wie die Profis"},
  {ico:"🗂️",titel:"Ordnung im Computer",kurz:"Dateien in die richtigen Ordner sortieren"},
  {ico:"💬",titel:"Nett im Netz",kurz:"Welche Nachricht ist okay, welche nicht?"},
  {ico:"⚡",titel:"Tipp-Training",kurz:"Schneller tippen mit allen Fingern"},
  {ico:"🕵️",titel:"Echt oder Betrug?",kurz:"Gefälschte Nachrichten erkennen"},
  {ico:"🤖",titel:"Robo-Labyrinth",kurz:"Einen Roboter mit Befehlen steuern"},
  {ico:"0️⃣",titel:"Geheimsprache 0 und 1",kurz:"Zahlen und Wörter in Binär"}
];

/* Notenvorschlag aus Prozent (nur Vorschlag, Lehrkraft entscheidet) */
const noteAus=p=>p>=90?"1":p>=75?"2":p>=60?"3":p>=45?"4":p>=20?"5":"6";
const zeit=ms=>{const m=Math.round(ms/60000);return m<1?"unter 1 Min.":m+" Min."};
const jetzt=()=>new Date().toLocaleString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});

let profil=lsGet("if5-profil");
let laufend=null; // {st, prog} der gerade offenen Station

/* ---------- Aktive Zeit messen (nur wenn die Seite sichtbar ist) ---------- */
let tick=Date.now();
setInterval(()=>{const n=Date.now(),d=Math.min(n-tick,15000);tick=n;
  if(laufend&&!document.hidden&&!laufend.prog.fertig){laufend.prog.aktiv=(laufend.prog.aktiv||0)+d;speichern()}},5000);

function speichern(){if(laufend)lsSet("if5-st-"+laufend.st.id,laufend.prog)}

/* ---------- Seiten ---------- */
function render(){
  const h=location.hash.slice(1);
  if(!profil)return seiteName();
  if(h.startsWith("s/")){const st=STATIONEN.find(s=>s.id===h.slice(2));if(st)return seiteStation(st)}
  laufend=null;seiteStart();
}
window.addEventListener("hashchange",render);

const LOGO=`<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="var(--accent)"/><g fill="var(--accent-ink)"><rect x="9" y="9" width="6" height="6" rx="1"/><rect x="17" y="9" width="6" height="6" rx="1" opacity=".45"/><rect x="25" y="9" width="6" height="6" rx="1"/><rect x="9" y="17" width="6" height="6" rx="1" opacity=".45"/><rect x="17" y="17" width="6" height="6" rx="1"/><rect x="25" y="17" width="6" height="6" rx="1" opacity=".45"/><rect x="9" y="25" width="6" height="6" rx="1"/><rect x="17" y="25" width="6" height="6" rx="1" opacity=".45"/><rect x="25" y="25" width="6" height="6" rx="1"/></g></svg>`;
const kopf=()=>`<div class="top noprint"><div class="brand">${LOGO}<span>Informatik 5</span></div>${profil?`<div class="row"><span class="who">${esc(profil.name)} · ${esc(profil.klasse)}</span><button class="link" id="wechsel">Nicht du?</button></div>`:""}</div>`;
function kopfAktiv(){const b=$("#wechsel");if(b)b.onclick=()=>{if(confirm("Alles auf diesem Gerät löschen und neuen Namen eingeben?")){lsClear();profil=null;location.hash="";render()}}}

function seiteName(){
  $("#app").innerHTML=kopf()+`
  <div class="plate"><p class="eyebrow">Willkommen</p><h1>Wie heißt du?</h1><p>Schreib deinen Vornamen und wähle deine Klasse. Dann geht es los.</p></div>
  <form class="block" id="f" autocomplete="off">
    <label class="f" for="n">Vorname</label><input type="text" id="n" maxlength="30" required>
    <div style="height:14px"></div>
    <label class="f" for="k">Klasse</label><select id="k" required><option value="">Bitte wählen</option>${KLASSEN.map(k=>`<option>${k}</option>`).join("")}</select>
    <div style="height:18px"></div>
    <button class="btn wide" type="submit">Los geht's</button>
  </form>`;
  $("#n").focus();
  $("#f").onsubmit=e=>{e.preventDefault();const name=$("#n").value.trim().replace(/\s+/g," ");const klasse=$("#k").value;
    if(!name||!klasse)return toast("Bitte Name und Klasse angeben");
    lsClear();profil={name,klasse};lsSet("if5-profil",profil);render()};
}

function seiteStart(){
  const karten=STATIONEN.map(s=>{const p=lsGet("if5-st-"+s.id);
    const st=p?.fertig?`<span class="chip good">fertig</span>`:p?`<span class="chip">angefangen</span>`:"";
    return`<button class="st" data-id="${s.id}"><span class="ico">${s.ico}</span><h3>${esc(s.titel)}</h3><span class="muted small">${esc(s.kurz)}</span><span class="meta"><span class="chip">${s.schritte.length} Teile</span>${st}</span></button>`}).join("");
  const bald=BALD.filter(b=>!STATIONEN.some(s=>s.titel===b.titel)).map(b=>`<div class="st soon"><span class="ico">${b.ico}</span><h3>${esc(b.titel)}</h3><span class="muted small">${esc(b.kurz)}</span><span class="meta"><span class="chip">kommt bald</span></span></div>`).join("");
  $("#app").innerHTML=kopf()+`
  <div class="plate"><p class="eyebrow">Hallo ${esc(profil.name)}</p><h1>Welche Station heute?</h1><p>Deine Lehrkraft sagt dir, welche Station dran ist. Löse alle Teile und zeig am Ende deine Ergebniskarte.</p></div>
  <div class="grid-st">${karten}${bald}</div>
  <p class="muted small" style="margin-top:22px">Version ${VERSION}</p>`;
  kopfAktiv();
  document.querySelectorAll(".st[data-id]").forEach(b=>b.onclick=()=>location.hash="s/"+b.dataset.id);
}

function seiteStation(st){
  if(!laufend||laufend.st!==st){
    const prog=lsGet("if5-st-"+st.id)||{schritt:0,punkte:{},daten:{},start:Date.now(),aktiv:0};
    laufend={st,prog};speichern();
  }
  const {prog}=laufend;
  if(prog.fertig)return seiteErgebnis(st,prog);
  const i=Math.min(prog.schritt,st.schritte.length-1),sch=st.schritte[i];
  const summe=Object.values(prog.punkte).reduce((a,b)=>a+b,0);
  const geloest=i in prog.punkte;
  $("#app").innerHTML=kopf()+`
  <div class="steps noprint">${st.schritte.map((_,k)=>`<i class="${k in prog.punkte?"ok":k===i?"now":""}"></i>`).join("")}</div>
  <div class="stephead"><p class="eyebrow">${st.ico} ${esc(st.titel)} · Teil ${i+1} von ${st.schritte.length}</p><span class="pts">⭐ ${summe} Punkte</span></div>
  <h2>${esc(sch.titel)}</h2>
  <div id="body"></div>
  <div class="nav noprint">
    <button class="btn ghost" id="zur">${i===0?"Übersicht":"Zurück"}</button>
    <button class="btn" id="weiter" ${geloest?"":"disabled"}>${i===st.schritte.length-1?"Fertig – Ergebnis zeigen":"Weiter"}</button>
  </div>`;
  kopfAktiv();
  prog.daten[i]=prog.daten[i]||{};
  const ctx={
    daten:prog.daten[i],
    geloest,
    speichern,
    geschafft(p){if(!(i in prog.punkte)){prog.punkte[i]=p;speichern();
        if(p>0)toast(`Geschafft! +${p} Punkte`);
        $(".pts").textContent=`⭐ ${Object.values(prog.punkte).reduce((a,b)=>a+b,0)} Punkte`;
        $(".steps").children[i].className="ok"}
      ctx.geloest=true;$("#weiter").disabled=false},
  };
  sch.zeige($("#body"),ctx);
  $("#zur").onclick=()=>{if(i===0){location.hash=""}else{prog.schritt=i-1;speichern();seiteStation(st);scrollTo(0,0)}};
  $("#weiter").onclick=()=>{if(!(i in prog.punkte))return;
    if(i===st.schritte.length-1){prog.fertig=Date.now();speichern();seiteErgebnis(st,prog)}
    else{prog.schritt=i+1;speichern();seiteStation(st)}
    scrollTo(0,0)};
}

function seiteErgebnis(st,prog){
  const max=st.schritte.reduce((a,s)=>a+(s.punkte||0),0);
  const pkt=Object.values(prog.punkte).reduce((a,b)=>a+b,0);
  const pz=max?Math.round(pkt/max*100):100;
  $("#app").innerHTML=kopf()+`
  <div class="plate result">
    <p class="eyebrow">Ergebniskarte · ${st.ico} ${esc(st.titel)}</p>
    <div class="row" style="justify-content:space-between;align-items:flex-start">
      <div><h1 style="margin:0">${esc(profil.name)}</h1><p style="margin:2px 0 0">Klasse ${esc(profil.klasse)}</p></div>
      <div style="text-align:right"><div class="note">${noteAus(pz)}</div><span class="small">Vorschlag</span></div>
    </div>
    <dl><dt>Punkte</dt><dd>${pkt} von ${max} (${pz} %)</dd>
    <dt>Gearbeitet</dt><dd>${zeit(prog.aktiv||0)}</dd>
    <dt>Fertig am</dt><dd>${new Date(prog.fertig).toLocaleString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</dd></dl>
  </div>
  ${st.ergebnis?`<div class="block">${st.ergebnis(prog.daten)}</div>`:""}
  <div class="block"><p style="margin:0"><b>Zeig diese Karte deiner Lehrkraft.</b> ${st.kreativ?"Die Note für Kreativität gibt die Lehrkraft.":""}</p></div>
  <div class="nav noprint"><button class="btn ghost" id="zur">Übersicht</button><button class="btn ghost" id="nochmal">Noch mal machen</button></div>`;
  kopfAktiv();
  if(st.nachErgebnis)st.nachErgebnis(prog.daten);
  $("#zur").onclick=()=>location.hash="";
  $("#nochmal").onclick=()=>{if(confirm("Wirklich von vorne? Deine Punkte werden gelöscht.")){try{localStorage.removeItem("if5-st-"+st.id)}catch(e){}laufend=null;seiteStation(st)}};
}

/* ---------- Bausteine für Stationen ---------- */

/* Pixel-Raster: w×h Kästchen, Werte = Index in palette. Malen mit Maus, Finger oder Stift (auch Ziehen). */
function pixelRaster({w,h,werte,palette,malbar=false,farbe=()=>1,klein=false,onAenderung}){
  const el=document.createElement("div");el.className="px"+(malbar?" malbar":"")+(klein?" klein":"");
  el.style.gridTemplateColumns=`repeat(${w},1fr)`;
  const v=werte?werte.slice():Array(w*h).fill(0);
  const zellen=v.map((x,k)=>{const c=document.createElement("i");c.style.background=palette[x];c.dataset.k=k;el.append(c);return c});
  const setze=(k,x)=>{if(v[k]===x)return;v[k]=x;zellen[k].style.background=palette[x];zellen[k].classList.remove("falsch");onAenderung&&onAenderung(v)};
  if(malbar){let mal=null;
    const ziel=e=>{const t=document.elementFromPoint(e.clientX,e.clientY);return t&&t.parentNode===el?+t.dataset.k:null};
    el.addEventListener("pointerdown",e=>{const k=ziel(e);if(k==null)return;e.preventDefault();el.setPointerCapture(e.pointerId);
      const f=farbe();mal=v[k]===f?0:f;setze(k,mal)});
    el.addEventListener("pointermove",e=>{if(mal==null)return;const k=ziel(e);if(k!=null)setze(k,mal)});
    const ende=()=>{mal=null};el.addEventListener("pointerup",ende);el.addEventListener("pointercancel",ende);
  }
  return{el,werte:v,setzeAlle(a){a.forEach((x,k)=>setze(k,x))},markiere(falsch){zellen.forEach((c,k)=>c.classList.toggle("falsch",falsch.includes(k)))}};
}

/* Farbauswahl für Pixel-Raster */
function farbLeiste(palette,namen,start=1,ohneWeiss=false){
  const el=document.createElement("div");el.className="pal";let wahl=start;
  palette.forEach((f,k)=>{if(ohneWeiss&&k===0)return;const b=document.createElement("button");b.type="button";b.style.setProperty("--c",f);
    b.setAttribute("aria-label",namen[k]);b.title=namen[k];b.innerHTML=`<span>${k}</span>`;b.className=k===wahl?"an":"";
    b.onclick=()=>{wahl=k;el.querySelectorAll("button").forEach(x=>x.classList.remove("an"));b.classList.add("an")};el.append(b)});
  return{el,farbe:()=>wahl};
}

/* ---------- Start ---------- */
STATIONEN.sort((a,b)=>(a.nr||99)-(b.nr||99));
render();

/* Neue Version holen (wie KT Schule): beim Start und beim Zurückkehren */
async function versionPruefen(){if(!/github\.io$/.test(location.hostname))return;
  try{const r=await fetch("version.txt?"+Date.now(),{cache:"no-store"});const v=(await r.text()).trim();if(v&&v!==VERSION)location.reload()}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)versionPruefen()});
versionPruefen();
if("serviceWorker"in navigator&&/github\.io$/.test(location.hostname))navigator.serviceWorker.register("sw.js").catch(()=>{});
