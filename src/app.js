/* =====================================================================
   Informatik 5 — eigene Stunden-Seite für Jahrgang 5 (EKG Homberg, GNDO)
   Kinder: Klasse → Tier antippen (beim ersten Mal selbst aussuchen), dann im Lernpfad die nächste Station lösen.
   Lernpfad: Stationen der Reihe nach, höchstens eine neue pro Tag. Wer heute fertig ist, darf auf den Spielplatz.
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

/* Kapitel des Lernpfads (Reihenfolge = Reihenfolge im Schuljahr) */
const KAPITEL_NAME={fit:"Fit am Computer",netz:"Sicher im Netz",daten:"Daten und Codes",algo:"Algorithmen",ki:"Automaten und KI",ich:"Ich und meine Daten"};
const KAPITEL={fit:"🖥️ Fit am Computer",netz:"🛡️ Sicher im Netz",daten:"🔢 Daten & Codes",algo:"🤖 Algorithmen",ki:"🧠 Automaten & KI",ich:"👣 Ich & meine Daten"};
/* Höchstens eine NEUE Station pro Tag (sonst laufen schnelle Kinder der Klasse weit davon) */
const EINE_PRO_TAG=true;
/* Ränge nach gesammelten Sternen (= Punkte aller Stationen) */
const RAENGE=[[0,"🌱","Neuling"],[150,"🖱️","Klick-Kenner"],[400,"💾","Daten-Detektiv"],[750,"🔐","Code-Knacker"],[1100,"🤖","Robo-Meister"],[1500,"🧠","Informatik-Ass"],[1900,"🏆","Informatik-Legende"]];

/* Bewertung wie im Notenbuch: + / o / − aus den Prozent der Punkte (Grenzen hier anpassen) */
const PLUS_AB=75,O_AB=40;
const zeichenAus=p=>p>=PLUS_AB?"+":p>=O_AB?"o":"−";
const ZEICHEN_TEXT={"+":"Stark gearbeitet","o":"Ordentlich, da geht mehr","−":"Das war zu wenig"};
const zeichenKlasse=z=>z==="+"?"good":z==="o"?"":"bad";
const zeit=ms=>{const m=Math.round((ms||0)/60000);return m<1?"unter 1 Min.":m+" Min."};
const maxPunkte=st=>st.schritte.reduce((a,s)=>a+(s.punkte||0),0);
const summe=prog=>Object.values(prog?.punkte||{}).reduce((a,b)=>a+b,0);
const prozent=(st,prog)=>{const m=maxPunkte(st);return m?Math.round(summe(prog)/m*100):100};
const ABZEICHEN={"+":"🥇","o":"🥈","−":"🥉"};
const heuteTag=()=>new Date().toDateString(),tagVon=ms=>new Date(ms).toDateString();
const PFAD=()=>STATIONEN.filter(s=>!s.spiel),SPIELE=()=>STATIONEN.filter(s=>s.spiel);
const sterne=()=>PFAD().reduce((a,s)=>a+summe(meineStaende()[s.id]),0);
const rang=n=>{let r=RAENGE[0];for(const x of RAENGE)if(n>=x[0])r=x;return r};
const naechsterRang=n=>RAENGE.find(x=>x[0]>n);
/* Status einer Station im Lernpfad: fertig | offen | zu (vorherige fehlt) | morgen (heute schon eine geschafft) */
function status(st){
  const s=meineStaende(),p=s[st.id];
  if(p?.fertig)return"fertig";
  if(VS||st.spiel)return"offen";
  const pfad=PFAD(),i=pfad.indexOf(st);if(i<=0)return"offen";
  const vor=s[pfad[i-1].id];
  if(!vor?.fertig)return"zu";
  if(p)return"offen";
  if(EINE_PRO_TAG&&tagVon(vor.fertig)===heuteTag())return"morgen";
  return"offen";
}
/* Der Spielplatz ist die Belohnung für gute Arbeit: Er öffnet nur, wenn die Station von heute ein + hat (Schnell-Durchklicken lohnt sich nicht). */
const heuteFertig=()=>PFAD().filter(s=>{const p=meineStaende()[s.id];return p?.fertig&&tagVon(p.fertig)===heuteTag()});
const spielplatzOffen=()=>VS||heuteFertig().some(s=>zeichenAus(prozent(s,meineStaende()[s.id]))==="+");
/* Aufräumen beim Verlassen eines Teils (z. B. Tastatur-Abhörer, Zeitgeber) */
let aufraeumListe=[];
function aufraeumen(){aufraeumListe.forEach(f=>{try{f()}catch(e){}});aufraeumListe=[]}

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
  if(laufend.st.spiel)return;   // Spielplatz bleibt nur auf diesem Gerät
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
  if(laufend&&!laufend.st.spiel&&!document.hidden&&!laufend.prog.fertig){laufend.prog.aktiv=(laufend.prog.aktiv||0)+d;speichern()}},10000);

/* ---------- Seiten ---------- */
function render(){
  aufraeumen();
  let h=location.hash.slice(1);
  if(h==="lehrer"||h.startsWith("lehrer/"))return seiteLehrer();
  const vs=h==="v"||h.startsWith("v/");if(vs!==VS){VS=vs;laufend=null}
  if(VS)h=h.slice(2);
  else if(!sitzung)return seiteKlasse();
  if(h.startsWith("s/")){const st=STATIONEN.find(s=>s.id===h.slice(2));if(st)return seiteStation(st)}
  laufend=null;seiteStart();
}
window.addEventListener("hashchange",render);

/* Pixelzeichen: 7×7-Kästchen je Station (statt Emojis), gezeichnet in der Textfarbe */
const PIX={
  logo:["0111110","0100000","0111100","0000010","0000010","0100010","0011100"],
  maus:["1000000","1100000","1110000","1111000","1111100","1101000","0000100"],
  computer:["1111111","1000001","1000001","1000001","1111111","0011100","0111110"],
  ordner:["1110000","1111111","1000001","1000001","1000001","1000001","1111111"],
  tippen:["0000000","1010101","0000000","1010101","0000000","1011101","0000000"],
  passwort:["0011100","0100010","0100010","1111111","1110111","1110111","1111111"],
  fake:["0011100","0011100","0011100","0011100","0000000","0011100","0011100"],
  chat:["1111111","1000001","1000001","1000001","1111111","0011000","0010000"],
  pixel:["1010101","0101010","1010101","0101010","1010101","0101010","1010101"],
  binaer:["1110010","1010110","1010010","1010010","1010010","1010010","1110111"],
  geheim:["0111000","1101100","1101100","0111000","0011000","0011100","0011000"],
  algorithmus:["1100000","1100000","1111000","0011000","0011110","0000110","0000111"],
  robo:["0010100","1111111","1011101","1111111","1100011","1111111","0100010"],
  schleifen:["0111110","1000001","1000001","1000111","1000010","1000000","0111110"],
  suchen:["0111000","1000100","1000100","1000100","0111100","0000110","0000011"],
  automat:["1111111","1011101","1011101","1111111","1100011","1111111","1111111"],
  ki:["0001000","0011100","0001000","0111110","0100010","1110111","1110111"],
  spuren:["0110000","0110000","0000110","0000110","0110000","0110000","0000110"],
  atelier:["0110110","1111111","1111111","1111111","0111110","0011100","0001000"],
  raetsel:["0111110","1100011","0000110","0001100","0001100","0000000","0001100"],
  zahlen:["0100100","1111111","0100100","0100100","1111111","0100100","0000000"],
};
PIX.robobonus=PIX.robo;PIX.tipprennen=PIX.tippen;PIX.kimalen=PIX.ki;
const pix=(id,px=28,kl="")=>{const m=PIX[id]||PIX.pixel;
  return`<svg class="pix ${kl}" width="${px}" height="${px}" viewBox="0 0 7 7" aria-hidden="true" shape-rendering="crispEdges">${m.map((r,y)=>[...r].map((c,x)=>c==="1"?`<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="currentColor"/>`:"").join("")).join("")}</svg>`};
const LOGO=pix("logo",26,"blau");
const ich=()=>{if(VS)return"Lehrkraft";const t=tierInfo(sitzung.tier);return`${t.emoji} ${esc(t.name)}`};
const kopf=()=>`<div class="top noprint"><div class="brand">${LOGO}<span>Informatik 5</span></div>${VS?`<div class="row"><span class="who">Vorschau für Lehrkräfte</span><a class="link" href="#lehrer">Zur Lehrer-Ansicht</a></div>`:sitzung?`<div class="row"><span class="who">${ich()}, ${esc(sitzung.klasse)}</span><button class="link" id="raus">Abmelden</button></div>`:""}</div>`;
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
  $("#app").innerHTML=kopf()+`<button class="link" id="zur">Andere Klasse</button>
  <div class="plate"><p class="eyebrow">Klasse ${esc(klasse)}</p><h1>Welches Tier bist du?</h1></div><div id="liste"><p class="muted">Einen Moment …</p></div>`;
  $("#zur").onclick=()=>seiteKlasse(false);
  let r;try{r=await db.tiere(klasse)}catch(e){$("#liste").innerHTML=`<div class="msg no">Keine Verbindung. Versuch es gleich noch mal.</div><button class="btn ghost" id="neu" style="margin-top:12px">Noch mal</button>`;$("#neu").onclick=()=>seiteTier(klasse);return}
  if(!r.offen){const n=naechsteStunde(klasse);
    $("#liste").innerHTML=`<div class="block"><h2>Gerade geschlossen</h2><p>Du kannst dich nur in deiner Informatik-Stunde anmelden.${n?` Nächste Stunde: <b>${esc(n)}</b>.`:""}</p><button class="btn" id="neu">Noch mal schauen</button></div>`;$("#neu").onclick=()=>seiteTier(klasse);return}
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
  $("#app").innerHTML=kopf()+`<button class="link" id="zur">Zurück</button>
  <div class="plate"><p class="eyebrow">Neu · Klasse ${esc(klasse)}</p><h1>Such dir dein Tier aus</h1><p>Das ist ab jetzt dein Name hier. Graue Tiere sind schon vergeben.</p></div>
  <div class="msg no" style="margin:0 0 14px">Nur wenn du <b>zum ersten Mal</b> hier bist! Hast du schon ein Tier? Dann tippe oben auf „Zurück“.</div>
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
  const s=meineStaende(),pfad=PFAD(),fertig=pfad.filter(x=>s[x.id]?.fertig).length;
  const n=sterne(),[,,rName]=rang(n),nr=naechsterRang(n);
  const akt=pfad.find(x=>!s[x.id]?.fertig);
  const stAkt=akt?status(akt):null,spOffen=spielplatzOffen();
  const spielListe=`<div class="spiele">${SPIELE().map(x=>`<button class="spiel" data-sp="${x.id}">${pix(x.id,24)}<b>${esc(x.titel)}</b></button>`).join("")}</div>`;
  /* Oben steht genau eine Sache: die Station von heute – oder, wenn sie geschafft ist, der Spielplatz als Belohnung */
  const heute=VS?"":!akt?`<div class="heute-karte">${pix("pixel",56,"blau")}<div><p class="eyebrow">Alles geschafft</p><h2>Du hast alle ${pfad.length} Stationen geschafft.</h2><p class="muted">Starke Leistung. Der Spielplatz gehört dir.</p></div></div>`
    :stAkt==="morgen"?`<div class="heute-karte">${pix(akt.id,56)}<div><p class="eyebrow">Für heute fertig</p><h2>Deine Station ist geschafft.</h2><p class="muted">${spOffen?"Du hast ein + geschafft und darfst spielen.":"Für den Spielplatz brauchst du ein +. Du kannst deine Station verbessern: Tippe sie unten im Lernpfad an."} Nächste Stunde geht es weiter mit „${esc(akt.titel)}“</p></div></div>`
    :`<button class="heute-karte" data-id="${akt.id}">${pix(akt.id,56,"blau")}<div><p class="eyebrow">${s[akt.id]?"Hier machst du weiter":"Deine Station heute"}</p><h2>${esc(akt.titel)}</h2><p class="muted">${esc(akt.kurz)}</p></div><span class="btn">${s[akt.id]?"Weitermachen":"Anfangen"}</span></button>`;
  const spielplatz=VS?`<h2 style="margin:28px 0 6px">Spielplatz</h2><p class="muted">Bonus-Spiele ohne Note. Kinder sehen sie erst, wenn die Station von heute geschafft ist.</p><div class="spielplatz">${spielListe}</div>`
    :spOffen?`<div class="spielplatz"><h2>Spielplatz</h2><p class="muted">Deine Belohnung für heute. Hier gibt es keine Note.</p>${spielListe}</div>`:"";
  let kap="";
  const liste=pfad.map((x,i)=>{const p=s[x.id],stt=status(x);
    const kopf=x.kapitel!==kap?(kap=x.kapitel,`<li class="kap">${KAPITEL_NAME[x.kapitel]||""}</li>`):"";
    const z=p?.fertig?zeichenAus(prozent(x,p)):null;
    const rechts=stt==="fertig"?`<span class="stempel-k" title="Note ${z}">${z}</span>`
      :stt==="offen"?`<span class="stand">${p?"angefangen":"heute dran"}</span>`:stt==="morgen"?`<span class="stand">nächste Stunde</span>`:"";
    return`${kopf}<li><button class="pfad ${stt}" data-id="${x.id}"><span class="nr">${i+1}</span>${pix(x.id,28)}<span class="ptitel"><b>${esc(x.titel)}</b><small>${esc(x.kurz)}</small></span>${rechts}</button></li>`}).join("");
  $("#app").innerHTML=kopf()+`
  ${VS?`<div class="plate"><h1>Alle Stationen ansehen</h1><p>So sehen die Kinder ihren Lernpfad. In der Vorschau ist alles offen, und du kannst jeden Teil frei anklicken. Nichts wird gespeichert.</p><button class="btn ghost" id="vreset">Vorschau zurücksetzen</button></div>`
    :`<div class="gruss"><span>Hallo <b>${ich()}</b></span><span><b>${n}</b> Punkte, <b>${fertig}</b> von ${pfad.length} Stationen, Rang <b>${rName}</b></span></div>`}
  ${heute}
  ${VS?"":spielplatz}
  <h2 style="margin:8px 0 0">${VS?"Lernpfad":"Dein Lernpfad"}</h2>
  <ol class="lernpfad">${liste}</ol>
  ${VS?spielplatz:spOffen||!akt?"":`<p class="spielplatz zu-hinweis">Der Spielplatz öffnet sich, wenn du deine Station von heute mit einem + schaffst.</p>`}
  <p class="muted small" style="margin-top:22px">Version ${VERSION}</p>`;
  kopfAktiv();
  document.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>{const x=STATIONEN.find(y=>y.id===b.dataset.id),stt=status(x);
    if(stt==="zu")return toast("Schaff zuerst die Station davor.");
    if(stt==="morgen")return toast("Diese Station kommt in der nächsten Stunde dran.");
    location.hash=basis()+"s/"+x.id});
  document.querySelectorAll("[data-sp]").forEach(b=>b.onclick=()=>location.hash=basis()+"s/"+b.dataset.sp);
  if($("#vreset"))$("#vreset").onclick=()=>{vStaende={};laufend=null;seiteStart();toast("Vorschau zurückgesetzt")};
}

function seiteStation(st){
  aufraeumen();
  const stt=status(st);
  if(stt==="zu"||stt==="morgen"){location.hash=home();return}
  if(st.spiel&&!spielplatzOffen()){toast("🔒 Der Spielplatz öffnet, wenn du heute deine Station geschafft hast.");location.hash=home();return}
  const frei=VS||!!st.spiel;   // frei: „Weiter“ geht immer (Vorschau und Spielplatz)
  if(!laufend||laufend.st!==st){
    const prog=meineStaende()[st.id]||{schritt:0,punkte:{},daten:{},start:Date.now(),aktiv:0};
    laufend={st,prog};
  }
  const {prog}=laufend;
  if(prog.fertig)return seiteErgebnis(st,prog);
  const i=Math.min(prog.schritt,st.schritte.length-1),sch=st.schritte[i];
  const geloest=i in prog.punkte;
  $("#app").innerHTML=`
  <div class="leiste noprint"><div class="wo">${pix(st.id,22)}<span>${esc(st.titel)}</span></div><span>Teil ${i+1} von ${st.schritte.length}</span>${st.spiel?`<span class="pts">Spielplatz, ohne Note</span>`:`<span class="pts">${summe(prog)} Punkte</span>`}</div>
  <div class="steps noprint springen">${st.schritte.map((_,k)=>{const darf=VS||k in prog.punkte||k<=(prog.weitester||0);
    return`<i class="${k in prog.punkte?"ok":k===i?"now":""}${darf?"":" zu"}"${darf?` data-sp="${k}" title="Zu Teil ${k+1}"`:""}></i>`}).join("")}</div>
  <h1>${esc(sch.titel)}</h1>
  ${sch.merke?`<div class="aha merke"><b>Merke</b> ${sch.merke}</div>`:""}
  <div id="body"></div>
  <div class="nav noprint">
    <button class="btn ghost pfeil" id="zur">${i===0?"Zum Lernpfad":"Zurück"}</button>
    <button class="btn pfeil" id="weiter">${i===st.schritte.length-1?"Fertig":"Weiter"}</button>
  </div>`;
  prog.weitester=Math.max(prog.weitester||0,i);
  kopfAktiv();
  prog.daten[i]=prog.daten[i]||{};
  const ctx={
    daten:prog.daten[i],
    geloest,
    speichern:()=>speichern(),
    /* Ein falscher Versuch kostet 2 Punkte, aber höchstens die Hälfte der Punkte dieses Teils */
    fehler(){prog.fehler=prog.fehler||{};prog.fehler[i]=(prog.fehler[i]||0)+1;speichern();
      /* Raten erkennen: zwei falsche Versuche innerhalb weniger Sekunden → kurze Lese-Pause statt weiterem Raten */
      const jetzt=Date.now();serie=jetzt-letzterFehler<7000?serie+1:1;letzterFehler=jetzt;
      if(serie>=2&&!frei){serie=0;lesePause(15)}},
    geschafft(p){if(!(i in prog.punkte)){const f=(prog.fehler||{})[i]||0;p=Math.max(Math.ceil(p/2),p-2*f);prog.punkte[i]=p;speichern(true);
        if(p>0)toast(`Geschafft, +${p} Punkte`);
        $(".pts").textContent=`${summe(prog)} Punkte`;
        $(".steps").children[i].className="ok"}
      ctx.geloest=true},
    pruefer:null,   // Teil setzt hier eine Prüf-Funktion (true = richtig); „Weiter“ ruft sie auf
    loesung:null,   // Teil setzt hier eine Funktion, die die Lösung zeigt (Lehrer-Vorschau)
    beimVerlassen:f=>aufraeumListe.push(f),
  };
  window._ctx=ctx;   // für automatische Tests
  sch.zeige($("#body"),ctx);
  if(VS&&ctx.loesung){$("#body").insertAdjacentHTML("beforebegin",`<button class="btn ghost noprint" id="loesung" style="margin:0 0 14px;min-height:40px;padding:6px 14px">Lösung zeigen (nur Vorschau)</button>`);
    $("#loesung").onclick=()=>{ctx.loesung();$("#loesung").remove()}}
  document.querySelectorAll("[data-sp]").forEach(x=>x.onclick=()=>{prog.schritt=+x.dataset.sp;speichern();seiteStation(st);scrollTo(0,0)});
  $("#zur").onclick=()=>{if(i===0){location.hash=home()}else{prog.schritt=i-1;speichern();seiteStation(st);scrollTo(0,0)}};
  const vor=()=>{if(i===st.schritte.length-1){
      if(st.spiel){delete staende[st.id];staendeLokal();laufend=null;toast("Gut gespielt.");location.hash=home();return}
      prog.fertig=Date.now();speichern(true);seiteErgebnis(st,prog)}
    else{prog.schritt=i+1;speichern();seiteStation(st)}
    scrollTo(0,0)};
  /* „Weiter“ prüft automatisch: richtig → kurz Erfolg zeigen, dann weiter; falsch → bleiben, Rückmeldung steht da */
  let sperre=false,pause=0,letzterFehler=0,serie=0,pauseTimer=null;
  function lesePause(sek){const w=$("#weiter");if(!w)return;pause=Date.now()+sek*1000;const text=w.textContent;w.disabled=true;
    const tick=()=>{const r=Math.ceil((pause-Date.now())/1000);if(r<=0||!w.isConnected){clearInterval(pauseTimer);if(w.isConnected){w.disabled=false;w.textContent=text}return}
      w.textContent=`Erst lesen (${r})`};
    tick();pauseTimer=setInterval(tick,500);aufraeumListe.push(()=>clearInterval(pauseTimer));
    toast("Nicht raten. Lies die Aufgabe noch einmal in Ruhe.")}
  $("#weiter").onclick=()=>{if(sperre)return;
    if(frei||i in prog.punkte)return vor();
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
  aufraeumen();
    const pz=prozent(st,prog);
  const z=zeichenAus(pz);
  $("#app").innerHTML=kopf()+`
  <p class="eyebrow">Ergebnis, ${esc(st.titel)}</p>
  <div class="ergebnis result">
    <div><h1 style="margin:0 0 4px">${ich()}</h1><p class="muted" style="margin:0">${VS?"Vorschau":"Klasse "+esc(sitzung.klasse)}</p>
      <dl><dt>Punkte</dt><dd>${summe(prog)} von ${maxPunkte(st)} (${pz} %)</dd>
      <dt>Fehlversuche</dt><dd>${Object.values(prog.fehler||{}).reduce((a,b)=>a+b,0)}</dd>
      <dt>Gearbeitet</dt><dd>${zeit(prog.aktiv)}</dd>
      <dt>Fertig am</dt><dd>${new Date(prog.fertig).toLocaleString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</dd></dl></div>
    <div class="stempel"><span>Note für heute</span><span class="z note zeichen">${z}</span><span>${ZEICHEN_TEXT[z]}</span></div>
  </div>
  <p style="font-weight:700">Zeig dieses Ergebnis deiner Lehrkraft.${st.kreativ?" Die Note für Kreativität gibt die Lehrkraft.":""}</p>
  ${st.ergebnis?`<div class="block">${st.ergebnis(prog.daten)}</div>`:""}
  <div class="nav noprint"><button class="btn ghost" id="zur">Zum Lernpfad</button>${VS?"":z==="+"?`<button class="btn" id="spielen">Zum Spielplatz</button>`:`<button class="btn" id="besser">Station verbessern</button>`}</div>
  ${VS||z==="+"?"":`<p class="muted" style="margin-top:14px">Der Spielplatz öffnet nur mit einem +. Du kannst die Station noch einmal machen. Dann zählt dein neues Ergebnis.</p>`}`;
  kopfAktiv();
  if(st.nachErgebnis)st.nachErgebnis(prog.daten);
  $("#zur").onclick=()=>location.hash=home();
  if($("#besser"))$("#besser").onclick=()=>{if(!confirm("Station noch einmal von vorn machen? Dein neues Ergebnis zählt dann."))return;
    staende[st.id]={schritt:0,punkte:{},daten:{},start:Date.now(),aktiv:0,versuch:(prog.versuch||1)+1};laufend=null;staendeLokal();seiteStation(st)};
  if($("#spielen"))$("#spielen").onclick=()=>{location.hash=home();setTimeout(()=>document.querySelector(".spielplatz")?.scrollIntoView({behavior:"smooth"}),100)};
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
  $("#app").innerHTML=`<div class="top noprint"><div class="brand">${LOGO}<span>Informatik 5 · Lehrkraft</span></div><div class="row">${db.online?`<button class="link" id="lraus">Abmelden</button>`:""}<a class="link" href="#v">Stationen ansehen</a></div></div><div id="lb"><p class="muted">Lade …</p></div>`;
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
    const zellen=PFAD().map(st=>{const p=s[st.id];if(!p)return`<td class="muted c">·</td>`;const pz=prozent(st,p);
      return`<td class="c" title="${esc(st.titel)}: ${pz} %${p.fertig?"":" · Teil "+((p.schritt||0)+1)}">${p.fertig?`<span class="chip ${zeichenKlasse(zeichenAus(pz))} gross-z">${zeichenAus(pz)}</span>`:`<span class="muted small">…${pz}%</span>`}</td>`}).join("");
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
    ${kinder.length?`<table class="liste"><thead><tr><th>Tier</th><th>Vorname <span class="muted small">(nur hier)</span></th><th>Status</th>${PFAD().map((st,i)=>`<th class="c" title="${esc(st.titel)}">${i+1}<br>${st.ico}</th>`).join("")}<th></th></tr></thead><tbody>${kinder.map(zeile).join("")}</tbody></table>`
      :`<p style="margin:0">Noch keine Kinder in ${kl}. In der ersten Stunde suchen sich die Kinder selbst ein Tier aus.</p>`}
    <datalist id="dl-${esc(kl)}">${(listen[kl]||[]).filter(n=>!kinder.some(k=>namen[k.id]===n)).map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
    ${(listen[kl]||[]).length?`<p class="muted small" style="margin:10px 0 0">${kinder.filter(k=>namen[k.id]).length} von ${listen[kl].length} Kindern zugeordnet.${(()=>{const fehlt=listen[kl].filter(n=>!kinder.some(k=>namen[k.id]===n));return fehlt.length&&fehlt.length<=8?" Noch ohne Tier: "+fehlt.map(esc).join(", "):""})()}</p>`:""}
  </div>
  ${(()=>{const heute=new Date().toDateString(),zeilen=[];
    kinder.forEach(k=>{const t=tierInfo(k.tier),s=d.staende[k.id]||{};
      PFAD().forEach(st=>{const p=s[st.id];if(!p)return;
        const tag=new Date(p.fertig||p.start||0).toDateString();if(tag!==heute)return;
        const pz=prozent(st,p),z=zeichenAus(pz);
        zeilen.push({name:namen[k.id]||`${t.emoji} ${t.name}`,z,st:st.ico+" "+st.titel,pz,fertig:!!p.fertig})})});
    if(!zeilen.length)return"";
    zeilen.sort((a,b)=>a.name.localeCompare(b.name,"de"));
    return`<div class="block"><h2 style="margin-bottom:4px">Für das Notenbuch · heute</h2><p class="muted small">Zeichen aus den Punkten von heute. Wer nicht fertig wurde, bekommt das Zeichen für das, was geschafft ist.</p>
      <div class="heute">${zeilen.map(x=>`<div><span>${esc(x.name)} <span class="muted small">${esc(x.st)}</span></span><span>${x.fertig?"":`<span class="muted small">nicht fertig · </span>`}<span class="chip ${zeichenKlasse(x.z)} gross-z">${x.z}</span></span></div>`).join("")}</div></div>`})()}
  <div class="row noprint">
    <button class="btn ghost" id="druck" ${kinder.length?"":"disabled"}>Kärtchen drucken</button>
    <button class="btn ghost" id="sichern">Namensliste sichern</button><label class="btn ghost">Namensliste laden<input type="file" id="laden" accept=".json" hidden></label>
  </div>
  <details class="block plan"><summary><b>Lernpfad & Lehrplan</b> <span class="muted small">– alle ${PFAD().length} Stationen mit Bezug zum Kernlehrplan NRW</span></summary>
    <ol>${PFAD().map(st=>`<li><b>${st.ico} ${esc(st.titel)}</b> <span class="chip">${KAPITEL[st.kapitel]||""}</span><br><span class="small">${esc(st.kurz)}</span>${st.klp?`<br><span class="muted small">KLP: ${esc(st.klp)}</span>`:""}</li>`).join("")}</ol>
    <p class="muted small">Ablauf: Jede Station ist eine Doppelstunde (60 Min.). Die Kinder gehen den Lernpfad der Reihe nach, höchstens eine neue Station pro Tag. Wer früher fertig ist, darf auf den Spielplatz (Bonus-Spiele, ohne Note).</p></details>
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
  if(wahl==="1"){const P=PFAD(),st=P[parseInt(prompt(P.map((s,i)=>`${i+1} = ${s.titel}`).join("\n")),10)-1];
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
  el.style.gridTemplateColumns=`repeat(${w},1fr)`;el.style.aspectRatio=`${w}/${h}`;
  if(h<w)el.style.maxWidth=`${Math.round(340*Math.max(h/w,.5))*w/h}px`;
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
  try{const r=await fetch("version.txt?"+Date.now(),{cache:"no-store"});const v=(await r.text()).trim();
    if(!v||v===VERSION)return;
    /* höchstens ein Neuladen pro Version (sonst Schleife, solange GitHub noch die alte Seite ausliefert) */
    let schon=null;try{schon=sessionStorage.getItem("if5-neu")}catch(e){}
    if(schon===v)return;try{sessionStorage.setItem("if5-neu",v)}catch(e){}
    await hochladen();location.replace(location.pathname+"?v="+v+location.hash)}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)versionPruefen();else if(sitzung){clearTimeout(pushTimer);hochladen()}});
versionPruefen();
if("serviceWorker"in navigator&&/github\.io$/.test(location.hostname))navigator.serviceWorker.register("sw.js").catch(()=>{});
