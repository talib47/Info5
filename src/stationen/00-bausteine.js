/* =====================================================================
   Gemeinsame Bausteine für alle Stationen.
   Jeder Baustein ist ein Teil (Schritt): {titel, punkte, merke, zeige(el, ctx)}.
   Er setzt ctx.pruefer (true = richtig, wird von „Weiter“ aufgerufen) und ctx.loesung (Lehrer-Vorschau).
   Rückmeldungen erscheinen im Kasten .mld unter der Aufgabe.
   ===================================================================== */
const mischen=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
const mischenAnders=a=>{if(a.length<2)return a.slice();let b;do{b=mischen(a)}while(b.every((x,i)=>x===a[i]));return b};
const MLD=`<div class="mld"></div>`;
function meldung(el,ok,html){const m=el.querySelector(".mld");if(!m)return;m.className="mld msg "+(ok===null?"info":ok?"ok":"no");m.innerHTML=html;m.scrollIntoView({block:"nearest",behavior:"smooth"})}
function schonGeloest(el){meldung(el,true,"✔️ Schon gelöst. Tippe auf „Weiter“.")}
/* Einheitliche Bewertung: leer → Hinweis ohne Abzug; Fehler → 2 Punkte Abzug (nur einmal pro gleichem Stand); ab 2. Versuch Fehler markieren */
function bewerte(ctx,el,{leer,leerText,fehler,stand,punkte,okText,markiere}){
  if(leer){meldung(el,false,leerText||"Mach zuerst die Aufgabe, dann tippe auf „Weiter“.");return false}
  if(!fehler){meldung(el,true,okText||"Richtig! 🎉");ctx.geschafft(punkte);return true}
  const d=ctx.daten;
  if(stand!==d.letzterFehler){ctx.fehler();d.letzterFehler=stand;d.versuche=(d.versuche||0)+1;ctx.speichern()}
  let t=fehler===1?"Fast! Noch <b>1 Fehler</b>.":`Noch <b>${fehler} Fehler</b>.`;
  if(stand===d.letzterFehler&&d.versuche&&markiere&&d.versuche>=2){markiere();t+=" Die falschen sind jetzt <b style='color:var(--bad)'>rot</b> markiert."}
  else t+=" Schau noch mal genau hin.";
  meldung(el,false,t);return false;
}
const kopfText=t=>t?`<div class="regel">${t}</div>`:"";

/* ---------- Sortieren: Karten in Kästen verteilen (antippen oder ziehen) ----------
   sortieren({titel,punkte,merke,text,toepfe:[["id","Name","🙂"]],karten:[["Text","🙂","zielId"]],warum:"Erklärung nach dem Lösen"}) */
function sortieren({titel,punkte=10,merke,text,toepfe,karten,warum,breit}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.wo=d.wo||{};if(!d.reihe){d.reihe=mischen(karten.map((_,i)=>i));ctx.speichern()}
  let wahl=null,falsch=new Set();
  const karte=i=>{const [t,ico]=karten[i];return`<button class="karte${wahl===i?" an":""}${falsch.has(i)?" falsch":""}" data-i="${i}" draggable="true">${ico?`<span class="kico">${ico}</span>`:""}<span>${t}</span></button>`};
  const zeichne=()=>{
    const frei=d.reihe.filter(i=>d.wo[i]==null);
    el.innerHTML=kopfText(text)+`
      <p class="eyebrow" style="margin-top:12px">${frei.length?`👆 Tippe eine Karte an, dann den passenden Kasten · noch ${frei.length}`:"✔️ Alle verteilt! Tippe auf „Weiter“."}</p>
      <div class="karten">${frei.map(karte).join("")}</div>
      <div class="toepfe${breit?" breit":""}" style="--n:${toepfe.length}">${toepfe.map(([id,name,ico])=>`<div class="topf${wahl!=null?" bereit":""}" data-t="${id}"><div class="topf-kopf">${ico?`<span>${ico}</span>`:""}${name}</div><div class="topf-inhalt">${d.reihe.filter(i=>d.wo[i]===id).map(karte).join("")}</div></div>`).join("")}</div>${MLD}`;
    el.querySelectorAll(".karte").forEach(b=>{const i=+b.dataset.i;
      b.onclick=e=>{e.stopPropagation();if(d.wo[i]!=null){delete d.wo[i];falsch.delete(i);wahl=i;ctx.speichern()}else wahl=wahl===i?null:i;zeichne()};
      b.ondragstart=e=>{wahl=i;e.dataTransfer.setData("text/plain",String(i))}});
    el.querySelectorAll(".topf").forEach(t=>{
      const legen=()=>{if(wahl==null)return toast("Tippe zuerst oben eine Karte an.");d.wo[wahl]=t.dataset.t;falsch.delete(wahl);wahl=null;ctx.speichern();zeichne()};
      t.onclick=legen;t.ondragover=e=>e.preventDefault();t.ondrop=e=>{e.preventDefault();legen()}});
  };
  zeichne();
  ctx.pruefer=()=>{const fs=karten.map((k,i)=>i).filter(i=>d.wo[i]!==karten[i][2]);
    return bewerte(ctx,el,{leer:karten.some((k,i)=>d.wo[i]==null),leerText:"Verteile zuerst alle Karten.",fehler:fs.length,stand:JSON.stringify(d.wo),punkte,
      okText:`Richtig! Alles passt. 🎉${warum?`<div class="aha" style="margin-top:10px"><b>💡</b> ${warum}</div>`:""}`,markiere:()=>{falsch=new Set(fs);zeichne()}})};
  ctx.loesung=()=>{karten.forEach((k,i)=>d.wo[i]=k[2]);wahl=null;falsch.clear();zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Reihenfolge: Schritte in die richtige Reihenfolge bringen ----------
   reihenfolge({titel,punkte,merke,text,schritte:["erst","dann",…]})  (in richtiger Reihenfolge angeben) */
function reihenfolge({titel,punkte=10,merke,text,schritte}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;if(!d.reihe){d.reihe=mischenAnders(schritte.map((_,i)=>i));ctx.speichern()}d.gew=d.gew||[];
  let falsch=new Set();
  const zeichne=()=>{
    const frei=d.reihe.filter(i=>!d.gew.includes(i));
    el.innerHTML=kopfText(text)+`
      <div class="paar" style="margin-top:12px"><div><p class="eyebrow">👆 Tippe die Schritte der Reihe nach an</p><div class="karten spalte">${frei.map(i=>`<button class="karte" data-f="${i}">${schritte[i]}</button>`).join("")||`<p class="muted">Alle eingeordnet.</p>`}</div></div>
      <div><p class="eyebrow">Deine Reihenfolge</p><ol class="reihe">${d.gew.map((i,k)=>`<li><button class="karte${falsch.has(k)?" falsch":""}" data-g="${k}" title="Zurücklegen">${schritte[i]} <span class="weg">✕</span></button></li>`).join("")}${frei.length?`<li class="leer">…</li>`:""}</ol></div></div>${MLD}`;
    el.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{d.gew.push(+b.dataset.f);falsch.clear();ctx.speichern();zeichne()});
    el.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{d.gew.splice(+b.dataset.g,1);falsch.clear();ctx.speichern();zeichne()});
  };
  zeichne();
  ctx.pruefer=()=>{const fs=d.gew.map((x,k)=>x===k?-1:k).filter(k=>k>=0);
    return bewerte(ctx,el,{leer:d.gew.length<schritte.length,leerText:"Ordne zuerst alle Schritte ein.",fehler:fs.length,stand:d.gew.join(),punkte,
      okText:"Richtig! Die Reihenfolge stimmt. 🎉",markiere:()=>{falsch=new Set(fs);zeichne()}})};
  ctx.loesung=()=>{d.gew=schritte.map((_,i)=>i);zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Paare: Links und rechts verbinden ----------
   paare({titel,punkte,merke,text,paare:[["links","rechts"],…]}) */
const PAAR_FARBEN=["#4338CA","#E5383B","#2DA44E","#F08A24","#8E5BD6","#0EA5B7","#C2185B","#8B5A2B"];
function paare({titel,punkte=10,merke,text,paare:liste}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;if(!d.reihe){d.reihe=mischenAnders(liste.map((_,i)=>i));ctx.speichern()}d.zu=d.zu||{};   // rechtsIndex → linksIndex
  let wahl=null,falsch=new Set();
  const zeichne=()=>{
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">👆 Tippe links etwas an, dann rechts das Passende</p>
      <div class="paare"><div>${liste.map(([l],i)=>{const vergeben=Object.values(d.zu).includes(i);return`<button class="karte links${wahl===i?" an":""}" data-l="${i}" style="--pf:${PAAR_FARBEN[i%8]}"><span class="pnr${vergeben?" voll":""}">${i+1}</span>${l}</button>`}).join("")}</div>
      <div>${d.reihe.map(r=>{const l=d.zu[r];return`<button class="karte rechts${falsch.has(r)?" falsch":""}" data-r="${r}" ${l!=null?`style="--pf:${PAAR_FARBEN[l%8]}"`:""}><span class="pnr${l!=null?" voll":""}">${l!=null?l+1:"?"}</span>${liste[r][1]}</button>`}).join("")}</div></div>${MLD}`;
    el.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{const i=+b.dataset.l;wahl=wahl===i?null:i;zeichne()});
    el.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{const r=+b.dataset.r;
      if(wahl==null){if(d.zu[r]!=null){delete d.zu[r];ctx.speichern();zeichne()}else toast("Tippe zuerst links etwas an.");return}
      for(const k in d.zu)if(d.zu[k]===wahl)delete d.zu[k];
      d.zu[r]=wahl;wahl=null;falsch.delete(r);ctx.speichern();zeichne()});
  };
  zeichne();
  ctx.pruefer=()=>{const fs=liste.map((_,r)=>r).filter(r=>d.zu[r]!==r);
    return bewerte(ctx,el,{leer:Object.keys(d.zu).length<liste.length,leerText:"Verbinde zuerst alle Paare.",fehler:fs.length,stand:JSON.stringify(d.zu),punkte,
      okText:"Richtig! Alle Paare passen. 🎉",markiere:()=>{falsch=new Set(fs);zeichne()}})};
  ctx.loesung=()=>{liste.forEach((_,i)=>d.zu[i]=i);zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Fehler-Suche: verdächtige Stellen in einer Nachricht antippen ----------
   fehlerSuche({titel,punkte,merke,text,kopf:"Von: … Betreff: …",teile:[["Text",true,"warum verdächtig"],["normaler Text"]]}) */
function fehlerSuche({titel,punkte=10,merke,text,kopf,teile,art="📩 Nachricht"}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.an=d.an||[];
  const anzahl=teile.filter(t=>t[1]).length;let falsch=new Set();
  const zeichne=()=>{
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">🔍 Tippe die verdächtigen Stellen an · Finde ${anzahl} Stück · markiert: ${d.an.length}</p>
      <div class="nachricht"><div class="n-art">${art}</div>${kopf?`<div class="n-kopf">${kopf}</div>`:""}<div class="n-text zeilen">${teile.map(([t],i)=>`<span class="stelle${d.an.includes(i)?" an":""}${falsch.has(i)?" falsch":""}" data-i="${i}" role="button" tabindex="0">${t}</span>`).join(" ")}</div></div>${MLD}`;
    el.querySelectorAll(".stelle").forEach(s=>s.onclick=()=>{const i=+s.dataset.i,k=d.an.indexOf(i);if(k<0)d.an.push(i);else d.an.splice(k,1);falsch.clear();ctx.speichern();zeichne()});
  };
  zeichne();
  ctx.pruefer=()=>{const zuviel=d.an.filter(i=>!teile[i][1]),fehlt=teile.map((t,i)=>t[1]?i:-1).filter(i=>i>=0&&!d.an.includes(i));
    const r=bewerte(ctx,el,{leer:!d.an.length,leerText:"Tippe zuerst die verdächtigen Stellen an.",fehler:zuviel.length+fehlt.length,stand:d.an.slice().sort().join(),punkte,
      okText:`Richtig! Du hast alle gefunden. 🕵️<ul class="warum">${teile.filter(t=>t[1]).map(t=>`<li><b>${t[0]}</b> – ${t[2]||""}</li>`).join("")}</ul>`,
      markiere:()=>{falsch=new Set(zuviel);zeichne()}});
    if(!r&&!zuviel.length&&fehlt.length){meldung(el,false,`Gut so weit! Es fehlen noch <b>${fehlt.length}</b> verdächtige Stellen.`)}
    return r};
  ctx.loesung=()=>{d.an=teile.map((t,i)=>t[1]?i:-1).filter(i=>i>=0);zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Entscheidung: Situationen, in denen das Kind entscheidet, was es tun würde ----------
   entscheidung({titel,punkte,merke,szenen:[{bild:"💬",text:"…",optionen:[["Antwort",true,"Rückmeldung"],…]}]}) */
function entscheidung({titel,punkte=10,merke,text,szenen,frage:frage0}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.s=d.s||0;d.ok=d.ok||{};if(!d.reihen){d.reihen=szenen.map(s=>mischen(s.optionen.map((_,i)=>i)));ctx.speichern()}
  let weg=new Set();
  const zeichne=()=>{
    if(d.s>=szenen.length){el.innerHTML=kopfText(text)+`<div class="msg ok">✔️ Alle Situationen geschafft! Tippe auf „Weiter“.</div>`;return}
    const sz=szenen[d.s],gut=d.ok[d.s]!=null;
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Situation ${d.s+1} von ${szenen.length}</p>
      <div class="szene"><span class="sz-bild">${sz.bild||"💭"}</span><div class="sz-text">${sz.text}</div></div>
      <p class="frage">${sz.frage||frage0||"Was machst du?"}</p>
      <div class="antworten">${d.reihen[d.s].map(i=>{const [t,r]=sz.optionen[i];return`<button class="antwort${gut&&r?" richtig":""}${weg.has(i)?" falsch":""}" data-o="${i}" ${gut||weg.has(i)?"disabled":""}>${t}</button>`}).join("")}</div>${MLD}`;
    if(gut){const o=sz.optionen.find(o=>o[1]);meldung(el,true,`✔️ ${o[2]||"Richtig!"} <br><b>Tippe auf „Weiter“.</b>`)}
    el.querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{const i=+b.dataset.o,o=sz.optionen[i];
      if(o[1]){d.ok[d.s]=i;ctx.speichern();zeichne()}
      else{weg.add(i);ctx.fehler();zeichne();meldung(el,false,`✗ ${o[2]||"Das ist keine gute Idee."} Versuch es noch mal.`)}});
  };
  zeichne();
  ctx.pruefer=()=>{
    if(d.s>=szenen.length){ctx.geschafft(punkte);return true}
    if(d.ok[d.s]==null){meldung(el,false,"Tippe zuerst auf eine Antwort.");return false}
    d.s++;weg=new Set();ctx.speichern();
    if(d.s>=szenen.length){ctx.geschafft(punkte);return true}
    zeichne();scrollTo({top:0,behavior:"smooth"});return false};
  ctx.loesung=()=>{if(d.s<szenen.length){d.ok[d.s]=szenen[d.s].optionen.findIndex(o=>o[1]);zeichne()}};
}}}

/* ---------- Ordner-Explorer: durch Ordner klicken und an der richtigen Stelle speichern ----------
   ordnerPfad({titel,punkte,merke,text,datei:"🖼️ urlaub.jpg",baum:{"Bilder":{"Urlaub":{}},…},ziel:["Bilder","Urlaub"]}) */
function ordnerPfad({titel,punkte=10,merke,text,datei,baum,ziel}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.pfad=d.pfad||[];
  const ordner=p=>p.reduce((o,n)=>o[n],baum);
  const zeichne=()=>{
    const hier=ordner(d.pfad),kinder=Object.keys(hier);
    el.innerHTML=kopfText(text)+`<div class="explorer"><div class="ex-leiste"><button class="btn ghost klein-btn" id="hoch" ${d.pfad.length?"":"disabled"}>⬆️ Zurück</button>
      <div class="ex-pfad">💻 Dieser PC ${d.pfad.map(n=>`<span>›</span> 📁 ${n}`).join(" ")}</div></div>
      <div class="ex-inhalt">${kinder.map(n=>`<button class="ex-ordner" data-n="${esc(n)}"><span>📁</span>${n}</button>`).join("")||`<p class="muted" style="grid-column:1/-1">Dieser Ordner ist leer.</p>`}
      ${d.gespeichert&&d.gespeichert.join("/")===d.pfad.join("/")?`<div class="ex-datei">${datei}</div>`:""}</div>
      <div class="ex-speichern"><span>Datei: <b>${datei}</b></span><button class="btn" id="spei">💾 Hier speichern</button></div></div>${MLD}`;
    el.querySelector("#hoch").onclick=()=>{d.pfad.pop();ctx.speichern();zeichne()};
    el.querySelectorAll("[data-n]").forEach(b=>b.ondblclick=b.onclick=()=>{d.pfad.push(b.dataset.n);ctx.speichern();zeichne()});
    el.querySelector("#spei").onclick=()=>{d.gespeichert=d.pfad.slice();ctx.speichern();zeichne();
      meldung(el,true,`💾 Gespeichert in: Dieser PC › ${d.pfad.join(" › ")||"(ganz oben)"}. Wenn das richtig ist, tippe auf „Weiter“.`)};
  };
  zeichne();
  ctx.pruefer=()=>bewerte(ctx,el,{leer:!d.gespeichert,leerText:"Geh in den richtigen Ordner und tippe auf „💾 Hier speichern“.",fehler:d.gespeichert&&d.gespeichert.join("/")===ziel.join("/")?0:1,stand:(d.gespeichert||[]).join("/"),punkte,okText:"Richtig gespeichert! 🎉 So findest du die Datei immer wieder."});
  ctx.loesung=()=>{d.pfad=ziel.slice();d.gespeichert=ziel.slice();zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Eingabe: ein Wort oder eine Zahl eintippen ----------
   eingabe({titel,punkte,merke,text,html,antwort:"HALLO" oder ["…","…"],gross:true,zahl:false,platz:"?"}) */
function eingabe({titel,punkte=10,merke,text,html="",antwort,zahl,platz="Deine Antwort",laenge,egal}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;const norm=v=>{v=String(v).trim();return egal==="nichts"?v:v.toUpperCase().replace(/\s+/g," ")};
  const gut=(Array.isArray(antwort)?antwort:[antwort]).map(norm);
  el.innerHTML=kopfText(text)+html+`<div class="eing"><input type="text" ${zahl?'inputmode="numeric"':""} autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${platz}" ${laenge?`maxlength="${laenge}"`:""} value="${esc(d.v||"")}"></div>${MLD}`;
  const inp=el.querySelector(".eing input");inp.oninput=()=>{d.v=inp.value;ctx.speichern()};
  inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();document.getElementById("weiter")?.click()}};
  ctx.pruefer=()=>bewerte(ctx,el,{leer:!inp.value.trim(),leerText:"Tippe zuerst deine Antwort ins Feld.",fehler:gut.includes(norm(inp.value))?0:1,stand:norm(inp.value),punkte,okText:"Richtig! 🎉"});
  ctx.loesung=()=>{inp.value=Array.isArray(antwort)?antwort[0]:antwort;d.v=inp.value};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Tipp-Training: Zeilen abtippen, Tastatur zeigt den nächsten Buchstaben und den Finger ---------- */
const TAST_REIHEN=["1234567890ß","qwertzuiopü","asdfghjklöä","yxcvbnm,.-"];
const FINGER={};["1qay","2wsx","3edc","4rfv5tgb","6zhn7ujm","8ik,","9ol.","0pöäüß-"].forEach((g,f)=>[...g].forEach(c=>FINGER[c]=f));
const FINGER_NAME=["kleiner Finger links","Ringfinger links","Mittelfinger links","Zeigefinger links","Zeigefinger rechts","Mittelfinger rechts","Ringfinger rechts","kleiner Finger rechts"];
function tastaturBild(naechst){
  const k=(naechst||"").toLowerCase(),gross=naechst&&naechst!==k;
  return`<div class="tastatur">${TAST_REIHEN.map((r,ri)=>`<div class="t-reihe" style="padding-left:${ri*14}px">${ri===3?`<span class="taste breit${gross?" naechst":""}">⇧</span>`:""}${[...r].map(c=>`<span class="taste f${FINGER[c]}${c===k?" naechst":""}${c==="f"||c==="j"?" huegel":""}">${c==="ß"?"ß":c.toUpperCase()}</span>`).join("")}</div>`).join("")}
    <div class="t-reihe"><span class="taste leer${naechst===" "?" naechst":""}">Leertaste</span></div></div>`;
}
function tippen({titel,punkte=15,merke,text,zeilen,zeigeTastatur=true,rennen}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.z=d.z||0;d.p=d.p||0;d.f=d.f||0;
  const fertig=()=>d.z>=zeilen.length;
  const zeichne=(blitz)=>{
    if(fertig()){el.innerHTML=kopfText(text)+`<div class="msg ok">✔️ Alles abgetippt! Fehler: ${d.f}${d.zeit?` · Zeit: ${Math.round(d.zeit/1000)} Sek.`:""}. Tippe auf „Weiter“.</div>`;return}
    const z=zeilen[d.z],c=z[d.p];
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Zeile ${d.z+1} von ${zeilen.length} · Fehler: ${d.f}${c&&FINGER[c.toLowerCase()]!=null?` · nimm den <b style="text-transform:none">${FINGER_NAME[FINGER[c.toLowerCase()]]}</b>`:""}</p>
      <div class="tippzeile${blitz?" blitz":""}">${[...z].map((x,i)=>`<span class="${i<d.p?"ok":i===d.p?"jetzt":""}">${x===" "?"␣":esc(x)}</span>`).join("")}</div>
      <p class="muted small">Einfach lostippen – die Seite hört zu. Kein Klick nötig.</p>
      ${zeigeTastatur?tastaturBild(c):""}${MLD}`;
  };
  const taste=e=>{
    if(fertig()||e.ctrlKey||e.altKey||e.metaKey||e.key.length!==1)return;
    if(document.activeElement&&/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
    e.preventDefault();if(!d.start)d.start=Date.now();
    const z=zeilen[d.z];
    if(e.key===z[d.p]){d.p++;if(d.p>=z.length){d.z++;d.p=0;if(fertig()){d.zeit=Date.now()-d.start;
        const p=Math.max(Math.ceil(punkte/2),punkte-Math.floor(d.f/4));ctx.speichern();ctx.geschafft(p)}}zeichne()}
    else{d.f++;zeichne(true)}
    ctx.speichern();
  };
  document.addEventListener("keydown",taste);ctx.beimVerlassen(()=>document.removeEventListener("keydown",taste));
  zeichne();
  ctx.pruefer=()=>{if(fertig()){ctx.geschafft(Math.max(Math.ceil(punkte/2),punkte-Math.floor(d.f/4)));return true}meldung(el,false,"Tippe zuerst alle Zeilen ab.");return false};
  ctx.loesung=()=>{d.z=zeilen.length;d.zeit=d.zeit||1;zeichne()};
}}}

/* ---------- Tasten-Missionen: echte Tasten und Tastenkürzel in einem Übungsfeld ausprobieren ----------
   tastenMissionen({titel,punkte,merke,text,start:"Text im Feld",missionen:[{text:"…",tasten:["Strg","C"],test:e=>…}]}) */
function tastenMissionen({titel,punkte=15,merke,text,start="",missionen}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.m=d.m||0;
  const zeichne=()=>{
    const fertig=d.m>=missionen.length,ms=missionen[d.m];
    el.innerHTML=kopfText(text)+`<div class="missionen">${missionen.map((x,i)=>`<div class="mission${i<d.m?" ok":i===d.m?" jetzt":""}"><span class="mnr">${i<d.m?"✔️":i+1}</span><span>${x.text}</span><span class="kappen">${x.tasten.map(t=>`<kbd>${t}</kbd>`).join("<i>+</i>")}</span></div>`).join("")}</div>
      ${fertig?`<div class="msg ok">✔️ Alle Missionen geschafft! Tippe auf „Weiter“.</div>`:`<p class="eyebrow" style="margin-top:12px">Mission ${d.m+1}: ${ms.text}</p>`}
      <textarea class="uebfeld" spellcheck="false" placeholder="Hier ist dein Übungsfeld">${esc(d.feld??start)}</textarea>${MLD}`;
    const f=el.querySelector(".uebfeld");
    f.oninput=()=>{d.feld=f.value;ctx.speichern()};
    f.onkeydown=e=>{
      if((e.ctrlKey||e.metaKey)&&["s","p","f","d","h","w","n","t"].includes(e.key.toLowerCase()))e.preventDefault();
      const ms=missionen[d.m];if(!ms)return;
      if(ms.test(e,f)){setTimeout(()=>{d.feld=f.value;d.m++;ctx.speichern();zeichne();const g=el.querySelector(".uebfeld");g.focus();
        if(d.m>=missionen.length)ctx.geschafft(punkte);else toast("✔️ Mission geschafft!")},ms.verzoegert?150:30)}};
    if(!fertig)setTimeout(()=>f.focus(),50);
  };
  zeichne();
  ctx.pruefer=()=>{if(d.m>=missionen.length){ctx.geschafft(punkte);return true}meldung(el,false,`Mach zuerst alle Missionen. Du bist bei Mission ${d.m+1}.`);return false};
  ctx.loesung=()=>{d.m=missionen.length;zeichne()};
}}}
const strg=b=>e=>(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===b;

/* ---------- Maus-Parcours: Klick, Doppelklick, Rechtsklick, Ziehen ----------
   mausParcours({titel,punkte,merke,text,aufgaben:["klick","doppel","rechts","ziehen",…]}) */
const MAUS={klick:{ico:"⭐",t:"<b>Klick</b> einmal auf den Stern ⭐ (linke Maustaste)"},doppel:{ico:"📦",t:"<b>Doppelklick</b> auf die Kiste 📦 (zweimal ganz schnell links klicken)"},
  rechts:{ico:"🎁",t:"<b>Rechtsklick</b> auf das Geschenk 🎁 (rechte Maustaste)"},ziehen:{ico:"🍎",t:"<b>Zieh</b> den Apfel 🍎 in den Korb 🧺 (Taste gedrückt halten und schieben)"}};
function mausParcours({titel,punkte=10,merke,text,aufgaben}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.n=d.n||0;let tipp=0;
  const zeichne=()=>{
    if(d.n>=aufgaben.length){el.innerHTML=kopfText(text)+`<div class="msg ok">✔️ Parcours geschafft! Tippe auf „Weiter“.</div>`;return}
    const a=aufgaben[d.n],m=MAUS[a],x=8+Math.random()*70,y=12+Math.random()*58;
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Aufgabe ${d.n+1} von ${aufgaben.length}</p><p class="frage">${m.t}</p>
      <div class="arena">${a==="ziehen"?`<span class="ziel" style="left:${x>50?8:70}%;top:40%">🧺</span>`:""}<span class="mz" style="left:${x}%;top:${y}%">${m.ico}</span></div>${MLD}`;
    const z=el.querySelector(".mz"),ar=el.querySelector(".arena");
    const gut=()=>{z.classList.add("treffer");d.n++;ctx.speichern();setTimeout(()=>{zeichne();if(d.n>=aufgaben.length)ctx.geschafft(punkte)},350)};
    const hinweis=t=>{if(Date.now()-tipp>1500){tipp=Date.now();meldung(el,false,t)}};
    if(a==="klick")z.onclick=gut;
    if(a==="doppel"){z.ondblclick=gut;z.onclick=()=>setTimeout(()=>{if(z.isConnected&&!z.classList.contains("treffer"))hinweis("Das war ein einfacher Klick. Du brauchst einen <b>Doppelklick</b>: zweimal ganz schnell!")},450)}
    if(a==="rechts"){z.oncontextmenu=e=>{e.preventDefault();gut()};z.onclick=()=>hinweis("Das war die linke Taste. Nimm die <b>rechte</b> Maustaste!")}
    ar.oncontextmenu=e=>e.preventDefault();
    if(a==="ziehen"){const korb=el.querySelector(".ziel");let ziehe=false;
      z.onpointerdown=e=>{ziehe=true;z.setPointerCapture(e.pointerId);e.preventDefault()};
      z.onpointermove=e=>{if(!ziehe)return;const r=ar.getBoundingClientRect();z.style.left=((e.clientX-r.left)/r.width*100-4)+"%";z.style.top=((e.clientY-r.top)/r.height*100-8)+"%"};
      z.onpointerup=e=>{if(!ziehe)return;ziehe=false;const a1=z.getBoundingClientRect(),b1=korb.getBoundingClientRect();
        const cx=a1.left+a1.width/2,cy=a1.top+a1.height/2;
        if(cx>b1.left-10&&cx<b1.right+10&&cy>b1.top-10&&cy<b1.bottom+10)gut();else hinweis("Fast! Lass den Apfel genau <b>über dem Korb</b> los.")}}
  };
  zeichne();
  ctx.pruefer=()=>{if(d.n>=aufgaben.length){ctx.geschafft(punkte);return true}meldung(el,false,"Mach zuerst alle Aufgaben im Parcours.");return false};
  ctx.loesung=()=>{d.n=aufgaben.length;zeichne()};
}}}

/* ---------- Mal-Roboter: ein Programm Schritt für Schritt ausführen und das Ergebnis malen ----------
   malRoboter({titel,punkte,merke,text,w,h,programm:"R R M D M …"})  R/L/U/D = Schritt, M = Feld anmalen. Start oben links. */
const MALBEF={R:"➡️",L:"⬅️",U:"⬆️",D:"⬇️",M:"🖌️"};
/* Programm-Text: "R M D M" oder mit Wiederholung "3x(R M)" */
const malTeile=t=>{const out=[];const re=/(\d+)x\(([^)]*)\)|([RLUDM])/g;let m;while((m=re.exec(t))){if(m[3])out.push(m[3]);else out.push({w:+m[1],k:m[2].trim().split(/\s+/)})}return out};
const malFlach=t=>malTeile(t).flatMap(x=>typeof x==="string"?[x]:Array.from({length:x.w},()=>x.k).flat());
function malRoboter({titel,punkte=15,merke,text,w=6,h=6,programm}){return{titel,punkte,merke,zeige(el,ctx){
  const bef=malFlach(programm),soll=Array(w*h).fill(0);let x=0,y=0;
  bef.forEach(b=>{if(b==="R")x++;if(b==="L")x--;if(b==="U")y--;if(b==="D")y++;if(b==="M")soll[y*w+x]=1});
  const d=ctx.daten;
  const liste=malTeile(programm).map(t=>typeof t==="string"?`<li>${MALBEF[t]}</li>`:`<li class="loop"><span>🔁 ${t.w}×</span>${t.k.map(b=>MALBEF[b]).join("")}</li>`).join("");
  el.innerHTML=kopfText(text||"Du bist der Roboter! Er startet <b>oben links</b> 🤖. Führe das Programm Schritt für Schritt aus: ➡️⬅️⬆️⬇️ = ein Feld gehen, 🖌️ = das Feld anmalen, auf dem du gerade stehst.")+`
    <div class="paar" style="margin-top:12px"><div><p class="eyebrow">Programm</p><ol class="programm">${liste}</ol></div><div><p class="eyebrow">Dein Bild</p><div id="mr"></div></div></div>
    <div class="row" style="margin-top:12px"><button class="btn ghost" id="mrl">Alles löschen</button></div>${MLD}`;
  const r=pixelRaster({w,h,werte:d.bild,palette:["#FFFFFF","#1B1B1F"],malbar:true,onAenderung:v=>{d.bild=v.slice();ctx.speichern()}});
  r.el.classList.add("start-ol");el.querySelector("#mr").append(r.el);
  el.querySelector("#mrl").onclick=()=>{if(confirm("Wirklich alles löschen?"))r.setzeAlle(Array(w*h).fill(0))};
  ctx.pruefer=()=>{const fs=soll.map((v,k)=>r.werte[k]!==v?k:-1).filter(k=>k>=0);
    return bewerte(ctx,el,{leer:r.werte.every(v=>!v),leerText:"Mal zuerst, was der Roboter malt.",fehler:fs.length,stand:r.werte.join(""),punkte,okText:"Richtig! Du hast das Programm genau ausgeführt – wie ein Computer. 🤖",markiere:()=>r.markiere(fs)})};
  ctx.loesung=()=>r.setzeAlle(soll);
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Info: ein reiner Erklär-Teil mit großem Bild (zählt 0 Punkte) ---------- */
function info({titel,html,merke}){return{titel,punkte:0,merke,zeige(el,ctx){el.innerHTML=`<div class="block info">${html}</div>`;ctx.geschafft(0)}}}
