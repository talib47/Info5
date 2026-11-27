/* =====================================================================
   Informatik 5 — eigene Stunden-Seite für Jahrgang 5 (EKG Homberg, GNDO)
   Kinder: Klasse → Tier antippen (beim ersten Mal selbst aussuchen), dann im Lernpfad die nächste Station lösen.
   Lernpfad: Stationen der Reihe nach. Wie sie öffnen, stellt die Lehrkraft pro Klasse ein (wochenweise / alle frei / eine pro Tag). Wer heute fertig ist, darf auf den Spielplatz.
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
/* Anmeldung des Kindes nur für diesen Tab: Neu laden behält sie, Tab oder Browser schließen meldet ab */
const ssGet=k=>{try{return JSON.parse(sessionStorage.getItem(k))}catch(e){return null}};
const ssSet=(k,v)=>{try{sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const ssDel=k=>{try{sessionStorage.removeItem(k)}catch(e){}};
function toast(t){document.querySelectorAll(".toast").forEach(x=>x.remove());const el=document.createElement("div");el.className="toast";el.setAttribute("role","status");el.textContent=t;document.body.append(el);setTimeout(()=>el.remove(),2400)}

/* Klassen und Stundenplan liegen in der Datenbank. Die Lehrkraft legt sie in der Lehrer-Ansicht an („+ Klasse“, „Unterricht ändern“).
   START_KLASSEN und START_PLAN sind nur der Startwert für ein Gerät, das noch nie verbunden war (und die erste Füllung der Vorschau). */
const START_KLASSEN=["5B","5D","5E"];
let KLASSEN=[...START_KLASSEN];
/* So lange öffnet „Jetzt öffnen“ von Hand */
const FREIGABE_MIN=90;

/* Stundenplan Informatik (deutsche Zeit). tag: 1=Mo … 5=Fr. Jedes Schuljahr anpassen.
   Anmelden geht PUFFER Minuten vor Beginn bis zum Ende der Stunde. Speichern geht auch danach noch.
   (Kein Puffer nach dem Ende, sonst überschneiden sich Stunden, die direkt aufeinander folgen.) */
const PUFFER=5;
/* gruppe: Halbgruppe wie im Notenbuch (1 oder 2). Steht auf den Kärtchen und ordnet die Lehrer-Ansicht. */
const START_PLAN=[
  {klasse:"5B",tag:1,von:"09:05",min:60,gruppe:1},   // 5B-1 Mo
  {klasse:"5B",tag:3,von:"11:25",min:60,gruppe:2},   // 5B-2 Mi
  {klasse:"5D",tag:3,von:"10:20",min:60,gruppe:1},   // 5D-1 Mi (laut Anmeldungen der Kinder)
  {klasse:"5D",tag:4,von:"13:40",min:60,gruppe:2},   // 5D-2 Do
  {klasse:"5E",tag:1,von:"08:00",min:60,gruppe:1},   // 5E-1 Mo
  {klasse:"5E",tag:5,von:"10:20",min:60,gruppe:2},   // 5E-2 Fr
];
let STUNDENPLAN=START_PLAN.map(x=>({...x}));
const TAGNAME=["","Montag","Dienstag","Mittwoch","Donnerstag","Freitag"];
const gruppenStunde=(kl,g)=>STUNDENPLAN.find(s=>s.klasse===kl&&s.gruppe===g);
const gruppenText=(kl,g,kurz)=>{const s=gruppenStunde(kl,g);return s?`Gruppe ${g} · ${kurz?TAGNAME[s.tag].slice(0,2):TAGNAME[s.tag]} ${s.von}`:`Gruppe ${g}`};
/* Ferien NRW 2026/27 (erster und letzter Ferientag). Bewegliche Ferientage der Schule hier ergänzen. */
const FERIEN=[["2026-12-23","2027-01-06"],["2027-03-22","2027-04-03"],["2027-05-18","2027-05-18"],["2027-07-19","2027-08-31"]];

/*@@DATEN@@*/

/* Alle Stationen tragen sich selbst hier ein (Dateien in src/stationen/) */
const STATIONEN=[];
function station(s){STATIONEN.push(s)}

/* Kapitel des Lernpfads (Reihenfolge = Reihenfolge im Schuljahr) */
const KAPITEL_NAME={fit:"Fit am Computer",netz:"Sicher im Netz",daten:"Daten und Codes",algo:"Algorithmen",ki:"Automaten und KI",ich:"Ich und meine Daten"};
const KAPITEL={fit:"🖥️ Fit am Computer",netz:"🛡️ Sicher im Netz",daten:"🔢 Daten & Codes",algo:"🤖 Algorithmen",ki:"🧠 Automaten & KI",ich:"👣 Ich & meine Daten"};
/* Ränge nach gesammelten Sternen (= Punkte aller Stationen) */
const RAENGE=[[0,"🌱","Neuling"],[150,"🖱️","Klick-Kenner"],[400,"💾","Daten-Detektiv"],[750,"🔐","Code-Knacker"],[1100,"🤖","Robo-Meister"],[1500,"🧠","Informatik-Ass"],[1900,"🏆","Informatik-Legende"]];

/* Bewertung wie im Notenbuch: + / o / − aus den Prozent der Punkte (Grenzen hier anpassen) */
const PLUS_AB=90,O_AB=70;
const zeichenAus=p=>p>=PLUS_AB?"+":p>=O_AB?"o":"−";
const ZEICHEN_TEXT={"+":"Stark gearbeitet","o":"Ordentlich, da geht mehr","−":"Das war zu wenig"};
/* Schulnote mit Tendenz, passend zu den Zeichen: + = 1+ bis 2+, o = 2 bis 3−, − = 4+ und schlechter */
const NOTEN=[[98,"1+"],[95,"1"],[92,"1−"],[90,"2+"],[86,"2"],[82,"2−"],[78,"3+"],[74,"3"],[70,"3−"],[66,"4+"],[62,"4"],[58,"4−"],[54,"5+"],[50,"5"],[45,"5−"],[0,"6"]];
const noteAus=p=>NOTEN.find(([g])=>p>=g)[1];
/* Mühe-Stern (vergibt nur die Lehrkraft): hebt die Note um eine Stufe, z. B. 3+ → 2− */
const notenIndex=p=>NOTEN.findIndex(([g])=>p>=g);
/* Lehrernote (p.lnote, z. B. "2−"): Die Lehrkraft legt die Note selbst fest. Sie ersetzt Note der App und Stern, bis sie wieder entfernt wird. */
const zeichenVonIndex=i=>i<=3?"+":i<=8?"o":"−";
/* Note – EIN Maßstab für alle (seit 23.11.2026), fertig oder nicht:
   1. Fertig: Punkte geteilt durch die Punkte der Station (bzw. das Soll, siehe SOLL_ANTEIL) – wie bisher.
   2. Nicht fertig: Punkte geteilt durch die Punkte der GANZEN Station (die Station ist die Aufgabe der Woche),
      und höchstens UNFERTIG_BESTE. So schneidet niemand, der weniger gemacht hat, besser ab als jemand, der alles gemacht hat.
   3. Mühe-Boden für ALLE gleich: Wer mindestens MUEHE_MIN Minuten wirklich an der Station gearbeitet hat, bekommt nicht
      schlechter als MUEHE_BODEN – egal ob fertig oder nicht. Wer kaum gearbeitet hat, bekommt keinen Boden.
   Nichts bearbeitet (z. B. Stunde ausgefallen): keine Note.
   Kinder sehen bei nicht fertigen Stationen keine Note; die Lehrer-Ansicht zeigt sie mit „vorl.“ (Woche läuft) bzw. „n. f.“. */
const notenStufe=n=>NOTEN.findIndex(([,x])=>x===n);
const UNFERTIG_BESTE=notenStufe("2−"),MUEHE_BODEN=notenStufe("4"),MUEHE_MIN=30;
const unfertig=p=>!p?.fertig||!!p.gestoppt;
function bewertung(st,p){
  const uf=unfertig(p),leer=!Object.keys(p?.punkte||{}).length,pz=uf?Math.min(100,Math.round(summe(p)/(maxPunkte(st)||1)*100)):prozent(st,p);
  if(uf&&leer&&!p?.lnote)return{pz,note:"–",z:"",stern:false,lehrer:false,vorl:true,leer:true};
  let i=notenIndex(pz);
  if(uf)i=Math.max(i,UNFERTIG_BESTE);
  if((p?.aktiv||0)>=MUEHE_MIN*60000)i=Math.min(i,MUEHE_BODEN);
  if(p?.stern)i=Math.max(0,i-1);
  const li=p?.lnote?NOTEN.findIndex(([,n])=>n===p.lnote):-1;if(li>=0)i=li;
  return{pz,note:NOTEN[i][1],z:zeichenVonIndex(i),stern:li<0&&!!p?.stern,lehrer:li>=0,vorl:uf&&li<0}}
const zeichenKlasse=z=>z==="+"?"good":z==="o"?"":"bad";
const zeit=ms=>{const m=Math.round((ms||0)/60000);return m<1?"unter 1 Min.":m+" Min."};
const maxPunkte=st=>st.schritte.reduce((a,s)=>a+(s.punkte||0),0);
const summe=prog=>Object.values(prog?.punkte||{}).reduce((a,b)=>a+b,0);
/* Fertige Stationen behalten ihr damaliges Maximum – kommen später Teile dazu, bleibt die alte Note gültig */
/* Soll: Bewertet wird, was das Kind bearbeitet hat – aber mindestens SOLL_ANTEIL der Station. Was bis zum Soll fehlt, zählt 0.
   So drückt eine sehr lange Station die Note nicht, Fleiß zählt trotzdem. */
const SOLL_ANTEIL=0.6;
const wertMax=(st,prog)=>{const m=prog?.fertig&&prog.erg?.max?prog.erg.max:maxPunkte(st);
  const bearb=Object.keys(prog?.punkte||{}).reduce((a,k)=>a+(st.schritte[k]?.punkte||0),0);
  return Math.min(m,Math.max(bearb,Math.ceil(m*SOLL_ANTEIL)))};
const prozent=(st,prog)=>{const m=wertMax(st,prog);return m?Math.min(100,Math.round(summe(prog)/m*100)):100};
const ABZEICHEN={"+":"🥇","o":"🥈","−":"🥉"};
const heuteTag=()=>new Date().toDateString(),tagVon=ms=>new Date(ms).toDateString();
const PFAD=()=>STATIONEN.filter(s=>!s.spiel),SPIELE=()=>STATIONEN.filter(s=>s.spiel);
const sterne=()=>PFAD().reduce((a,s)=>a+summe(meineStaende()[s.id]),0);
const rang=n=>{let r=RAENGE[0];for(const x of RAENGE)if(n>=x[0])r=x;return r};
const naechsterRang=n=>RAENGE.find(x=>x[0]>n);
/* Status einer Station im Lernpfad: fertig | offen | zu (vorherige fehlt) | morgen (noch nicht dran) | vorbei (Woche vorbei) | schluss (Stunde gleich zu Ende)
   WOCHEN-NEUSTART (seit 23.11.2026, Regel „woche“): Jede Station gehört zu genau einer Schulwoche. Nur in dieser Woche ist sie offen –
   ohne Rücksicht darauf, ob die Station davor fertig ist. Danach ist sie zu („vorbei“); was nicht fertig wurde, bekommt die
   vorläufige (gnädige) Note, die die Kinder nicht sehen. Fällt die Stunde in einer Woche aus, bleibt die Station ohne Note,
   und nächste Woche geht es mit der nächsten Station weiter – alle Klassen bleiben im gleichen Takt.
   Schalter der Lehrkraft: false = zu; true = offen (eine alte Station wieder öffnen oder die nächste früher – früher nur,
   wenn die Station davor fertig ist). */
const wocheVon=(rg,i)=>{const ab=stAb(rg.start);return{von:ab[i]||null,bis:ab[i+1]||null}};
/* Schalter der Lehrkraft (klassen.stationen): Schlüssel "id" = ganze Klasse, "id@1" / "id@2" = nur Gruppe 1 / 2 (Gruppe geht vor).
   Werte: false = zu · true = offen (auch eine alte Station noch einmal) · "frueh" = die nächste Station schon vor ihrer Woche;
   "frueh" läuft von selbst aus: Ist ihre Woche da, gilt der Plan; danach geht es im normalen Takt weiter. */
const schalterFuer=(st,id,g)=>{const a=g?st?.[id+"@"+g]:undefined;return a!==undefined?a:st?.[id]};
/* Gruppe des Kindes = Gruppe der Stunde, die gerade läuft (laut Stundenplan, mit Vorlauf). Außerhalb der Stunde: keine. */
const aktuelleGruppe=kl=>{const b=berlin();const x=STUNDENPLAN.find(s=>s.klasse===kl&&s.tag===b.tag&&b.min>=hm(s.von)-PUFFER&&b.min<hm(s.von)+s.min);return x?.gruppe||0};
const inWoche=(rg,i)=>{if(rg.modus!=="woche")return true;const {von,bis}=wocheVon(rg,i),h=isoTag(new Date());return!!von&&von<=h&&(!bis||h<bis)};
function status(st){
  const s=meineStaende(),p=s[st.id];
  if(p?.fertig&&!p.gestoppt)return"fertig";   // per Zeitstopp beendet (bis 23.11.2026) = nicht fertig
  if(VS||st.spiel)return"offen";
  const pfad=PFAD(),i=pfad.indexOf(st),rg=regelVon(sitzung?.klasse),schalter=schalterFuer(rg.stationen,st.id,aktuelleGruppe(sitzung?.klasse)),vor=i>0?s[pfad[i-1].id]:null;
  if(schalter===false)return p?"vorbei":"morgen";
  if(rg.modus==="woche"){
    const {von}=wocheVon(rg,i),h=isoTag(new Date()),jetzt=inWoche(rg,i);
    const frueh=schalter==="frueh"&&!!von&&von>h;
    if(!jetzt&&schalter!==true&&!frueh)return von&&von>h?"morgen":"vorbei";
    if(!jetzt&&von&&von>h&&i>0&&unfertig(vor))return"zu";   // früher geöffnet: erst die Station davor
    return stoppZeit()?"schluss":"offen";
  }
  /* Regeln „frei“ und „tag“ (nur für neue Klassen denkbar): der Reihe nach */
  if(i>0&&unfertig(vor))return p?"offen":"zu";
  if(stoppZeit())return"schluss";
  if(p||schalter===true)return"offen";
  if(rg.modus==="tag"&&vor?.fertig&&tagVon(vor.fertig)===heuteTag()&&tagVon(vor.start||vor.fertig)===heuteTag())return"morgen";
  return"offen";
}
/* Der Spielplatz ist die Belohnung für gute Arbeit: Er öffnet nur, wenn die Station von heute ein + hat (Schnell-Durchklicken lohnt sich nicht). */
const heuteFertig=()=>PFAD().filter(s=>{const p=meineStaende()[s.id];return p?.fertig&&!p.gestoppt&&tagVon(p.fertig)===heuteTag()});
const plusHeute=()=>heuteFertig().some(s=>bewertung(s,meineStaende()[s.id]).z==="+");
/* Gespielt wird für alle gleichzeitig: erst in den letzten SPIEL_MIN Minuten der Stunde. Davor: Note verbessern. */
const SPIEL_MIN=10;
function spielAb(){ /* Uhrzeit (Minuten) ab der der Spielplatz heute öffnet – null, wenn gerade keine Stunde laut Plan läuft */
  if(!sitzung)return null;const b=berlin();
  const s=STUNDENPLAN.find(x=>x.klasse===sitzung.klasse&&x.tag===b.tag&&b.min>=hm(x.von)-PUFFER&&b.min<hm(x.von)+x.min+15);
  return s?hm(s.von)+s.min-SPIEL_MIN:null}
const uhr=m=>`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
const spielZeit=()=>{const a=spielAb();return a===null||berlin().min>=a};
const spielplatzOffen=()=>VS||(plusHeute()&&spielZeit());
/* Schluss-Stopp: STOPP_MIN Minuten vor Ende der Stunde wird jede angefangene Station PAUSIERT (seit 23.11.2026):
   Der Stand wird gespeichert, es gibt KEINE Note. Nächste Stunde macht das Kind dort weiter; die Note kommt erst, wenn es fertig ist.
   (Bis 23.11.2026 wurde die Station hier beendet und benotet – das war ungerecht für Kinder, die spät angefangen hatten.)
   Danach in dieser Stunde kein Weiterarbeiten, kein neuer Anfang und kein Verbessern mehr. Ein laufendes Verbessern wird abgeschlossen (Punkte steigen nur). */
const STOPP_MIN=5;
function stoppAb(){
  if(!sitzung)return null;const b=berlin();
  const s=STUNDENPLAN.find(x=>x.klasse===sitzung.klasse&&x.tag===b.tag&&b.min>=hm(x.von)-PUFFER&&b.min<hm(x.von)+x.min+15);
  return s?hm(s.von)+s.min-STOPP_MIN:null}
const stoppZeit=()=>{if(VS||!sitzung)return false;const a=stoppAb();return a!==null&&berlin().min>=a};
function stoppPruefen(){
  if(!stoppZeit())return;
  if(laufend&&!laufend.st.spiel&&!staende[laufend.st.id]&&Object.keys(laufend.prog.punkte||{}).length)staende[laufend.st.id]=laufend.prog;
  let neu=0,pausiert=0;
  for(const st of PFAD()){const p=staende[st.id];if(!p)continue;
    if(p.verb){delete p.verb;p.verbessert=Date.now();p.erg={...p.erg,p:summe(p),z:zeichenAus(prozent(st,p))}}
    else if(!p.fertig&&!(p.pause&&tagVon(p.pause)===heuteTag())&&status(st)!=="vorbei"){p.pause=Date.now();pausiert++}
    else continue;
    neu++;pushWarte.add(st.id)}
  if(!neu)return;
  staendeLokal();clearTimeout(pushTimer);hochladen();
  toast(pausiert?"Die Stunde ist gleich vorbei. Dein Stand ist gespeichert.":"Die Zeit ist um.");
  if(!location.hash.includes("s/spiel"))render();
}
/* Welche Teile einer fertigen Station lassen sich verbessern? (nur Teile aus dem eigenen Durchgang, bei denen Punkte fehlen) */
const verbesserbar=(st,p)=>p?.fertig&&!p.gestoppt&&!p.lnote&&!stoppZeit()&&(VS||inWoche(regelVon(sitzung?.klasse),PFAD().indexOf(st))||(()=>{const rg=regelVon(sitzung?.klasse),v=schalterFuer(rg.stationen,st.id,aktuelleGruppe(sitzung?.klasse)),von=wocheVon(rg,PFAD().indexOf(st)).von;
    return v===true||(v==="frueh"&&!!von&&von>isoTag(new Date()))})())?st.schritte.map((_,k)=>k).filter(k=>k in (p.punkte||{})&&p.punkte[k]<st.schritte[k].punkte):[];
const kartenHinweis=()=>{const a=spielAb(),kann=heuteFertig().some(x=>verbesserbar(x,meineStaende()[x.id]).length);
  return(a!==null?`Der Spielplatz öffnet um <b>${uhr(a)} Uhr</b>. `:"")+(kann?"Bis dahin kannst du deine Note noch verbessern: Tippe unten im Lernpfad auf deine Station von heute.":"")};
/* Aufräumen beim Verlassen eines Teils (z. B. Tastatur-Abhörer, Zeitgeber) */
let aufraeumListe=[];
function aufraeumen(){aufraeumListe.forEach(f=>{try{f()}catch(e){}});aufraeumListe=[]}

/* ---------- Sitzung des Kindes ---------- */
/* Alte Versionen hatten die Anmeldung dauerhaft gespeichert: nur übernehmen, wenn die Stunde gerade läuft */
(()=>{const alt=lsGet("if5-sitzung");if(alt&&!ssGet("if5-sitzung")&&planOffen(alt.klasse)){ssSet("if5-sitzung",alt);ssSet("if5-staende",lsGet("if5-staende")||{})}
  lsDel("if5-sitzung");lsDel("if5-staende")})();
let sitzung=ssGet("if5-sitzung");      // {klasse, tier, token} – nur in diesem Tab
let staende=ssGet("if5-staende")||{};  // {stationId: prog}
let laufend=null;                      // {st, prog}
/* Lehrer-Vorschau (#v): alle Stationen und Teile frei durchklicken, nichts wird gespeichert */
let VS=false,vStaende={};
const basis=()=>VS?"v/":"",home=()=>VS?"v":"";
const meineStaende=()=>VS?vStaende:staende;

function staendeLokal(){ssSet("if5-staende",staende)}
/* Spielplatz-Statistik: zählt leise mit (Starts, Zeit, Rekord). Liegt als eigener Stand „spielplatz“ beim Kind.
   Die Lehrkraft sieht sie nur auf Wunsch (aufklappbar), sie hat nichts mit der Note zu tun. */
let vSpiel={spiele:{}};
function spielStat(id,f){
  const p=VS||!sitzung?vSpiel:(staende.spielplatz=staende.spielplatz||{spiele:{}});p.spiele=p.spiele||{};
  const g=p.spiele[id]=p.spiele[id]||{n:0,ms:0};f(g);
  if(VS||!sitzung)return;
  staendeLokal();pushWarte.add("spielplatz");clearTimeout(pushTimer);pushTimer=setTimeout(hochladen,4000)}
const spielRekord=id=>((VS||!sitzung?vSpiel:staende.spielplatz)?.spiele?.[id]?.best)??null;
/* Ein Spiel meldet sein Ergebnis. klein=true: weniger ist besser (z. B. Züge). Gibt true zurück bei neuem Rekord. */
function rekord(id,wert,klein){let neu=false;spielStat(id,g=>{g.runden=(g.runden||0)+1;if(!klein&&wert<=0)return;if(g.best==null||(klein?wert<g.best:wert>g.best)){neu=g.best!=null;g.best=wert}});return neu}
let pushTimer=null,pushWarte=new Set();
/* ---------- Lernzeit-Karten: Abgabe der Lösungswörter ----------
   Die Karte liegt auf Papier. Das Kind tippt in der nächsten Informatik-Stunde seine Lösungswörter ein.
   Gespeichert wird nur „abgegeben am“ als eigener Stand „lernzeit“ (wie der Spielplatz), keine Note.
   Die Wörter stehen nur als Prüfsumme im Code, damit niemand sie im Quelltext liest. */
const lzNorm=w=>String(w||"").trim().toUpperCase().replace(/\s+/g,"").replace(/Ä/g,"AE").replace(/Ö/g,"OE").replace(/Ü/g,"UE").replace(/ß/g,"SS");
const lzHash=w=>{let h=2166136261;for(const c of lzNorm(w)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h.toString(36)};
/* Erzeugt mit dem Karten-Programm (python3 lz.py --hash N). f: welche Aufgabe, Wort oder Zahl. */
const LERNZEIT={
"01":{titel:"Maus- und Tasten-Profi",f:[["Aufgabe 1","Wort"],["Aufgabe 3","Wort"]],w:["1cyhppb","3s8y0r"]},
"02":{titel:"Was steckt im Computer?",f:[["Aufgabe 1","Zahl"],["Aufgabe 2","Wort"]],w:["1iu4cqi","1ns75ha"]},
"03":{titel:"Ordnung im Computer",f:[["Aufgabe 1","Wort"],["Aufgabe 2","Zahl"]],w:["91vwd6","kzvamd"]},
"04":{titel:"Tipp-Training",f:[["Aufgabe 1","Wort"],["Aufgabe 2","Zahl"]],w:["13vsdn1","1ez1x1n"]},
"05":{titel:"Passwort-Werkstatt",f:[["Aufgabe 1","Zahl"],["Aufgabe 2","Wort"]],w:["15i2l20","bgxngy"]},
"06":{titel:"Echt oder Fake?",f:[["Aufgabe 1","Wort"],["Aufgabe 2","Zahl"]],w:["1517obi","13u1te7"]},
"07":{titel:"Nett im Netz",f:[["Aufgabe 1","Wort"],["Aufgabe 2","Zahl"]],w:["1rxlka4","159hnjj"]},
"08":{titel:"Pixel-Werkstatt",f:[["Aufgabe 1","Wort"],["Aufgabe 2","Zahl"]],w:["b3sywn","11pcryb"]},
"09":{titel:"Geheimsprache Binär",f:[["Aufgabe 1","Zahl"],["Aufgabe 3","Wort"]],w:["15vzeev","182vlxw"]},
"10":{titel:"Geheimschrift",f:[["Aufgabe 1","Wort"],["Aufgabe 2","Wort"]],w:["nfqf6t","1qr6gul"]},
"11":{titel:"Algorithmen im Alltag",f:[["Aufgabe 1","Zahl"],["Aufgabe 2","Wort"]],w:["n8ok35","12zo62c"]},
"12":{titel:"Robo-Labyrinth",f:[["Aufgabe 1","Wort"],["Aufgabe 2","Zahl"]],w:["h0d9qx","12tb6q7"]},
"13":{titel:"Schleifen-Profi",f:[["Aufgabe 1","Zahl"],["Aufgabe 2","Zahl"]],w:["b1mtmh","13nv4eq"]},
"14":{titel:"Suchen und Sortieren",f:[["Aufgabe 1","Wort"],["Aufgabe 2","Zahl"]],w:["127uwdj","tixyvq"]},
"15":{titel:"Automaten überall",f:[["Aufgabe 1","Zahl"],["Aufgabe 2","Wort"]],w:["zyockl","xxv1dn"]},
"16":{titel:"Wie lernt eine KI?",f:[["Aufgabe 1","Wort"],["Aufgabe 2","Zahl"]],w:["7rexkp","cg56bw"]},
"17":{titel:"Meine Daten-Spuren",f:[["Aufgabe 1","Zahl"],["Aufgabe 2","Wort"]],w:["cezz86","1sjdn12"]},
};
/* Wochenplan der Lernzeit-Karten: Karte 01 in der Woche ab LZ_START, danach jede Schulwoche eine neue Karte.
   Ab dem Montag ihrer Woche kann eine Karte abgegeben werden, danach bleibt sie offen.
   Schulwoche = mindestens 3 Schultage Mo–Fr außerhalb der FERIEN (kurze Wochen vor und nach Weihnachten zählen nicht).
   In der Vorschau (Lehrer) sind alle Karten offen. */
const LZ_START="2026-11-16";
const isoTag=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
/* Montage der Schulwochen ab start (Datum „JJJJ-MM-TT“, ein Montag): die ersten n Stück */
function schulWochen(start,n){const ferien=t=>FERIEN.some(([a,b])=>t>=a&&t<=b),ab=[];
  const d=new Date(start+"T12:00:00");
  for(let w=0;w<120&&ab.length<n;w++,d.setDate(d.getDate()+7)){
    let schule=0;for(let k=0;k<5;k++){const t=new Date(d);t.setDate(d.getDate()+k);if(!ferien(isoTag(t)))schule++}
    if(schule>=3)ab.push(isoTag(d))}
  return ab}
const LZ_AB=(()=>{const nrs=Object.keys(LERNZEIT).sort(),w=schulWochen(LZ_START,nrs.length),ab={};nrs.forEach((n,i)=>ab[n]=w[i]);return ab})();
/* Wie die Stationen öffnen: pro Klasse, eingestellt in der Lehrer-Ansicht, gespeichert in der Datenbank (Tabelle pfad_regeln).
   modus "woche" = Station 1 in der Woche ab start, danach jede Schulwoche eine (gleiche Regel wie bei den Karten)
   modus "frei"  = alle offen (immer der Reihe nach)
   modus "tag"   = höchstens eine NEUE Station pro Tag
   Klassen ohne Eintrag: STANDARD_REGEL. Das Kind bekommt die Regel beim Anmelden; sie wird auf dem Gerät zwischengespeichert. */
const ST_START="2026-11-16";   // Station 1 = Woche ab 16.11.2026 (auf Talibs Wunsch vom 23.11.: diese Woche Station 2)
const STANDARD_REGEL={modus:"woche",start:ST_START};
const MODI={woche:"wochenweise ab Startwoche",frei:"alle frei",tag:"eine pro Tag"};
const regelOk=r=>!!r&&(r.modus==="frei"||r.modus==="tag"||(r.modus==="woche"&&/^\d{4}-\d\d-\d\d$/.test(r.start||"")));
let REGELN={};   // {klasse: {modus,start}} – kommt mit dem Plan aus der Datenbank
const regelVon=kl=>{const r=kl&&REGELN[kl];return regelOk(r)?r:STANDARD_REGEL};
const stAb=(()=>{const c={};return start=>c[start]||(c[start]=schulWochen(start,PFAD().length))})();
/* Datum auf den Montag seiner Woche setzen */
const montagVon=iso=>{const d=new Date(iso+"T12:00:00");d.setDate(d.getDate()-((d.getDay()+6)%7));return isoTag(d)};
/* Plan = {klassen:[{klasse,modus,start}], plan:[{klasse,tag,von,min,gruppe}]} – aus der Datenbank, auf dem Gerät zwischengespeichert */
function planAnwenden(p){if(!p||!Array.isArray(p.klassen)||!Array.isArray(p.plan))return false;
  const alt=JSON.stringify([KLASSEN,STUNDENPLAN,REGELN]);
  KLASSEN=p.klassen.map(k=>k.klasse).sort((a,b)=>a.localeCompare(b,"de",{numeric:true}));
  STUNDENPLAN=p.plan.map(x=>({klasse:x.klasse,tag:+x.tag,von:String(x.von).slice(0,5),min:+x.min,gruppe:x.gruppe==null?0:+x.gruppe}));
  REGELN={};p.klassen.forEach(k=>REGELN[k.klasse]={modus:k.modus,start:k.start||null,stationen:k.stationen||{}});
  return JSON.stringify([KLASSEN,STUNDENPLAN,REGELN])!==alt}
planAnwenden(lsGet("if5-plan"));
async function planLaden(){
  let p;try{p=await db.plan()}catch(e){return}   // keine Verbindung: zuletzt bekannter Plan bleibt
  if(!p||!Array.isArray(p.klassen))return;lsSet("if5-plan",p);
  if(planAnwenden(p)&&!laufend&&!location.hash.startsWith("#lehrer")&&!/^#?(v\/)?s\//.test(location.hash))render()}
const lzOffen=nr=>VS||!LZ_AB[nr]||LZ_AB[nr]<=isoTag(new Date());
const LZ_VERSUCHE=3;
let vLern={karten:{}};
const lernStand=()=>VS||!sitzung?vLern:(staende.lernzeit=staende.lernzeit||{karten:{}});
function lernAbgeben(nr,woerter){
  if(!lzOffen(nr))return"zu";
  const k=LERNZEIT[nr],p=lernStand();p.karten=p.karten||{};const e=p.karten[nr]=p.karten[nr]||{};
  if(e.am)return"schon";
  const heute=new Date().toDateString();if(e.tag!==heute){e.tag=heute;e.falsch=0}
  if(e.falsch>=LZ_VERSUCHE)return"gesperrt";
  const ok=k.w.every((h,i)=>lzHash(woerter[i])===h);
  if(ok){e.am=Date.now();delete e.falsch;delete e.tag}else e.falsch=(e.falsch||0)+1;
  if(!VS&&sitzung){staendeLokal();pushWarte.add("lernzeit");clearTimeout(pushTimer);pushTimer=setTimeout(hochladen,ok?0:1500)}
  return ok?"ok":e.falsch>=LZ_VERSUCHE?"gesperrt":"falsch";
}
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
  /* Solange etwas nicht beim Server angekommen ist: sichtbar machen und eine Notkopie auf diesem PC behalten */
  document.body.dataset.offline=pushWarte.size?"1":"";
  if(pushWarte.size)notkopie();else lsDel("if5-ungesendet");
}
function notkopie(){if(!sitzung||!pushWarte.size)return;const s={};pushWarte.forEach(id=>{if(staende[id])s[id]=staende[id]});
  const alt=lsGet("if5-ungesendet")||[];const rest=alt.filter(x=>!(x.klasse===sitzung.klasse&&x.tier===sitzung.tier));
  rest.push({klasse:sitzung.klasse,tier:sitzung.tier,staende:s,zeit:Date.now()});lsSet("if5-ungesendet",rest.slice(-12))}
const weiterAls=(a,b)=>!b||(!!a.fertig&&!b.fertig)||Object.keys(a.punkte||{}).length>Object.keys(b.punkte||{}).length;
function rauswurf(t){notkopie();sitzung=null;staende={};laufend=null;ssDel("if5-sitzung");ssDel("if5-staende");toast(t);location.hash="";render()}

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
setInterval(stoppPruefen,15000);

/* Aktive Zeit messen (nur wenn die Seite sichtbar ist) */
let tick=Date.now();
setInterval(()=>{const n=Date.now(),d=Math.min(n-tick,15000);tick=n;
  if(laufend&&!laufend.st.spiel&&!document.hidden&&!laufend.prog.fertig){laufend.prog.aktiv=(laufend.prog.aktiv||0)+d;speichern()}},10000);

/* ---------- Seiten ---------- */
/* Safari auf iPad/iPhone vergrößert bei schnellem Doppeltippen auf Text oder Bilder trotzdem manchmal.
   Darum: zweites Tippen kurz nach dem ersten nicht als Zoom-Geste durchlassen – außer auf Knöpfen und Eingabefeldern,
   damit dort schnelles Tippen (z. B. zweimal +) weiter zählt. */
let letzteBeruehrung=0;
document.addEventListener("touchend",e=>{const t=Date.now();
  if(t-letzteBeruehrung<400&&e.touches.length===0&&!e.target.closest("button,a,input,textarea,select,label,summary"))e.preventDefault();
  letzteBeruehrung=t},{passive:false});
document.addEventListener("dblclick",e=>{if(!e.target.closest("input,textarea"))e.preventDefault()},{passive:false});

/* lehrer.html = dieselbe App, aber als eigene Startbildschirm-App für Lehrkräfte (eigenes Manifest): öffnet die Lehrer-Ansicht */
const LEHRER_SEITE=/\/lehrer\.html$/.test(location.pathname);
if(LEHRER_SEITE&&!location.hash)history.replaceState(null,"",location.pathname+location.search+"#lehrer");
function render(){
  aufraeumen();
  document.body.dataset.seite=location.hash.startsWith("#lehrer")?"lehrer":"kind";
  if(ONLINE.url&&/github\.io$/.test(location.hostname)&&!db.online){$("#app").innerHTML=`<div class="msg no">Die Verbindung zur Datenbank konnte nicht geladen werden. Lade die Seite neu. Wenn das nicht hilft, sag deiner Lehrkraft Bescheid.</div>`;return}
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
PIX.schlange=["0000000","1110000","0010000","0011100","0000100","0100111","0000000"];
PIX.jagd=["0011100","0100010","1001001","1011101","1001001","0100010","0011100"];
PIX.memory=["1110111","1010101","1110111","0000000","1110111","1010111","1110111"];
PIX.ball=["0011100","0110110","1101011","1011101","1101011","0110110","0011100"];
PIX.lampen=["0011100","0111110","0111110","0111110","0011100","0011100","0001000"];
const pix=(id,px=28,kl="")=>{const m=PIX[id]||PIX.pixel;
  return`<svg class="pix ${kl}" width="${px}" height="${px}" viewBox="0 0 7 7" aria-hidden="true" shape-rendering="crispEdges">${m.map((r,y)=>[...r].map((c,x)=>c==="1"?`<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="currentColor"/>`:"").join("")).join("")}</svg>`};
const LOGO=pix("logo",26,"blau");
const ich=()=>{if(VS)return"Lehrkraft";const t=tierInfo(sitzung.tier);return`${t.emoji} ${esc(t.name)}`};
const kopf=()=>`<div class="top noprint"><div class="brand">${LOGO}<span>Informatik 5</span></div>${VS?`<div class="row"><span class="who">Vorschau für Lehrkräfte</span><a class="link" href="#lehrer">Zur Lehrer-Ansicht</a></div>`:sitzung?`<div class="row"><span class="who">${ich()}, ${esc(sitzung.klasse)}</span><button class="link" id="raus">Abmelden</button></div>`:""}</div>`;
function kopfAktiv(){const b=$("#raus");if(b)b.onclick=async()=>{
  if(!confirm("Abmelden? Dein Stand ist gespeichert."))return;
  clearTimeout(pushTimer);await hochladen();notkopie();try{await db.abmelden(sitzung.token)}catch(e){}
  sitzung=null;staende={};laufend=null;ssDel("if5-sitzung");ssDel("if5-staende");location.hash="";render()}}
const vorschauHinweis=()=>db.online?"":`<p class="muted small" style="margin-top:18px">Vorschau: Alles wird nur in diesem Browser gespeichert.</p>`;

/* 1. Klasse wählen */
/* Ist genau eine Klasse gerade offen (der Normalfall nach Stundenplan), geht es direkt zu ihren Tieren. */
/* ---------- Startseite der Kinder (auch der Link auf IServ) ----------
   Klassen als Karten mit Status. Ist gerade keine Stunde, gibt es statt „zu“ die nächsten Stunden und eine Vorschau auf den Lernpfad. */
const TAGKURZ=["","Mo","Di","Mi","Do","Fr"];
function naechsteKurz(klasse){   // {wann:"heute"|"morgen"|"Mo 23.11.", von:"09:05", gruppe} – nächste Stunde laut Plan (ohne Ferien)
  for(let d=0;d<28;d++){const ms=Date.now()+d*864e5,b=berlin(ms);
    if(FERIEN.some(([v,z])=>b.datum>=v&&b.datum<=z))continue;
    const s=STUNDENPLAN.filter(x=>x.klasse===klasse&&x.tag===b.tag&&(d>0||hm(x.von)+x.min>b.min)).sort((a,c)=>hm(a.von)-hm(c.von))[0];
    if(s)return{wann:d===0?"heute":d===1?"morgen":`${TAGKURZ[s.tag]} ${b.datum.slice(8)}.${b.datum.slice(5,7)}.`,von:s.von,gruppe:s.gruppe}}
  return null}
const grussText=()=>{const h=berlin().min/60;return h<11?"Guten Morgen":h<17?"Hallo":"Guten Abend"};
const datumHeute=()=>new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"});
function pfadVorschau(){const P=PFAD();if(!P.length)return"";
  return`<details class="block pfad-vorschau"><summary><b>Was dich erwartet</b> <span class="muted small">· ${P.length} Stationen, eine nach der anderen</span></summary>
    ${Object.keys(KAPITEL).filter(k=>P.some(st=>st.kapitel===k)).map(k=>`<p class="eyebrow" style="margin:14px 0 6px">${esc(KAPITEL_NAME[k])}</p>
      <div class="pv-reihe">${P.filter(st=>st.kapitel===k).map(st=>`<div class="pv-st">${pix(st.id,34)}<span>${esc(st.titel)}</span></div>`).join("")}</div>`).join("")}
    <p class="muted small" style="margin:12px 0 0">Die Stationen öffnest du in deiner Informatik-Stunde. Für jede gibt es ein Abzeichen 🥇🥈🥉.</p></details>`}
async function seiteKlasse(direkt=true){
  let offen=[];try{offen=await db.offeneKlassen()}catch(e){}
  if(direkt&&offen.length===1)return seiteTier(offen[0]);
  document.body.dataset.seite="kompakt";
  const karten=[...KLASSEN].sort((a,b)=>(offen.includes(b)-offen.includes(a))).map(k=>{const auf=offen.includes(k),n=auf?null:naechsteKurz(k);
    return`<button class="kl-karte${auf?" auf":""}" data-k="${esc(k)}"><span class="kl-name">${esc(k)}</span>
      <span class="kl-status">${auf?`<i class="punkt"></i>jetzt offen`:n?`nächste Stunde<br><b>${esc(n.wann)} ${esc(n.von)}</b>`:"kein Unterricht eingetragen"}</span></button>`}).join("");
  $("#app").innerHTML=kopf()+`
  <div class="plate"><p class="eyebrow">${grussText()} · ${esc(datumHeute())}</p>
    <h1>${offen.length?"In welche Klasse gehst du?":"Gerade ist keine Informatik-Stunde"}</h1>
    ${offen.length?"":`<p style="margin:6px 0 0">Hier siehst du, wann es weitergeht. Anmelden kannst du dich ${PUFFER} Minuten vor deiner Stunde.</p>`}</div>
  <div class="kl-karten">${karten}</div>
  ${pfadVorschau()}${vorschauHinweis()}`;
  document.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>seiteTier(b.dataset.k));
}

/* 2. Tier wählen (oder neu anlegen) */
async function seiteTier(klasse){
  document.body.dataset.seite="kind";
  $("#app").innerHTML=kopf()+`<button class="link" id="zur">Andere Klasse</button>
  <div class="plate"><p class="eyebrow">Klasse ${esc(klasse)}</p><h1>Welches Tier bist du?</h1></div><div id="liste"><p class="muted">Einen Moment …</p></div>`;
  $("#zur").onclick=()=>seiteKlasse(false);
  let r;try{r=await db.tiere(klasse)}catch(e){$("#liste").innerHTML=`<div class="msg no">Keine Verbindung. Versuch es gleich noch mal.</div><button class="btn ghost" id="neu" style="margin-top:12px">Noch mal</button>`;$("#neu").onclick=()=>seiteTier(klasse);return}
  if(!r.offen){document.body.dataset.seite="kompakt";
    const gr=[...new Set(STUNDENPLAN.filter(x=>x.klasse===klasse).map(x=>x.gruppe||0))].sort();
    const zeilen=gr.map(g=>{const z=STUNDENPLAN.filter(x=>x.klasse===klasse&&(x.gruppe||0)===g).sort((a,b)=>a.tag-b.tag||hm(a.von)-hm(b.von));
      return`<div class="zu-zeile"><b>${g?"Gruppe "+g:"Unterricht"}</b><span>${z.map(x=>`${TAGNAME[x.tag]} ${x.von}`).join(" und ")}</span></div>`}).join("");
    const n=naechsteKurz(klasse);
    const h1=document.querySelector(".plate h1");if(h1)h1.textContent=n?`Weiter geht es ${n.wann} um ${n.von} Uhr`:"Gerade ist keine Stunde";
    $("#liste").innerHTML=`<div class="block zu-box"><p class="muted" style="margin:0 0 12px">Anmelden kannst du dich ${PUFFER} Minuten vor deiner Informatik-Stunde.</p>${zeilen}
      <div class="row" style="margin-top:14px"><button class="btn" id="neu">Noch mal schauen</button></div></div>${pfadVorschau()}`;
    $("#neu").onclick=()=>seiteTier(klasse);return}
  /* Auf diesem PC war zuletzt dieses Tier angemeldet: groß vorschlagen (die meisten sitzen am selben Platz) */
  const zl=lsGet("if5-zuletzt"),zt=zl&&zl.klasse===klasse&&r.liste.find(x=>x.tier===zl.tier&&!x.besetzt);
  $("#liste").innerHTML=(zt?`<div class="block vorschlag"><span class="e">${tierInfo(zt.tier).emoji}</span><div><p class="eyebrow">Letztes Mal an diesem Platz</p><h2 style="margin:0">Bist du ${artikel(zt.tier)} ${esc(zt.tier)}?</h2></div><button class="btn" id="dasbinich">Ja, das bin ich</button></div><p class="muted" style="margin:6px 2px 10px">Nein? Dann tippe auf dein Tier:</p>`:"")+
    (r.liste.length?`<div class="tiere">${r.liste.map(x=>{const t=tierInfo(x.tier);
    return`<button class="tier${x.besetzt?" zu":""}" data-t="${esc(x.tier)}" ${x.besetzt?"disabled":""}><span class="e">${t.emoji}</span><span>${esc(t.name)}</span>${x.besetzt?`<span class="chip">besetzt</span>`:""}</button>`}).join("")}</div>
    <p class="muted small" style="margin-top:12px">Dein Tier ist grau? Dann sag sofort deiner Lehrkraft Bescheid.</p>`:`<p class="muted">In dieser Klasse gibt es noch keine Tiere.</p>`)+
    `<p class="muted" style="margin-top:16px">Du hast noch kein Tier oder weißt es nicht mehr? Frag deine Lehrkraft.</p><div id="m"></div>`;
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
  if(r.token){sitzung={klasse,tier,token:r.token};ssSet("if5-sitzung",sitzung);lsSet("if5-zuletzt",{klasse,tier});staende=r.staende||{};
    /* Liegt auf diesem PC noch ein nicht gesendeter Stand von diesem Tier? Dann jetzt nachreichen. */
    const un=(lsGet("if5-ungesendet")||[]).find(x=>x.klasse===klasse&&x.tier===tier);
    if(un){Object.entries(un.staende).forEach(([id,p])=>{if(weiterAls(p,staende[id])){staende[id]=p;pushWarte.add(id)}});
      lsSet("if5-ungesendet",(lsGet("if5-ungesendet")||[]).filter(x=>x!==un&&!(x.klasse===klasse&&x.tier===tier)));setTimeout(hochladen,500)}
    staendeLokal();toast(`Hallo ${t.name}!`);ssSet("if5-lz-erinnern",1);location.hash="";render();planLaden();return}
  const T={besetzt:"Dieses Tier ist schon an einem anderen Platz angemeldet. Sag deiner Lehrkraft Bescheid.",zu:"Die Klasse ist gerade geschlossen.",
    unbekannt:"Dieses Tier gibt es nicht mehr.",vergeben:"Dieses Tier hat sich gerade jemand anderes genommen. Such dir ein anderes aus.",voll:"Die Klasse ist voll. Sag deiner Lehrkraft Bescheid.",netz:"Keine Verbindung. Versuch es noch mal."};
  const m=$("#m");m.className="msg no";m.textContent=T[r.fehler]||"Das hat nicht geklappt.";m.scrollIntoView({block:"center",behavior:"smooth"});
  if(r.fehler==="netz")nochmal();else if(r.fehler==="vergeben"||r.fehler==="besetzt")setTimeout(nochmal,2500);
}

function seiteStart(){
  const s=meineStaende(),pfad=PFAD(),fertig=pfad.filter(x=>!unfertig(s[x.id])).length;
  const n=sterne(),[,,rName]=rang(n),nr=naechsterRang(n);
  /* Oben steht die Station der Woche: die neueste offene, noch nicht fertige Station. Ältere offene, nicht fertige = Nachholen. */
  const offenUnfertig=VS?[]:pfad.filter(x=>unfertig(s[x.id])&&status(x)==="offen");
  const akt=offenUnfertig[offenUnfertig.length-1]||pfad.find(x=>unfertig(s[x.id])&&status(x)!=="vorbei");
  const nachholen=offenUnfertig.filter(x=>x!==akt);
  const stAkt=akt?status(akt):null,spOffen=spielplatzOffen();
  const spielListe=`<div class="spiele">${SPIELE().map(x=>`<button class="spiel" data-sp="${x.id}">${pix(x.id,24)}<b>${esc(x.titel)}</b>${spielRekord(x.id)!=null?`<span class="rek" title="Dein Rekord">★ ${spielRekord(x.id)}</span>`:""}</button>`).join("")}</div>`;
  /* Oben steht genau eine Sache: die Station von heute – oder, wenn sie geschafft ist, der Spielplatz als Belohnung */
  const heute=VS?"":!akt?`<div class="heute-karte">${pix("pixel",56,"blau")}<div><p class="eyebrow">Alles geschafft</p><h2>Du hast alle ${pfad.length} Stationen geschafft.</h2><p class="muted">Starke Leistung. Der Spielplatz gehört dir.</p></div></div>`
    :stAkt==="schluss"?`<div class="heute-karte">${pix(akt.id,56)}<div><p class="eyebrow">Gleich ist Schluss</p><h2>Die Stunde ist gleich vorbei.</h2><p class="muted">${spOffen?"Du hast heute ein + geschafft und darfst spielen. ":""}Dein Stand ist gespeichert. Gut gemacht für heute!</p></div></div>`
    :stAkt==="morgen"&&!heuteFertig().length?`<div class="heute-karte">${pix(akt.id,56)}<div><p class="eyebrow">Gleich geht es weiter</p><h2>Deine nächste Station ist noch zu.</h2><p class="muted">„${esc(akt.titel)}“ öffnet bald. Wenn du willst, kannst du eine fertige Station unten im Lernpfad verbessern.</p></div></div>`
    :stAkt==="morgen"?`<div class="heute-karte">${pix(akt.id,56)}<div><p class="eyebrow">Für heute fertig</p><h2>Deine Station ist geschafft.</h2><p class="muted">${spOffen?"Du hast ein + geschafft und darfst spielen.":plusHeute()?kartenHinweis():stoppZeit()?"Die Stunde ist gleich vorbei.":"Für den Spielplatz brauchst du ein +. Du kannst deine Station verbessern: Tippe sie unten im Lernpfad an."} Nächste Stunde geht es weiter mit „${esc(akt.titel)}“</p></div></div>`
    :`<button class="heute-karte" data-id="${akt.id}">${pix(akt.id,56,"blau")}<div><p class="eyebrow">${s[akt.id]?"Hier machst du weiter":"Deine Station heute"}</p><h2>${esc(akt.titel)}</h2><p class="muted">${esc(akt.kurz)}</p></div><span class="btn">${s[akt.id]?"Weitermachen":"Anfangen"}</span></button>`;
  const nachholBox=VS||!nachholen.length?"":`<div class="nachholen"><b>Wieder offen</b> <span class="muted small">Deine Lehrkraft hat diese Station noch einmal geöffnet.</span><div class="nh-liste">${nachholen.map(x=>`<button class="nh" data-id="${x.id}">${pix(x.id,20)}<span>${pfad.indexOf(x)+1}. ${esc(x.titel)}</span>${s[x.id]?`<small>angefangen</small>`:""}</button>`).join("")}</div></div>`;
  const spielplatz=VS?`<h2 style="margin:28px 0 6px">Spielplatz</h2><p class="muted">Bonus-Spiele ohne Note. Kinder sehen sie erst, wenn die Station von heute geschafft ist.</p><div class="spielplatz">${spielListe}</div>`
    :spOffen?`<div class="spielplatz"><h2>Spielplatz</h2><p class="muted">Deine Belohnung für heute. Hier gibt es keine Note.</p>${spielListe}</div>`:"";
  let kap="";
  const liste=pfad.map((x,i)=>{const p=s[x.id],stt=status(x);
    const kopf=x.kapitel!==kap?(kap=x.kapitel,`<li class="kap">${KAPITEL_NAME[x.kapitel]||""}</li>`):"";
    const bw=p?.fertig&&!p.gestoppt?bewertung(x,p):null,z=bw?.z;
    const rechts=stt==="fertig"?`<span class="stand">${bw.stern?"⭐ ":""}${bw.note}</span><span class="stempel-k" title="Note ${z}">${z}</span>`
      :stt==="offen"?`<span class="stand">${VS?"":!inWoche(regelVon(sitzung?.klasse),i)?(p?"angefangen":"extra offen"):p?"angefangen":"diese Woche dran"}</span>`
      :stt==="vorbei"?`<span class="stand muted">${p?"Woche vorbei":"–"}</span>`:stt==="schluss"?`<span class="stand">nächste Stunde</span>`:stt==="morgen"?`<span class="stand muted">kommt noch</span>`:"";
    return`${kopf}<li><button class="pfad ${stt}" data-id="${x.id}"><span class="nr">${i+1}</span>${pix(x.id,28)}<span class="ptitel"><b>${esc(x.titel)}</b><small>${esc(x.kurz)}</small></span>${rechts}</button></li>`}).join("");
  $("#app").innerHTML=kopf()+`
  ${VS?`<div class="plate"><h1>Alle Stationen ansehen</h1><p>So sehen die Kinder ihren Lernpfad. In der Vorschau ist alles offen, und du kannst jeden Teil frei anklicken. Nichts wird gespeichert.</p><button class="btn ghost" id="vreset">Vorschau zurücksetzen</button></div>`
    :`<div class="gruss"><span>Hallo <b>${ich()}</b></span><span><b>${n}</b> Punkte, <b>${fertig}</b> von ${pfad.length} Stationen, Rang <b>${rName}</b></span></div>`}
  ${heute}
  ${nachholBox}
  ${VS?"":spielplatz}
  ${lernBlock()}
  <h2 style="margin:8px 0 0">${VS?"Lernpfad":"Dein Lernpfad"}</h2>
  <ol class="lernpfad">${liste}</ol>
  ${VS?spielplatz:spOffen||!akt||plusHeute()||stoppZeit()?"":`<p class="spielplatz zu-hinweis">Der Spielplatz öffnet sich am Ende der Stunde, wenn du deine Station von heute mit einem + schaffst.</p>`}
  <p class="muted small" style="margin-top:22px">Version ${VERSION}</p>`;
  if(!VS&&!spOffen&&plusHeute()){const t=setInterval(()=>{if(spielplatzOffen()){clearInterval(t);toast("Der Spielplatz ist jetzt offen.");render()}},20000);aufraeumListe.push(()=>clearInterval(t))}
  kopfAktiv();
  document.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>{const x=STATIONEN.find(y=>y.id===b.dataset.id),stt=status(x);
    if(stt==="zu")return toast("Schaff zuerst die Station davor.");
    if(stt==="vorbei")return toast("Diese Woche ist vorbei. Jetzt ist eine neue Station dran.");
    if(stt==="morgen")return toast("Diese Station ist noch nicht dran.");
    if(stt==="schluss")return toast("Die Stunde ist gleich vorbei. Nächste Stunde geht es weiter.");
    location.hash=basis()+"s/"+x.id});
  document.querySelectorAll("[data-sp]").forEach(b=>b.onclick=()=>location.hash=basis()+"s/"+b.dataset.sp);
  if($("#vreset"))$("#vreset").onclick=()=>{vStaende={};laufend=null;vLern={karten:{}};seiteStart();toast("Vorschau zurückgesetzt")};
  lernBinden();
  if(!VS&&ssGet("if5-lz-erinnern")){ssDel("if5-lz-erinnern");lernErinnern()}
}
/* Nach dem Anmelden: freundlich an die Lernzeit-Karte erinnern – nur wenn eine offene Karte noch nicht abgegeben ist.
   Einmal pro Anmeldung. „Hab ich nicht dabei“ schließt; abgeben geht weiter unten auf der Seite. */
function lernErinnern(){
  const p=lernStand().karten||{},offen=Object.keys(LERNZEIT).sort().filter(lzOffen).filter(n=>!p[n]?.am).reverse();
  if(!offen.length||stoppZeit())return;
  let nr=offen[0];const dlg=document.createElement("dialog");dlg.className="lz-dlg";document.body.append(dlg);
  const zeigen=()=>{dlg.innerHTML=`<div class="lz-dlg-bild" aria-hidden="true"><span>${nr}</span></div>
    <h2>Hast du deine Lernzeit-Karte dabei?</h2>
    <p class="muted">Tippe ein, was in deinem Lösungsfeld steht. Das dauert nur eine Minute.</p>
    ${offen.length>1?`<label class="lz-dlg-wahl">Karte <select id="dlzk">${offen.map(n=>`<option value="${n}" ${n===nr?"selected":""}>${n} · ${esc(LERNZEIT[n].titel)}</option>`).join("")}</select></label>`:`<p class="lz-dlg-titel"><b>Karte ${nr}</b> · ${esc(LERNZEIT[nr].titel)}</p>`}
    <div class="lz-dlg-felder">${lernFelder(nr).replace(/class="lzw/g,'class="dlzw')}</div>
    <div id="dlzm"></div>
    <div class="lz-dlg-knoepfe"><button class="btn ghost" id="dlzspaeter">Hab ich nicht dabei</button><button class="btn" id="dlzab">Abgeben</button></div>`;
    if($("#dlzk"))$("#dlzk").onchange=()=>{nr=$("#dlzk").value;zeigen()};
    const los=()=>{const w=[...dlg.querySelectorAll(".dlzw")].map(x=>x.value),m=$("#dlzm");
      if(w.some(x=>!x.trim())){m.className="msg no";m.textContent=w.length===1?"Tippe deine Lösung ein.":"Füll alle Felder aus.";return}
      const r=lernAbgeben(nr,w),e=(lernStand().karten||{})[nr]||{};
      if(r==="ok"){dlg.close();dlg.remove();toast(`Super! Karte ${nr} ist abgegeben.`);seiteStart();return}
      m.className="msg no";m.textContent=r==="gesperrt"?`Das waren ${LZ_VERSUCHE} falsche Versuche. Schau morgen noch mal auf deine Karte.`
        :`${w.length===1?"Das stimmt noch nicht.":"Mindestens eine Lösung stimmt noch nicht."} Schau auf deine Karte. Noch ${LZ_VERSUCHE-(e.falsch||0)} ${LZ_VERSUCHE-(e.falsch||0)===1?"Versuch":"Versuche"} heute.`};
    $("#dlzab").onclick=los;dlg.querySelectorAll(".dlzw").forEach(x=>x.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();los()}});
    $("#dlzspaeter").onclick=()=>{dlg.close();dlg.remove()};
    const f=dlg.querySelector(".dlzw");if(f)setTimeout(()=>f.focus(),50)};
  dlg.addEventListener("cancel",()=>dlg.remove());zeigen();dlg.showModal()}
function lernBlock(){
  const p=lernStand().karten||{},nrs=Object.keys(LERNZEIT).sort().filter(lzOffen),offen=nrs.filter(n=>!p[n]?.am),fertig=nrs.filter(n=>p[n]?.am);
  return`<div class="lz-block" id="lz">
    <div class="lz-kopf"><div><h2 style="margin:0">Lernzeit-Karte abgeben</h2><p class="muted small" style="margin:2px 0 0">Hast du eine Karte fertig? Tippe ein, was in deinem Lösungsfeld steht.</p></div>
      ${fertig.length?`<p class="lz-fertig small">Abgegeben: ${fertig.map(n=>`<span class="lz-chip">${n} ✓</span>`).join(" ")}</p>`:""}</div>
    ${offen.length?`<div class="lz-form"><label>Karte <select id="lzk">${offen.map(n=>`<option value="${n}">${n} · ${esc(LERNZEIT[n].titel)}</option>`).join("")}</select></label>
      <span id="lzf" class="lz-felder">${lernFelder(offen[0])}</span>
      <button class="btn" id="lzab">Abgeben</button></div><div id="lzm"></div>`:`<p class="muted small" style="margin:8px 0 0">Alle Karten, die es gerade gibt, sind abgegeben.</p>`}
  </div>`}
/* Eingabefelder passend zur Karte: so viele wie im Lösungsfeld, beschriftet wie auf dem Blatt */
const lernFelder=nr=>LERNZEIT[nr].f.map(([a,art],i)=>`<label>${art} aus ${a} <input type="text" class="lzw${art==="Zahl"?" zahl":""}" data-i="${i}" ${art==="Zahl"?'inputmode="numeric" maxlength="6"':'maxlength="20"'} autocomplete="off" spellcheck="false"></label>`).join("");
function lernBinden(){
  const b=$("#lzab");if(!b)return;
  const binde=()=>document.querySelectorAll(".lzw").forEach(x=>x.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();los()}});
  $("#lzk").onchange=()=>{$("#lzf").innerHTML=lernFelder($("#lzk").value);$("#lzm").className="";$("#lzm").textContent="";binde()};
  const los=()=>{const nr=$("#lzk").value,w=[...document.querySelectorAll(".lzw")].map(x=>x.value),m=$("#lzm");
    if(w.some(x=>!x.trim())){m.className="msg no";m.textContent=w.length===1?"Tippe deine Lösung ein.":"Füll alle Felder aus.";return}
    const r=lernAbgeben(nr,w),e=(lernStand().karten||{})[nr]||{};
    if(r==="ok"){toast(`Karte ${nr} abgegeben.`);seiteStart();return}
    m.className="msg no";
    m.textContent=r==="gesperrt"?`Das waren ${LZ_VERSUCHE} falsche Versuche. Schau morgen noch mal auf deine Karte und such den Fehler.`
      :`${w.length===1?"Das stimmt noch nicht.":"Mindestens eine Lösung stimmt noch nicht."} Schau auf deine Karte. Noch ${LZ_VERSUCHE-(e.falsch||0)} ${LZ_VERSUCHE-(e.falsch||0)===1?"Versuch":"Versuche"} heute.`};
  b.onclick=los;binde();
}

function seiteStation(st){
  aufraeumen();
  const stt=status(st);
  if(stt==="zu"||stt==="morgen"||stt==="schluss"||stt==="vorbei"){location.hash=home();return}
  if(st.spiel&&!spielplatzOffen()){toast(plusHeute()?"🔒 Der Spielplatz öffnet erst am Ende der Stunde.":"🔒 Der Spielplatz öffnet, wenn du heute deine Station mit + geschafft hast.");location.hash=home();return}
  const frei=VS||!!st.spiel;   // frei: „Weiter“ geht immer (Vorschau und Spielplatz)
  if(st.spiel){if(!laufend||laufend.st!==st)spielStat(st.id,g=>g.n++);
    const t0=Date.now();aufraeumListe.push(()=>spielStat(st.id,g=>g.ms=(g.ms||0)+Math.min(Date.now()-t0,20*60000)))}
  if(!laufend||laufend.st!==st){
    const prog=meineStaende()[st.id]||{schritt:0,punkte:{},daten:{},start:Date.now(),aktiv:0};
    laufend={st,prog};
  }
  const {prog}=laufend;
  /* Per Zeitstopp beendet (bis 23.11.2026): wieder aufmachen. Punkte bleiben, weiter beim ersten offenen Teil. */
  if(prog.gestoppt&&!VS&&!prog.lnote){delete prog.fertig;delete prog.erg;delete prog.gestoppt;prog.fortgesetzt=Date.now();
    const offenK=st.schritte.findIndex((_,k)=>!(k in prog.punkte));prog.schritt=offenK<0?st.schritte.length-1:offenK}
  /* Verbessern-Modus (prog.verb): Die Station bleibt fertig, das Kind macht nur die Teile mit Punktverlust noch einmal.
     Punkte können dabei nur steigen. vb={offen:[Teile],punkte:{},fehler:{},schritt} */
  const vb=prog.verb||null;
  if(prog.fertig&&!vb)return seiteErgebnis(st,prog);
  const i=Math.min(vb?vb.schritt:prog.schritt,st.schritte.length-1),sch=st.schritte[i];
  const erledigt=k=>vb?(!vb.offen.includes(k)||k in vb.punkte):k in prog.punkte;
  const fk=vb?(vb.fehler=vb.fehler||{}):(prog.fehler=prog.fehler||{});
  const geloest=erledigt(i);
  const rest=st.schritte.map((_,k)=>k).filter(k=>k!==i&&!erledigt(k)).length;
  $("#app").innerHTML=`
  <div class="leiste noprint"><button class="haus" id="haus" title="Zur Übersicht – dein Stand bleibt gespeichert" aria-label="Zur Übersicht"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 9.5 10 3l7 6.5M5 8v9h4v-5h2v5h4V8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg><span>Übersicht</span></button><div class="wo">${pix(st.id,22)}<span>${esc(st.titel)}</span></div><span>Teil ${i+1} von ${st.schritte.length}${vb?` · <b>Note verbessern</b>`:""}</span>${st.spiel?`<span class="pts">Spielplatz, ohne Note</span>`:`<span class="pts">${summe(prog)} Punkte</span>`}</div>
  <div class="steps noprint springen">${st.schritte.map((_,k)=>{const darf=VS||(vb?vb.offen.includes(k):k in prog.punkte||k<=(prog.weitester||0));
    return`<i class="${k===i&&!erledigt(k)?"now":erledigt(k)?"ok":""}${k===i?" hier":""}${darf?"":" zu"}"${darf?` data-sp="${k}" title="Zu Teil ${k+1}"`:""}></i>`}).join("")}</div>
  ${sch.art?`<p class="art"><i></i>${esc(sch.art)}</p>`:""}<h1>${esc(sch.titel)}</h1>
  ${sch.merke?`<div class="aha merke"><b>Merke</b> ${sch.merke}</div>`:""}
  <div id="body"></div>
  <div id="hilfe"></div>
  <div class="nav noprint">
    <button class="btn ghost pfeil" id="zur">${vb?"Zum Ergebnis":i===0?"Zum Lernpfad":"Zurück"}</button>
    <button class="btn pfeil" id="weiter">${(VS||st.spiel?i===st.schritte.length-1:rest===0)?"Fertig":"Weiter"}</button>
  </div>`;
  if(!vb)prog.weitester=Math.max(prog.weitester||0,i);
  kopfAktiv();
  /* Übersicht: jederzeit zurück zum Lernpfad (z. B. für die Lernzeit-Wörter). Der Stand ist gespeichert; Fortsetzen über die Station. */
  $("#haus").onclick=()=>{if(Object.keys(prog.punkte||{}).length||vb)speichern(true);location.hash=home()};
  prog.daten[i]=prog.daten[i]||{};
  /* Hilfe-Kasten: nach 3 Fehlversuchen ein Schubs, nach 6 (oder 6 Minuten am selben Teil) darf man überspringen */
  const hilfeBox=mitSkip=>{const h=$("#hilfe");if(!h||VS||erledigt(i))return;
    h.innerHTML=`<div class="hilfe-box"><b>Kurz durchatmen.</b> ${sch.tipp||"Lies die Aufgabe oben noch einmal langsam, Wort für Wort. Schau dir das Beispiel und den Merke-Kasten an."} Kommst du trotzdem nicht weiter? <b>Heb die Hand.</b> Fragen ist schlau, nicht peinlich.
      ${mitSkip?`<div class="skip-zeile">Du hast es oft versucht. Das ist okay. <button class="btn ghost" id="skip">Diesen Teil überspringen</button><span class="muted small">Dafür gibt es keine Punkte. Du kannst den Teil später noch einmal machen.</span></div>`:""}</div>`;
    if(mitSkip)$("#skip").onclick=()=>{if(erledigt(i))return;
      if(vb)vb.punkte[i]=0;else{prog.punkte[i]=0;prog.skip=prog.skip||{};prog.skip[i]=1}
      speichern(true);toast("Übersprungen. Weiter geht es mit dem nächsten Teil.");vor()};
    h.scrollIntoView({block:"nearest",behavior:"smooth"})};
  if(!frei&&!geloest){const t=setTimeout(()=>hilfeBox(true),6*60000);aufraeumListe.push(()=>clearTimeout(t))}
  const ctx={
    daten:prog.daten[i],
    geloest,
    speichern:()=>speichern(),
    /* Ein falscher Versuch kostet 1 Punkt, aber höchstens die Hälfte der Punkte dieses Teils (bis 18.11.2026: 2 Punkte) */
    fehler(){fk[i]=(fk[i]||0)+1;speichern();aufgabeZeigen();
      if(fk[i]>=6)hilfeBox(true);else if(fk[i]%3===0)hilfeBox(false);
      /* Raten erkennen: zwei falsche Versuche innerhalb weniger Sekunden → kurze Lese-Pause statt weiterem Raten */
      const jetzt=Date.now();serie=jetzt-letzterFehler<7000?serie+1:1;letzterFehler=jetzt;
      if(serie>=2&&!frei){serie=0;lesePause(15)}},
    geschafft(p){if(!erledigt(i)){const f=fk[i]||0;p=Math.max(Math.ceil(p/2),p-f);
        if(vb){vb.punkte[i]=p;if(p>(prog.punkte[i]||0)){prog.punkte[i]=p;if(prog.skip)delete prog.skip[i]}
          prog.erg={...prog.erg,p:summe(prog),z:zeichenAus(prozent(st,prog))}}
        else prog.punkte[i]=p;
        speichern(true);const h=$("#hilfe");if(h)h.innerHTML="";
        if(p>0)toast(`Geschafft, +${p} Punkte`);
        $(".pts").textContent=`${summe(prog)} Punkte`;
        $(".steps").children[i].className="ok";
        if(!frei)setTimeout(()=>{if(!sperre)autoWeiter()},0)}   // Teil von selbst gelöst (nicht über „Weiter“): gleich automatisch weiter
      ctx.geloest=true},
    pruefer:null,   // Teil setzt hier eine Prüf-Funktion (true = richtig); „Weiter“ ruft sie auf
    loesung:null,   // Teil setzt hier eine Funktion, die die Lösung zeigt (Lehrer-Vorschau)
    beimVerlassen:f=>aufraeumListe.push(f),
  };
  window._ctx=ctx;   // für automatische Tests
  sch.zeige($("#body"),ctx);
  rundenBeobachten($("#body"));
  if(VS&&ctx.loesung){$("#body").insertAdjacentHTML("beforebegin",`<button class="btn ghost noprint" id="loesung" style="margin:0 0 14px;min-height:40px;padding:6px 14px">Lösung zeigen (nur Vorschau)</button>`);
    $("#loesung").onclick=()=>{ctx.loesung();$("#loesung").remove()}}
  const geheZu=k=>{if(vb)vb.schritt=k;else prog.schritt=k;speichern();seiteStation(st);scrollTo(0,0)};
  const endeVerb=()=>{delete prog.verb;prog.verbessert=Date.now();prog.erg={...prog.erg,p:summe(prog),z:zeichenAus(prozent(st,prog))};speichern(true);seiteErgebnis(st,prog);scrollTo(0,0)};
  document.querySelectorAll("[data-sp]").forEach(x=>x.onclick=()=>geheZu(+x.dataset.sp));
  $("#zur").onclick=()=>{if(vb)return endeVerb();if(i===0){location.hash=home()}else geheZu(i-1)};
  const naechster=()=>{const n=st.schritte.length;for(let k=i+1;k<n;k++)if(!erledigt(k))return k;for(let k=0;k<i;k++)if(!erledigt(k))return k;return -1};
  const vor=()=>{
    if(vb){const k=naechster();return k<0?endeVerb():geheZu(k)}
    if(!frei){const k=naechster();if(k>=0)return geheZu(k)}
    if(frei?i===st.schritte.length-1:true){
      if(st.spiel){delete staende[st.id];staendeLokal();laufend=null;toast("Gut gespielt.");location.hash=home();return}
      prog.fertig=Date.now();prog.erg={p:summe(prog),max:maxPunkte(st),z:zeichenAus(prozent(st,prog)),f:Object.values(prog.fehler||{}).reduce((a,b)=>a+b,0)};speichern(true);seiteErgebnis(st,prog)}
    else{prog.schritt=i+1;speichern();seiteStation(st)}
    scrollTo(0,0)};
  /* „Weiter“ prüft automatisch: richtig → kurz Erfolg zeigen, dann weiter; falsch → bleiben, Rückmeldung steht da */
  let sperre=false,pause=0,letzterFehler=0,serie=0,pauseTimer=null;
  /* Automatisch weiter (seit 26.11.2026): Ist ein Teil gelöst, zählt „Weiter“ 5 Sekunden herunter und geht dann von selbst weiter.
     Tippt oder klickt das Kind in der Aufgabe, stoppt der Countdown – der Knopf pulsiert aber weiter. */
  function autoWeiter(){const w=$("#weiter");if(!w||sperre)return;const text=w.disabled?(w.dataset.text||"Weiter"):w.textContent;let n=5,t=null;
    const stop=()=>{clearInterval(t);if(w.isConnected){w.textContent=text}};
    w.classList.add("puls");if(!w.disabled)w.textContent=`${text} (${n})`;
    t=setInterval(()=>{if(!w.isConnected)return clearInterval(t);if(w.disabled)return;   // Lese-Pause läuft: erst danach zählen
      n--;if(n<=0){clearInterval(t);w.textContent=text;w.click()}else w.textContent=`${text} (${n})`},1000);
    const b=$("#body");const halt=()=>{stop();b?.removeEventListener("pointerdown",halt);b?.removeEventListener("keydown",halt)};
    b?.addEventListener("pointerdown",halt);b?.addEventListener("keydown",halt);aufraeumListe.push(()=>clearInterval(t))}
  function lesePause(sek){const w=$("#weiter");if(!w)return;pause=Date.now()+sek*1000;const text=w.textContent.replace(/ \(\d+\)$/,"");w.dataset.text=text;w.disabled=true;
    const tick=()=>{const r=Math.ceil((pause-Date.now())/1000);if(r<=0||!w.isConnected){clearInterval(pauseTimer);if(w.isConnected){w.disabled=false;w.textContent=text}return}
      w.textContent=`Erst lesen (${r})`};
    tick();pauseTimer=setInterval(tick,500);aufraeumListe.push(()=>clearInterval(pauseTimer));
    toast("Nicht raten. Lies die Aufgabe noch einmal in Ruhe.")}
  $("#weiter").onclick=()=>{if(sperre)return;
    if(frei||erledigt(i))return vor();
    if(ctx.pruefer){if(ctx.pruefer()){sperre=true;setTimeout(vor,900)}else aufgabeZeigen();return}
    toast("Löse zuerst diesen Teil.");aufgabeZeigen()};
}

/* Runden-Wechsel deutlich machen (seit 26.11.2026): Viele Teile haben mehrere Runden („Auftrag 2 von 4“).
   Springt die Zahl hoch, erscheint kurz „✓ Geschafft – jetzt Auftrag 2 von 4“, die neue Aufgabe gleitet herein und leuchtet kurz blau.
   Neben „… von N“ stehen kleine Punkte für die Runden. Funktioniert für alle Teile, ohne sie einzeln anzufassen. */
function rundenBeobachten(b){if(!b)return;let letzte=null;
  const pruefen=()=>{const e=[...b.querySelectorAll(".eyebrow")].find(x=>/\b(\d+) von (\d+)\b/.test(x.textContent));
    if(!e){return}const [,a,n]=e.textContent.match(/\b(\d+) von (\d+)\b/).map(Number);
    if(!e.querySelector(".r-punkte")&&n<=12)e.insertAdjacentHTML("beforeend",` <span class="r-punkte" aria-hidden="true">${Array.from({length:n},(_,k)=>`<i class="${k<a-1?"ok":k===a-1?"jetzt":""}"></i>`).join("")}</span>`);
    if(letzte!==null&&a>letzte){const was=e.textContent.replace(/\s*$/,"").trim();
      const fr=[...b.querySelectorAll(".frage")].filter(x=>x.offsetParent)[0];
      /* ruhig (27.11.): kleines „✓ Geschafft“ in derselben Zeile, nichts verschiebt sich; die neue Aufgabe wird sanft hinterlegt */
      e.insertAdjacentHTML("beforeend",`<span class="r-geschafft" role="status">✓ Geschafft</span>`);
      [e,fr].forEach(x=>{if(!x)return;x.classList.remove("runde-neu");void x.offsetWidth;x.classList.add("runde-neu")});
      const r=e.getBoundingClientRect();if(r.top<60||r.top>innerHeight*.6)e.scrollIntoView({block:"center",behavior:"smooth"})}
    letzte=a};
  pruefen();const mo=new MutationObserver(()=>{mo.disconnect();pruefen();mo.observe(b,{childList:true,subtree:true})});
  mo.observe(b,{childList:true,subtree:true});aufraeumListe.push(()=>mo.disconnect())}

/* „Lies hier!“ (seit 26.11.2026): Bei einem falschen Versuch oder „Weiter“ ohne Lösung leuchtet die Aufgabenstellung kurz auf –
   die letzte Frage (.frage) im Teil, sonst der Text oben (.regel). Fett gedruckte Wörter darin springen kurz größer.
   Höchstens alle 4 Sekunden, damit es beim schnellen Klicken nicht flackert. */
let lesHierZeit=0;
function aufgabeZeigen(){if(Date.now()-lesHierZeit<4000)return;lesHierZeit=Date.now();setTimeout(lesHier,30)}   // nach dem Neuzeichnen des Teils
function lesHier(){const b=$("#body");if(!b)return;
  const fr=[...b.querySelectorAll(".frage")].filter(x=>x.offsetParent),z=fr[fr.length-1]||b.querySelector(".regel");if(!z)return;
  z.classList.remove("lies-hier");void z.offsetWidth;z.classList.add("lies-hier");
  const r=z.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight-90)z.scrollIntoView({block:"center",behavior:"smooth"});
  setTimeout(()=>z.classList.remove("lies-hier"),2600)}

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
  const bw=bewertung(st,prog),z=bw.z,offen=VS?[]:verbesserbar(st,prog);
  const teile=offen.length===1?"den einen Teil":`die ${offen.length} Teile`;
  $("#app").innerHTML=kopf()+`
  <p class="eyebrow">Ergebnis, ${esc(st.titel)}</p>
  <div class="ergebnis result">
    <div><h1 style="margin:0 0 4px">${ich()}</h1><p class="muted" style="margin:0">${VS?"Vorschau":"Klasse "+esc(sitzung.klasse)}</p>
      <dl><dt>Punkte</dt><dd>${summe(prog)} von ${wertMax(st,prog)} (${bw.pz} %)</dd>
      <dt>Fehlversuche</dt><dd>${Object.values(prog.fehler||{}).reduce((a,b)=>a+b,0)}</dd>
      <dt>Gearbeitet</dt><dd>${zeit(prog.aktiv)}</dd>
      <dt>Fertig am</dt><dd>${new Date(prog.fertig).toLocaleString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</dd></dl></div>
    <div class="stempel"><span>Note für heute</span><span class="z note zeichen">${z}</span><span class="note16">Note ${bw.note}</span><span>${ZEICHEN_TEXT[z]}</span></div>
  </div>
  ${prog.gestoppt&&!bw.lehrer?`<div class="msg info stern-msg">Die Zeit war um. Deine Note zählt, was du bis dahin geschafft hast.</div>`:""}
  ${bw.lehrer?`<div class="msg info stern-msg">Diese Note hat deine Lehrkraft festgelegt.</div>`:""}
  ${bw.stern?`<div class="msg ok stern-msg">⭐ Deine Lehrkraft hat gesehen, wie viel Mühe du dir gegeben hast. Darum ist deine Note eine Stufe besser.</div>`:""}
  <p style="font-weight:700">Zeig dieses Ergebnis deiner Lehrkraft.${st.kreativ?" Die Note für Kreativität gibt die Lehrkraft.":""}</p>
  ${st.ergebnis?`<div class="block">${st.ergebnis(prog.daten)}</div>`:""}
  ${!VS&&z==="+"&&!spielZeit()&&spielAb()!==null?`<div class="msg info" style="margin:0 0 14px">Der Spielplatz öffnet um <b>${uhr(spielAb())} Uhr</b>.</div>`:""}
  ${VS?"":offen.length?`<p class="muted" style="margin:0 0 14px">${z==="+"?"":"Der Spielplatz öffnet nur mit einem +. "}Du kannst deine Note verbessern: Du machst nur ${teile} noch einmal, bei denen du Punkte verloren hast. Deine Punkte können dabei nur mehr werden.</p>`
    :z==="+"?"":`<p class="muted" style="margin:0 0 14px">Der Spielplatz öffnet nur mit einem +.</p>`}
  <div class="nav noprint"><button class="btn ghost" id="zur">Zum Lernpfad</button>${offen.length?`<button class="btn${z==="+"&&spielZeit()?" ghost":""}" id="besser">Note verbessern</button>`:""}${!VS&&z==="+"&&spielZeit()?`<button class="btn" id="spielen">Zum Spielplatz</button>`:""}</div>
  `;
  kopfAktiv();
  if(st.nachErgebnis)st.nachErgebnis(prog.daten);
  $("#zur").onclick=()=>location.hash=home();
  if($("#besser"))$("#besser").onclick=()=>{
    if(!prog.erst)prog.erst={p:summe(prog),pz:bw.pz};   // erstes Ergebnis merken – die Lehrkraft sieht „vorher → jetzt“
    prog.daten=prog.daten||{};offen.forEach(k=>{prog.daten[k]={}});
    prog.verb={offen,punkte:{},fehler:{},schritt:offen[0]};prog.versuch=(prog.versuch||1)+1;
    laufend={st,prog};speichern(true);seiteStation(st);scrollTo(0,0)};
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

/* Namen: lokal merken und (online) verschlüsselt beim Lehrer-Konto sichern, damit sie auf jedem Gerät da sind */
let namenTimer=null,namenStand="";
function namenMerken(){lsSet("if5-namen",namen);lsSet("if5-listen",listen);clearTimeout(namenTimer);
  namenTimer=setTimeout(async()=>{try{if(await db.lGeheimSpeichern({namen,listen}))namenStand="gesichert"}catch(e){namenStand="fehler"}},800)}
async function namenHolen(){
  try{const g=await db.lGeheimLaden();if(g){namen={...(g.namen||{}),...namen};listen={...(g.listen||{}),...listen};lsSet("if5-namen",namen);lsSet("if5-listen",listen);namenStand="gesichert"}
    else if(db.online&&db.hatSchluessel()&&(Object.keys(namen).length||Object.keys(listen).length))namenMerken()}
  catch(e){namenStand="fehler"}
  try{const u=await db.lUebergabeHolen();
    if(u){namen={...namen,...(u.namen||{})};listen={...listen,...(u.listen||{})};lsSet("if5-namen",namen);lsSet("if5-listen",listen);
      if(await db.lGeheimSpeichern({namen,listen})){await db.lUebergabeLoeschen();namenStand="gesichert"}}}
  catch(e){namenStand="fehler"}}

async function seiteLehrer(){
  laufend=null;clearInterval(lTimer);
  if(!(await db.lSitzung()))return lehrerLogin();
  document.body.dataset.seite="lehrer";
  $("#app").innerHTML=`<div class="top noprint"><div class="brand">${LOGO}<span>Informatik 5, Lehrkraft</span></div><div class="row kopf-links"><a class="link" href="#v">Stationen ansehen</a>${db.online?`<button class="link" id="lraus">Abmelden</button>`:""}</div></div><div id="lb"><p class="muted">Lade …</p></div>`;
  if($("#lraus"))$("#lraus").onclick=async()=>{await db.lAbmelden();seiteLehrer()};
  if(db.online&&!lPlanGesendet){try{await db.lPlanUebertragen();lPlanGesendet=true}catch(e){toast("Stundenplan konnte nicht übertragen werden")}}
  await namenHolen();
  await lehrerLaden();
  lTimer=setInterval(()=>{if(location.hash==="#lehrer"&&!document.hidden&&!document.activeElement?.matches("input"))lehrerLaden()},20000);
}

/* Notenverteilung von heute als Kreis (nur fertige Stationen, ganze Noten 1–6) */
const N_FARBEN=["#1B7A3E","#58A55C","#E2B93B","#E8833A","#D24B3E","#8E2A2A"];
function notenKreis(liste){if(!liste.length)return"";
  const n=[0,0,0,0,0,0];liste.forEach(no=>n[parseInt(no)-1]++);
  const R=15.9155,U=100;let pos=0;
  const teile=n.map((a,i)=>{if(!a)return"";const l=a/liste.length*U,t=`<circle r="${R}" cx="21" cy="21" fill="none" stroke="${N_FARBEN[i]}" stroke-width="7" stroke-dasharray="${l} ${U-l}" stroke-dashoffset="${25-pos}"/>`;pos+=l;return t}).join("");
  const schnitt=(liste.reduce((a,no)=>a+parseInt(no),0)/liste.length).toFixed(1).replace(".",",");
  return`<div class="nkreis"><svg viewBox="0 0 42 42" width="96" height="96" aria-hidden="true">${teile}<text x="21" y="20" text-anchor="middle" class="nk-z">${schnitt}</text><text x="21" y="26.5" text-anchor="middle" class="nk-t">Schnitt</text></svg>
    <ul>${n.map((a,i)=>a?`<li><i style="background:${N_FARBEN[i]}"></i><b>${a}×</b> Note ${i+1}</li>`:"").join("")}</ul></div>`}

function noteDialog(kid,st,p,name){
  let dlg=$("#ndlg");if(!dlg){dlg=document.createElement("dialog");dlg.id="ndlg";document.body.append(dlg)}
  const auto=bewertung(st,{...p,lnote:null});
  dlg.innerHTML=`<h2>Note festlegen</h2>
    <p class="muted" style="margin:4px 0 14px">${esc(name)} · ${esc(st.titel)}<br>Note der App: <b>${auto.note}</b> (${auto.pz} %)${p.fertig?"":" · Station noch nicht fertig"}</p>
    <div class="ngrid">${NOTEN.map(([,n])=>`<button class="nbtn${p.lnote===n?" an":""}" data-n="${n}">${n}</button>`).join("")}</div>
    <p class="small muted" style="margin:14px 0">Deine Note ersetzt die Note der App. Das Kind kann sie nicht mehr verändern.${p.fertig?"":" Die Station gilt damit als abgeschlossen."}</p>
    <div class="row" style="justify-content:space-between">${p.lnote?`<button class="btn ghost" data-n="">Wieder Note der App</button>`:"<span></span>"}<button class="btn ghost" id="nzu">Abbrechen</button></div>`;
  dlg.querySelector("#nzu").onclick=()=>dlg.close();
  dlg.querySelectorAll("[data-n]").forEach(b=>b.onclick=async()=>{const n=b.dataset.n;
    try{await db.lProg(kid,st.id,pr=>{
        if(!n){delete pr.lnote;return}
        pr.lnote=n;delete pr.verb;pr.punkte=pr.punkte||{};
        const pu=Object.values(pr.punkte).reduce((a,x)=>a+x,0),z=zeichenVonIndex(NOTEN.findIndex(([,x])=>x===n));
        if(!pr.fertig){pr.fertig=Date.now();pr.erg={p:pu,max:maxPunkte(st),z,f:Object.values(pr.fehler||{}).reduce((a,x)=>a+x,0)}}
        else pr.erg={...pr.erg,z}});
      dlg.close();toast(n?`Note ${n} festgelegt`:"Es gilt wieder die Note der App");await lehrerLaden()}
    catch(e){toast("Das hat nicht geklappt")}});
  dlg.showModal()}

function lehrerLogin(){
  document.body.dataset.seite="login";
  $("#app").innerHTML=`<div class="login-kopf">${LOGO}<div><div class="login-titel">Informatik 5</div><div class="muted small">Bereich für Lehrkräfte</div></div></div>
  <form id="f"><label class="f" for="e">E-Mail</label><input type="text" id="e" autocomplete="username" inputmode="email">
  <div style="height:12px"></div><label class="f" for="p">Passwort</label><input type="password" id="p" autocomplete="current-password" class="pw">
  <div style="height:18px"></div><button class="btn wide">Anmelden</button><div id="m"></div></form>
  <p class="muted small login-fuss"><a class="link" href="#">Zur Schüler-Seite</a> · Version ${VERSION}</p>`;
  $("#f").onsubmit=async e=>{e.preventDefault();try{await db.lAnmelden($("#e").value.trim(),$("#p").value);seiteLehrer()}catch(err){const m=$("#m");m.className="msg no";m.textContent="Anmeldung fehlgeschlagen."}};
}

/* Notfall-Datei: alle Noten als Tabelle (öffnet in Excel) – nur auf Knopfdruck */
function notfallCsv(){const d=lDaten;if(!d)return"";
  const tierVon=Object.fromEntries(d.kinder.map(k=>[k.id,k])),titel=Object.fromEntries(STATIONEN.map(s=>[s.id,s.titel]));
  const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
  const kopf=["Klasse","Name","Tier","Station","Stand","Note","Note 1–6","Punkte","von","Fehlversuche","Minuten","Fertig am"];
  const z=[];const schon=new Set();
  (d.abschluesse||[]).forEach(a=>{schon.add(a.kind_id+"|"+a.station+"|"+new Date(a.fertig_am).getTime());
    z.push([a.klasse,namen[a.kind_id]||"",a.tier,titel[a.station]||a.station,tierVon[a.kind_id]?"fertig":"fertig (Kind gelöscht)",...(()=>{const pk=d.staende[a.kind_id]?.[a.station];if(pk&&pk.fertig&&new Date(a.fertig_am).getTime()===pk.fertig){const st=STATIONEN.find(s=>s.id===a.station);if(st){const b=bewertung(st,pk);return[b.z,b.note+(b.lehrer?" (Lehrernote)":b.vorl?" (nicht fertig)":b.stern?" ⭐":"")]}}
        if(pk&&(unfertig(pk)||pk.fertig!==new Date(a.fertig_am).getTime()))return["","(ersetzt, siehe aktuelle Zeile)"];
      return[a.note,a.max?noteAus(Math.round(a.punkte*100/a.max)):""]})(),a.punkte,a.max,a.fehlversuche,a.minuten,new Date(a.fertig_am).toLocaleString("de-DE")])});
  d.kinder.forEach(k=>Object.entries(d.staende[k.id]||{}).forEach(([id,p])=>{const st=STATIONEN.find(s=>s.id===id);if(!st||st.spiel)return;
    if(p.fertig&&schon.has(k.id+"|"+id+"|"+p.fertig))return;
    z.push([k.klasse,namen[k.id]||"",k.tier,st.titel,!unfertig(p)?"fertig":`vorläufig · Teil ${(p.schritt||0)+1} von ${st.schritte.length}`,bewertung(st,p).z,bewertung(st,p).note+(p.lnote?" (Lehrernote)":p.stern?" ⭐":""),summe(p),wertMax(st,p),Object.values(p.fehler||{}).reduce((a,b)=>a+b,0),Math.round((p.aktiv||0)/60000),p.fertig?new Date(p.fertig).toLocaleString("de-DE"):""])}));
  z.sort((a,b)=>String(a[0]+a[1]+a[2]).localeCompare(String(b[0]+b[1]+b[2]),"de"));
  return"\uFEFF"+[kopf,...z].map(r=>r.map(q).join(";")).join("\r\n")}
function notfallLaden(auto){const csv=notfallCsv();if(!csv)return;
  try{localStorage.setItem("if5-notfall",csv);localStorage.setItem("if5-notfall-zeit",new Date().toISOString())}catch(e){}
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  a.download=`Informatik5-Noten-${new Date().toLocaleDateString("sv")}.csv`;a.click();URL.revokeObjectURL(a.href);
  lsSet("if5-notfall-tag",{tag:new Date().toDateString(),n:(lDaten.abschluesse||[]).length});
  toast(auto?"Notfall-Datei mit allen Noten wurde automatisch gespeichert.":"Notfall-Datei gespeichert.")}

async function lehrerLaden(){
  try{lDaten=await db.lAlles()}catch(e){$("#lb").innerHTML=`<div class="msg no">Laden fehlgeschlagen: ${esc(e.message||e)}</div>`;return}
  planAnwenden(lDaten.plan);   // Lehrkraft: nur die eigenen Klassen
  if(!KLASSEN.includes(lKlasse))lKlasse=KLASSEN[0]||null;
  if($("#kdlg")?.open)return;   // Fenster „Klasse“ offen: nicht dazwischenfunken
  lehrerZeigen();
  /* Kopie der Notenliste immer auch in diesem Browser (kein automatischer Download mehr) */
  try{localStorage.setItem("if5-notfall",notfallCsv());localStorage.setItem("if5-notfall-zeit",new Date().toISOString())}catch(e){}
}

/* Halbgruppe: gespeichert, sonst aus den Zeiten der fertigen Stationen erkannt (welche Stunde laut Stundenplan) */
function gruppeVon(k){if(k.gruppe)return{g:k.gruppe,erkannt:false};
  const z=[0,0,0];(lDaten.abschluesse||[]).filter(a=>a.kind_id===k.id).forEach(a=>{const t=new Date(a.fertig_am);
    const tag=t.getDay(),m=t.getHours()*60+t.getMinutes();
    STUNDENPLAN.filter(s=>s.klasse===k.klasse&&s.tag===tag).forEach(s=>{const [h,mi]=s.von.split(":").map(Number),v=h*60+mi;if(m>=v-PUFFER&&m<=v+s.min+30)z[s.gruppe]++})});
  return z[1]>z[2]?{g:1,erkannt:true}:z[2]>z[1]?{g:2,erkannt:true}:{g:0,erkannt:false}}

/* „Stationen“: Jede Schulwoche öffnet automatisch eine neue Station (Regel der Klasse).
   Mit dem Schalter öffnet oder schließt die Lehrkraft eine Station sofort (klassen.stationen: {id: true|false}).
   Stimmt der Schalter wieder mit „automatisch“ überein, wird der Eintrag gelöscht. */
const datumDE=iso=>{const [y,m,d]=iso.split("-");return`${d}.${m}.${y}`};
const regelDerKlasse=kl=>{const r=(lDaten?.regeln||{})[kl];return regelOk(r)?{...r,stationen:r.stationen||{}}:{...STANDARD_REGEL,stationen:{}}};
const gruppenDerKlasse=kl=>[...new Set(STUNDENPLAN.filter(x=>x.klasse===kl&&x.gruppe).map(x=>x.gruppe))].sort();
function stationenStand(kl){const r=regelDerKlasse(kl),heute=isoTag(new Date()),ab=r.modus==="woche"?stAb(r.start):[],gr=gruppenDerKlasse(kl);
  return PFAD().map((st,i)=>{const auto=inWoche(r,i),spaeter=!!ab[i]&&ab[i]>heute,d=ab[i]?datumDE(ab[i]).slice(0,6):"";
    const wirk=v=>v===undefined?auto:v===false?false:v==="frueh"?(spaeter||auto):true;
    const teile=(gr.length?gr:[0]).map(g=>{const v=schalterFuer(r.stationen,st.id,g);return{g,v,offen:wirk(v),hand:v!==undefined&&wirk(v)!==auto}});
    const hand=teile.some(t=>t.hand),eigen=Object.keys(r.stationen).some(key=>key===st.id||key.startsWith(st.id+"@"));
    const plan=auto?(r.modus==="woche"?`diese Woche dran (seit ${d})`:"offen"):spaeter?`dran ab ${d}`:`Woche ab ${d} – vorbei`;
    const wer=t=>t.g?`Gr. ${t.g}`:"Klasse";
    const info=!hand?plan:teile.filter(t=>t.hand).map(t=>`${wer(t)} ${t.offen?(spaeter?"schon offen":"wieder offen"):"geschlossen"}`).join(", ")+(spaeter?` · sonst ab ${d}`:"");
    return{st,i,auto,spaeter,teile,hand,eigen,offen:teile.some(t=>t.offen),info}})}
function stationenBox(kl){const z=stationenStand(kl),nae=z.find(x=>x.spaeter),r=regelDerKlasse(kl);
  return`<details class="block noprint st-box" id="stbox" ${lsGet("if5-stbox")?"open":""}><summary><b>Stationen</b> <span class="muted small">${z.filter(x=>x.auto).map(x=>` · Station ${x.i+1} diese Woche`).join("")}${nae&&r.modus==="woche"?` · Station ${nae.i+1} ab ${esc(datumDE(stAb(r.start)[nae.i]).slice(0,6))}`:""}${z.some(x=>x.hand)?" · von dir angepasst":""}</span></summary>
    <p class="muted small" style="margin:10px 0 12px">Jede Woche öffnet automatisch die nächste Station. Ist eine Gruppe schneller, öffne ihr die nächste Station schon früher: Kinder, die die Station der Woche fertig haben, dürfen dann weitermachen. Nächste Woche geht es für alle wieder im normalen Takt weiter.</p>
    <ol class="st-liste">${z.map(x=>`<li class="st-zeile${x.hand?" hand":""}${x.auto?" jetzt":""}"><span class="nr">${x.i+1}</span>${pix(x.st.id,24)}<span class="st-t"><b>${esc(x.st.titel)}</b><small>${esc(x.info)}${x.eigen?` · <button class="link" data-auto="${x.st.id}">wie geplant</button>`:""}</small></span>
      <span class="st-gr">${x.teile.map(t=>`<button class="gr-pille${t.offen?" an":""}" role="switch" aria-checked="${t.offen}" data-st="${x.st.id}" data-g="${t.g}" aria-label="${esc(x.st.titel)}${t.g?" Gruppe "+t.g:""} ${t.offen?"schließen":"öffnen"}"><i></i>${t.g?"Gr. "+t.g:"offen"}</button>`).join("")}</span></li>`).join("")}</ol></details>`}
function stationenBoxAktiv(kl){
  const box=$("#stbox");if(!box)return;box.ontoggle=()=>lsSet("if5-stbox",box.open);
  const speichern=async(neu,text)=>{box.querySelectorAll("button").forEach(b=>b.disabled=true);
    try{await db.lStationen(kl,neu);toast(text)}catch(e){toast("Hat nicht geklappt: "+(e.message||e))}await lehrerLaden()};
  box.querySelectorAll("[data-st]").forEach(b=>b.onclick=()=>{const x=stationenStand(kl).find(y=>y.st.id===b.dataset.st),g=+b.dataset.g,t=x.teile.find(y=>y.g===g),neu={...regelDerKlasse(kl).stationen};
    const key=g?x.st.id+"@"+g:x.st.id,ziel=!t.offen,klasseV=g?neu[x.st.id]:undefined;
    const planV=klasseV===undefined?x.auto:(klasseV===false?false:klasseV==="frueh"?(x.spaeter||x.auto):true);
    if(ziel===planV)delete neu[key];else neu[key]=ziel?(x.spaeter?"frueh":true):false;
    speichern(neu,`Station ${x.i+1}${g?" · Gruppe "+g:""}: ${ziel?"offen":"zu"}`)});
  box.querySelectorAll("[data-auto]").forEach(b=>b.onclick=()=>{const neu={...regelDerKlasse(kl).stationen},id=b.dataset.auto;
    Object.keys(neu).forEach(key=>{if(key===id||key.startsWith(id+"@"))delete neu[key]});speichern(neu,"Wieder wie geplant")})}

/* ---------- Klasse anlegen / Unterricht ändern ----------
   Die Lehrkraft gibt nur Tag, Beginn und Dauer ein. Anmelden ab PUFFER Minuten vorher und Stopp STOPP_MIN Minuten vor Ende rechnet die App selbst. */
const DAUERN=[45,60,90];
const unterrichtText=kl=>{const z=STUNDENPLAN.filter(x=>x.klasse===kl).sort((a,b)=>a.tag-b.tag||hm(a.von)-hm(b.von));
  return z.length?z.map(x=>`${TAGNAME[x.tag].slice(0,2)} ${x.von}–${uhr(hm(x.von)+x.min)}${x.gruppe?` (Gruppe ${x.gruppe})`:""}`).join(" · "):"noch kein Unterricht eingetragen"};
function klasseDialog(kl){
  const neu=!kl;let dlg=$("#kdlg");if(!dlg){dlg=document.createElement("dialog");dlg.id="kdlg";dlg.className="kdlg";document.body.append(dlg)}
  let stunden=neu?[{gruppe:1,tag:1,von:"08:00",min:60},{gruppe:2,tag:3,von:"08:00",min:60}]:STUNDENPLAN.filter(x=>x.klasse===kl).map(x=>({...x}));
  if(!stunden.length)stunden=[{gruppe:1,tag:1,von:"08:00",min:60}];
  let geteilt=neu?true:stunden.some(x=>x.gruppe);
  const r={...regelVon(kl)};if(neu){r.modus="woche";r.start=montagVon(isoTag(new Date()))}
  const zeile=(x,i)=>`<div class="kstd" data-i="${i}">
      ${geteilt?`<select data-f="gruppe" aria-label="Gruppe"><option value="1" ${x.gruppe===1?"selected":""}>Gruppe 1</option><option value="2" ${x.gruppe===2?"selected":""}>Gruppe 2</option></select>`:""}
      <select data-f="tag" aria-label="Tag">${[1,2,3,4,5].map(t=>`<option value="${t}" ${x.tag===t?"selected":""}>${TAGNAME[t]}</option>`).join("")}</select>
      <input type="time" data-f="von" value="${esc(x.von)}" step="300" aria-label="Beginn">
      <select data-f="min" aria-label="Dauer">${[...new Set([...DAUERN,x.min])].sort((a,b)=>a-b).map(m=>`<option value="${m}" ${x.min===m?"selected":""}>${m} Min.</option>`).join("")}</select>
      <button class="link kweg" data-weg="${i}" aria-label="Stunde entfernen" ${stunden.length<2?"disabled":""}>✕</button></div>`;
  const zeigen=(fehler)=>{dlg.innerHTML=`<h2 style="margin:0 0 4px">${neu?"Neue Klasse":"Unterricht von "+esc(kl)}</h2>
    <p class="muted small" style="margin:0 0 14px">${neu?"Die Klasse gehört dann zu deinem Konto. Andere Lehrkräfte sehen sie nicht.":"Gilt ab sofort. Kinder, Stände und Noten bleiben, wie sie sind."}</p>
    ${neu?`<label class="kfeld"><b>Name der Klasse</b><input type="text" id="kname" maxlength="12" placeholder="zum Beispiel 5A" autocomplete="off" value="${esc(dlg.dataset.name||"")}"></label>`:""}
    <p style="margin:14px 0 6px"><b>Wann ist Unterricht?</b></p>
    <label class="regel-opt" style="margin:0 0 10px"><input type="checkbox" id="kgeteilt" ${geteilt?"checked":""}> Die Klasse ist in Gruppe 1 und Gruppe 2 geteilt</label>
    <div id="kstunden">${stunden.map(zeile).join("")}</div>
    <button class="link" id="kplus" style="margin-top:6px">+ weitere Stunde</button>
    <p class="muted small" style="margin:8px 0 0">Die Kinder können sich ${PUFFER} Minuten vor Beginn anmelden. ${STOPP_MIN} Minuten vor Ende stoppt die Station automatisch. Ferien rechnet die App selbst heraus.</p>
    ${neu?`<p class="muted small" style="margin:14px 0 0">Die Stationen öffnen automatisch, ab dieser Woche eine pro Schulwoche. Einzelne Stationen kannst du später selbst öffnen oder schließen.</p>`:""}
    ${fehler?`<div class="msg no" style="margin-top:12px">${esc(fehler)}</div>`:""}
    <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn ghost" id="kzu">Abbrechen</button><button class="btn" id="kok">${neu?"Klasse anlegen":"Speichern"}</button></div>`;
    const lesen=()=>{if(!geteilt)stunden.forEach(x=>x.gruppe=0);dlg.querySelectorAll(".kstd").forEach(z=>{const x=stunden[+z.dataset.i];z.querySelectorAll("[data-f]").forEach(f=>{const v=f.value;x[f.dataset.f]=f.dataset.f==="von"?v:+v})});
      if(neu)dlg.dataset.name=$("#kname").value};
    $("#kgeteilt").onchange=()=>{lesen();geteilt=$("#kgeteilt").checked;stunden.forEach((x,i)=>x.gruppe=geteilt?(i%2?2:1):0);zeigen()};
    $("#kplus").onclick=()=>{lesen();const l=stunden[stunden.length-1];stunden.push({...l,gruppe:geteilt?(l.gruppe===1?2:1):0});zeigen()};
    dlg.querySelectorAll("[data-weg]").forEach(b=>b.onclick=()=>{lesen();stunden.splice(+b.dataset.weg,1);zeigen()});
    $("#kzu").onclick=()=>{dlg.close();delete dlg.dataset.name;lehrerZeigen()};
    $("#kok").onclick=async()=>{lesen();
      const name=neu?dlg.dataset.name.trim().replace(/\s+/g,"").toUpperCase():kl;
      if(neu&&!/^[0-9A-ZÄÖÜ][0-9A-ZÄÖÜ\-]{0,11}$/.test(name))return zeigen("Bitte einen Namen eingeben, zum Beispiel 5A (nur Buchstaben, Zahlen und Bindestrich).");
      if(neu&&KLASSEN.some(k=>k.toLowerCase()===name.toLowerCase()))return zeigen(`Die Klasse ${name} gibt es schon. Ihren Unterricht änderst du bei der Klasse unter „ändern“.`);
      if(stunden.some(x=>!/^\d\d:\d\d$/.test(x.von)))return zeigen("Bitte bei jeder Stunde eine Uhrzeit eingeben.");
      if(stunden.some(x=>hm(x.von)<7*60||hm(x.von)+x.min>18*60))return zeigen("Der Unterricht muss zwischen 07:00 und 18:00 Uhr liegen.");
      /* Überschneidungen: untereinander und mit deinen anderen Klassen */
      const ueber=(a,b)=>a.tag===b.tag&&hm(a.von)<hm(b.von)+b.min&&hm(b.von)<hm(a.von)+a.min;
      for(let x=0;x<stunden.length;x++){const a=stunden[x];
        for(let y=x+1;y<stunden.length;y++)if(ueber(a,stunden[y]))return zeigen(`Zwei Stunden am ${TAGNAME[a.tag]} überschneiden sich (${a.von} und ${stunden[y].von}).`);
        const b=STUNDENPLAN.find(o=>o.klasse!==name&&ueber(a,o));
        if(b)return zeigen(`${TAGNAME[a.tag]} ${a.von} überschneidet sich mit deiner Klasse ${b.klasse} (${b.von}–${uhr(hm(b.von)+b.min)}).`)}
      $("#kok").disabled=true;
      let erg;try{erg=await db.lKlasseSpeichern(name,{modus:r.modus,start:r.start,stunden},neu)}catch(e){return zeigen("Das hat nicht geklappt: "+(e.message||e))}
      if(erg?.fehler==="vergeben")return zeigen(`Die Klasse ${name} gibt es schon. Wenn sie einer anderen Lehrkraft gehört, sprecht euch ab.`);
      dlg.close();delete dlg.dataset.name;if(neu){lKlasse=name;lsSet("if5-lklasse",name)}
      toast(neu?`Klasse ${name} angelegt`:`Unterricht von ${name} gespeichert`);await lehrerLaden()};};
  delete dlg.dataset.name;zeigen();dlg.showModal()}

function lehrerZeigen(){
  if(!lKlasse){$("#lb").innerHTML=`<div class="block"><h2 style="margin-top:0">Willkommen!</h2><p>Du hast noch keine Klasse. Leg deine erste Klasse an: Name, wann Unterricht ist, fertig.</p><button class="btn" id="kneu">Neue Klasse anlegen</button></div>`;$("#kneu").onclick=()=>klasseDialog(null);return}
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
      return`<td class="c" title="${esc(st.titel)}: ${pz} %${p.fertig?"":" · Teil "+((p.schritt||0)+1)}">${!unfertig(p)||p.lnote?(()=>{const b=bewertung(st,p);return`<button class="chip ${zeichenKlasse(b.z)} gross-z nchip${b.lehrer?" lehrer":""}" data-ln="${k.id}|${st.id}" title="${b.lehrer?"Von dir festgelegt. ":""}Klicken: Note selbst festlegen">${b.note}${b.stern?"⭐":""}${b.lehrer?" ✎":""}</button><span class="pzk">${pz} %${p.gestoppt?" · Zeit um":""}</span>`})():offen?`<button class="nchip offen muted small" data-ln="${k.id}|${st.id}" title="Noch nicht fertig. Klicken: Note selbst festlegen">…${pz}%</button>`
        :(()=>{const b=bewertung(st,p);return`<button class="chip ${zeichenKlasse(b.z)} gross-z nchip${b.lehrer?" lehrer":""}" data-ln="${k.id}|${st.id}" title="Nicht fertig: Note nach demselben Maßstab wie alle (höchstens 2−; mit mind. 30 Min. Arbeit nicht schlechter als 4). Das Kind sieht sie nicht. Klicken: Note selbst festlegen">${b.note}${b.stern?"⭐":""}</button><span class="pzk">${inWoche(regelDerKlasse(k.klasse),PFAD().indexOf(st))?"vorl.":"n. f."}</span>`})()}</td>`}).join("");
    const gv=gruppeVon(k);
    return`<tr><td class="t"><span class="e">${t.emoji}</span>${esc(t.name)}</td>
      <td><input type="text" class="vn" data-id="${k.id}" value="${esc(namen[k.id]||"")}" placeholder="Wer ist das?" list="dl-${esc(kl)}"></td><td><select class="grw" data-id="${k.id}" title="${gv.erkannt?"Automatisch erkannt. Auswählen, um es festzulegen.":"Halbgruppe"}"><option value="">–</option><option value="1" ${gv.g===1?"selected":""}>1${gv.erkannt&&gv.g===1?" ?":""}</option><option value="2" ${gv.g===2?"selected":""}>2${gv.erkannt&&gv.g===2?" ?":""}</option></select></td><td>${status}</td>${zellen}
      <td class="small">${(()=>{const lk=(s.lernzeit||{}).karten||{},ab=Object.keys(lk).filter(n=>lk[n].am).sort();return ab.length?ab.map(n=>`<span class="lz-chip" title="abgegeben am ${new Date(lk[n].am).toLocaleDateString("de-DE")}">${n}</span>`).join(" "):`<span class="muted">–</span>`})()}</td>
      <td><button class="link" data-a="mehr" data-id="${k.id}" aria-label="Mehr">⋯</button></td></tr>`};
  $("#lb").innerHTML=`
  <div class="tabs noprint">${KLASSEN.map(k=>`<button class="${k===kl?"an":""}" data-kl="${esc(k)}">${esc(k)} <span class="muted small">${d.kinder.filter(x=>x.klasse===k).length}</span></button>`).join("")}<button class="btn-rand" id="kneu"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Neue Klasse</button></div>
  <div class="block frei-box ${offen?"offen":""}">
    <div><h2 style="margin:0">${offen?`${kl} ist offen`:`${kl} ist zu`}</h2><p class="muted small" style="margin:2px 0 0">${esc(info)}</p>
      <p class="small" style="margin:6px 0 0">Unterricht: ${esc(unterrichtText(kl))} <button class="link" id="kaendern">ändern</button></p></div>
    <div class="row">${hand?`<button class="btn ghost" id="plan">Wieder nach Stundenplan</button>`:""}<button class="btn" id="frei">${offen?"Jetzt schließen":`Jetzt öffnen (${FREIGABE_MIN} Min.)`}</button></div>
  </div>
  ${stationenBox(kl)}
  ${(()=>{const heute=new Date().toDateString(),zeilen=[];
    kinder.forEach(k=>{const t=tierInfo(k.tier),s=d.staende[k.id]||{};
      PFAD().forEach(st=>{const p=s[st.id];if(!p)return;
        const tag=new Date(p.fertig||p.start||0).toDateString();if(tag!==heute)return;
        const bw=bewertung(st,p),pz=bw.pz,z=bw.z,f=p.fehler||{},fGes=Object.values(f).reduce((a,b)=>a+b,0),fHier=f[p.schritt||0]||0,min=Math.round((p.aktiv||0)/60000);
        const sk=Object.keys(p.skip||{}).length;
        const hinweis=[!p.fertig&&fHier>=3?"hängt an diesem Teil":!unfertig(p)&&min<15?"sehr schnell fertig":fGes>=12?"viele Fehlversuche":"",sk?`${sk} übersprungen`:""].filter(Boolean).join(" · ");
        zeilen.push({name:namen[k.id]||`${t.emoji} ${t.name}`,z,note:bw.note,stern:bw.stern,lehrer:bw.lehrer,kid:k.id,sid:st.id,erst:p.erst&&p.erst.pz!==pz?p.erst.pz:null,st:st.titel,pz,fertig:!unfertig(p),gestoppt:!!p.gestoppt,vorl:!!bw.vorl,teil:`Teil ${(p.schritt||0)+1} von ${st.schritte.length}`,min,fGes,hinweis,da:k.besetzt})})});
    if(!zeilen.length)return`<div class="block"><h2 style="margin-bottom:4px">Heute</h2><p class="muted" style="margin:0">Heute hat in ${kl} noch niemand gearbeitet. Sobald Kinder anfangen, siehst du hier, wer wo ist und wer Hilfe braucht.</p></div>`;
    zeilen.sort((a,b)=>(b.hinweis?1:0)-(a.hinweis?1:0)||a.name.localeCompare(b.name,"de"));
    window._noten=zeilen.map(x=>`${x.name}\t${x.st}\t${x.z} (${x.note}${x.stern?" ⭐":""})${x.fertig?"":" vorläufig"}`).join("\n");
    return`<div class="block" style="overflow-x:auto"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Heute</h2>${notenKreis(zeilen.filter(x=>x.fertig||!offen).map(x=>x.note))}<button class="btn ghost noprint" id="kopie" style="min-height:40px;padding:6px 14px">Noten kopieren</button></div>
      <p class="muted small" style="margin:4px 0 10px">Aktualisiert sich alle 20 Sekunden. Kinder mit Hinweis stehen oben. 5 Minuten vor Schluss pausiert die App alle angefangenen Stationen – ohne Note. Alle Noten nach einem Maßstab: Punkte im Verhältnis zur ganzen Station. Nicht fertig: höchstens 2−. Wer mind. 30 Minuten gearbeitet hat, bekommt nicht schlechter als 4 – fertig oder nicht. Nicht fertige Noten siehst nur du („vorl.“, solange die Woche läuft, danach „n. f.“).</p>
      <table class="liste heute-t"><thead><tr><th>Kind</th><th>Station</th><th>Stand</th><th class="c">Minuten</th><th class="c">Fehlversuche</th><th>Hinweis</th><th class="c" title="Mühe-Stern: hebt die Note um eine Stufe">Mühe</th><th class="c" title="Erreichte Punkte in Prozent. „81 → 93“ heißt: nach dem Verbessern">%</th><th class="c" title="Auf die Note klicken, um sie selbst festzulegen">Note</th></tr></thead><tbody>
      ${zeilen.map(x=>`<tr class="${x.hinweis?"auff":""}"><td class="t">${esc(x.name)}</td><td>${esc(x.st)}</td><td>${x.fertig?"fertig":x.teil}</td><td class="c">${x.min}</td><td class="c">${x.fGes}</td><td>${x.hinweis?`<b>${x.hinweis}</b>`:""}</td><td class="c"><button class="stern-btn${x.stern?" an":""}" data-stern="${x.kid}|${x.sid}" title="${x.stern?"Mühe-Stern wieder wegnehmen":"Mühe-Stern geben: Note eine Stufe besser"}">⭐</button></td><td class="c pz">${x.erst!=null?`<span class="muted">${x.erst} → </span>`:""}${x.pz} %</td><td class="c"><button class="chip ${zeichenKlasse(x.z)} gross-z nchip${x.lehrer?" lehrer":""}" data-ln="${x.kid}|${x.sid}" title="${x.lehrer?"Von dir festgelegt. ":x.vorl?"Nicht fertig: Note nach demselben Maßstab wie alle. Das Kind sieht sie nicht. ":""}Klicken: Note selbst festlegen">${x.note}${x.lehrer?" ✎":""}</button>${x.vorl&&!x.lehrer?`<span class="pzk">vorl.</span>`:""}</td></tr>`).join("")}</tbody></table></div>`})()}
  <div class="block" style="overflow-x:auto"><h2 style="margin-bottom:8px">Alle Stationen</h2>
    ${kinder.length?`<table class="liste"><thead><tr><th>Tier</th><th>Vorname <span class="muted small">(nur hier)</span></th><th title="Halbgruppe">Gr.</th><th>Status</th>${PFAD().map((st,i)=>`<th class="c" title="${esc(st.titel)}">${i+1}</th>`).join("")}<th title="Abgegebene Lernzeit-Karten">Lernzeit</th><th></th></tr></thead>${[1,2,0].map(g=>{const ks=kinder.filter(k=>gruppeVon(k).g===g).sort((a,b)=>(namen[a.id]||"~"+a.tier).localeCompare(namen[b.id]||"~"+b.tier,"de"));if(!ks.length)return"";
      return`<tbody><tr class="grkopf"><th colspan="${PFAD().length+6}">${g?esc(gruppenText(kl,g)):"Ohne Gruppe"} <span class="muted small">· ${ks.length} Kinder</span></th></tr>${ks.map(zeile).join("")}</tbody>`}).join("")}</table>`
      :`<p style="margin:0">Noch keine Kinder in ${kl}. Trag unten die Klassenliste ein, dann bekommt jedes Kind ein Tier.</p>`}
    <datalist id="dl-${esc(kl)}">${(listen[kl]||[]).filter(n=>!kinder.some(k=>namen[k.id]===n)).map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
    ${(listen[kl]||[]).length?`<p class="muted small" style="margin:10px 0 0">${kinder.filter(k=>namen[k.id]).length} von ${listen[kl].length} Kindern zugeordnet.${(()=>{const fehlt=listen[kl].filter(n=>!kinder.some(k=>namen[k.id]===n));return fehlt.length&&fehlt.length<=8?" Noch ohne Tier: "+fehlt.map(esc).join(", "):""})()}</p>`:""}
  </div>
  <details class="block noprint" ${kinder.length?"":"open"}><summary><b>Klassenliste und Tiere zuteilen</b> <span class="muted small">– ${kinder.length} Kinder haben ein Tier</span></summary>
    <p class="small" style="margin:10px 0 6px">Ein Name pro Zeile (Vorname oder Vor- und Nachname). Jedes neue Kind bekommt ein freies Tier. Wer schon ein Tier hat, behält es. Die Namen sieht nur dein Lehrer-Konto.</p>
    <textarea class="uebfeld" id="kliste" style="min-height:160px" spellcheck="false">${esc([...new Set([...(listen[kl]||[]),...kinder.map(k=>namen[k.id]).filter(Boolean)])].join("\n"))}</textarea>
    <div class="row" style="margin-top:10px"><button class="btn" id="zuteilen">Speichern und Tiere zuteilen</button><span class="muted small">Danach: Kärtchen drucken und verteilen.</span></div></details>
  ${(()=>{const mit=kinder.filter(k=>d.staende[k.id]?.spielplatz?.spiele);if(!mit.length)return"";const SP=SPIELE();
    return`<details class="block noprint"><summary><b>Spielplatz-Statistik</b> <span class="muted small">– nur zur Info, ohne Note</span></summary>
      <p class="small muted" style="margin:10px 0 6px">Wie oft ein Kind ein Spiel geöffnet hat und sein Rekord (★). Rechts: Minuten auf dem Spielplatz insgesamt.</p>
      <div style="overflow-x:auto"><table class="liste"><thead><tr><th>Kind</th>${SP.map(x=>`<th class="c">${esc(x.titel)}</th>`).join("")}<th class="c">Min.</th></tr></thead><tbody>
      ${mit.map(k=>{const t=tierInfo(k.tier),sp=d.staende[k.id].spielplatz.spiele;let ms=0;
        return`<tr><td class="t">${esc(namen[k.id]||`${t.emoji} ${t.name}`)}</td>${SP.map(x=>{const g=sp[x.id];if(!g)return`<td class="muted c">·</td>`;ms+=g.ms||0;return`<td class="c">${g.n}×${g.best!=null?` <span class="muted">★ ${g.best}</span>`:""}</td>`}).join("")}<td class="c">${Math.round(ms/60000)}</td></tr>`}).join("")}
      </tbody></table></div></details>`})()}
  <div class="row noprint">
    <button class="btn ghost" id="druck" ${kinder.length?"":"disabled"}>Kärtchen ${esc(kl)} als PDF</button>
    <button class="btn" id="notfall">Notfall-Datei: alle Noten speichern</button>
    <button class="btn ghost" id="sichern">Namensliste sichern</button><label class="btn ghost">Namensliste laden<input type="file" id="laden" accept=".json" hidden></label>
  </div>
  <details class="block plan"><summary><b>Lernpfad & Lehrplan</b> <span class="muted small">– alle ${PFAD().length} Stationen mit Bezug zum Kernlehrplan NRW</span></summary>
    <ol>${PFAD().map(st=>`<li><b>${esc(st.titel)}</b> <span class="chip">${KAPITEL_NAME[st.kapitel]||""}</span><br><span class="small">${esc(st.kurz)}</span>${st.klp?`<br><span class="muted small">KLP: ${esc(st.klp)}</span>`:""}</li>`).join("")}</ol>
    <p class="muted small">Ablauf: Jede Station ist eine Doppelstunde (60 Min.). Jede Schulwoche ist genau eine Station dran, für alle Klassen gleich (Kasten „Stationen“ oben). Was in der Woche nicht fertig wird, bleibt zu und wird nach dem Geschafften benotet (gleicher Maßstab für alle); fällt die Stunde aus, gibt es für diese Station keine Note. Der Spielplatz (Bonus-Spiele, ohne Note) öffnet nur mit einem + in der Station von heute.</p></details>
  <p class="muted small" style="margin-top:14px">${!db.online?"<b>Vorschau-Modus:</b> Alles liegt nur in diesem Browser."
    :db.hatSchluessel()?"<b>Sicherung:</b> Jede fertige Station wird zusätzlich in ein Protokoll geschrieben, das sich nicht löschen lässt. Die Datenbank sichert sich stündlich selbst (60 Tage zurück). Eine Kopie aller Noten liegt zusätzlich in diesem Browser; die Notfall-Datei lädst du bei Bedarf mit dem Knopf herunter. Die Namen sehen nur du und dieses Konto. Sie werden mit deinem Passwort verschlüsselt gesichert und sind nach der Anmeldung auf jedem Gerät da. Kinder sehen nur Tiere."+(namenStand==="fehler"?" <b>Die Sicherung hat gerade nicht geklappt.</b>":"")
    :"<b>Melde dich einmal ab und wieder an</b>, dann werden die Namen verschlüsselt bei deinem Konto gesichert. Bis dahin liegen sie nur in diesem Browser."}</p>`;

  document.querySelectorAll("[data-kl]").forEach(b=>b.onclick=()=>{lKlasse=b.dataset.kl;lsSet("if5-lklasse",lKlasse);lehrerZeigen()});
  $("#frei").onclick=()=>lAktion(()=>db.lFreigabe(kl,offen?{zu_bis:Date.now()+FREIGABE_MIN*60000}:{offen_bis:Date.now()+FREIGABE_MIN*60000}));
  if($("#plan"))$("#plan").onclick=()=>lAktion(()=>db.lFreigabe(kl,{}));
  stationenBoxAktiv(kl);
  $("#kneu").onclick=()=>klasseDialog(null);$("#kaendern").onclick=()=>klasseDialog(kl);
  document.querySelectorAll(".vn").forEach(i=>{i.oninput=()=>{const v=i.value.trim();if(v)namen[i.dataset.id]=v;else delete namen[i.dataset.id];namenMerken()};i.onchange=()=>lehrerZeigen()});
  document.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{const id=b.dataset.id,a=b.dataset.a;
    if(a==="freigeben")return lAktion(()=>db.lAbmeldenKind(id));
    if(a==="mehr")return lMehr(d.kinder.find(k=>k.id===id))});
  $("#druck").onclick=()=>kaertchenPdf(kl,kinder);
  document.querySelectorAll(".grw").forEach(s=>s.onchange=()=>lAktion(()=>db.lKindGruppe(s.dataset.id,parseInt(s.value)||null)));
  $("#notfall").onclick=()=>notfallLaden(false);
  $("#zuteilen").onclick=async()=>{const liste=[...new Set($("#kliste").value.split("\n").map(x=>x.trim()).filter(Boolean))];
    listen[kl]=liste;namenMerken();
    const neu=liste.filter(n=>!kinder.some(k=>namen[k.id]===n)),frei=TIERE.map(t=>t[1]).filter(t=>!kinder.some(k=>k.tier===t));
    /* erst Kinder ohne Namen (z. B. alte Tiere) übernehmen, dann neue anlegen */
    const ohne=kinder.filter(k=>!namen[k.id]);
    if(neu.length-ohne.length>frei.length)return toast(`Zu viele Kinder: Es sind nur noch ${frei.length} Tiere frei.`);
    $("#zuteilen").disabled=true;
    try{for(const n of neu){let id;const k=ohne.shift();
        if(k)id=k.id;else{const t=frei.splice(Math.floor(Math.random()*frei.length),1)[0];id=await db.lKindAnlegen(kl,t)}
        namen[id]=n}
      namenMerken();toast(neu.length?`${neu.length} Kinder haben ein Tier bekommen.`:"Liste gespeichert.");await lehrerLaden()}
    catch(e){namenMerken();toast("Hat nicht geklappt: "+(e.message||e));await lehrerLaden()}};
  document.querySelectorAll("[data-ln]").forEach(b=>b.onclick=()=>{const [id,stid]=b.dataset.ln.split("|"),st=STATIONEN.find(x=>x.id===stid),k=kinder.find(x=>x.id===id);
    if(!st||!k)return;const t=tierInfo(k.tier);noteDialog(id,st,(d.staende[id]||{})[stid]||{},namen[id]||`${t.emoji} ${t.name}`)});
  document.querySelectorAll("[data-stern]").forEach(b=>b.onclick=async()=>{const [id,stid]=b.dataset.stern.split("|"),an=!b.classList.contains("an");
    b.disabled=true;try{await db.lStern(id,stid,an);toast(an?"⭐ Mühe-Stern vergeben":"Mühe-Stern entfernt");await lehrerLaden()}catch(e){b.disabled=false;toast("Das hat nicht geklappt")}});
  if($("#kopie"))$("#kopie").onclick=async()=>{try{await navigator.clipboard.writeText(window._noten);toast("Noten kopiert. Du kannst sie in eine Tabelle einfügen.")}catch(e){toast("Kopieren hat nicht geklappt")}};
  $("#sichern").onclick=()=>{const b=new Blob([JSON.stringify({art:"if5-namen",gesichert:new Date().toISOString(),namen,listen},null,1)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`Informatik5-Namensliste-${new Date().toLocaleDateString("sv")}.json`;a.click();URL.revokeObjectURL(a.href)};
  $("#laden").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(j.art!=="if5-namen")throw 0;
    namen={...namen,...(j.namen||{})};namenMerken();if(j.listen){listen={...listen,...j.listen};namenMerken()}toast("Namensliste geladen");lehrerZeigen()}catch(err){toast("Das ist keine Namensliste")}};
}

async function lAktion(f){try{await f();await lehrerLaden()}catch(e){toast("Hat nicht geklappt: "+(e.message||e))}}

function lMehr(k){
  const t=tierInfo(k.tier);
  const wahl=prompt(`${t.emoji} ${t.name}${namen[k.id]?" ("+namen[k.id]+")":""}\n\n1 = Stand einer Station löschen\n2 = Tier ganz löschen`);
  if(wahl==="1"){const P=PFAD(),st=P[parseInt(prompt(P.map((s,i)=>`${i+1} = ${s.titel}`).join("\n")),10)-1];
    if(st&&confirm(`Stand „${st.titel}“ von ${t.name} löschen?`))lAktion(()=>db.lStandLoeschen(k.id,st.id))}
  else if(wahl==="2"){if(confirm(`${t.name} mit allen Punkten löschen?`)){delete namen[k.id];namenMerken();lAktion(()=>db.lKindLoeschen(k.id))}}
}

/* Kärtchen als echte PDF-Datei (A4 hoch, 10 Kärtchen pro Seite, Schnittlinien). Jede Gruppe beginnt auf einer neuen Seite.
   Wird direkt heruntergeladen; öffnen und ganz normal drucken (100 %, „Tatsächliche Größe“). */
function jsPdfLaden(){return window.jspdf?Promise.resolve():new Promise((ok,nein)=>{const s=document.createElement("script");s.src="vendor/jspdf.js?v="+VERSION;s.onload=ok;s.onerror=()=>nein(new Error("PDF-Baustein lädt nicht"));document.head.append(s)})}
function emojiBild(e){try{const c=document.createElement("canvas");c.width=c.height=160;const x=c.getContext("2d");
  x.textAlign="center";x.textBaseline="middle";x.font='120px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';x.fillText(e,80,88);
  const d=x.getImageData(0,0,160,160).data;let n=0;for(let i=3;i<d.length;i+=40)if(d[i])n++;return n>20?c.toDataURL("image/png"):null}catch(err){return null}}
async function kaertchenPdf(kl,kinder){
  try{await jsPdfLaden()}catch(e){return toast("Hat nicht geklappt: "+e.message)}
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"mm",format:"a4"});
  const RAND=10,SP=2,ZE=5,B=(210-2*RAND)/SP,H=(297-2*RAND)/ZE;
  const gruppen=[1,2,0].map(g=>kinder.filter(k=>gruppeVon(k).g===g).sort((a,b)=>(namen[a.id]||"~").localeCompare(namen[b.id]||"~","de"))).map((ks,i)=>({g:[1,2,0][i],ks})).filter(x=>x.ks.length);
  const bilder={};let seite=0;
  const linien=()=>{doc.setDrawColor(150);doc.setLineWidth(.2);doc.setLineDashPattern([2,1.5],0);
    for(let i=0;i<=SP;i++)doc.line(RAND+i*B,RAND,RAND+i*B,297-RAND);for(let j=0;j<=ZE;j++)doc.line(RAND,RAND+j*H,210-RAND,RAND+j*H);doc.setLineDashPattern([],0)};
  gruppen.forEach(({g,ks})=>{for(let i=0;i<ks.length;i++){const pos=i%(SP*ZE);
    if(pos===0){if(seite++)doc.addPage();linien()}
    const k=ks[i],t=tierInfo(k.tier),x=RAND+(pos%SP)*B,y=RAND+Math.floor(pos/SP)*H,P=6;
    doc.setTextColor(90);doc.setFont("helvetica","normal");doc.setFontSize(9);
    doc.text("Informatik 5",x+P,y+P+2);doc.text(`Klasse ${k.klasse} · ${g?gruppenText(k.klasse,g):""}`,x+B-P,y+P+2,{align:"right"});
    doc.setTextColor(0);doc.setFont("helvetica","bold");doc.setFontSize(15);doc.text(namen[k.id]||" ",x+P,y+P+10);
    if(!(t.emoji in bilder))bilder[t.emoji]=emojiBild(t.emoji);
    const bx=bilder[t.emoji]?20:0;if(bx)doc.addImage(bilder[t.emoji],"PNG",x+P,y+20,18,18);
    doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(90);doc.text("Dein Tier",x+P+bx+2,y+26);
    doc.setTextColor(0);doc.setFont("helvetica","bold");doc.setFontSize(24);doc.text(t.name,x+P+bx+2,y+35);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(60);
    doc.text(`So geht's: Lesezeichen "Informatik 5"  >  ${k.klasse}  >  ${t.name}`,x+P,y+H-P)}});
  doc.save(`Informatik5-Kaertchen-${kl}.pdf`);toast("PDF ist heruntergeladen. Öffnen und drucken.")}

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
planLaden();

/* Neue Version holen (wie KT Schule): beim Start und beim Zurückkehren */
async function versionPruefen(){if(!/github\.io$/.test(location.hostname))return;
  try{const r=await fetch("version.txt?"+Date.now(),{cache:"no-store"});const v=(await r.text()).trim();
    if(!v||v===VERSION)return;
    /* höchstens ein Neuladen pro Version (sonst Schleife, solange GitHub noch die alte Seite ausliefert) */
    let schon=null;try{schon=sessionStorage.getItem("if5-neu")}catch(e){}
    if(schon===v)return;try{sessionStorage.setItem("if5-neu",v)}catch(e){}
    await hochladen();location.replace(location.pathname+"?v="+v+location.hash)}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden){versionPruefen();if(sitzung)db.lebt(sitzung.token).catch(()=>{})}else if(sitzung){clearTimeout(pushTimer);hochladen()}});
/* Tab oder Fenster zu (seit 27.11.2026): Tier sofort wieder frei. Beim nächsten Öffnen tippt das Kind einfach wieder auf sein Tier.
   Solange die Seite offen ist, meldet sie sich jede Minute („lebt“) – sonst gilt das Tier nach 4 Minuten als frei. */
addEventListener("pagehide",()=>{if(!sitzung)return;clearTimeout(pushTimer);hochladen();db.pause(sitzung.token)});
setInterval(()=>{if(sitzung&&!document.hidden)db.lebt(sitzung.token).catch(()=>{})},60000);
if(sitzung)db.lebt(sitzung.token).catch(()=>{});
versionPruefen();
if("serviceWorker"in navigator&&/github\.io$/.test(location.hostname))navigator.serviceWorker.register("sw.js").catch(()=>{});
