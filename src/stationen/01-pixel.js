/* Station: Pixel-Werkstatt (KLP Inhaltsfeld „Information und Daten“):
   Daten vs. Information, binär decodieren und codieren, Farbcodes, Daten verkleinern (Lauflänge),
   Fehler finden (Prüfbit-Zaubertrick), eigenes Bild mit Code-Ansicht. Ca. 60 Minuten. */
(()=>{
const SW=["#FFFFFF","#1B1B1F"];
const PAL=["#FFFFFF","#1B1B1F","#E5383B","#2DA44E","#F5C518","#2F6FDE","#8B5A2B","#F28CB8","#F08A24","#8E5BD6"];
const NAMEN=["Weiß","Schwarz","Rot","Grün","Gelb","Blau","Braun","Rosa","Orange","Lila"];
const zahlen=z=>z.join("").split("").map(Number);

const BILDER={
  pfeil:["00011000","00111100","01111110","11111111","00011000","00011000","00011000","00011000"],
  boot:["00010000","00011000","00011100","00011110","00010000","11111111","01111110","00111100"],
  alien:["00100100","00011000","00111100","01011010","11111111","10111101","10100101","00100100"],
  herz:["00000000","01100110","11111111","11111111","01111110","00111100","00011000","00000000"],
  smiley:["00111100","01000010","10100101","10000001","10100101","10011001","01000010","00111100"],
  haus:["00011000","00111100","01111110","11111111","01000010","01011010","01011010","01111110"],
  apfel:["00003200","00003000","01111110","11111111","11111111","11111111","01111110","00111100"],
  sonne:["00111100","01111110","01111110","00111100","00000000","22222222","22222222","22222222"],
  tanne:["00011000","00111100","01111110","00111100","01111110","11111111","00011000","00011000"],
  pilz:["00111100","01111110","11111111","00011000","00011000","00111100"],
  herz5:["01010","11111","11111","01110","00100"],
  pfeil:["00011000","00111100","01111110","11111111","00011000","00011000","00011000","00011000"],
};
/* Farbcodes: In jedem Bild gilt ein eigener Schlüssel (1, 2, 3 …). 0 ist immer weiß. */
const SCHLUESSEL={
  apfel:[["Rot","#E5383B"],["Grün","#2DA44E"],["Braun","#8B5A2B"]],
  sonne:[["Gelb","#F5C518"],["Blau","#2F6FDE"]],
};

/* Wird beim Tippen auf „Weiter“ aufgerufen. true = richtig. Ab dem 3. Fehlversuch werden falsche Kästchen rot umrandet. */
function pruefen(ctx,raster,soll,punkte,box){
  if(raster.werte.every(x=>x===0)){box.className="msg no";box.textContent="Mal zuerst das Bild, dann tippe auf „Weiter“.";return false} // aus Versehen getippt: kein Abzug
  const stand=raster.werte.join("");
  const falsch=[];soll.forEach((x,k)=>{if(raster.werte[k]!==x)falsch.push(k)});
  if(falsch.length&&stand===ctx.daten.letzterFehler){box.className="msg no";box.textContent=`Du hast noch nichts geändert. Noch ${falsch.length===1?"1 Kästchen ist":falsch.length+" Kästchen sind"} falsch.`;return false}
  ctx.daten.versuche=(ctx.daten.versuche||0)+1;ctx.speichern();
  if(!falsch.length){raster.markiere([]);box.className="msg ok";box.textContent="Richtig! Alle Kästchen stimmen.";ctx.geschafft(punkte);return true}
  ctx.fehler();ctx.daten.letzterFehler=stand;ctx.speichern();
  box.className="msg no";
  box.textContent=falsch.length===1?"Fast! Noch 1 Kästchen ist falsch.":`Noch ${falsch.length} Kästchen sind falsch.`;
  if(ctx.daten.versuche>=3){raster.markiere(falsch);box.textContent+=" Sie sind jetzt rot umrandet."}
  box.scrollIntoView({block:"nearest",behavior:"smooth"});
  return false;
}

function abmalen(name,titel,punkte,merke){return{titel,punkte,merke,zeige(el,ctx){
  const soll=zahlen(BILDER[name]);
  el.innerHTML=`<p>Mal das Bild links genau ab. Tippe auf ein Kästchen, dann wird es schwarz. Nochmal tippen macht es wieder weiß. Du kannst auch ziehen.</p>
    <div class="paar"><div><p class="eyebrow">Vorlage</p><div id="a"></div></div><div><p class="eyebrow">Dein Bild</p><div id="b"></div></div></div>
    <div class="row noprint" style="margin-top:14px"><button class="btn ghost" id="l">Alles löschen</button><span class="muted small">Fertig? Tippe unten auf „Weiter“ – dann wird geprüft.</span></div><div id="m"></div>`;
  el.querySelector("#a").append(pixelRaster({w:8,h:8,werte:soll,palette:SW}).el);
  const r=pixelRaster({w:8,h:8,werte:ctx.daten.bild,palette:SW,malbar:true,onAenderung:v=>{ctx.daten.bild=v.slice();ctx.speichern()}});
  el.querySelector("#b").append(r.el);
  ctx.pruefer=()=>pruefen(ctx,r,soll,punkte,el.querySelector("#m"));
  ctx.loesung=()=>r.setzeAlle(soll);
  el.querySelector("#l").onclick=()=>{if(confirm("Wirklich alles löschen?"))r.setzeAlle(Array(64).fill(0))};
  if(ctx.geloest){const m=el.querySelector("#m");m.className="msg ok";m.textContent="Schon gelöst. Weiter geht's!"}
}}}

function codeBild(name,titel,punkte,farbig,merke){return{titel,punkte,merke,zeige(el,ctx){
  const roh=BILDER[name],soll=zahlen(roh);
  const key=farbig?SCHLUESSEL[name]:null;
  const pal=farbig?["#FFFFFF",...key.map(x=>x[1])]:SW;
  const ziffer=c=>farbig&&c!=="0"?`<span class="z" style="--c:${pal[+c]}">${c}</span>`:`<span>${c}</span>`;
  el.innerHTML=(farbig
    ?`<div class="regel"><b>Neue Regel:</b> Jetzt ist jede Zahl eine <b>Farbe</b>. Schau in den Schlüssel: Welche Zahl ist welche Farbe?</div>
      <p class="eyebrow" style="margin-top:12px">🔑 Schlüssel – tippe auf eine Farbe, dann auf die Kästchen</p><div class="schluessel" id="key">${key.map(([n,c],k)=>`<button data-f="${k+1}" style="--c:${c}"><b>${k+1}</b><span class="sw"></span>${n}</button>`).join("")}<button data-f="0" class="rad" style="--c:#fff"><b>0</b><span class="sw"></span>Weiß 🧽</button></div>`
    :`<p>Das ist ein Geheimcode. <b>1</b> heißt schwarz, <b>0</b> heißt weiß. Mal jede Zeile so, wie der Code es sagt. Was kommt heraus?</p>`)+
    `<div class="paar"><div><p class="eyebrow">Code</p><ol class="code">${roh.map(z=>`<li>${z.split("").map(ziffer).join("")}</li>`).join("")}</ol></div>
    <div><p class="eyebrow">Dein Bild</p><div id="b"></div></div></div>
    <div class="row noprint" style="margin-top:14px"><button class="btn ghost" id="l">Alles löschen</button><span class="muted small">Fertig? Tippe unten auf „Weiter“ – dann wird geprüft.</span></div><div id="m"></div>`;
  let wahl=1;
  if(farbig){const knoepfe=el.querySelectorAll("#key button");
    const setze=f=>{wahl=f;knoepfe.forEach(b=>b.classList.toggle("an",+b.dataset.f===f))};
    knoepfe.forEach(b=>b.onclick=()=>setze(+b.dataset.f));setze(1)}
  const r=pixelRaster({w:8,h:8,werte:ctx.daten.bild,palette:pal,malbar:true,farbe:()=>wahl,onAenderung:v=>{ctx.daten.bild=v.slice();ctx.speichern()}});
  el.querySelector("#b").append(r.el);
  const zeilen=el.querySelectorAll(".code li");
  const leuchte=z=>zeilen.forEach((li,k)=>li.classList.toggle("an",k===z));
  r.el.addEventListener("pointerover",e=>{const k=e.target.dataset?.k;if(k!=null)leuchte(Math.floor(k/8))});
  r.el.addEventListener("pointermove",e=>{const t=document.elementFromPoint(e.clientX,e.clientY);if(t&&t.dataset?.k!=null&&t.parentNode===r.el)leuchte(Math.floor(t.dataset.k/8))});
  r.el.addEventListener("pointerleave",()=>leuchte(-1));
  ctx.pruefer=()=>pruefen(ctx,r,soll,punkte,el.querySelector("#m"));
  ctx.loesung=()=>r.setzeAlle(soll);
  el.querySelector("#l").onclick=()=>{if(confirm("Wirklich alles löschen?"))r.setzeAlle(Array(64).fill(0))};
  if(ctx.geloest){const m=el.querySelector("#m");m.className="msg ok";m.textContent="Schon gelöst. Weiter geht's!"}
}}}

/* ---------- Codieren: Das Kind schreibt selbst den Code zu einem Bild (0/1-Knöpfe antippen) ---------- */
function codieren(name,titel,punkte,merke){return{titel,punkte,merke,zeige(el,ctx){
  const roh=BILDER[name],soll=zahlen(roh),h=roh.length;
  const code=ctx.daten.code||(ctx.daten.code=Array(8*h).fill(0));
  el.innerHTML=`<div class="regel"><b>Jetzt andersrum!</b> Du siehst das Bild und schreibst den Code. Tippe auf eine Zahl, dann wird aus 0 eine 1. Schwarz = 1, weiß = 0.</div>
    <div class="paar" style="margin-top:12px"><div><p class="eyebrow">Bild</p><div id="a"></div></div>
    <div><p class="eyebrow">Dein Code</p><div class="tipp-code" id="c">${roh.map((_,z)=>`<div class="tz">${Array.from({length:8},(_,s)=>`<button data-i="${z*8+s}">${code[z*8+s]}</button>`).join("")}</div>`).join("")}</div></div></div>
    <div id="m"></div>`;
  el.querySelector("#a").append(pixelRaster({w:8,h,werte:soll,palette:SW}).el);
  const knoepfe=[...el.querySelectorAll("#c button")];
  const zeig=()=>knoepfe.forEach((b,k)=>{b.textContent=code[k];b.classList.toggle("eins",code[k]===1)});zeig();
  knoepfe.forEach(b=>b.onclick=()=>{const k=+b.dataset.i;code[k]=code[k]?0:1;b.classList.remove("falsch");zeig();ctx.speichern()});
  ctx.pruefer=()=>{const m=el.querySelector("#m");
    if(code.every(x=>x===0)){m.className="msg no";m.textContent="Tippe zuerst die Zahlen an, dann auf „Weiter“.";return false}
    const falsch=[];soll.forEach((x,k)=>{if(code[k]!==x)falsch.push(k)});
    if(!falsch.length){m.className="msg ok";m.textContent="Richtig! Du hast das Bild codiert – wie ein Computer.";ctx.geschafft(punkte);return true}
    const stand=code.join("");if(stand!==ctx.daten.letzterFehler){ctx.fehler();ctx.daten.letzterFehler=stand;ctx.daten.versuche=(ctx.daten.versuche||0)+1;ctx.speichern()}
    m.className="msg no";m.textContent=falsch.length===1?"Fast! Noch 1 Zahl ist falsch.":`Noch ${falsch.length} Zahlen sind falsch.`;
    if((ctx.daten.versuche||0)>=3){knoepfe.forEach((b,k)=>b.classList.toggle("falsch",falsch.includes(k)));m.textContent+=" Sie sind jetzt rot."}
    return false};
  ctx.loesung=()=>{soll.forEach((x,k)=>code[k]=x);zeig()};
  if(ctx.geloest){const m=el.querySelector("#m");m.className="msg ok";m.textContent="Schon gelöst. Weiter geht's!"}
}}}

/* ---------- Kurzschrift: lange Codes kürzer schreiben (immer: erst weiß, dann schwarz, dann weiß …) ---------- */
/* Läufe einer Zeile: [{c:"0"|"1", n}] – gleiche Farben hintereinander zusammengefasst */
const laeufe=z=>{const r=[];for(const c of z){if(r.length&&r[r.length-1].c===c)r[r.length-1].n++;else r.push({c,n:1})}return r};
const SQ_W=`<i class="sq"></i>`,SQ_S=`<i class="sq s"></i>`;
const kurzText=z=>laeufe(z).map(l=>`<span class="lauf"><b>${l.n}</b>${l.c==="1"?SQ_S:SQ_W}</span>`).join("");

function kurzLesen(name,titel,punkte,merke){return{titel,punkte,merke,zeige(el,ctx){
  const roh=BILDER[name],soll=zahlen(roh);
  el.innerHTML=`<div class="regel"><b>Kurzschrift:</b> Statt ${SQ_W.repeat(3)+SQ_S.repeat(2)+SQ_W.repeat(3)} schreibt der Computer kurz: <b>3${SQ_W} 2${SQ_S} 3${SQ_W}</b>. Das spart Platz! Lies jede Zeile und mal das Bild.</div>
    <div class="paar" style="margin-top:12px"><div><p class="eyebrow">Kurzschrift</p><ol class="kurz">${roh.map(z=>`<li>${kurzText(z)}</li>`).join("")}</ol></div>
    <div><p class="eyebrow">Dein Bild</p><div id="b"></div></div></div>
    <div class="row noprint" style="margin-top:14px"><button class="btn ghost" id="l">Alles löschen</button><span class="muted small">Fertig? Tippe unten auf „Weiter“ – dann wird geprüft.</span></div><div id="m"></div>`;
  const r=pixelRaster({w:8,h:roh.length,werte:ctx.daten.bild,palette:SW,malbar:true,onAenderung:v=>{ctx.daten.bild=v.slice();ctx.speichern()}});
  el.querySelector("#b").append(r.el);
  const zeilen=el.querySelectorAll(".kurz li"),leuchte=z=>zeilen.forEach((li,k)=>li.classList.toggle("an",k===z));
  r.el.addEventListener("pointermove",e=>{const t=document.elementFromPoint(e.clientX,e.clientY);if(t&&t.dataset?.k!=null&&t.parentNode===r.el)leuchte(Math.floor(t.dataset.k/8))});
  r.el.addEventListener("pointerleave",()=>leuchte(-1));
  ctx.pruefer=()=>pruefen(ctx,r,soll,punkte,el.querySelector("#m"));
  ctx.loesung=()=>r.setzeAlle(soll);
  el.querySelector("#l").onclick=()=>{if(confirm("Wirklich alles löschen?"))r.setzeAlle(Array(soll.length).fill(0))};
  if(ctx.geloest){const m=el.querySelector("#m");m.className="msg ok";m.textContent="Schon gelöst. Weiter geht's!"}
}}}

function kurzSchreiben(name,titel,punkte,merke){return{titel,punkte,merke,zeige(el,ctx){
  const roh=BILDER[name],soll=roh.map(laeufe);
  const ein=ctx.daten.ein||(ctx.daten.ein=soll.map(l=>l.map(()=>"")));
  const lang=roh.length*8,kurz=soll.flat().length;
  el.innerHTML=`<div class="regel"><b>Jetzt du!</b> Jede Zeile ist in Kästen aufgeteilt. <b>Zähl die Kästchen in jedem Kasten</b> und schreib die Zahl darunter.</div>
    <div class="kurz-tabelle">${soll.map((l,z)=>`<div class="kzeile">${l.map((x,k)=>`<div class="gruppe"><div class="kaest">${`<i class="${x.c==="1"?"s":""}"></i>`.repeat(x.n)}</div><input inputmode="numeric" maxlength="1" placeholder="?" data-z="${z}" data-k="${k}" value="${esc(ein[z][k])}" aria-label="Anzahl"></div>`).join("")}</div>`).join("")}</div>
    <p class="muted" style="margin-top:12px">📦 Normal braucht das Bild <b>${lang} Zahlen</b>. In Kurzschrift nur <b>${kurz} Zahlen</b>!</p><div id="m"></div>`;
  const felder=[...el.querySelectorAll(".kurz-tabelle input")];
  felder.forEach((f,i)=>f.oninput=()=>{f.value=f.value.replace(/\D/g,"").slice(-1);ein[+f.dataset.z][+f.dataset.k]=f.value;f.classList.remove("falsch");ctx.speichern();
    if(f.value&&felder[i+1])felder[i+1].focus()});
  ctx.pruefer=()=>{const m=el.querySelector("#m");
    if(ein.flat().every(x=>x==="")){m.className="msg no";m.textContent="Schreib zuerst die Zahlen in die Felder, dann tippe auf „Weiter“.";return false}
    const falsch=[];soll.forEach((l,z)=>l.forEach((x,k)=>{if(+ein[z][k]!==x.n||ein[z][k]==="")falsch.push(`${z}_${k}`)}));
    if(!falsch.length){m.className="msg ok";m.textContent="Richtig! Du hast die Daten kleiner gemacht.";ctx.geschafft(punkte);return true}
    const stand=JSON.stringify(ein);if(stand!==ctx.daten.letzterFehler){ctx.fehler();ctx.daten.letzterFehler=stand;ctx.daten.versuche=(ctx.daten.versuche||0)+1;ctx.speichern()}
    m.className="msg no";m.textContent=falsch.length===1?"Fast! Noch 1 Zahl stimmt nicht.":`Noch ${falsch.length} Zahlen stimmen nicht.`;
    if((ctx.daten.versuche||0)>=2){felder.forEach(f=>f.classList.toggle("falsch",falsch.includes(`${f.dataset.z}_${f.dataset.k}`)));m.textContent+=" Sie sind jetzt rot."}
    return false};
  ctx.loesung=()=>felder.forEach(f=>{const n=soll[+f.dataset.z][+f.dataset.k].n;f.value=n;ein[+f.dataset.z][+f.dataset.k]=String(n)});
  if(ctx.geloest){const m=el.querySelector("#m");m.className="msg ok";m.textContent="Schon gelöst. Weiter geht's!"}
}}}

/* ---------- Zaubertrick (Prüfbit): In jeder Reihe und Spalte ist die Zahl der schwarzen Kästchen gerade.
   Der Zauberer dreht heimlich ein Kästchen um – das Kind findet es. So erkennt der Computer Übertragungsfehler. ---------- */
const N=6;
function neueRunde(){const g=Array(N*N).fill(0);
  for(let z=0;z<N-1;z++)for(let s=0;s<N-1;s++)g[z*N+s]=Math.random()<.45?1:0;
  for(let z=0;z<N-1;z++)g[z*N+N-1]=g.slice(z*N,z*N+N-1).reduce((a,b)=>a+b,0)%2;
  for(let s=0;s<N;s++){let n=0;for(let z=0;z<N-1;z++)n+=g[z*N+s];g[(N-1)*N+s]=n%2}
  return{g,dreh:null}}
function zauber(titel,punkte,runden,hilfe,merke){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.geschafft=d.geschafft||0;if(!d.runde)d.runde=neueRunde();ctx.speichern();
  const zeichne=()=>{const {g,dreh}=d.runde;
    const zs=z=>g.slice(z*N,z*N+N).reduce((a,b)=>a+b,0),ss=s=>{let n=0;for(let z=0;z<N;z++)n+=g[z*N+s];return n};
    el.innerHTML=`<div class="regel">🎩 <b>Der Trick:</b> In jeder Reihe und jeder Spalte sind <b>gerade viele</b> schwarze Kästchen (0, 2, 4 oder 6). Der Zauberer dreht heimlich <b>ein</b> Kästchen um. Wo ist jetzt eine Reihe <b>und</b> eine Spalte ungerade? Da ist es!</div>
      <p class="eyebrow" style="margin-top:12px">Runde ${Math.min(d.geschafft+1,runden)} von ${runden} · ✔️ ${d.geschafft} geschafft</p>
      <div class="zauber${hilfe?" hilfe":""}">${Array.from({length:N},(_,z)=>Array.from({length:N},(_,s)=>`<button data-i="${z*N+s}" class="${g[z*N+s]?"s":""}" ${dreh==null?"disabled":""}></button>`).join("")+(hilfe?`<span class="zahl">${zs(z)}</span>`:"")).join("")}
        ${hilfe?Array.from({length:N},(_,s)=>`<span class="zahl">${ss(s)}</span>`).join("")+"<span></span>":""}</div>
      <div class="row" style="margin-top:14px">${d.geschafft>=runden?"":dreh==null?`<button class="btn" id="zaub">🎩 Zaubern! Ein Kästchen umdrehen</button>`:`<span class="msg" style="margin:0">👆 Tippe auf das umgedrehte Kästchen!</span>`}</div><div id="m"></div>`;
    if(hilfe)el.querySelector(".zauber").style.gridTemplateColumns=`repeat(${N},1fr) 2.2em`;
    const z=el.querySelector("#zaub");if(z)z.onclick=()=>{const g2=d.runde.g;el.querySelector(".zauber").classList.add("wackeln");
      setTimeout(()=>{const i=Math.floor(Math.random()*N*N);g2[i]=g2[i]?0:1;d.runde.dreh=i;ctx.speichern();zeichne()},600)};
    el.querySelectorAll(".zauber button:not([disabled])").forEach(b=>b.onclick=()=>{const i=+b.dataset.i;
      if(i===d.runde.dreh){b.classList.add("gefunden");d.geschafft++;d.runde=neueRunde();ctx.speichern();
        if(d.geschafft>=runden){ctx.geschafft(punkte);setTimeout(()=>{zeichne();const m=el.querySelector("#m");m.className="msg ok";m.textContent="🎉 Super! Du hast den Trick durchschaut. Tippe auf „Weiter“."},500)}
        else{toast("Gefunden! 🎉");setTimeout(zeichne,700)}}
      else{ctx.fehler();b.classList.add("daneben");toast("Nicht das – zähl die schwarzen Kästchen in jeder Reihe!")}});
  };
  zeichne();
  ctx.pruefer=()=>{const m=el.querySelector("#m");m.className="msg no";m.textContent=`Noch ${runden-d.geschafft} ${runden-d.geschafft===1?"Runde":"Runden"}!`;return false};
  ctx.loesung=()=>{if(d.runde.dreh!=null){const b=el.querySelector(`.zauber button[data-i="${d.runde.dreh}"]`);if(b)b.classList.add("gefunden")}else toast("Erst „Zaubern“ tippen")};
}}}

/* ---------- Pixel-Rätsel (Nonogramm): Die Zahlen am Rand sagen, wie viele schwarze Kästchen nebeneinander liegen ---------- */
const hinweise=zeile=>{const r=[];let n=0;for(const c of zeile){if(c===1)n++;else if(n){r.push(n);n=0}}if(n)r.push(n);return r.length?r:[0]};
function nonogramm(name,titel,punkte,merke){return{titel,punkte,merke,zeige(el,ctx){
  const roh=BILDER[name],h=roh.length,w=roh[0].length,soll=zahlen(roh);
  const reihe=z=>soll.slice(z*w,z*w+w),spalte=sp=>Array.from({length:h},(_,z)=>soll[z*w+sp]);
  const rh=Array.from({length:h},(_,z)=>hinweise(reihe(z))),sh=Array.from({length:w},(_,sp)=>hinweise(spalte(sp)));
  el.innerHTML=`<div class="regel">🧩 <b>Pixel-Rätsel:</b> Die Zahlen sagen dir, wie viele <b>schwarze Kästchen nebeneinander</b> liegen. „2 1“ heißt: erst 2 schwarze, dann Lücke, dann 1 schwarzes. Eine Zahl wird <b style="color:var(--good)">grün</b>, wenn die Reihe passt.</div>
    <div class="nono" style="--w:${w}"><div></div><div class="sh">${sh.map((x,sp)=>`<span data-s="${sp}">${x.join("<br>")}</span>`).join("")}</div>
      <div class="rh">${rh.map((x,z)=>`<span data-r="${z}">${x.join(" ")}</span>`).join("")}</div><div id="b"></div></div>
    <div class="row noprint" style="margin-top:14px"><button class="btn ghost" id="l">Alles löschen</button><span class="muted small">Fertig? Tippe unten auf „Weiter“.</span></div><div id="m"></div>`;
  const pruefeZeilen=v=>{
    for(let z=0;z<h;z++)el.querySelector(`[data-r="${z}"]`).classList.toggle("ok",hinweise(v.slice(z*w,z*w+w)).join()===rh[z].join());
    for(let sp=0;sp<w;sp++)el.querySelector(`[data-s="${sp}"]`).classList.toggle("ok",hinweise(Array.from({length:h},(_,z)=>v[z*w+sp])).join()===sh[sp].join())};
  const r=pixelRaster({w,h,werte:ctx.daten.bild,palette:SW,malbar:true,onAenderung:v=>{ctx.daten.bild=v.slice();ctx.speichern();pruefeZeilen(v)}});
  el.querySelector("#b").append(r.el);r.el.style.maxWidth="none";pruefeZeilen(r.werte);
  ctx.pruefer=()=>pruefen(ctx,r,soll,punkte,el.querySelector("#m"));
  ctx.loesung=()=>r.setzeAlle(soll);
  el.querySelector("#l").onclick=()=>{if(confirm("Wirklich alles löschen?"))r.setzeAlle(Array(w*h).fill(0))};
  if(ctx.geloest){const m=el.querySelector("#m");m.className="msg ok";m.textContent="Schon gelöst. Weiter geht's!"}
}}}

/* ---------- Farbmischer: Bildschirm-Farben entstehen aus 3 Lampen (Rot, Grün, Blau). Jede Lampe: aus / halb / an.
   Für den Computer ist jede Farbe 3 Zahlen (0, 128 oder 255). ---------- */
const STUFEN=[0,128,255],STUFE_TEXT=["aus","halb","an"];
const ZIELE=[
  {n:"Rot",s:[2,0,0],tipp:"Mach nur die rote Lampe an."},
  {n:"Gelb",s:[2,2,0],tipp:"Komisch, aber wahr: <b>Rot + Grün</b> ergibt bei Licht <b>Gelb</b>!"},
  {n:"Weiß",s:[2,2,2],tipp:"Was passiert, wenn <b>alle drei</b> Lampen an sind?"},
  {n:"Lila",s:[1,0,2],tipp:"<b>Halb Rot</b> und <b>ganz Blau</b>."},
];
const rgb=st=>st.map(x=>STUFEN[x]).join(",");
function farbmischer(titel,punkte,merke){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.runde=d.runde||0;d.s=d.s||[0,0,0];
  const zeichne=()=>{
    if(d.runde>=ZIELE.length){el.innerHTML=`<div class="msg ok">🎨 Alle Farben gemischt! Tippe auf „Weiter“.</div>`;return}
    const ziel=ZIELE[d.runde];
    el.innerHTML=`<div class="regel">🔦 Jeder Bildschirm hat winzige <b>Lampen</b> in Rot, Grün und Blau. Tippe auf die Lampen, bis deine Farbe aussieht wie das Ziel. Jede Lampe: <b>aus → halb → an</b>.</div>
      <p class="eyebrow" style="margin-top:12px">Farbe ${d.runde+1} von ${ZIELE.length}</p><p class="tipp">💡 Tipp: ${ziel.tipp}</p>
      <div class="mischer"><div class="felder"><div><div class="feld" style="background:rgb(${rgb(ziel.s)})"></div><b>Ziel: ${ziel.n}</b></div>
        <div><div class="feld" id="du"></div><b>Deine Farbe</b></div></div>
        <div><div class="lampen">${["Rot","Grün","Blau"].map((n,k)=>`<button class="lampe l${k}" data-k="${k}"><span class="birne"></span><b>${n}</b><span class="stufe"></span></button>`).join("")}</div>
        <p class="muted" style="margin-top:10px">Für den Computer ist deine Farbe: <b id="code"></b></p></div></div><div id="m"></div>`;
    const male=()=>{el.querySelector("#du").style.background=`rgb(${rgb(d.s)})`;
      el.querySelectorAll(".lampe").forEach(b=>{const k=+b.dataset.k;b.dataset.st=d.s[k];b.querySelector(".stufe").textContent=`${STUFE_TEXT[d.s[k]]} (${STUFEN[d.s[k]]})`});
      el.querySelector("#code").textContent=d.s.map(x=>STUFEN[x]).join(", ")};male();
    el.querySelectorAll(".lampe").forEach(b=>b.onclick=()=>{const k=+b.dataset.k;d.s[k]=(d.s[k]+1)%3;male();ctx.speichern();
      if(d.s.join()===ZIELE[d.runde].s.join()){const m=el.querySelector("#m");m.className="msg ok";m.textContent="✔️ Genau richtig! Tippe auf „Weiter“."}});
  };
  zeichne();
  ctx.pruefer=()=>{const m=el.querySelector("#m");
    if(d.runde>=ZIELE.length){ctx.geschafft(punkte);return true}
    if(d.s.join()===ZIELE[d.runde].s.join()){d.runde++;d.s=[0,0,0];ctx.speichern();
      if(d.runde>=ZIELE.length){ctx.geschafft(punkte);return true}
      toast("Perfekt gemischt! 🎨 Nächste Farbe");zeichne();return false}
    m.className="msg no";m.textContent="Noch nicht gleich – schau dir den Tipp oben an.";return false};
  ctx.loesung=()=>{if(d.runde<ZIELE.length){d.s=ZIELE[d.runde].s.slice();zeichne()}};
}}}

const MIN_PIXEL=40;
let FREI=0; // Index des Teils „Dein eigenes Bild“ (wird unten gesetzt)
station({
  id:"pixel",nr:1,ico:"🎨",titel:"Pixel-Werkstatt",kreativ:true,
  kurz:"Bilder aus Kästchen – und wie der Computer sie als Zahlen speichert",
  schritte:[
    {titel:"Worum geht's?",punkte:0,zeige(el,ctx){
      el.innerHTML=`<div class="block"><p>Schau ganz nah auf einen Bildschirm: Jedes Bild besteht aus winzigen <b>Kästchen</b>. Ein Kästchen heißt <b>Pixel</b>.</p>
      <p>Der Computer kann keine Bilder sehen. Er merkt sich für jedes Pixel nur eine <b>Zahl</b>, zum Beispiel 1 für schwarz und 0 für weiß. Die Zahlen sind die <b>Daten</b>, das Bild ist die <b>Information</b>.</p>
      <p style="margin:0">Heute bist du der Computer: Du knackst Geheimcodes, schreibst selbst Codes, lernst eine Kurzschrift und einen Zaubertrick. Am Ende malst du dein eigenes Bild.</p></div>
      <div class="paar"><div id="a"></div><ol class="code klein">${BILDER.herz.map(z=>`<li>${z.split("").map(c=>`<span>${c}</span>`).join("")}</li>`).join("")}</ol></div>`;
      el.querySelector("#a").append(pixelRaster({w:8,h:8,werte:zahlen(BILDER.herz),palette:SW,klein:true}).el);
      ctx.geschafft(0);
    }},
    abmalen("alien","Aufwärmen: Das Alien",10),
    codeBild("herz","Geheimcode 1",10,false,"Die Kästchen heißen <b>Pixel</b>. Jedes Bild auf dem Handy und am Computer besteht aus Pixeln."),
    codeBild("haus","Geheimcode 2",10),
    codieren("boot","Du bist der Computer",15,"<b>Decodieren</b> heißt: Code → Bild. <b>Codieren</b> heißt: Bild → Code. Jetzt codierst du!"),
    codeBild("apfel","Farbcode 1",15,true,"Im Computer gibt es nur Strom <b>aus = 0</b> oder Strom <b>an = 1</b>. Darum speichert er alles mit Zahlen."),
    codeBild("sonne","Farbcode 2",15,true),
    farbmischer("Farbmischer 🎨",15),
    kurzLesen("tanne","Kurzschrift lesen",15,"Daten brauchen Platz. Mit einem Trick kann man sie <b>kleiner</b> machen – so passen mehr Fotos aufs Handy."),
    kurzSchreiben("pilz","Kurzschrift schreiben",15),
    nonogramm("herz5","Pixel-Rätsel 🧩",15,"Mit der Kurzschrift kann man sogar Rätsel bauen!"),
    nonogramm("pfeil","Pixel-Rätsel für Profis 🧩",20),
    zauber("Zaubertrick 🎩",20,3,true,"Beim Senden kann ein Kästchen kaputtgehen. Der Computer hat einen Trick, um den Fehler zu finden. Probier ihn aus!"),
    zauber("Zaubertrick für Profis 🎩",20,3,false,"Jetzt ohne Zählhilfe – zähl selbst!"),
    {titel:"Dein eigenes Bild",punkte:20,merke:"Für den Computer ist <b>jede Farbe Zahlen</b> – beim Bildschirm 3 Stück: Rot, Grün, Blau. Ein Handyfoto hat Millionen Pixel – und Millionen Zahlen.",zeige(el,ctx){
      el.innerHTML=`<p>Jetzt bist du dran! Mal ein eigenes Bild auf 16 mal 16 Kästchen. Gib ihm einen Namen. Die schönsten und kreativsten Bilder bekommen die beste Note.</p>
        <label class="f" for="t">Name deines Bildes</label><input type="text" id="t" maxlength="40" placeholder="z. B. Mein Haustier">
        <div id="pal" style="margin-top:14px"></div><div class="frei" id="b"></div>
        <div class="row noprint" style="margin-top:14px"><button class="btn ghost" id="l">Alles löschen</button><span class="muted small" id="z"></span></div><div id="m"></div>`;
      const t=el.querySelector("#t");t.value=ctx.daten.titel||"";t.oninput=()=>{ctx.daten.titel=t.value;ctx.speichern()};
      const leiste=farbLeiste(PAL,NAMEN,1,false,false);el.querySelector("#pal").append(leiste.el);
      const zaehle=v=>{const n=v.filter(x=>x>0).length;el.querySelector("#z").textContent=n<MIN_PIXEL?`${n} von mindestens ${MIN_PIXEL} Kästchen bemalt`:`${n} Kästchen bemalt`};
      const r=pixelRaster({w:16,h:16,werte:ctx.daten.bild,palette:PAL,malbar:true,farbe:leiste.farbe,onAenderung:v=>{ctx.daten.bild=v.slice();ctx.speichern();zaehle(v)}});
      el.querySelector("#b").append(r.el);zaehle(r.werte);
      el.querySelector("#l").onclick=()=>{if(confirm("Ganzes Bild löschen?"))r.setzeAlle(Array(256).fill(0))};
      /* „Fertig“ prüft: genug gemalt und Name da? (kein Punktabzug – hier gibt es kein Falsch) */
      ctx.pruefer=()=>{const m=el.querySelector("#m"),n=r.werte.filter(x=>x>0).length;
        if(n<MIN_PIXEL){m.className="msg no";m.textContent=`Mal noch etwas mehr: mindestens ${MIN_PIXEL} Kästchen.`;return false}
        if(!t.value.trim()){m.className="msg no";m.textContent="Gib deinem Bild noch einen Namen.";t.focus();return false}
        ctx.geschafft(20);return true};
    }},
  ],
  ergebnis(d){
    const f=d[FREI]||{};
    const code=(f.bild||[]).map(String).join("").match(/.{16}/g)||[];
    return`<p class="eyebrow">Eigenes Bild</p><h2>${esc(f.titel||"ohne Namen")}</h2>
      <div class="paar"><div id="erg-bild" style="max-width:340px"></div>
      <div><p class="eyebrow">So sieht dein Bild für den Computer aus</p><pre class="bildcode">${code.join("\n")}</pre><p class="muted small">Das sind 256 Zahlen – nur für dieses kleine Bild!</p></div></div>`;
  },
  nachErgebnis(d){const f=d[FREI]||{};const box=document.getElementById("erg-bild");if(box)box.append(pixelRaster({w:16,h:16,werte:f.bild,palette:PAL}).el)}
});
FREI=STATIONEN.find(x=>x.id==="pixel").schritte.findIndex(x=>x.titel==="Dein eigenes Bild");
})();
