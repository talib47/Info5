/* =====================================================================
   Informatik 5 — eigene Stunden-Seite für Jahrgang 5 (EKG Homberg, GNDO)
   Kinder: Klasse → Tier antippen (beim ersten Mal selbst aussuchen), Station lösen, Ergebniskarte zeigen.
   Anmelden geht nur während der eigenen Stunde (Stundenplan unten) oder wenn die Lehrkraft von Hand öffnet.
   Lehrkraft (#lehrer): Stände sehen, Vornamen zuordnen (nur lokal), Klassen von Hand öffnen/schließen.
   Neue Stunde = neue Datei in src/stationen/ (siehe README).
   ===================================================================== */
const VERSION="__VERSION__";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=q=>document.querySelector(q);
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const lsDel=k=>{try{localStorage.removeItem(k)}catch(e){}};
function toast(t){document.querySelectorAll(".toast").forEach(x=>x.remove());const el=document.createElement("div");el.className="toast";el.setAttribute("role","status");el.textContent=t;document.body.append(el);setTimeout(()=>el.remove(),2400)}

/* Klassen: hier jedes Schuljahr anpassen */
const KLASSEN=["5B","5D","5E"];
/* So lange öffnet „Jetzt öffnen“ von Hand */
const FREIGABE_MIN=90;

/* Stundenplan Informatik (deutsche Zeit). tag: 1=Mo … 5=Fr. Jedes Schuljahr anpassen.
   Anmelden geht PUFFER Minuten vor Beginn bis zum Ende der Stunde. Speichern geht auch danach noch.
   (Kein Puffer nach dem Ende, sonst überschneiden sich Stunden, die direkt aufeinander folgen.) */
const PUFFER=5;
const STUNDENPLAN=[
  {klasse:"5B",tag:1,von:"09:05",min:60},   // 5B-1 Mo
  {klasse:"5B",tag:3,von:"11:25",min:60},   // 5B-2 Mi
  {klasse:"5D",tag:4,von:"13:40",min:60},   // 5D-1 Do
  {klasse:"5D",tag:3,von:"10:20",min:60},   // 5D-2 Mi
  {klasse:"5E",tag:1,von:"08:00",min:60},   // 5E-1 Mo
  {klasse:"5E",tag:5,von:"10:20",min:60},   // 5E-2 Fr
];
/* Ferien NRW 2026/27 (erster und letzter Ferientag). Bewegliche Ferientage der Schule hier ergänzen. */
const FERIEN=[["2026-12-23","2027-01-06"],["2027-03-22","2027-04-03"],["2027-05-18","2027-05-18"],["2027-07-19","2027-08-31"]];

/*@@DATEN@@*/

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

/* Bewertung wie im Notenbuch: + / o / − aus den Prozent der Punkte (Grenzen hier anpassen) */
const PLUS_AB=75,O_AB=40;
const zeichenAus=p=>p>=PLUS_AB?"+":p>=O_AB?"o":"−";
const ZEICHEN_TEXT={"+":"Super gemacht!","o":"Gut, da geht noch mehr.","−":"Das war noch zu wenig."};
const zeichenKlasse=z=>z==="+"?"good":z==="o"?"":"bad";
const zeit=ms=>{const m=Math.round((ms||0)/60000);return m<1?"unter 1 Min.":m+" Min."};
const maxPunkte=st=>st.schritte.reduce((a,s)=>a+(s.punkte||0),0);
const summe=prog=>Object.values(prog?.punkte||{}).reduce((a,b)=>a+b,0);
const prozent=(st,prog)=>{const m=maxPunkte(st);return m?Math.round(summe(prog)/m*100):100};

/* ---------- Sitzung des Kindes ---------- */
let sitzung=lsGet("if5-sitzung");      // {klasse, tier, token}
let staende=lsGet("if5-staende")||{};  // {stationId: prog}
let laufend=null;                      // {st, prog}
/* Lehrer-Vorschau (#v): alle Stationen und Teile frei durchklicken, nichts wird gespeichert */
let VS=false,vStaende={};
const basis=()=>VS?"v/":"",home=()=>VS?"v":"";
const meineStaende=()=>VS?vStaende:staende;

function staendeLokal(){lsSet("if5-staende",staende)}
let pushTimer=null,pushWarte=new Set();
function speichern(sofort){
  if(!laufend)return;
  if(VS){vStaende[laufend.st.id]=laufend.prog;return}
  staende[laufend.st.id]=laufend.prog;staendeLokal();
  pushWarte.add(laufend.st.id);
  clearTimeout(pushTimer);pushTimer=setTimeout(hochladen,sofort?0:1500);
}
async function hochladen(){
  if(!sitzung)return;
  const ids=[...pushWarte];pushWarte.clear();
  for(const id of ids){
    try{const ok=await db.speichern(sitzung.token,id,staende[id]);
      if(ok===false){rauswurf("Du wurdest abgemeldet. Bitte melde dich neu an.");return}}
    catch(e){pushWarte.add(id);clearTimeout(pushTimer);pushTimer=setTimeout(hochladen,8000)}
  }
}
function rauswurf(t){sitzung=null;staende={};laufend=null;lsDel("if5-sitzung");lsDel("if5-staende");toast(t);location.hash="";render()}

/* Automatisch abmelden, wenn die Stunde vorbei ist (10 Minuten Nachlauf für Ergebniskarte und Speichern),
   damit die nächste Gruppe am selben PC nicht im fremden Tier landet. */
const NACHLAUF=10;
async function stundeVorbeiPruefen(){
  if(!sitzung||VS||location.hash.startsWith("#lehrer"))return;
  const k=sitzung.klasse;
  if(planOffen(k)||planOffen(k,Date.now()-NACHLAUF*60000))return;
  let offen=[];try{offen=await db.offeneKlassen()}catch(e){return}
  if(offen.includes(k))return;
  clearTimeout(pushTimer);await hochladen();try{await db.abmelden(sitzung.token)}catch(e){}
  rauswurf("Die Stunde ist vorbei. Du wurdest abgemeldet – dein Stand ist gespeichert.");
}
setInterval(stundeVorbeiPruefen,60000);

/* Aktive Zeit messen (nur wenn die Seite sichtbar ist) */
let tick=Date.now();
setInterval(()=>{const n=Date.now(),d=Math.min(n-tick,15000);tick=n;
  if(laufend&&!document.hidden&&!laufend.prog.fertig){laufend.prog.aktiv=(laufend.prog.aktiv||0)+d;speichern()}},10000);

/* ---------- Seiten ---------- */
function render(){
  let h=location.hash.slice(1);
  if(h==="lehrer"||h.startsWith("lehrer/"))return seiteLehrer();
  const vs=h==="v"||h.startsWith("v/");if(vs!==VS){VS=vs;laufend=null}
  if(VS)h=h.slice(2);
  else if(!sitzung)return seiteKlasse();
  if(h.startsWith("s/")){const st=STATIONEN.find(s=>s.id===h.slice(2));if(st)return seiteStation(st)}
  laufend=null;seiteStart();
}
window.addEventListener("hashchange",render);

const LOGO=`<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="var(--accent)"/><g fill="var(--accent-ink)"><rect x="9" y="9" width="6" height="6" rx="1"/><rect x="17" y="9" width="6" height="6" rx="1" opacity=".45"/><rect x="25" y="9" width="6" height="6" rx="1"/><rect x="9" y="17" width="6" height="6" rx="1" opacity=".45"/><rect x="17" y="17" width="6" height="6" rx="1"/><rect x="25" y="17" width="6" height="6" rx="1" opacity=".45"/><rect x="9" y="25" width="6" height="6" rx="1"/><rect x="17" y="25" width="6" height="6" rx="1" opacity=".45"/><rect x="25" y="25" width="6" height="6" rx="1"/></g></svg>`;
const ich=()=>{if(VS)return"👀 Lehrkraft";const t=tierInfo(sitzung.tier);return`${t.emoji} ${esc(t.name)}`};
const kopf=()=>`<div class="top noprint"><div class="brand">${LOGO}<span>Informatik 5</span></div>${VS?`<div class="row"><span class="who">👀 Lehrer-Vorschau</span><a class="link" href="#lehrer">Zur Lehrer-Ansicht</a></div>`:sitzung?`<div class="row"><span class="who">${ich()} · ${esc(sitzung.klasse)}</span><button class="link" id="raus">Abmelden</button></div>`:""}</div>`;
function kopfAktiv(){const b=$("#raus");if(b)b.onclick=async()=>{
  if(!confirm("Abmelden? Dein Stand ist gespeichert."))return;
  clearTimeout(pushTimer);await hochladen();try{await db.abmelden(sitzung.token)}catch(e){}
  sitzung=null;staende={};laufend=null;lsDel("if5-sitzung");lsDel("if5-staende");location.hash="";render()}}
const vorschauHinweis=()=>db.online?"":`<p class="muted small" style="margin-top:18px">Vorschau: Alles wird nur in diesem Browser gespeichert.</p>`;

/* 1. Klasse wählen */
/* Ist genau eine Klasse gerade offen (der Normalfall nach Stundenplan), geht es direkt zu ihren Tieren. */
async function seiteKlasse(direkt=true){
  if(direkt){let offen=[];try{offen=await db.offeneKlassen()}catch(e){}
    if(offen.length===1)return seiteTier(offen[0])}
  $("#app").innerHTML=kopf()+`
  <div class="plate"><p class="eyebrow">Willkommen</p><h1>In welche Klasse gehst du?</h1></div>
  <div class="wahl">${KLASSEN.map(k=>`<button class="gross" data-k="${k}">${k}</button>`).join("")}</div>${vorschauHinweis()}`;
  document.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>seiteTier(b.dataset.k));
}

/* 2. Tier wählen (oder neu anlegen) */
async function seiteTier(klasse){
  $("#app").innerHTML=kopf()+`<button class="link" id="zur">‹ Andere Klasse</button>
  <div class="plate"><p class="eyebrow">Klasse ${esc(klasse)}</p><h1>Welches Tier bist du?</h1></div><div id="liste"><p class="muted">Einen Moment …</p></div>`;
  $("#zur").onclick=()=>seiteKlasse(false);
  let r;try{r=await db.tiere(klasse)}catch(e){$("#liste").innerHTML=`<div class="msg no">Keine Verbindung. Versuch es gleich noch mal.</div><button class="btn ghost" id="neu" style="margin-top:12px">Noch mal</button>`;$("#neu").onclick=()=>seiteTier(klasse);return}
  if(!r.offen){const n=naechsteStunde(klasse);
    $("#liste").innerHTML=`<div class="block"><h2>Gerade geschlossen 🔒</h2><p>Du kannst dich nur in deiner Informatik-Stunde anmelden.${n?` Nächste Stunde: <b>${esc(n)}</b>.`:""}</p><button class="btn" id="neu">Noch mal schauen</button></div>`;$("#neu").onclick=()=>seiteTier(klasse);return}
  /* Auf diesem PC war zuletzt dieses Tier angemeldet: groß vorschlagen (die meisten sitzen am selben Platz) */
  const zl=lsGet("if5-zuletzt"),zt=zl&&zl.klasse===klasse&&r.liste.find(x=>x.tier===zl.tier&&!x.besetzt);
  $("#liste").innerHTML=(zt?`<div class="block vorschlag"><span class="e">${tierInfo(zt.tier).emoji}</span><div><p class="eyebrow">Letztes Mal an diesem Platz</p><h2 style="margin:0">Bist du ${artikel(zt.tier)} ${esc(zt.tier)}?</h2></div><button class="btn" id="dasbinich">Ja, das bin ich</button></div><p class="muted" style="margin:6px 2px 10px">Nein? Dann tippe auf dein Tier:</p>`:"")+
    (r.liste.length?`<div class="tiere">${r.liste.map(x=>{const t=tierInfo(x.tier);
    return`<button class="tier${x.besetzt?" zu":""}" data-t="${esc(x.tier)}" ${x.besetzt?"disabled":""}><span class="e">${t.emoji}</span><span>${esc(t.name)}</span>${x.besetzt?`<span class="chip">besetzt</span>`:""}</button>`}).join("")}</div>
    <p class="muted small" style="margin-top:12px">Dein Tier ist grau? Dann sag sofort deiner Lehrkraft Bescheid.</p>`:`<p class="muted">Hier ist noch niemand. Sei die oder der Erste!</p>`)+
    `<button class="btn ghost wide" id="ichneu" style="margin-top:16px">Ich bin neu hier – Tier aussuchen</button><div id="m"></div>`;
  const rein=async tier=>{document.querySelectorAll("#app button").forEach(x=>x.disabled=true);
    let r;try{r=await db.anmelden(klasse,tier)}catch(e){r={fehler:"netz"}}
    anmeldeErgebnis(klasse,tier,r,()=>seiteTier(klasse))};
  if(zt)$("#dasbinich").onclick=()=>rein(zt.tier);
  /* Fremdes Tier? Einmal nachfragen – Kinder tippen gern auf das Tier, das ihnen gefällt */
  document.querySelectorAll(".tier[data-t]:not([disabled])").forEach(b=>b.onclick=()=>{
    if(zt&&b.dataset.t===zt.tier)return rein(zt.tier);
    const t=tierInfo(b.dataset.t);
    $("#app").innerHTML=kopf()+`<div class="plate gross-tier"><span class="e">${t.emoji}</span><h1>Bist du ${artikel(t.name)} ${esc(t.name)}?</h1>
      <p>Tippe nur auf „Ja“, wenn das <b>dein</b> Tier ist. Mit einem fremden Tier sammelst du Punkte für jemand anderen.</p></div>
      <div class="row"><button class="btn" id="ja">Ja, das bin ich</button><button class="btn ghost" id="nein">Nein, zurück</button></div><div id="m"></div>`;
    $("#nein").onclick=()=>seiteTier(klasse);$("#ja").onclick=()=>rein(b.dataset.t)});
  $("#ichneu").onclick=()=>seiteNeuTier(klasse,new Set(r.liste.map(x=>x.tier)));
}

/* Neu: eigenes Tier aussuchen (in der Klasse noch frei) */
function seiteNeuTier(klasse,vergeben){
  $("#app").innerHTML=kopf()+`<button class="link" id="zur">‹ Zurück</button>
  <div class="plate"><p class="eyebrow">Neu · Klasse ${esc(klasse)}</p><h1>Such dir dein Tier aus</h1><p>Das ist ab jetzt dein Name hier. Graue Tiere sind schon vergeben.</p></div>
  <div class="msg no" style="margin:0 0 14px">⚠️ Nur wenn du <b>zum ersten Mal</b> hier bist! Hast du schon ein Tier? Dann tippe oben auf „‹ Zurück“.</div>
  <div class="tiere klein">${TIERE.map(([e,n])=>`<button class="tier${vergeben.has(n)?" zu":""}" data-w="${esc(n)}" ${vergeben.has(n)?"disabled":""}><span class="e">${e}</span><span>${esc(n)}</span></button>`).join("")}</div><div id="m"></div>`;
  $("#zur").onclick=()=>seiteTier(klasse);
  document.querySelectorAll("[data-w]:not([disabled])").forEach(b=>b.onclick=()=>{const t=tierInfo(b.dataset.w);
    $("#app").innerHTML=kopf()+`<div class="plate"><p class="eyebrow">Merk dir gut</p><h1>Du bist ab jetzt: ${t.emoji} ${esc(t.name)}</h1><p>Merk es dir gut! Nächstes Mal tippst du einfach auf dein Tier.</p></div>
      <div class="row"><button class="btn" id="ok">Ja, das bin ich!</button><button class="btn ghost" id="nein">Anderes Tier</button></div><div id="m"></div>`;
    $("#nein").onclick=()=>seiteNeuTier(klasse,vergeben);
    $("#ok").onclick=async()=>{$("#ok").disabled=true;let r;try{r=await db.neu(klasse,b.dataset.w)}catch(e){r={fehler:"netz"}}
      anmeldeErgebnis(klasse,b.dataset.w,r,()=>{$("#ok").disabled=false})};
  });
}

function anmeldeErgebnis(klasse,tier,r,nochmal){
  const t=tierInfo(tier);
  if(r.token){sitzung={klasse,tier,token:r.token};lsSet("if5-sitzung",sitzung);lsSet("if5-zuletzt",{klasse,tier});staende=r.staende||{};staendeLokal();toast(`Hallo ${t.name}!`);location.hash="";render();return}
  const T={besetzt:"Dieses Tier ist schon an einem anderen Platz angemeldet. Sag deiner Lehrkraft Bescheid.",zu:"Die Klasse ist gerade geschlossen.",
    unbekannt:"Dieses Tier gibt es nicht mehr.",vergeben:"Dieses Tier hat sich gerade jemand anderes genommen. Such dir ein anderes aus.",voll:"Die Klasse ist voll. Sag deiner Lehrkraft Bescheid.",netz:"Keine Verbindung. Versuch es noch mal."};
  const m=$("#m");m.className="msg no";m.textContent=T[r.fehler]||"Das hat nicht geklappt.";m.scrollIntoView({block:"center",behavior:"smooth"});
  if(r.fehler==="netz")nochmal();else if(r.fehler==="vergeben"||r.fehler==="besetzt")setTimeout(nochmal,2500);
}

function seiteStart(){
  const karten=STATIONEN.map(s=>{const p=meineStaende()[s.id];
    const st=p?.fertig?`<span class="chip good">fertig · ${summe(p)} Punkte</span>`:p?`<span class="chip">angefangen</span>`:"";
    return`<button class="st" data-id="${s.id}"><span class="ico">${s.ico}</span><h3>${esc(s.titel)}</h3><span class="muted small">${esc(s.kurz)}</span><span class="meta"><span class="chip">${s.schritte.length} Teile</span>${st}</span></button>`}).join("");
  const bald=BALD.filter(b=>!STATIONEN.some(s=>s.titel===b.titel)).map(b=>`<div class="st soon"><span class="ico">${b.ico}</span><h3>${esc(b.titel)}</h3><span class="muted small">${esc(b.kurz)}</span><span class="meta"><span class="chip">kommt bald</span></span></div>`).join("");
  $("#app").innerHTML=kopf()+`
  ${VS?`<div class="plate"><p class="eyebrow">👀 Lehrer-Vorschau</p><h1>Alle Stationen ansehen</h1><p>So sehen die Kinder die Stationen. Du kannst jeden Teil frei anklicken, ohne ihn zu lösen. Nichts wird gespeichert.</p><button class="btn" id="vreset">Vorschau zurücksetzen</button></div>`
    :`<div class="plate"><p class="eyebrow">Hallo ${ich()}</p><h1>Welche Station heute?</h1><p>Deine Lehrkraft sagt dir, welche Station dran ist. Löse alle Teile und zeig am Ende deine Ergebniskarte.</p></div>`}
  <div class="grid-st">${karten}${bald}</div>
  <p class="muted small" style="margin-top:22px">Version ${VERSION}</p>`;
  kopfAktiv();
  document.querySelectorAll(".st[data-id]").forEach(b=>b.onclick=()=>location.hash=basis()+"s/"+b.dataset.id);
  if($("#vreset"))$("#vreset").onclick=()=>{vStaende={};laufend=null;seiteStart();toast("Vorschau zurückgesetzt")};
}

function seiteStation(st){
  if(!laufend||laufend.st!==st){
    const prog=meineStaende()[st.id]||{schritt:0,punkte:{},daten:{},start:Date.now(),aktiv:0};
    laufend={st,prog};
  }
  const {prog}=laufend;
  if(prog.fertig)return seiteErgebnis(st,prog);
  const i=Math.min(prog.schritt,st.schritte.length-1),sch=st.schritte[i];
  const geloest=i in prog.punkte;
  $("#app").innerHTML=kopf()+`
  ${VS?`<div class="msg ok noprint" style="margin:0 0 12px">👀 Vorschau: Du kannst jeden Teil anklicken und ohne Lösen weitergehen. Nichts wird gespeichert.</div>`:""}
  <div class="steps noprint springen">${st.schritte.map((_,k)=>{const darf=VS||k in prog.punkte||k<=(prog.weitester||0);
    return`<i class="${k in prog.punkte?"ok":k===i?"now":""}${darf?"":" zu"}"${darf?` data-sp="${k}" title="Zu Teil ${k+1}"`:""}></i>`}).join("")}</div>
  <div class="stephead"><p class="eyebrow">${st.ico} ${esc(st.titel)} · Teil ${i+1} von ${st.schritte.length}</p><span class="pts">⭐ ${summe(prog)} Punkte</span></div>
  <h2>${esc(sch.titel)}</h2>
  ${sch.merke?`<div class="aha merke"><b>💡 Merke:</b> ${sch.merke}</div>`:""}
  <div id="body"></div>
  <div class="nav noprint">
    <button class="btn ghost pfeil" id="zur">${i===0?"🏠 Übersicht":"◀ Zurück"}</button>
    <button class="btn pfeil" id="weiter">${i===st.schritte.length-1?"Fertig 🏁":"Weiter ▶"}</button>
  </div>`;
  prog.weitester=Math.max(prog.weitester||0,i);
  kopfAktiv();
  prog.daten[i]=prog.daten[i]||{};
  const ctx={
    daten:prog.daten[i],
    geloest,
    speichern:()=>speichern(),
    /* Ein falscher Versuch kostet 2 Punkte, aber höchstens die Hälfte der Punkte dieses Teils */
    fehler(){prog.fehler=prog.fehler||{};prog.fehler[i]=(prog.fehler[i]||0)+1;speichern()},
    geschafft(p){if(!(i in prog.punkte)){const f=(prog.fehler||{})[i]||0;p=Math.max(Math.ceil(p/2),p-2*f);prog.punkte[i]=p;speichern(true);
        if(p>0)toast(`Geschafft! +${p} Punkte`);
        $(".pts").textContent=`⭐ ${summe(prog)} Punkte`;
        $(".steps").children[i].className="ok"}
      ctx.geloest=true},
    pruefer:null,
    loesung:null,   // Teil setzt hier eine Funktion, die die Lösung zeigt (nur Lehrer-Vorschau)   // Teil setzt hier eine Prüf-Funktion (true = richtig); „Weiter“ ruft sie auf
  };
  sch.zeige($("#body"),ctx);
  if(VS&&ctx.loesung){$("#body").insertAdjacentHTML("beforebegin",`<button class="btn ghost noprint" id="loesung" style="margin:0 0 12px">🔑 Lösung zeigen</button>`);
    $("#loesung").onclick=()=>{ctx.loesung();$("#loesung").remove()}}
  document.querySelectorAll("[data-sp]").forEach(x=>x.onclick=()=>{prog.schritt=+x.dataset.sp;speichern();seiteStation(st);scrollTo(0,0)});
  $("#zur").onclick=()=>{if(i===0){location.hash=home()}else{prog.schritt=i-1;speichern();seiteStation(st);scrollTo(0,0)}};
  const vor=()=>{if(i===st.schritte.length-1){prog.fertig=Date.now();speichern(true);seiteErgebnis(st,prog)}
    else{prog.schritt=i+1;speichern();seiteStation(st)}
    scrollTo(0,0)};
  /* „Weiter“ prüft automatisch: richtig → kurz Erfolg zeigen, dann weiter; falsch → bleiben, Rückmeldung steht da */
  let sperre=false;
  $("#weiter").onclick=()=>{if(sperre)return;
    if(VS||i in prog.punkte)return vor();
    if(ctx.pruefer){if(ctx.pruefer()){sperre=true;setTimeout(vor,900)}return}
    toast("Löse zuerst diesen Teil.")};
}

function konfetti(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const box=document.createElement("div");box.className="konfetti";box.setAttribute("aria-hidden","true");
  for(let k=0;k<40;k++){const i=document.createElement("i");i.textContent=["🎉","⭐","✨","🎊"][k%4];
    i.style.left=Math.random()*100+"%";i.style.animationDelay=Math.random()*.8+"s";i.style.fontSize=(16+Math.random()*18)+"px";box.append(i)}
  document.body.append(box);setTimeout(()=>box.remove(),3500);
}
function seiteErgebnis(st,prog){
  if(prog.fertig&&Date.now()-prog.fertig<5000&&zeichenAus(prozent(st,prog))!=="−")konfetti();
  const pz=prozent(st,prog);
  $("#app").innerHTML=kopf()+`
  <div class="plate result">
    <p class="eyebrow">Ergebniskarte · ${st.ico} ${esc(st.titel)}</p>
    <div class="row" style="justify-content:space-between;align-items:flex-start">
      <div><h1 style="margin:0">${ich()}</h1><p style="margin:2px 0 0">${VS?"Vorschau":"Klasse "+esc(sitzung.klasse)}</p></div>
      <div style="text-align:right"><div class="note zeichen">${zeichenAus(pz)}</div><span class="small">${ZEICHEN_TEXT[zeichenAus(pz)]}</span></div>
    </div>
    <dl><dt>Punkte</dt><dd>${summe(prog)} von ${maxPunkte(st)} (${pz} %)</dd>
    <dt>Gearbeitet</dt><dd>${zeit(prog.aktiv)}</dd>
    <dt>Fertig am</dt><dd>${new Date(prog.fertig).toLocaleString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</dd></dl>
  </div>
  ${st.ergebnis?`<div class="block">${st.ergebnis(prog.daten)}</div>`:""}
  <div class="block"><p style="margin:0"><b>Zeig diese Karte deiner Lehrkraft.</b> ${st.kreativ?"Die Note für Kreativität gibt die Lehrkraft.":""}</p></div>
  <div class="nav noprint"><button class="btn ghost" id="zur">Übersicht</button></div>`;
  kopfAktiv();
  if(st.nachErgebnis)st.nachErgebnis(prog.daten);
  $("#zur").onclick=()=>location.hash=home();
  if(VS)$(".nav").insertAdjacentHTML("beforeend",`<button class="btn ghost" id="vnochmal">Station noch mal</button>`),$("#vnochmal").onclick=()=>{delete vStaende[st.id];laufend=null;seiteStation(st)};
}

/* =====================================================================
   Lehrer-Ansicht (#lehrer). Vornamen bleiben NUR in diesem Browser.
   ===================================================================== */
let namen=lsGet("if5-namen")||{};      // {kindId: "Vorname"}
let listen=lsGet("if5-listen")||{};    // {klasse: ["Vorname", …]} – Klassenlisten, nur in diesem Browser
let lKlasse=lsGet("if5-lklasse")||KLASSEN[0];
let lDaten=null,lTimer=null,lPlanGesendet=false;

async function seiteLehrer(){
  laufend=null;clearInterval(lTimer);
  if(!(await db.lSitzung()))return lehrerLogin();
  $("#app").innerHTML=`<div class="top noprint"><div class="brand">${LOGO}<span>Informatik 5 · Lehrkraft</span></div><div class="row">${db.online?`<button class="link" id="lraus">Abmelden</button>`:""}<a class="link" href="#v">👀 Stationen ansehen</a></div></div><div id="lb"><p class="muted">Lade …</p></div>`;
  if($("#lraus"))$("#lraus").onclick=async()=>{await db.lAbmelden();seiteLehrer()};
  if(db.online&&!lPlanGesendet){try{await db.lPlanUebertragen();lPlanGesendet=true}catch(e){toast("Stundenplan konnte nicht übertragen werden")}}
  await lehrerLaden();
  lTimer=setInterval(()=>{if(location.hash==="#lehrer"&&!document.hidden&&!document.activeElement?.matches("input"))lehrerLaden()},20000);
}

function lehrerLogin(){
  $("#app").innerHTML=`<div class="top"><div class="brand">${LOGO}<span>Informatik 5 · Lehrkraft</span></div></div>
  <form class="block" id="f" style="max-width:26rem"><h2>Anmelden</h2>
  <label class="f" for="e">E-Mail</label><input type="text" id="e" autocomplete="username" inputmode="email">
  <div style="height:12px"></div><label class="f" for="p">Passwort</label><input type="password" id="p" autocomplete="current-password" class="pw">
  <div style="height:16px"></div><button class="btn wide">Anmelden</button><div id="m"></div></form>`;
  $("#f").onsubmit=async e=>{e.preventDefault();try{await db.lAnmelden($("#e").value.trim(),$("#p").value);seiteLehrer()}catch(err){const m=$("#m");m.className="msg no";m.textContent="Anmeldung fehlgeschlagen."}};
}

async function lehrerLaden(){
  try{lDaten=await db.lAlles()}catch(e){$("#lb").innerHTML=`<div class="msg no">Laden fehlgeschlagen: ${esc(e.message||e)}</div>`;return}
  lehrerZeigen();
}

function lehrerZeigen(){
  const d=lDaten,kl=lKlasse;
  const kinder=d.kinder.filter(k=>k.klasse===kl);
  const fg=d.freigaben[kl]||{},nun=Date.now();
  const offen=offenAus(kl,fg),hand=(fg.zu_bis||0)>nun?"zu":(fg.offen_bis||0)>nun?"offen":null;
  const naechste=naechsteStunde(kl);
  const info=hand==="offen"?`Von Hand geöffnet bis ${new Date(fg.offen_bis).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})} Uhr.`
    :hand==="zu"?`Von Hand geschlossen bis ${new Date(fg.zu_bis).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})} Uhr.`
    :offen?"Nach Stundenplan offen.":`Nach Stundenplan zu.${naechste?" Nächste Stunde: "+naechste+".":""}`;
  const zeile=k=>{const t=tierInfo(k.tier),s=d.staende[k.id]||{};
    const status=k.besetzt?`<span class="chip good">angemeldet</span> <button class="link" data-a="freigeben" data-id="${k.id}">abmelden</button>`:`<span class="muted small">–</span>`;
    const zellen=STATIONEN.map(st=>{const p=s[st.id];if(!p)return`<td class="muted">–</td>`;const pz=prozent(st,p);
      return`<td>${p.fertig?`<span class="chip ${zeichenKlasse(zeichenAus(pz))} gross-z">${zeichenAus(pz)}</span>`:"<b>…</b>"} <span class="muted small">${pz} %${p.fertig?"":" · Teil "+((p.schritt||0)+1)}</span></td>`}).join("");
    return`<tr><td class="t"><span class="e">${t.emoji}</span>${esc(t.name)}</td>
      <td><input type="text" class="vn" data-id="${k.id}" value="${esc(namen[k.id]||"")}" placeholder="Wer ist das?" list="dl-${esc(kl)}"></td><td>${status}</td>${zellen}
      <td><button class="link" data-a="mehr" data-id="${k.id}" aria-label="Mehr">⋯</button></td></tr>`};
  $("#lb").innerHTML=`
  <div class="tabs noprint">${KLASSEN.map(k=>`<button class="${k===kl?"an":""}" data-kl="${k}">${k} <span class="muted small">${d.kinder.filter(x=>x.klasse===k).length}</span></button>`).join("")}</div>
  <div class="block frei-box ${offen?"offen":""}">
    <div><h2 style="margin:0">${offen?`${kl} ist offen`:`${kl} ist zu`}</h2><p class="muted small" style="margin:2px 0 0">${esc(info)}</p></div>
    <div class="row">${hand?`<button class="btn ghost" id="plan">Wieder nach Stundenplan</button>`:""}<button class="btn" id="frei">${offen?"Jetzt schließen":`Jetzt öffnen (${FREIGABE_MIN} Min.)`}</button></div>
  </div>
  <div class="block" style="overflow-x:auto">
    ${kinder.length?`<table class="liste"><thead><tr><th>Tier</th><th>Vorname <span class="muted small">(nur hier)</span></th><th>Status</th>${STATIONEN.map(st=>`<th>${st.ico} ${esc(st.titel)}</th>`).join("")}<th></th></tr></thead><tbody>${kinder.map(zeile).join("")}</tbody></table>`
      :`<p style="margin:0">Noch keine Kinder in ${kl}. In der ersten Stunde suchen sich die Kinder selbst ein Tier aus.</p>`}
    <datalist id="dl-${esc(kl)}">${(listen[kl]||[]).filter(n=>!kinder.some(k=>namen[k.id]===n)).map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
    ${(listen[kl]||[]).length?`<p class="muted small" style="margin:10px 0 0">${kinder.filter(k=>namen[k.id]).length} von ${listen[kl].length} Kindern zugeordnet.${(()=>{const fehlt=listen[kl].filter(n=>!kinder.some(k=>namen[k.id]===n));return fehlt.length&&fehlt.length<=8?" Noch ohne Tier: "+fehlt.map(esc).join(", "):""})()}</p>`:""}
  </div>
  ${(()=>{const heute=new Date().toDateString(),zeilen=[];
    kinder.forEach(k=>{const t=tierInfo(k.tier),s=d.staende[k.id]||{};
      STATIONEN.forEach(st=>{const p=s[st.id];if(!p)return;
        const tag=new Date(p.fertig||p.start||0).toDateString();if(tag!==heute)return;
        const pz=prozent(st,p),z=zeichenAus(pz);
        zeilen.push({name:namen[k.id]||`${t.emoji} ${t.name}`,z,st:st.titel,pz,fertig:!!p.fertig})})});
    if(!zeilen.length)return"";
    zeilen.sort((a,b)=>a.name.localeCompare(b.name,"de"));
    return`<div class="block"><h2 style="margin-bottom:4px">Für das Notenbuch · heute</h2><p class="muted small">Zeichen aus den Punkten von heute. Wer nicht fertig wurde, bekommt das Zeichen für das, was geschafft ist.</p>
      <div class="heute">${zeilen.map(x=>`<div><span>${esc(x.name)}</span><span>${x.fertig?"":`<span class="muted small">nicht fertig · </span>`}<span class="chip ${zeichenKlasse(x.z)} gross-z">${x.z}</span></span></div>`).join("")}</div></div>`})()}
  <div class="row noprint">
    <button class="btn ghost" id="druck" ${kinder.length?"":"disabled"}>Kärtchen drucken</button>
    <button class="btn ghost" id="sichern">Namensliste sichern</button><label class="btn ghost">Namensliste laden<input type="file" id="laden" accept=".json" hidden></label>
  </div>
  <p class="muted small" style="margin-top:14px">Die Vornamen werden nur in diesem Browser gespeichert, nie auf dem Server. Sichere die Namensliste ab und zu (z. B. auf IServ), damit sie bei einem neuen Gerät nicht fehlt.${db.online?"":" <b>Vorschau-Modus:</b> Alles liegt nur in diesem Browser."}</p>`;

  document.querySelectorAll("[data-kl]").forEach(b=>b.onclick=()=>{lKlasse=b.dataset.kl;lsSet("if5-lklasse",lKlasse);lehrerZeigen()});
  $("#frei").onclick=()=>lAktion(()=>db.lFreigabe(kl,offen?{zu_bis:Date.now()+FREIGABE_MIN*60000}:{offen_bis:Date.now()+FREIGABE_MIN*60000}));
  if($("#plan"))$("#plan").onclick=()=>lAktion(()=>db.lFreigabe(kl,{}));
  document.querySelectorAll(".vn").forEach(i=>{i.oninput=()=>{const v=i.value.trim();if(v)namen[i.dataset.id]=v;else delete namen[i.dataset.id];lsSet("if5-namen",namen)};i.onchange=()=>lehrerZeigen()});
  document.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{const id=b.dataset.id,a=b.dataset.a;
    if(a==="freigeben")return lAktion(()=>db.lAbmeldenKind(id));
    if(a==="mehr")return lMehr(d.kinder.find(k=>k.id===id))});
  $("#druck").onclick=()=>lDruck(kinder);
  $("#sichern").onclick=()=>{const b=new Blob([JSON.stringify({art:"if5-namen",gesichert:new Date().toISOString(),namen,listen},null,1)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`Informatik5-Namensliste-${new Date().toLocaleDateString("sv")}.json`;a.click();URL.revokeObjectURL(a.href)};
  $("#laden").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(j.art!=="if5-namen")throw 0;
    namen={...namen,...(j.namen||{})};lsSet("if5-namen",namen);if(j.listen){listen={...listen,...j.listen};lsSet("if5-listen",listen)}toast("Namensliste geladen");lehrerZeigen()}catch(err){toast("Das ist keine Namensliste")}};
}

async function lAktion(f){try{await f();await lehrerLaden()}catch(e){toast("Hat nicht geklappt: "+(e.message||e))}}

function lMehr(k){
  const t=tierInfo(k.tier);
  const wahl=prompt(`${t.emoji} ${t.name}${namen[k.id]?" ("+namen[k.id]+")":""}\n\n1 = Stand einer Station löschen\n2 = Tier ganz löschen`);
  if(wahl==="1"){const st=STATIONEN.length===1?STATIONEN[0]:STATIONEN[parseInt(prompt(STATIONEN.map((s,i)=>`${i+1} = ${s.titel}`).join("\n")),10)-1];
    if(st&&confirm(`Stand „${st.titel}“ von ${t.name} löschen?`))lAktion(()=>db.lStandLoeschen(k.id,st.id))}
  else if(wahl==="2"){if(confirm(`${t.name} mit allen Punkten löschen?`)){delete namen[k.id];lsSet("if5-namen",namen);lAktion(()=>db.lKindLoeschen(k.id))}}
}

function lDruck(kinder){
  const w=window.open("","_blank");if(!w)return toast("Bitte Pop-ups erlauben");
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Kärtchen ${esc(lKlasse)}</title><style>
    body{font:16px system-ui,sans-serif;margin:10mm}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:0}
    .k{border:1px dashed #999;padding:10px 12px;height:42mm;display:flex;flex-direction:column;justify-content:space-between;break-inside:avoid}
    .e{font-size:40px;line-height:1}.n{font-size:20px;font-weight:700}.f{display:flex;align-items:center;gap:8px;font-weight:700}
    .f i{width:22px;height:22px;border-radius:50%;display:inline-block;-webkit-print-color-adjust:exact;print-color-adjust:exact}.s{color:#666;font-size:12px}
    </style></head><body><div class="g">${kinder.map(k=>{const t=tierInfo(k.tier);
    return`<div class="k"><div style="display:flex;justify-content:space-between"><span class="e">${t.emoji}</span><span class="s">Informatik 5 · ${esc(k.klasse)}<br>${esc(namen[k.id]||"")}</span></div>
    <div class="n">${esc(t.name)}</div><div class="f">Klasse ${esc(k.klasse)}</div></div>`}).join("")}</div>
    <script>onload=()=>print()<\/script></body></html>`);
  w.document.close();
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

/* Aha-Frage: kurze Frage mit 3 leichten Antworten. Nach der richtigen Antwort erklärt ein „Aha!“-Kasten den Sinn.
   frage("Titel","Frage?",["richtig","falsch"],"Erklärung",punkte,bildHTML)  – die erste Antwort ist die richtige, angezeigt wird gemischt.
   Für Klasse 5: kurze Frage, 2 Antworten mit Emoji, eine davon offensichtlich falsch. */
function frage(titel,text,antworten,aha,punkte=5,bild=""){return{titel,punkte,zeige(el,ctx){
  const reihe=ctx.daten.reihe||(ctx.daten.reihe=antworten.map((_,k)=>k).sort(()=>Math.random()-.5));ctx.speichern();
  el.innerHTML=`<p class="frage">${text}</p>${bild}<div class="antworten">${reihe.map(k=>`<button class="antwort" data-k="${k}">${esc(antworten[k])}</button>`).join("")}</div><div id="aha"></div>`;
  const zeigeAha=()=>{el.querySelector("#aha").innerHTML=`<div class="aha"><b>💡 Aha!</b> ${aha}</div>`;
    el.querySelectorAll(".antwort").forEach(b=>{b.disabled=true;if(b.dataset.k==="0")b.classList.add("richtig")})};
  ctx.pruefer=()=>{toast("Tippe zuerst auf eine Antwort.");return false};
  ctx.loesung=()=>{const b=el.querySelector('.antwort[data-k="0"]');b.classList.add("richtig");el.querySelector("#aha").innerHTML=`<div class="aha"><b>💡 Aha!</b> ${aha}</div>`};
  if(ctx.geloest)return zeigeAha();
  el.querySelectorAll(".antwort").forEach(b=>b.onclick=()=>{
    if(b.dataset.k==="0"){zeigeAha();ctx.geschafft(punkte)}
    else{ctx.fehler();b.classList.add("falsch");b.disabled=true;toast("Nicht ganz – versuch es noch mal!")}});
}}}

/* Farbauswahl für Pixel-Raster */
function farbLeiste(palette,nm,start=1,ohneWeiss=false,mitZahlen=true){
  const el=document.createElement("div");el.className="pal";let wahl=start;
  palette.forEach((f,k)=>{if(ohneWeiss&&k===0)return;const b=document.createElement("button");b.type="button";b.style.setProperty("--c",f);
    const rad=k===0;b.setAttribute("aria-label",rad?"Radierer":nm[k]);b.title=rad?"Radierer (macht weiß)":nm[k];
    b.innerHTML=rad?`<span class="rad">🧽</span>`:mitZahlen?`<span>${k}</span>`:"";b.className=(k===wahl?"an":"")+(rad?" radierer":"");
    b.onclick=()=>{wahl=k;el.querySelectorAll("button").forEach(x=>x.classList.remove("an"));b.classList.add("an")};el.append(b)});
  return{el,farbe:()=>wahl};
}

/* ---------- Start ---------- */
STATIONEN.sort((a,b)=>(a.nr||99)-(b.nr||99));
stundeVorbeiPruefen().finally(render);

/* Neue Version holen (wie KT Schule): beim Start und beim Zurückkehren */
async function versionPruefen(){if(!/github\.io$/.test(location.hostname))return;
  try{const r=await fetch("version.txt?"+Date.now(),{cache:"no-store"});const v=(await r.text()).trim();if(v&&v!==VERSION){await hochladen();location.reload()}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)versionPruefen();else if(sitzung){clearTimeout(pushTimer);hochladen()}});
versionPruefen();
if("serviceWorker"in navigator&&/github\.io$/.test(location.hostname))navigator.serviceWorker.register("sw.js").catch(()=>{});
