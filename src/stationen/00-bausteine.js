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
function schonGeloest(el){meldung(el,true,"Schon gelöst. Tippe auf „Weiter“.")}
/* Einheitliche Bewertung: leer → Hinweis ohne Abzug; Fehler → 2 Punkte Abzug (nur einmal pro gleichem Stand); ab 2. Versuch Fehler markieren */
function bewerte(ctx,el,{leer,leerText,fehler,stand,punkte,okText,markiere}){
  if(leer){meldung(el,false,leerText||"Mach zuerst die Aufgabe, dann tippe auf „Weiter“.");return false}
  if(!fehler){meldung(el,true,okText||"Richtig!");ctx.geschafft(punkte);return true}
  const d=ctx.daten;
  if(stand!==d.letzterFehler){ctx.fehler();d.letzterFehler=stand;d.versuche=(d.versuche||0)+1;ctx.speichern()}
  let t=fehler===1?"Fast! Noch <b>1 Fehler</b>.":`Noch <b>${fehler} Fehler</b>.`;
  if(stand===d.letzterFehler&&d.versuche&&markiere&&d.versuche>=2){markiere();t+=" Die falschen sind jetzt <b style='color:var(--bad)'>rot</b> markiert."}
  else t+=" Schau noch mal genau hin.";
  meldung(el,false,t);return false;
}

/* ---------- Eigene Symbole (Strichzeichnungen in Textfarbe): ruhiger als Emojis, drucken in Schwarz-Weiß ---------- */
const SVG=(inh,px=28)=>`<svg class="ic" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inh}</svg>`;
const IC={ordner:'<path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9a1.5 1.5 0 0 0-1.5-1.5H12L10 5H4.5A1.5 1.5 0 0 0 3 6.5z"/>',
  blatt:'<path d="M6 2.5h8l4.5 4.5v13.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1z"/><path d="M14 2.5V7h4.5"/>',
  laptop:'<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19.5h20"/>',pc:'<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8.5 20h7M12 16v4"/>',
  stick:'<rect x="8" y="9" width="8" height="12" rx="1.5"/><path d="M10 9V3.5h4V9"/>',korb:'<path d="M4 7h16M9.5 7V4h5v3M6 7l1 13.5h10L18 7M10 11v6M14 11v6"/>',
  lupe:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',telefon:'<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  stecker:'<path d="M9 2.5v5M15 2.5v5M6.5 7.5h11v4a5.5 5.5 0 0 1-11 0zM12 17v4.5"/>',platte:'<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="12" cy="12" r="3.2"/><path d="M16.5 16.5h.01"/>',
  chip:'<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3"/>',schloss:'<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'};
const GL={bild:'<path d="M8 18l3-4 2 2.5 1.2-1.2L16 18z"/><circle cx="9.7" cy="11.5" r=".8"/>',video:'<path d="M10 11.5v6l5-3z"/>',musik:'<path d="M11 17.5v-6l4-1v6"/><circle cx="9.8" cy="17.5" r="1.2"/><circle cx="13.8" cy="16.5" r="1.2"/>',
  text:'<path d="M8.5 11.5h7M8.5 14.5h7M8.5 17.5h4"/>',prog:'<circle cx="12" cy="14.5" r="2.6"/><path d="M12 10.4v1.5M12 17.1v1.5"/>'};
const dateiArt=n=>/\.(jpe?g|png)\b/i.test(n)?"bild":/\.mp4\b/i.test(n)?"video":/\.mp3\b/i.test(n)?"musik":/\.exe\b/i.test(n)?"prog":"text";
const dico=(name,px=28)=>SVG(IC.blatt+GL[dateiArt(name)],px);
const sym=(n,px=28)=>SVG(IC[n],px);
/* Nachricht einer Figur (Rahmengeschichte): Pixelbild + ruhige Sprechblase */
const nachricht=(wer,bild,t)=>`<div class="figur"><span class="nb">${pix(bild,34)}</span><div><span class="nv">${wer}</span><p>${t}</p></div></div>`;
const kopfText=t=>t?`<div class="regel">${t}</div>`:"";

/* ---------- Sortieren: Karten in Kästen verteilen (antippen oder ziehen) ----------
   sortieren({titel,punkte,merke,text,toepfe:[["id","Name","🙂"]],karten:[["Text","🙂","zielId"]],warum:"Erklärung nach dem Lösen"}) */
function sortieren({titel,punkte=10,merke,text,toepfe,karten,warum,breit,art="Sortieren"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.wo=d.wo||{};if(!d.reihe){d.reihe=mischen(karten.map((_,i)=>i));ctx.speichern()}
  let wahl=null,falsch=new Set();
  const karte=i=>{const [t,ico]=karten[i];return`<button class="karte${wahl===i?" an":""}${falsch.has(i)?" falsch":""}" data-i="${i}" draggable="true">${ico?`<span class="kico">${ico}</span>`:""}<span>${t}</span></button>`};
  const zeichne=()=>{
    const frei=d.reihe.filter(i=>d.wo[i]==null);
    el.innerHTML=kopfText(text)+`
      <p class="eyebrow" style="margin-top:12px">${frei.length?`Tippe eine Karte an, dann den passenden Kasten · noch ${frei.length}`:"Alle verteilt! Tippe auf „Weiter“."}</p>
      <div class="sortier"><div class="karten">${frei.map(karte).join("")}</div>
      <div class="toepfe${breit?" breit":""}" style="--n:${toepfe.length}">${toepfe.map(([id,name,ico])=>`<div class="topf${wahl!=null?" bereit":""}" data-t="${id}"><div class="topf-kopf">${ico?`<span>${ico}</span>`:""}${name}</div><div class="topf-inhalt">${d.reihe.filter(i=>d.wo[i]===id).map(karte).join("")}</div></div>`).join("")}</div></div>${MLD}`;
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
      okText:`Richtig! Alles passt.${warum?`<div class="aha" style="margin-top:10px"><b>💡</b> ${warum}</div>`:""}`,markiere:()=>{falsch=new Set(fs);zeichne()}})};
  ctx.loesung=()=>{karten.forEach((k,i)=>d.wo[i]=k[2]);wahl=null;falsch.clear();zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Reihenfolge: Schritte in die richtige Reihenfolge bringen ----------
   reihenfolge({titel,punkte,merke,text,schritte:["erst","dann",…]})  (in richtiger Reihenfolge angeben) */
function reihenfolge({titel,punkte=10,merke,text,schritte,art="Reihenfolge"}){return{titel,punkte,merke,art,zeige(el,ctx){
  /* Schritt für Schritt: Das Kind wählt immer nur den NÄCHSTEN Schritt und erfährt sofort, ob er stimmt.
     (Früher: erst alles einordnen, dann prüfen – das war für viele zu schwer.) */
  const d=ctx.daten;if(!d.reihe){d.reihe=mischenAnders(schritte.map((_,i)=>i));ctx.speichern()}
  d.gew=(d.gew||[]).filter((x,k)=>x===k);   // nur der richtige Anfang zählt (auch bei alten Ständen)
  const n=schritte.length,WORT=["Erstes","Zweites","Drittes","Viertes","Fünftes","Sechstes","Siebtes","Achtes"];
  let falsch=-1;
  const zeichne=()=>{
    const k=d.gew.length,fertig=k>=n,frei=d.reihe.filter(i=>!d.gew.includes(i));
    const tipp=fertig?`<span class="pschritt">✓</span> Alle Schritte stehen in der richtigen Reihenfolge. Tippe unten auf „Weiter“.`
      :`<span class="pschritt">${k+1}</span> Was kommt als <b>${WORT[k]||(k+1)+"."}</b>? Klick den Schritt links an.`;
    el.innerHTML=kopfText(text)+`<p class="paar-tipp">${tipp}</p>
      <div class="paar"><div><p class="eyebrow">Diese Schritte fehlen noch</p><div class="karten spalte">${frei.map(i=>`<button class="karte${falsch===i?" falsch":""}" data-f="${i}">${schritte[i]}</button>`).join("")||`<p class="muted">Alle eingeordnet.</p>`}</div></div>
      <div><p class="eyebrow">Die richtige Reihenfolge</p><ol class="reihe fest">${schritte.map((_,q)=>q<k?`<li class="ok">${schritte[q]}</li>`:`<li class="leer${q===k?" dran":""}">${q===k?"Hier kommt der nächste Schritt hin":"…"}</li>`).join("")}</ol></div></div>${MLD}`;
    el.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{const i=+b.dataset.f;
      if(i===d.gew.length){d.gew.push(i);falsch=-1;ctx.speichern();zeichne();
        if(d.gew.length>=n){meldung(el,true,"Richtig. Die Reihenfolge stimmt.");ctx.geschafft(punkte)}
        else meldung(el,true,"Richtig! Und was kommt danach?")}
      else{falsch=i;ctx.fehler();zeichne();
        meldung(el,false,i<d.gew.length?"Der Schritt ist schon eingeordnet.":"Das kommt erst <b>später</b>. Überleg: Was muss man <b>vorher</b> machen?")}});
  };
  zeichne();
  ctx.pruefer=()=>{if(d.gew.length>=n){ctx.geschafft(punkte);return true}meldung(el,false,"Ordne zuerst alle Schritte ein. Klick links den nächsten Schritt an.");return false};
  ctx.loesung=()=>{d.gew=schritte.map((_,i)=>i);zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Tempo-Runde: einen kurzen Satz auf Zeit tippen (Stoppuhr, eigener Rekord) ----------
   tippTempo({titel,punkte,text,satz}) – volle Punkte fürs Schaffen; die Zeit ist nur Ansporn */
function tippTempo({titel,punkte=10,merke,text,satz,art="Tippen"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;let p=0,f=0,start=0,ende=0,timer=null,neuRekord=false;
  const mmss=ms=>{const t=Math.floor(ms/1000);return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`};
  const uhr=()=>{const u=el.querySelector(".tempo-uhr");if(u)u.textContent="⏱ "+mmss(start?(ende||Date.now())-start:0)};
  const zeichne=blitz=>{
    const fertig=!!ende;
    el.innerHTML=kopfText(text)+`
      <div class="tempo-kopf"><span class="tempo-uhr">⏱ 0:00</span><span>${d.best?`Dein Rekord: <b>${mmss(d.best)}</b>`:"Noch kein Rekord"}</span></div>
      <div class="tippzeile${blitz?" blitz":""}">${[...satz].map((x,i)=>`<span class="${i<p?"ok":i===p&&!fertig?"jetzt":""}">${x===" "?"␣":esc(x)}</span>`).join("")}</div>
      ${fertig?`<div class="msg ok">${neuRekord?"<b>Neuer Rekord!</b> ":""}Geschafft in <b>${Math.round((ende-start)/1000)} Sekunden</b>. Das sind ${Math.round(satz.length/((ende-start)/60000))} Anschläge pro Minute. Tippfehler: ${f}.</div>
        <button class="btn ghost" id="tnoch" style="margin-top:10px">Noch einmal: Rekord knacken</button>`
        :`<p class="muted small">Einfach lostippen. Die Uhr startet mit dem ersten Buchstaben.</p>`}${MLD}`;
    uhr();
    const b=el.querySelector("#tnoch");if(b)b.onclick=()=>{p=0;f=0;start=0;ende=0;neuRekord=false;zeichne()};
  };
  const taste=e=>{
    if(ende||e.ctrlKey||e.altKey||e.metaKey||e.key.length!==1)return;
    if(document.activeElement&&/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
    e.preventDefault();
    if(!start){start=Date.now();timer=setInterval(uhr,250)}
    if(e.key===satz[p]){p++;
      if(p>=satz.length){ende=Date.now();clearInterval(timer);const t=ende-start;
        neuRekord=!!d.best&&t<d.best;if(!d.best||t<d.best)d.best=t;d.runden=(d.runden||0)+1;ctx.speichern();ctx.geschafft(punkte)}
      zeichne()}
    else{f++;zeichne(true)}
  };
  document.addEventListener("keydown",taste);ctx.beimVerlassen(()=>{document.removeEventListener("keydown",taste);clearInterval(timer)});
  zeichne();
  ctx.pruefer=()=>{if(d.best){ctx.geschafft(punkte);return true}meldung(el,false,"Tippe zuerst den Satz einmal ganz ab.");return false};
  ctx.loesung=()=>{d.best=d.best||20000;p=satz.length;start=Date.now()-20000;ende=Date.now();zeichne()};
}}}

/* ---------- Vorlage: ein Satz oder Text, den das Kind bearbeiten soll – bewusst NICHT fett, damit Fettdruck in der Aufgabe wertvoll bleibt ---------- */
const vorlage=(t,label="So steht es da")=>`<div class="vorlage"><span class="vl">${label}</span><p>${t}</p></div>`;

/* ---------- Lückentext mit Wortkasten (Merk-Check am Ende einer Station) ----------
   luecken({titel,punkte,text,saetze:["Die {Maus} ist ein {Eingabegerät}."],extra:["Drucker"]})
   Wort antippen → es springt in die nächste freie Lücke. Lücke antippen → Wort geht zurück. */
function luecken({titel,punkte=15,merke,text,saetze,extra=[],art="Merk-Check"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;const teile=[],soll=[];
  saetze.forEach(z=>{const t=[];z.split(/(\{[^}]+\})/).forEach(x=>{if(/^\{.*\}$/.test(x)){t.push(soll.length);soll.push(x.slice(1,-1))}else if(x)t.push(x)});teile.push(t)});
  const woerter=[...soll,...extra];
  if(!d.reihe||d.reihe.length!==woerter.length){d.reihe=mischen(woerter.map((_,i)=>i));d.f={};ctx.speichern()}
  d.f=d.f||{};let falsch=new Set(),wahl=null;
  const benutzt=()=>new Set(Object.values(d.f));
  const frei=()=>soll.map((_,g)=>g).filter(g=>d.f[g]==null);
  const zeichne=()=>{
    const b=benutzt(),offen=frei(),ziel=wahl!=null&&d.f[wahl]==null?wahl:offen[0];
    el.innerHTML=kopfText(text||"Setz die Wörter aus dem Wortkasten in die Lücken. Tippe ein Wort an – es springt in die markierte Lücke.")+`
      <div class="wortkasten">${d.reihe.map(i=>`<button class="wort${b.has(i)?" weg":""}" data-w="${i}" ${b.has(i)?"disabled":""}>${esc(woerter[i])}</button>`).join("")}</div>
      <div class="ltext">${teile.map(t=>`<p>${t.map(x=>typeof x==="number"?`<button class="luecke${d.f[x]!=null?" voll":""}${x===ziel?" ziel":""}${falsch.has(x)?" falsch":""}" data-g="${x}">${d.f[x]!=null?esc(woerter[d.f[x]]):"&nbsp;"}</button>`:esc(x)).join("")}</p>`).join("")}</div>${MLD}`;
    el.querySelectorAll("[data-w]").forEach(k=>k.onclick=()=>{const o=frei();if(!o.length)return;const g=wahl!=null&&d.f[wahl]==null?wahl:o[0];
      d.f[g]=+k.dataset.w;wahl=null;falsch.delete(g);ctx.speichern();zeichne()});
    el.querySelectorAll("[data-g]").forEach(k=>k.onclick=()=>{const g=+k.dataset.g;
      if(d.f[g]!=null){delete d.f[g];falsch.delete(g);wahl=g;ctx.speichern()}else wahl=g;zeichne()});
  };
  zeichne();
  ctx.pruefer=()=>{const fs=soll.map((w,g)=>d.f[g]!=null&&woerter[d.f[g]]===w?-1:g).filter(g=>g>=0);
    return bewerte(ctx,el,{leer:frei().length>0,leerText:"Füll zuerst alle Lücken.",fehler:fs.length,stand:soll.map((_,g)=>d.f[g]).join(),punkte,
      okText:"Richtig. Alle Lücken stimmen.",markiere:()=>{falsch=new Set(fs);zeichne()}})};
  ctx.loesung=()=>{d.f={};soll.forEach((w,g)=>{d.f[g]=woerter.findIndex((x,i)=>x===w&&!Object.values(d.f).includes(i))});zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Die geheime Maschine: EVA zum Ausprobieren ----------
   maschine({titel,punkte,text,runden:[{f:x=>x*2,regel:"mal 2",falsch:["plus 2","plus 4"]}]})
   Das Kind gibt Zahlen ein, sieht die Ausgabe und findet heraus, was die Verarbeitung macht. */
function maschine({titel,punkte=15,merke,text,runden,wort,art="Ausprobieren"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.r=d.r||0;d.v=d.v||[];
  const zeichne=()=>{
    if(d.r>=runden.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alle ${runden.length} Maschinen durchschaut. Tippe auf „Weiter“.</div>`;return}
    const R=runden[d.r];if(!d.opt||d.opt.length!==R.falsch.length+1){d.opt=mischen([R.regel,...R.falsch])}
    const genug=d.v.length>=3;
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Maschine ${d.r+1} von ${runden.length}</p>
      <div class="eva-m"><div class="eva-k"><span>Eingabe</span><input type="text" ${wort?'maxlength="12" autocapitalize="off" spellcheck="false" placeholder="Wort"':'inputmode="numeric" maxlength="3" placeholder="Zahl"'} autocomplete="off" id="mz"></div>
        <i>→</i><div class="eva-k mitte"><span>Verarbeitung</span><b class="zahnrad">${sym("chip",34)}</b></div><i>→</i>
        <div class="eva-k"><span>Ausgabe</span><b id="ma">${d.v.length?R.f(d.v[d.v.length-1]):"…"}</b></div>
        <button class="btn" id="ml">Los</button></div>
      ${d.v.length?`<table class="liste eva-t"><thead><tr><th>Eingabe</th>${d.v.map(x=>`<td>${x}</td>`).join("")}</tr></thead><tbody><tr><th>Ausgabe</th>${d.v.map(x=>`<td><b>${R.f(x)}</b></td>`).join("")}</tr></tbody></table>`:""}
      <p class="frage" style="margin-top:16px">Was macht die Maschine mit ${wort?"dem Wort":"der Zahl"}?</p>
      ${genug?`<div class="karten">${d.opt.map((o,i)=>`<button class="karte" data-o="${i}">${wort?"Sie":"Sie rechnet"} <b>${o}</b></button>`).join("")}</div>`
        :`<p class="muted">Probier zuerst <b>${3-d.v.length}</b> ${wort?(d.v.length===2?"weiteres Wort":d.v.length?"weitere Wörter":"verschiedene Wörter"):(d.v.length===2?"weitere Zahl":d.v.length?"weitere Zahlen":"verschiedene Zahlen")} aus. Dann kannst du antworten.</p>`}${MLD}`;
    const inp=el.querySelector("#mz"),los=()=>{const x=wort?inp.value.trim():parseInt(inp.value,10);
      if(wort?!/^[a-zäöüßA-ZÄÖÜ]{2,12}$/.test(x):(isNaN(x)||x<0||x>999)){meldung(el,false,wort?"Tippe ein Wort ins Feld <b>Eingabe</b>. Nur Buchstaben.":"Tippe eine Zahl von 0 bis 999 ins Feld <b>Eingabe</b>.");inp.focus();return}
      if(!d.v.includes(x))d.v.push(x);else{d.v=d.v.filter(y=>y!==x);d.v.push(x)}
      if(d.v.length>8)d.v.shift();ctx.speichern();zeichne();el.querySelector("#mz").focus()};
    el.querySelector("#ml").onclick=los;inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();los()}};
    el.querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{
      if(d.opt[+b.dataset.o]===R.regel){d.r++;d.v=[];d.opt=null;ctx.speichern();zeichne();
        if(d.r>=runden.length)ctx.geschafft(punkte);else meldung(el,true,`Richtig: Die Maschine ${wort?"":"rechnete "}<b>${R.regel}</b>. Hier kommt die nächste.`)}
      else{ctx.fehler();b.classList.add("falsch");meldung(el,false,wort?"Das passt nicht zu allen Wörtern. Schau in die Tabelle und probier noch ein Wort aus.":"Das passt nicht zu allen Zahlen. Schau in die Tabelle und probier noch eine Zahl aus.")}});
  };
  zeichne();
  ctx.pruefer=()=>{if(d.r>=runden.length){ctx.geschafft(punkte);return true}meldung(el,false,"Finde zuerst bei allen Maschinen heraus, was sie rechnen.");return false};
  ctx.loesung=()=>{d.r=runden.length;zeichne()};
}}}


/* ---------- Was bin ich? Rätsel mit Hinweisen, die man nach und nach aufdeckt (auf dunkler Tafel) ----------
   raetsel({titel,punkte,text,runden:[{hinweise:["…","…","…"],antwort:["Maus"]}]})  Mehr Hinweise kosten nichts, nur falsche Antworten. */
function raetsel({titel,punkte=10,merke,text,runden,art="Rätsel"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.r=d.r||0;d.h=d.h||1;
  const norm=v=>String(v||"").trim().toLowerCase().replace(/^(der|die|das|eine?)\s+/,"").replace(/[\s+-]+/g,"");
  const zeichne=()=>{
    if(d.r>=runden.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alle ${runden.length} Rätsel gelöst. Tippe auf „Weiter“.</div>`;return}
    const R=runden[d.r],n=Math.min(d.h,R.hinweise.length);
    el.innerHTML=kopfText(text)+`<div class="tafel"><p class="eyebrow">Rätsel ${d.r+1} von ${runden.length}</p>
      <ol class="hinweise">${R.hinweise.slice(0,n).map(h=>`<li>${h}</li>`).join("")}</ol>
      ${n<R.hinweise.length?`<button class="btn ghost" id="mehr">Noch ein Hinweis</button>`:""}
      <div class="eing" style="margin-top:14px"><input type="text" id="ra" placeholder="Was bin ich?" autocomplete="off" spellcheck="false" maxlength="30" value="${esc(d.v||"")}"></div></div>${MLD}`;
    const m=el.querySelector("#mehr");if(m)m.onclick=()=>{d.h++;ctx.speichern();zeichne()};
    const inp=el.querySelector("#ra");inp.oninput=()=>{d.v=inp.value;ctx.speichern()};
    inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();document.getElementById("weiter")?.click()}};
  };
  zeichne();
  ctx.pruefer=()=>{if(d.r>=runden.length){ctx.geschafft(punkte);return true}
    const R=runden[d.r],v=norm(d.v);
    if(!v){meldung(el,false,"Schreib deine Antwort ins Feld.");return false}
    if(R.antwort.map(norm).includes(v)){const w=R.antwort[0];d.r++;d.h=1;d.v="";ctx.speichern();
      if(d.r>=runden.length){zeichne();ctx.geschafft(punkte);return true}
      zeichne();meldung(el,true,`Richtig: <b>${esc(w)}</b>. Hier kommt das nächste Rätsel.`);return false}
    if(d.falsch!==v){ctx.fehler();d.falsch=v}
    if(d.h<R.hinweise.length){d.h++;ctx.speichern();zeichne();meldung(el,false,"Noch nicht. Du bekommst einen Hinweis mehr.")}
    else{ctx.speichern();meldung(el,false,"Noch nicht. Lies alle Hinweise noch einmal. Achte auf die Schreibweise.")}
    return false};
  ctx.loesung=()=>{d.r=runden.length;zeichne()};
}}}

/* ---------- Kette bauen: aus fünf Karten die drei richtigen in die Kette Eingabe → Verarbeitung → Ausgabe legen ---------- */
function evaKette({titel,punkte=15,merke,text,runden,art="Kette bauen"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.r=d.r||0;const NAME=["Eingabe","Verarbeitung","Ausgabe"];let falsch=new Set();
  const zeichne=()=>{
    if(d.r>=runden.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alle ${runden.length} Ketten stimmen. Tippe auf „Weiter“.</div>`;return}
    const R=runden[d.r],karten=[...R.kette,...R.extra];
    if(!d.reihe||d.reihe.length!==karten.length){d.reihe=mischen(karten.map((_,i)=>i));d.s=[null,null,null]}
    const weg=new Set(d.s.filter(x=>x!=null));
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Gerät ${d.r+1} von ${runden.length}</p><p class="frage">${R.geraet}</p>
      <div class="kette">${NAME.map((n,k)=>`<button class="glied${d.s[k]!=null?" voll":""}${falsch.has(k)?" falsch":""}" data-k="${k}"><span>${n}</span><b>${d.s[k]!=null?karten[d.s[k]]:"&nbsp;"}</b></button>`).join(`<i aria-hidden="true">→</i>`)}</div>
      <p class="muted small" style="margin:12px 0 6px">Tippe eine Karte an. Sie springt in das nächste freie Feld. Zwei Karten bleiben übrig.</p>
      <div class="karten">${d.reihe.map(i=>`<button class="karte" data-i="${i}" ${weg.has(i)?"disabled style='opacity:.35'":""}>${karten[i]}</button>`).join("")}</div>${MLD}`;
    el.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{const k=d.s.indexOf(null);if(k<0)return toast("Die Kette ist voll. Tippe ein Feld an, um es zu leeren.");d.s[k]=+b.dataset.i;falsch.clear();ctx.speichern();zeichne()});
    el.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{d.s[+b.dataset.k]=null;falsch.clear();ctx.speichern();zeichne()});
  };
  zeichne();
  ctx.pruefer=()=>{if(d.r>=runden.length){ctx.geschafft(punkte);return true}
    if(d.s.includes(null)){meldung(el,false,"Füll zuerst alle drei Felder der Kette.");return false}
    const fs=[0,1,2].filter(k=>d.s[k]!==k);
    if(!fs.length){d.r++;d.reihe=null;ctx.speichern();
      if(d.r>=runden.length){zeichne();ctx.geschafft(punkte);return true}
      zeichne();meldung(el,true,"Die Kette stimmt. Hier kommt das nächste Gerät.");return false}
    const st=d.s.join();if(d.falsch!==st){ctx.fehler();d.falsch=st;ctx.speichern()}
    falsch=new Set(fs);zeichne();meldung(el,false,fs.length===1?"Ein Feld stimmt noch nicht. Es ist markiert.":`${fs.length} Felder stimmen noch nicht. Sie sind markiert.`);return false};
  ctx.loesung=()=>{d.r=runden.length;zeichne()};
}}}

/* ---------- Strom-Probe: schreiben, speichern oder nicht, Stecker ziehen – und sehen, was bleibt ---------- */
function stromProbe({titel,punkte=20,merke,text,missionen,art="Ausprobieren"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.r=d.r||0;if(d.an==null)d.an=true;d.ram=d.ram||"";d.platte=d.platte||"";
  const zeichne=()=>{
    if(d.r>=missionen.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alle ${missionen.length} Versuche gemacht. Tippe auf „Weiter“.</div>`;return}
    const M=missionen[d.r],frage=d.erledigt&&M.frage;if(frage&&!d.opt)d.opt=mischen([M.richtig,...M.falsch]);
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Versuch ${d.r+1} von ${missionen.length}</p><p class="frage">${M.auftrag}</p>
      <div class="strom"><div class="st-pc${d.an?"":" aus"}"><div class="st-kopf">${sym("pc",22)} Bildschirm <span class="muted small">zeigt, was im Arbeitsspeicher ist</span></div>
          ${d.an?`<input type="text" id="sr" maxlength="24" placeholder="Schreib hier ein Wort" autocomplete="off" spellcheck="false" value="${esc(d.ram)}" ${d.erledigt?"disabled":""}>`:`<p class="st-aus">Kein Strom.</p>`}</div>
        <div class="st-platte"><div class="st-kopf">${sym("platte",22)} Festplatte</div><p>${d.platte?`${dico("wort.txt",22)} <b>${esc(d.platte)}</b>`:`<span class="muted">leer</span>`}</p></div></div>
      ${d.erledigt?"":`<div class="kp-knoepfe">${d.an?`<button class="btn" data-a="sp">Speichern</button><button class="btn ghost" data-a="auf" ${d.platte?"":"disabled"}>Datei öffnen</button><button class="btn ghost" data-a="aus">${sym("stecker",20)} Stecker ziehen</button>`:`<button class="btn" data-a="an">Wieder einschalten</button>`}</div>`}
      ${frage?`<p class="frage" style="margin-top:18px">${M.frage}</p><div class="antworten">${d.opt.map((o,i)=>`<button class="antwort" data-o="${i}">${o}</button>`).join("")}</div>`:""}${MLD}`;
    const inp=el.querySelector("#sr");if(inp)inp.oninput=()=>{d.ram=inp.value;ctx.speichern()};
    el.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{const a=b.dataset.a,vor={ram:d.ram.trim(),platte:d.platte};
      if(a==="sp"){if(!vor.ram)return meldung(el,false,"Schreib zuerst ein Wort.");d.platte=vor.ram}
      else if(a==="auf")d.ram=d.platte;
      else if(a==="aus"){d.an=false;d.ram=""}
      else if(a==="an")d.an=true;
      if(M.test(a,vor)){d.erledigt=!!M.frage;ctx.speichern();
        if(M.frage){zeichne();meldung(el,true,M.ok||"Geschafft. Beantworte noch die Frage.")}else naechste(M.ok||"Geschafft.")}
      else{ctx.speichern();zeichne();if(M.fast){const t=M.fast(a,vor);if(t)meldung(el,null,t)}}});
    el.querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{
      if(d.opt[+b.dataset.o]===M.richtig)naechste("Richtig.");
      else{ctx.fehler();b.classList.add("falsch");b.disabled=true;meldung(el,false,"Schau noch mal oben: Wo steht dein Wort, wo nicht?")}});
  };
  const naechste=t=>{d.r++;d.erledigt=false;d.opt=null;ctx.speichern();zeichne();
    if(d.r>=missionen.length)ctx.geschafft(punkte);else meldung(el,true,t+" Hier kommt der nächste Versuch.")};
  zeichne();
  ctx.pruefer=()=>{if(d.r>=missionen.length){ctx.geschafft(punkte);return true}meldung(el,false,d.erledigt?"Beantworte zuerst die Frage.":"Mach zuerst den Versuch.");return false};
  ctx.loesung=()=>{d.r=missionen.length;zeichne()};
}}}

/* ---------- Laser-Gang: den Zeiger durch einen Gang führen, ohne den Rand zu berühren (Maus-Kontrolle; mit dem Finger: ziehen) ---------- */
function mausGang({titel,punkte=15,merke,text,gaenge,art="Ruhige Hand"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.r=d.r||0;let aktiv=false;
  const zeichne=(hinweis)=>{
    if(d.r>=gaenge.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alle ${gaenge.length} Gänge geschafft. Tippe auf „Weiter“.</div>`;return}
    const G=gaenge[d.r];aktiv=false;
    el.innerHTML=kopfText(text)+`<div class="tafel gang"><p class="eyebrow">Gang ${d.r+1} von ${gaenge.length}</p>
      <svg viewBox="0 0 600 300" id="gsvg"><path class="g-weg" d="${G.d}" stroke-width="${G.b}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle class="g-ziel" cx="${G.ziel[0]}" cy="${G.ziel[1]}" r="${G.b/2+4}"/><text x="${G.ziel[0]}" y="${G.ziel[1]+5}" text-anchor="middle" class="g-t">Ziel</text>
        <circle class="g-start" cx="${G.start[0]}" cy="${G.start[1]}" r="${G.b/2+4}"/><text x="${G.start[0]}" y="${G.start[1]+5}" text-anchor="middle" class="g-t s">Start</text></svg>
      <p class="g-stand" id="gst">${hinweis||"Klick auf Start. Führ dann den Zeiger langsam bis zum Ziel."}</p></div>${MLD}`;
    const svg=el.querySelector("#gsvg"),st=el.querySelector("#gst");
    const art=e=>{const t=document.elementFromPoint(e.clientX,e.clientY);return!t?"":t.classList.contains("g-ziel")||(t.classList.contains("g-t")&&!t.classList.contains("s"))?"ziel":t.classList.contains("g-weg")||t.classList.contains("g-start")||t.classList.contains("g-t")?"weg":""};
    svg.addEventListener("pointerdown",e=>{const t=e.target;if(t.classList.contains("g-start")||t.classList.contains("s")){e.preventDefault();aktiv=true;svg.classList.add("an");st.textContent="Los. Bleib auf dem hellen Weg."}});
    svg.addEventListener("pointermove",e=>{if(!aktiv)return;const a=art(e);
      if(a==="ziel"){aktiv=false;d.r++;ctx.speichern();zeichne();if(d.r>=gaenge.length)ctx.geschafft(punkte);else meldung(el,true,"Geschafft. Der nächste Gang ist schmaler.")}
      else if(a!=="weg"){d.raus=(d.raus||0)+1;ctx.speichern();zeichne("Rand berührt. Klick wieder auf Start und versuch es langsamer.")}});
    svg.addEventListener("pointerup",e=>{if(aktiv&&e.pointerType!=="mouse"){zeichne("Finger abgehoben. Tippe auf Start und zieh ohne abzusetzen.")}});
  };
  zeichne();
  ctx.pruefer=()=>{if(d.r>=gaenge.length){ctx.geschafft(punkte);return true}meldung(el,false,"Bring den Zeiger zuerst durch alle Gänge.");return false};
  ctx.loesung=()=>{d.r=gaenge.length;zeichne()};
}}}

/* ---------- Paare: Links und rechts verbinden ----------
   paare({titel,punkte,merke,text,paare:[["links","rechts"],…]}) */
const PAAR_FARBEN=["#4338CA","#E5383B","#2DA44E","#F08A24","#8E5BD6","#0EA5B7","#C2185B","#8B5A2B"];
function paare({titel,punkte=10,merke,text,paare:liste,art="Verbinden"}){return{titel,punkte,merke,art,zeige(el,ctx){
  /* Häppchenweise: höchstens 3 bis 4 Paare auf einmal, dann die nächsten */
  const gruppen=[];for(let k=0;k<liste.length;k+=3)gruppen.push(liste.map((_,i)=>i).slice(k,k+3));
  if(gruppen.length>1&&gruppen[gruppen.length-1].length===1)gruppen[gruppen.length-2].push(...gruppen.pop());
  const d=ctx.daten;if(!d.reihe){d.reihe=mischenAnders(liste.map((_,i)=>i));ctx.speichern()}d.zu=d.zu||{};d.runde=Math.min(d.runde||0,gruppen.length-1);   // d.zu: rechtsIndex → linksIndex
  let wahl=null,wahlR=null,falsch=new Set(),lob="";   // wahl = links gewählt, wahlR = rechts gewählt
  const zeichne=()=>{const g=gruppen[d.runde],rechts=d.reihe.filter(r=>g.includes(r));
    const fertigG=g.every(r=>d.zu[r]!=null);
    const schritt=fertigG?`<span class="pschritt">✓</span> Alle verbunden. Tippe unten auf „Weiter“.`
      :wahl!=null?`<span class="pschritt">2</span> Gut! Jetzt <b>rechts</b> das Passende anklicken.`
      :wahlR!=null?`<span class="pschritt">2</span> Gut! Jetzt <b>links</b> das Passende anklicken.`
      :`<span class="pschritt">1</span> Klick <b>links</b> auf eine Karte. Dann klickst du <b>rechts</b> auf das, was dazu passt.`;
    el.innerHTML=kopfText(text)+(gruppen.length>1?`<p class="eyebrow" style="margin-top:12px">Runde ${d.runde+1} von ${gruppen.length}</p>`:"")+`
      <p class="paar-tipp">${schritt}</p>
      <div class="paare${wahl!=null?" wartet-r":wahlR!=null?" wartet-l":""}"><div>${g.map((i,n)=>{const vergeben=Object.values(d.zu).includes(i);return`<button class="karte links${wahl===i?" an":""}" data-l="${i}" style="--pf:${PAAR_FARBEN[n%8]}"><span class="pnr${vergeben?" voll":""}">${n+1}</span>${liste[i][0]}</button>`}).join("")}</div>
      <div>${rechts.map(r=>{const l=d.zu[r],n=g.indexOf(l);return`<button class="karte rechts${falsch.has(r)?" falsch":""}${wahlR===r?" an":""}" data-r="${r}" ${l!=null?`style="--pf:${PAAR_FARBEN[n%8]}"`:""}><span class="pnr${l!=null?" voll":""}">${l!=null?n+1:"?"}</span>${liste[r][1]}</button>`}).join("")}</div></div>${MLD}`;
    if(lob){meldung(el,true,lob);lob=""}
    const verbinde=(l,r)=>{for(const k in d.zu)if(d.zu[k]===l)delete d.zu[k];d.zu[r]=l;wahl=null;wahlR=null;falsch.delete(r);ctx.speichern();zeichne()};
    el.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{const i=+b.dataset.l;
      if(wahlR!=null)return verbinde(i,wahlR);
      wahl=wahl===i?null:i;zeichne()});
    el.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{const r=+b.dataset.r;
      if(wahl!=null)return verbinde(wahl,r);
      if(d.zu[r]!=null){delete d.zu[r];ctx.speichern()}   // schon verbunden: lösen und neu wählen
      wahlR=wahlR===r?null:r;zeichne()});
  };
  zeichne();
  ctx.pruefer=()=>{const g=gruppen[d.runde],fs=g.filter(r=>d.zu[r]!==r),leer=g.some(r=>d.zu[r]==null),letzte=d.runde===gruppen.length-1;
    if(!leer&&!fs.length&&!letzte){d.runde++;d.letzterFehler=null;d.versuche=0;ctx.speichern();lob="Richtig. Jetzt die nächsten Paare.";zeichne();return false}
    return bewerte(ctx,el,{leer,leerText:"Verbinde zuerst alle Paare.",fehler:fs.length,stand:JSON.stringify(d.zu),punkte,
      okText:"Richtig. Alle Paare passen.",markiere:()=>{falsch=new Set(fs);zeichne()}})};
  ctx.loesung=()=>{gruppen[d.runde].forEach(i=>d.zu[i]=i);zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Fehler-Suche: verdächtige Stellen in einer Nachricht antippen ----------
   fehlerSuche({titel,punkte,merke,text,kopf:"Von: … Betreff: …",teile:[["Text",true,"warum verdächtig"],["normaler Text"]]}) */
function fehlerSuche({titel,punkte=10,merke,text,kopf,teile,art="📩 Nachricht"}){return{titel,punkte,merke,art:"Fehler finden",zeige(el,ctx){
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
      okText:`Richtig! Du hast alle gefunden.<ul class="warum">${teile.filter(t=>t[1]).map(t=>`<li><b>${t[0]}</b> – ${t[2]||""}</li>`).join("")}</ul>`,
      markiere:()=>{falsch=new Set(zuviel);zeichne()}});
    if(!r&&!zuviel.length&&fehlt.length){meldung(el,false,`Gut so weit! Es fehlen noch <b>${fehlt.length}</b> verdächtige Stellen.`)}
    return r};
  ctx.loesung=()=>{d.an=teile.map((t,i)=>t[1]?i:-1).filter(i=>i>=0);zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Entscheidung: Situationen, in denen das Kind entscheidet, was es tun würde ----------
   entscheidung({titel,punkte,merke,szenen:[{bild:"💬",text:"…",optionen:[["Antwort",true,"Rückmeldung"],…]}]}) */
function entscheidung({titel,punkte=10,merke,text,szenen,frage:frage0,art="Entscheiden"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.s=d.s||0;d.ok=d.ok||{};if(!d.reihen){d.reihen=szenen.map(s=>mischen(s.optionen.map((_,i)=>i)));ctx.speichern()}
  let weg=new Set();
  const zeichne=()=>{
    if(d.s>=szenen.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alle Situationen geschafft! Tippe auf „Weiter“.</div>`;return}
    const sz=szenen[d.s],gut=d.ok[d.s]!=null;
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Situation ${d.s+1} von ${szenen.length}</p>
      <div class="szene"><span class="sz-bild">${sz.bild||"💭"}</span><div class="sz-text">${sz.text}</div></div>
      <p class="frage">${sz.frage||frage0||"Was machst du?"}</p>
      <div class="antworten">${d.reihen[d.s].map(i=>{const [t,r]=sz.optionen[i];return`<button class="antwort${gut&&r?" richtig":""}${weg.has(i)?" falsch":""}" data-o="${i}" ${gut||weg.has(i)?"disabled":""}>${t}</button>`}).join("")}</div>${MLD}`;
    if(gut){const o=sz.optionen.find(o=>o[1]);meldung(el,true,`${o[2]||"Richtig!"} <br><b>Tippe auf „Weiter“.</b>`)}
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
function ordnerPfad({titel,punkte=10,merke,text,datei,baum,ziel,art="Speichern"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.pfad=d.pfad||[];
  const ordner=p=>p.reduce((o,n)=>o[n],baum);
  const zeichne=()=>{
    const hier=ordner(d.pfad),kinder=Object.keys(hier);
    el.innerHTML=kopfText(text)+`<div class="explorer"><div class="ex-leiste"><button class="btn ghost klein-btn" id="hoch" ${d.pfad.length?"":"disabled"}>Eine Ebene zurück</button>
      <div class="ex-pfad">Dieser PC ${d.pfad.map(n=>`<span>›</span> ${n}`).join(" ")}</div></div>
      <div class="ex-inhalt">${kinder.map(n=>`<button class="ex-ordner" data-n="${esc(n)}"><span>${sym("ordner",44)}</span>${n}</button>`).join("")||`<p class="muted" style="grid-column:1/-1">Dieser Ordner ist leer.</p>`}
      ${d.gespeichert&&d.gespeichert.join("/")===d.pfad.join("/")?`<div class="ex-datei">${datei}</div>`:""}</div>
      <div class="ex-speichern"><span>Datei: <b>${datei}</b></span><button class="btn" id="spei">Hier speichern</button></div></div>${MLD}`;
    el.querySelector("#hoch").onclick=()=>{d.pfad.pop();ctx.speichern();zeichne()};
    el.querySelectorAll("[data-n]").forEach(b=>b.ondblclick=b.onclick=()=>{d.pfad.push(b.dataset.n);ctx.speichern();zeichne()});
    el.querySelector("#spei").onclick=()=>{d.gespeichert=d.pfad.slice();ctx.speichern();zeichne();
      meldung(el,true,`Gespeichert in: Dieser PC › ${d.pfad.join(" › ")||"(ganz oben)"}. Wenn das richtig ist, tippe auf „Weiter“.`)};
  };
  zeichne();
  ctx.pruefer=()=>bewerte(ctx,el,{leer:!d.gespeichert,leerText:"Geh in den richtigen Ordner und tippe auf „Hier speichern“.",fehler:d.gespeichert&&d.gespeichert.join("/")===ziel.join("/")?0:1,stand:(d.gespeichert||[]).join("/"),punkte,okText:"Richtig gespeichert. So findest du die Datei immer wieder."});
  ctx.loesung=()=>{d.pfad=ziel.slice();d.gespeichert=ziel.slice();zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Eingabe: ein Wort oder eine Zahl eintippen ----------
   eingabe({titel,punkte,merke,text,html,antwort:"HALLO" oder ["…","…"],gross:true,zahl:false,platz:"?"}) */
function eingabe({titel,punkte=10,merke,text,html="",antwort,zahl,platz="Deine Antwort",laenge,egal,art="Antwort tippen"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;const norm=v=>{v=String(v).trim();return egal==="nichts"?v:v.toUpperCase().replace(/\s+/g," ")};
  const gut=(Array.isArray(antwort)?antwort:[antwort]).map(norm);
  el.innerHTML=kopfText(text)+html+`<div class="eing"><input type="text" ${zahl?'inputmode="numeric"':""} autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${platz}" ${laenge?`maxlength="${laenge}"`:""} value="${esc(d.v||"")}"></div>${MLD}`;
  const inp=el.querySelector(".eing input");inp.oninput=()=>{d.v=inp.value;ctx.speichern()};
  inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();document.getElementById("weiter")?.click()}};
  ctx.pruefer=()=>bewerte(ctx,el,{leer:!inp.value.trim(),leerText:"Tippe zuerst deine Antwort ins Feld.",fehler:gut.includes(norm(inp.value))?0:1,stand:norm(inp.value),punkte,okText:"Richtig."});
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
function tippen({titel,punkte=15,merke,text,zeilen,zeigeTastatur=true,rennen,art="Tippen"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.z=d.z||0;d.p=d.p||0;d.f=d.f||0;
  const fertig=()=>d.z>=zeilen.length;
  const zeichne=(blitz)=>{
    if(fertig()){el.innerHTML=kopfText(text)+`<div class="msg ok">Alles abgetippt! Fehler: ${d.f}${d.zeit?` · Zeit: ${Math.round(d.zeit/1000)} Sek.`:""}. Tippe auf „Weiter“.</div>`;return}
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
    else{d.f++;zeichne(true);
      const soll=z[d.p],caps=e.getModifierState&&e.getModifierState("CapsLock");
      if(e.key.toLowerCase()===soll.toLowerCase()&&e.key!==soll){
        if(soll===soll.toLowerCase())meldung(el,false,caps?`Du schreibst <b>GROSS</b>, hier soll aber <b>klein</b> stehen. Die <b>Feststelltaste ⇪</b> ist an: Drück sie einmal, dann ist sie aus.`
          :`Du schreibst <b>GROSS</b>, hier soll aber <b>klein</b> stehen. Lass die <b>Umschalt-Taste ⇧</b> los.`);
        else meldung(el,false,`Hier kommt ein <b>Großbuchstabe</b>: Halte <b>Umschalt ⇧</b> gedrückt und drück dann ${esc(soll.toLowerCase())}.`)}}
    ctx.speichern();
  };
  document.addEventListener("keydown",taste);ctx.beimVerlassen(()=>document.removeEventListener("keydown",taste));
  zeichne();
  ctx.pruefer=()=>{if(fertig()){ctx.geschafft(Math.max(Math.ceil(punkte/2),punkte-Math.floor(d.f/4)));return true}meldung(el,false,"Tippe zuerst alle Zeilen ab.");return false};
  ctx.loesung=()=>{d.z=zeilen.length;d.zeit=d.zeit||1;zeichne()};
}}}

/* ---------- Tasten-Missionen: echte Tasten und Tastenkürzel in einem Übungsfeld ausprobieren ----------
   tastenMissionen({titel,punkte,merke,text,start:"Text im Feld",missionen:[{text:"…",tasten:["Strg","C"],test:e=>…}]}) */
function tastenMissionen({titel,punkte=15,merke,text,start="",missionen,art="Tasten"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.m=d.m||0;let pause=false;
  const zeichne=()=>{
    const fertig=d.m>=missionen.length,ms=missionen[d.m];
    el.innerHTML=kopfText(text)+(fertig?`<div class="msg ok">Alle ${missionen.length} Aufgaben geschafft. Tippe auf „Weiter“.</div>`
      :`<div class="tastaufgabe"><p class="eyebrow">Aufgabe ${d.m+1} von ${missionen.length}</p><p class="was">${ms.text}</p>
        <p class="wie"><b>${ms.tasten.length?"So geht es:":"Tipp:"}</b> ${ms.wie||""}</p><p class="kappen">${ms.tasten.map(t=>`<kbd>${t}</kbd>`).join("<i>+</i>")}</p></div>`)+`
      <p class="eyebrow" style="margin-top:14px">Dein Übungsfeld – klick hinein und probier es aus</p>
      <textarea class="uebfeld" spellcheck="false">${esc(d.feld??start)}</textarea>${MLD}`;
    const f=el.querySelector(".uebfeld");
    f.oninput=()=>{d.feld=f.value;ctx.speichern()};
    f.onkeydown=e=>{
      if((e.ctrlKey||e.metaKey)&&["s","p","f","d","h","w","n","t"].includes(e.key.toLowerCase()))e.preventDefault();
      const ms=missionen[d.m];if(!ms||pause)return;
      if(ms.test(e,f)){pause=true;setTimeout(()=>{d.feld=f.value;d.m++;ctx.speichern();
        const weiter=()=>{pause=false;zeichne();const g=el.querySelector(".uebfeld");g.focus();g.selectionStart=g.selectionEnd=g.value.length;
          if(d.m>=missionen.length)ctx.geschafft(punkte);else el.querySelector(".tastaufgabe")?.classList.add("neu")};
        /* Deutlich zeigen, dass es geklappt hat – erst dann kommt die nächste Aufgabe */
        const box=el.querySelector(".tastaufgabe");
        if(box&&d.m<missionen.length){box.classList.add("geschafft");box.innerHTML=`<p class="haken">✓</p><p class="was">Richtig!</p><p class="wie">Gleich kommt Aufgabe ${d.m+1} von ${missionen.length}.</p>`;setTimeout(weiter,1100)}
        else weiter()},ms.verzoegert?150:30);return}
      /* Falsche Taste: sofort sagen, was passiert ist – sonst tippen Kinder nur weiter und hängen fest */
      if(e.ctrlKey||e.metaKey||e.key.length!==1)return;
      const zwei=ms.tasten.length>1,shift=ms.tasten.some(t=>t.startsWith("Umschalt"));
      if(shift&&e.getModifierState&&e.getModifierState("CapsLock"))
        meldung(el,null,`Die <b>Feststelltaste ⇪</b> ist an. Das ist die falsche Taste. Drück sie einmal, dann ist sie aus. <b>Umschalt ⇧</b> ist die Taste direkt darunter.`);
      else meldung(el,null,`Da kam „<b>${esc(e.key===" "?"Leerzeichen":e.key)}</b>“. Das ist noch nicht richtig. `+
        (zwei?`Halte <b>${ms.tasten[0]}</b> fest gedrückt und drück <b>dann</b> ${ms.tasten[1]}. Erst danach loslassen.`:`Schau noch mal: ${ms.wie||""}`))};
    if(!fertig)setTimeout(()=>{f.focus();f.selectionStart=f.selectionEnd=f.value.length},50);
  };
  zeichne();
  ctx.pruefer=()=>{if(d.m>=missionen.length){ctx.geschafft(punkte);return true}meldung(el,false,`Mach zuerst alle Aufgaben. Du bist bei Aufgabe ${d.m+1} von ${missionen.length}.`);return false};
  ctx.loesung=()=>{d.m=missionen.length;zeichne()};
}}}
const strg=b=>e=>(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===b;

/* ---------- Maus-Parcours: Klick, Doppelklick, Rechtsklick, Ziehen ----------
   mausParcours({titel,punkte,merke,text,aufgaben:["klick","doppel","rechts","ziehen",…]}) */
/* ---------- Gerät erkennen: Touch (iPad/iPhone/Android ohne Maus) oder Computer ----------
   Zum Ausprobieren am PC: Adresse mit ?touch öffnen. */
const TOUCH=/[?&]touch\b/.test(location.search)||(matchMedia("(pointer: coarse)").matches&&!matchMedia("(any-pointer: fine)").matches);
/* geraet(pcTeil, touchTeil): Auf Touch-Geräten wird automatisch die Touch-Variante gezeigt (gleiche Punkte!) */
const geraet=(pc,touch)=>new Proxy({},{get:(_,k)=>(TOUCH?touch:pc)[k],has:(_,k)=>k in (TOUCH?touch:pc)});

/* ---------- Touch-Parcours: Tippen, Doppeltippen, lange drücken, ziehen, wischen, zoomen ---------- */
const FINGER_AUF={tipp:{ico:"⭐",t:"<b>Tippe</b> einmal kurz auf den Stern ⭐"},
  doppel:{ico:"📦",t:"<b>Doppeltippen</b>: Tippe zweimal ganz schnell auf die Kiste 📦"},
  lang:{ico:"🎁",t:"<b>Lange drücken</b>: Leg den Finger auf das Geschenk 🎁 und lass ihn liegen, bis ein Menü aufgeht"},
  ziehen:{ico:"🍎",t:"<b>Zieh</b> den Apfel 🍎 mit dem Finger in den Korb 🧺"},
  wischen:{ico:"🏞️",t:"<b>Wische</b> das Foto mit dem Finger zur Seite – wie in der Foto-Galerie"},
  zoom:{ico:"🐞",t:"<b>Zoomen</b>: Leg zwei Finger auf den Käfer 🐞 und zieh sie auseinander, bis er ganz groß ist"}};
function touchParcours({titel,punkte=10,merke,text,aufgaben,art="Finger"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.n=d.n||0;let tipp=0,timer=null;
  ctx.beimVerlassen(()=>clearTimeout(timer));
  const zeichne=()=>{clearTimeout(timer);
    if(d.n>=aufgaben.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Parcours geschafft! Tippe auf „Weiter“.</div>`;return}
    const a=aufgaben[d.n],m=FINGER_AUF[a],x=10+Math.random()*62,y=14+Math.random()*52;
    const pos=a==="wischen"?"left:50%;top:50%":a==="zoom"?"left:46%;top:42%":`left:${x}%;top:${y}%`;
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Aufgabe ${d.n+1} von ${aufgaben.length}</p><p class="frage">${m.t}</p>
      <div class="arena touch">${a==="ziehen"?`<span class="ziel" style="left:${x>50?8:70}%;top:40%">🧺</span>`:""}<span class="mz${a==="wischen"?" foto":""}${a==="zoom"?" klein":""}" style="${pos}">${m.ico}</span></div>${MLD}`;
    const z=el.querySelector(".mz"),ar=el.querySelector(".arena");
    ar.addEventListener("gesturestart",e=>e.preventDefault());ar.oncontextmenu=e=>e.preventDefault();
    let fertig=false;
    const gut=()=>{if(fertig)return;fertig=true;clearTimeout(timer);z.classList.add("treffer");d.n++;ctx.speichern();setTimeout(()=>{zeichne();if(d.n>=aufgaben.length)ctx.geschafft(punkte)},380)};
    const hinweis=t=>{if(Date.now()-tipp>1400){tipp=Date.now();meldung(el,null,t)}};
    if(a==="tipp")z.onpointerup=gut;
    if(a==="doppel"){let letzt=0;z.onpointerup=()=>{const jetzt=Date.now();if(jetzt-letzt<450)return gut();letzt=jetzt;
      timer=setTimeout(()=>{if(!fertig&&letzt===jetzt)hinweis("Das war einmal tippen. Tippe <b>zweimal ganz schnell</b> hintereinander!")},500)}}
    if(a==="lang"){let x0,y0,lauf=false;
      z.onpointerdown=e=>{e.preventDefault();x0=e.clientX;y0=e.clientY;lauf=true;z.classList.add("drueckt");
        timer=setTimeout(()=>{lauf=false;z.classList.remove("drueckt");
          const r=z.getBoundingClientRect(),ra=ar.getBoundingClientRect(),mn=document.createElement("div");mn.className="lmenu";
          mn.innerHTML="<span>📋 Kopieren</span><span>📤 Teilen</span><span>Löschen</span>";
          mn.style.left=Math.min(r.left-ra.left,ra.width-170)+"px";mn.style.top=Math.min(r.bottom-ra.top+6,ra.height-130)+"px";ar.append(mn);setTimeout(gut,1100)},650)};
      z.onpointermove=e=>{if(lauf&&Math.hypot(e.clientX-x0,e.clientY-y0)>14){lauf=false;clearTimeout(timer);z.classList.remove("drueckt");hinweis("Nicht schieben – lass den Finger <b>ganz ruhig</b> liegen.")}};
      z.onpointerup=z.onpointercancel=()=>{if(!lauf)return;lauf=false;clearTimeout(timer);z.classList.remove("drueckt");hinweis("Zu kurz! Lass den Finger <b>länger</b> liegen, bis das Menü aufgeht.")}}
    if(a==="ziehen"){const korb=el.querySelector(".ziel");let ziehe=false;
      z.onpointerdown=e=>{ziehe=true;z.setPointerCapture(e.pointerId);e.preventDefault()};
      z.onpointermove=e=>{if(!ziehe)return;const r=ar.getBoundingClientRect();z.style.left=((e.clientX-r.left)/r.width*100-4)+"%";z.style.top=((e.clientY-r.top)/r.height*100-8)+"%"};
      z.onpointerup=()=>{if(!ziehe)return;ziehe=false;const a1=z.getBoundingClientRect(),b1=korb.getBoundingClientRect();
        const cx=a1.left+a1.width/2,cy=a1.top+a1.height/2;
        if(cx>b1.left-14&&cx<b1.right+14&&cy>b1.top-14&&cy<b1.bottom+14)gut();else hinweis("Fast! Lass den Apfel genau <b>über dem Korb</b> los.")}}
    if(a==="wischen"){let x0=null,y0;
      z.onpointerdown=e=>{e.preventDefault();z.setPointerCapture(e.pointerId);x0=e.clientX;y0=e.clientY;z.style.transition="none"};
      z.onpointermove=e=>{if(x0==null)return;const dx=e.clientX-x0;z.style.transform=`translate(calc(-50% + ${dx}px),-50%) rotate(${dx/18}deg)`};
      z.onpointerup=z.onpointercancel=e=>{if(x0==null)return;const dx=e.clientX-x0,dy=e.clientY-y0;x0=null;z.style.transition="";
        if(Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)){z.style.transform=`translate(calc(-50% + ${dx>0?600:-600}px),-50%) rotate(${dx>0?30:-30}deg)`;setTimeout(gut,250)}
        else{z.style.transform="";hinweis("Wisch <b>weiter zur Seite</b> – mit Schwung nach links oder rechts!")}}}
    if(a==="zoom"){const finger=new Map();let d0=0;
      const abstand=()=>{const [p,q]=[...finger.values()];return Math.hypot(p.x-q.x,p.y-q.y)};
      ar.onpointerdown=e=>{e.preventDefault();finger.set(e.pointerId,{x:e.clientX,y:e.clientY});if(finger.size===2)d0=abstand()};
      ar.onpointermove=e=>{if(!finger.has(e.pointerId))return;finger.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(finger.size===2&&d0>0){const f=Math.max(1,Math.min(3.2,abstand()/d0));z.style.transform=`translate(-50%,-50%) scale(${f})`;if(f>=2.2)gut()}};
      ar.onpointerup=ar.onpointercancel=e=>{const zwei=finger.size===2;finger.delete(e.pointerId);
        if(!fertig&&finger.size===0){z.style.transform="";if(!zwei)hinweis("Du brauchst <b>zwei Finger</b>: Daumen und Zeigefinger auf den Käfer und dann auseinanderziehen.")}}}
  };
  zeichne();
  ctx.pruefer=()=>{if(d.n>=aufgaben.length){ctx.geschafft(punkte);return true}meldung(el,false,"Mach zuerst alle Aufgaben im Parcours.");return false};
  ctx.loesung=()=>{d.n=aufgaben.length;zeichne()};
}}}

const MAUS={klick:{ico:"⭐",t:"<b>Klick</b> einmal auf den Stern ⭐ (linke Maustaste)"},doppel:{ico:"📦",t:"<b>Doppelklick</b> auf die Kiste 📦 (zweimal ganz schnell links klicken)"},
  rechts:{ico:"🎁",t:"<b>Rechtsklick</b> auf das Geschenk 🎁 (rechte Maustaste)"},ziehen:{ico:"🍎",t:"<b>Zieh</b> den Apfel 🍎 in den Korb 🧺 (Taste gedrückt halten und schieben)"}};
function mausParcours({titel,punkte=10,merke,text,aufgaben,art="Maus"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.n=d.n||0;let tipp=0;
  const zeichne=()=>{
    if(d.n>=aufgaben.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Parcours geschafft! Tippe auf „Weiter“.</div>`;return}
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
    return bewerte(ctx,el,{leer:r.werte.every(v=>!v),leerText:"Mal zuerst, was der Roboter malt.",fehler:fs.length,stand:r.werte.join(""),punkte,okText:"Richtig. Du hast das Programm genau ausgeführt – wie ein Computer. 🤖",markiere:()=>r.markiere(fs)})};
  ctx.loesung=()=>r.setzeAlle(soll);
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- Info: ein reiner Erklär-Teil mit großem Bild (zählt 0 Punkte) ---------- */
function info({titel,html,merke}){return{titel,punkte:0,merke,zeige(el,ctx){el.innerHTML=`<div class="block info">${html}</div>`;ctx.geschafft(0)}}}
