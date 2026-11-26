/* Station 3 · Ordnung im Computer – Dateien, Endungen, Ordner, Pfade, Suche
   Rahmen: Der Trainer der U11 vom FC Ruhrwiese hat einen neuen Laptop. Alles liegt durcheinander. Das Kind räumt für ihn auf.
   (Nov. 2026 neu gebaut. Ab jetzt neue Teile nur noch hinten anhängen, sobald Kinder an der Station arbeiten.) */
{
const VEREIN={"Bilder":{"Verein":{"Sammelkarten":{"Saison 2026":{},"Saison 2025":{}},"Mannschaftsfoto":{}},"Privat":{}},
  "Dokumente":{"Verein":{"Aufstellungen":{},"Training":{},"Turniere":{}},"Privat":{}},
  "Musik":{"Kabine":{}},"Videos":{"Verein":{"Tore":{},"Training":{}},"Privat":{}}};

/* Nachricht vom Trainer: ruhige Sprechblase, keine Farbe nötig */
const ORD=sym("ordner",22);
const vomTrainer=t=>nachricht("Nachricht vom Trainer","ball",t);

/* ---------- Endungs-Probe: Endung ändern, „Öffnen“ drücken, sehen was passiert ----------
   Das Kind entdeckt selbst: Die Endung entscheidet, welches Programm die Datei öffnet. Der Inhalt bleibt gleich.
   Falsches Öffnen ist Ausprobieren und kostet nichts. Nur eine falsche Antwort auf die Frage kostet Punkte. */
const ENDUNG={".mp4":[dico("a.mp4",40),"Video-Player"],".jpg":[dico("a.jpg",40),"Fotos"],".mp3":[dico("a.mp3",40),"Musik-Player"],".docx":[dico("a.docx",40),"Word"]};
const INHALT={".mp4":"Das Video läuft: der Fallrückzieher.",".docx":"Die Aufstellung für Samstag ist offen.",".mp3":"Das Lied läuft: der Torjubel aus der Kabine."};
function endungProbe({titel,punkte=15,merke,text,runden,art="Ausprobieren"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.r=d.r||0;
  const zeichne=()=>{
    if(d.r>=runden.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alle ${runden.length} Dateien gehen wieder auf. Tippe auf „Weiter“.</div>`;return}
    const R=runden[d.r];if(!d.e)d.e=R.start;d.probiert=d.probiert||[];
    const [ico,prog]=ENDUNG[d.e];
    const frage=d.offen&&R.frage;if(frage&&(!d.opt||d.opt.length!==R.falsch.length+1))d.opt=mischen([R.richtig,...R.falsch]);
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Datei ${d.r+1} von ${runden.length}</p>
      <p class="frage">${R.auftrag}</p>
      <div class="probe"><div class="probe-datei"><span class="pd-ico">${ico}</span><span class="pd-name">${esc(R.name)}<b>${d.e}</b></span><span class="muted small">öffnet mit: ${prog}</span></div>
        <div class="probe-endungen" role="group" aria-label="Endung wählen">${Object.keys(ENDUNG).map(x=>`<button class="karte${x===d.e?" an":""}" data-e="${x}">${x}</button>`).join("")}</div>
        <button class="btn" id="oeffnen" ${d.offen?"disabled":""}>Öffnen</button></div>
      <div id="fenster">${d.zuletzt?fenster(d.zuletzt):""}</div>
      ${frage?`<p class="frage" style="margin-top:18px">${R.frage}</p><div class="antworten">${d.opt.map((o,i)=>`<button class="antwort" data-o="${i}">${o}</button>`).join("")}</div>`:""}${MLD}`;
    el.querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>{if(d.offen)return;d.e=b.dataset.e;d.zuletzt=null;ctx.speichern();zeichne()});
    el.querySelector("#oeffnen").onclick=()=>{if(!d.probiert.includes(d.e))d.probiert.push(d.e);
      const ok=d.e===R.echt;d.zuletzt={ok,e:d.e,echt:R.echt};
      if(ok){d.offen=true;if(!R.frage)return weiterRunde(`Richtig: Mit <b>${R.echt}</b> geht die Datei auf.`)}
      ctx.speichern();zeichne()};
    el.querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{
      if(d.opt[+b.dataset.o]===R.richtig)weiterRunde("Genau. Hier kommt die nächste Datei.");
      else{ctx.fehler();b.classList.add("falsch");b.disabled=true;meldung(el,false,"Schau noch mal: Was war bei jedem Öffnen anders, was blieb gleich?")}});
  };
  const fenster=z=>{const [ico,prog]=ENDUNG[z.e];
    const k=dico("a"+z.e,20);return z.ok?`<div class="fenster ok erfolg"><div class="f-kopf">${k} ${prog}</div><div class="f-ok"><span class="ok-haken" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><p><b>Geklappt!</b> ${INHALT[z.echt]}</p></div><span class="funken" aria-hidden="true">${"<i></i>".repeat(10)}</span></div>`
      :`<div class="fenster nein"><div class="f-kopf">${k} ${prog}</div><p><b>Fehler:</b> ${prog} kann diese Datei nicht öffnen.</p></div>`};
  const weiterRunde=t=>{d.r++;d.e=null;d.offen=false;d.zuletzt=null;d.opt=null;d.probiert=[];ctx.speichern();zeichne();
    if(d.r>=runden.length)ctx.geschafft(punkte);else meldung(el,true,t)};
  zeichne();
  ctx.pruefer=()=>{if(d.r>=runden.length){ctx.geschafft(punkte);return true}
    meldung(el,false,d.offen?"Beantworte zuerst die Frage.":"Bring zuerst die Datei zum Laufen: Endung wählen, dann „Öffnen“.");return false};
  ctx.loesung=()=>{d.r=runden.length;zeichne()};
}}}

/* ---------- Datei-Suche: Suchfeld über alle Dateien des Trainers, Fragen beantworten ---------- */
const DATEIEN=["fallrueckzieher.mp4","freistoss-tor.mp4","elfmeter-finale.mp4","training-dribbeln.mp4","mannschaftsfoto-2026.jpg","torwart-nr1.jpg","sammelkarte-nr7.jpg","sammelkarte-nr10.jpg",
  "aufstellung-samstag.docx","aufstellung-pokal.docx","training-plan-november.docx","training-uebungen.pdf","turnier-mai.pdf","elternbrief-trikots.pdf","torjubel.mp3","kabinen-playlist.mp3","Neues Dokument (3).docx","bild.jpg"];
function dateiSuche({titel,punkte=15,merke,text,fragen,art="Ausprobieren"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.r=d.r||0;d.s=d.s||"";
  const zeichne=(fokus)=>{
    if(d.r>=fragen.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alle ${fragen.length} Fragen gelöst. Tippe auf „Weiter“.</div>`;return}
    const F=fragen[d.r],q=d.s.trim().toLowerCase(),treffer=q?DATEIEN.filter(x=>x.toLowerCase().includes(q)):DATEIEN;
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Frage ${d.r+1} von ${fragen.length}</p><p class="frage">${F.frage}</p>
      <div class="explorer"><div class="ex-leiste">${sym("lupe",24)}<input type="text" id="such" placeholder="Suchen" autocomplete="off" spellcheck="false" value="${esc(d.s)}" aria-label="Dateien durchsuchen"></div>
        <p class="muted small" style="margin:8px 12px 0">${q?`${treffer.length} ${treffer.length===1?"Treffer":"Treffer"}`:`Alle ${DATEIEN.length} Dateien`}</p>
        <ul class="treffer">${treffer.map(x=>`<li>${dico(x,20)} ${x}</li>`).join("")||`<li class="muted">Nichts gefunden. Probier ein kürzeres Wort.</li>`}</ul></div>
      <div class="antw-kasten"><label for="antw"><span class="antw-stift" aria-hidden="true">✎</span> Deine Antwort${F.zahl?` <span class="muted">– nur die Zahl</span>`:""}</label>
        <input type="text" id="antw" ${F.zahl?'inputmode="numeric" pattern="[0-9]*" maxlength="3"':""} placeholder="${F.zahl?"Zahl":F.platz||"Deine Antwort"}" autocomplete="off" spellcheck="false" value="${esc(d.a||"")}"></div>${MLD}`;
    const s=el.querySelector("#such"),a=el.querySelector("#antw");
    s.oninput=()=>{d.s=s.value;ctx.speichern();zeichne("such")};
    a.oninput=()=>{d.a=a.value;ctx.speichern()};
    a.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();document.getElementById("weiter")?.click()}};
    if(fokus==="such"){s.focus();s.setSelectionRange(s.value.length,s.value.length)}
  };
  zeichne();
  const norm=v=>String(v||"").trim().toLowerCase().replace(/\s+/g," ");
  ctx.pruefer=()=>{if(d.r>=fragen.length){ctx.geschafft(punkte);return true}
    const F=fragen[d.r],v=norm(d.a);
    if(!v){meldung(el,false,"Schreib zuerst deine Antwort ins Feld „Deine Antwort“.");return false}
    /* Häufiger Verwechsler: Suchwort ins Antwortfeld getippt (oder Buchstaben bei einer Zahl-Frage) – Hinweis, kein Punktabzug */
    const such=norm(d.s).replace(/^\./,""),vv=v.replace(/^\./,"");
    if(!F.antwort.map(norm).includes(v)&&((such&&vv===such)||(F.zahl&&!/^\d+$/.test(v)))){
      meldung(el,null,F.zahl?"Oben suchst du, unten antwortest du. Zähl die Treffer und schreib nur die Zahl.":"Das ist dein Suchwort. Unten kommt die Antwort auf die Frage hin.");
      const a=el.querySelector("#antw");a.classList.add("hinweis");a.select();return false}
    if(F.antwort.map(norm).includes(v)){d.r++;d.a="";d.s="";ctx.speichern();
      if(d.r>=fragen.length){zeichne();ctx.geschafft(punkte);return true}
      zeichne();meldung(el,true,"Richtig. Hier kommt die nächste Frage.");return false}
    if(d.falsch!==v){ctx.fehler();d.falsch=v;ctx.speichern()}
    meldung(el,false,F.tipp||"Schau genau in die Trefferliste.");return false};
  ctx.loesung=()=>{d.r=fragen.length;zeichne()};
}}}

/* ---------- Datei-Detektiv: Liste nach Name, Datum oder Größe sortieren, dann die gesuchte Datei antippen ---------- */
function dateiListe({titel,punkte=15,merke,text,dateien,fragen,art="Ausprobieren"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.r=d.r||0;d.sp=d.sp||0;d.ab=!!d.ab;
  const SP=["Name","Geändert am","Größe"],wert=[x=>x[0],x=>x[2],x=>x[4]];
  const zeichne=()=>{
    if(d.r>=fragen.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alle ${fragen.length} Dateien gefunden. Tippe auf „Weiter“.</div>`;return}
    const F=fragen[d.r],liste=dateien.slice().sort((a,b)=>{const x=wert[d.sp](a),y=wert[d.sp](b);return(x<y?-1:x>y?1:0)*(d.ab?-1:1)});
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Frage ${d.r+1} von ${fragen.length}</p><p class="frage">${F.frage}</p>
      <div class="explorer"><table class="liste dliste"><thead><tr>${SP.map((n,k)=>`<th><button class="sortk${d.sp===k?" an":""}" data-sk="${k}">${n} ${d.sp===k?(d.ab?"▼":"▲"):""}</button></th>`).join("")}</tr></thead>
        <tbody>${liste.map(x=>`<tr><td><button class="dzeile" data-n="${esc(x[0])}">${dico(x[0],20)} ${esc(x[0])}</button></td><td>${x[1]}</td><td class="r">${x[3]}</td></tr>`).join("")}</tbody></table></div>${MLD}`;
    el.querySelectorAll("[data-sk]").forEach(b=>b.onclick=()=>{const k=+b.dataset.sk;if(d.sp===k)d.ab=!d.ab;else{d.sp=k;d.ab=false}ctx.speichern();zeichne()});
    el.querySelectorAll("[data-n]").forEach(b=>b.onclick=()=>{
      if(b.dataset.n===F.antwort){d.r++;ctx.speichern();zeichne();if(d.r>=fragen.length)ctx.geschafft(punkte);else meldung(el,true,"Richtig. Hier kommt die nächste Frage.")}
      else{ctx.fehler();b.classList.add("falsch");meldung(el,false,F.tipp||"Das ist sie nicht. Tippe oben auf eine Spalte. Dann sortiert der Computer für dich.")}});
  };
  zeichne();
  ctx.pruefer=()=>{if(d.r>=fragen.length){ctx.geschafft(punkte);return true}meldung(el,false,"Tippe in der Liste auf die gesuchte Datei.");return false};
  ctx.loesung=()=>{d.r=fragen.length;zeichne()};
}}}

/* ---------- Namen geben: Das Kind erfindet selbst einen guten Dateinamen. Geprüft wird: Stichwort drin? Endung richtig? ---------- */
function namenGeben({titel,punkte=15,merke,text,runden,art="Selbst schreiben"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.r=d.r||0;
  const pruef=(R,v)=>{v=v.trim().toLowerCase();return[[v.includes(R.wort),`Das Wort „${R.wort}“ kommt vor.`],[v.endsWith(R.endung)&&v.length>R.endung.length,"Die Endung passt zur Datei."]]};
  const zeichne=()=>{
    if(d.r>=runden.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alle ${runden.length} Dateien haben einen guten Namen. Tippe auf „Weiter“.</div>`;return}
    const R=runden[d.r];
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Datei ${d.r+1} von ${runden.length}</p>
      <div class="szene"><span class="sz-bild">${R.bild}</span><div class="sz-text">${R.was}</div></div>
      <p class="frage">${R.auftrag}</p>
      <div class="eing"><input type="text" id="nn" placeholder="Dateiname" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="50" value="${esc(d.v||"")}"></div>
      <ul class="regeln" id="rg"></ul>${MLD}`;
    const inp=el.querySelector("#nn"),rg=el.querySelector("#rg");
    const zeig=()=>{rg.innerHTML=d.geprueft?pruef(R,inp.value).map(([ok,t])=>`<li class="${ok?"ok":"no"}">${ok?"✓":"✗"} ${ok?t:t.replace("kommt vor","fehlt noch").replace("passt zur Datei","fehlt oder passt nicht")}</li>`).join(""):""};
    inp.oninput=()=>{d.v=inp.value;ctx.speichern()};
    inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();document.getElementById("weiter")?.click()}};
    zeig();
  };
  zeichne();
  ctx.pruefer=()=>{if(d.r>=runden.length){ctx.geschafft(punkte);return true}
    const R=runden[d.r],v=(d.v||"").trim();
    if(!v){meldung(el,false,"Schreib zuerst einen Namen ins Feld.");return false}
    const erg=pruef(R,v);
    if(erg.every(x=>x[0])){d.r++;d.v="";d.geprueft=false;ctx.speichern();
      if(d.r>=runden.length){zeichne();ctx.geschafft(punkte);return true}
      zeichne();meldung(el,true,`Guter Name: <b>${esc(v)}</b>. Hier kommt die nächste Datei.`);return false}
    if(d.falsch!==v.toLowerCase()){ctx.fehler();d.falsch=v.toLowerCase()}
    d.geprueft=true;ctx.speichern();zeichne();meldung(el,false,"Noch nicht ganz. Schau auf die Liste unter dem Feld.");return false};
  ctx.loesung=()=>{d.r=runden.length;zeichne()};
}}}

/* ---------- Kopier-Probe: Dateien zwischen Laptop, USB-Stick und Papierkorb bewegen. Ausprobieren kostet nichts. ---------- */
function kopierProbe({titel,punkte=20,merke,text,start,missionen,art="Ausprobieren"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.r=d.r||0;if(!d.o)d.o=JSON.parse(JSON.stringify(start));d.o.korb=d.o.korb||[];
  const ORT={laptop:[sym("laptop",22),"Laptop"],stick:[sym("stick",22),"USB-Stick"],korb:[sym("korb",22),"Papierkorb"]};
  let wahl=null;   // {ort, n}
  const hat=(ort,n)=>ort==="korb"?d.o.korb.some(x=>x.n===n):d.o[ort].includes(n);
  const zeichne=()=>{
    if(d.r>=missionen.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alle ${missionen.length} Aufträge erledigt. Tippe auf „Weiter“.</div>`;return}
    const M=missionen[d.r],frage=d.erledigt&&M.frage;
    if(frage&&!d.opt)d.opt=mischen([M.richtig,...M.falsch]);
    const anderer=wahl&&wahl.ort!=="korb"?(wahl.ort==="laptop"?"stick":"laptop"):null;
    const kasten=ort=>{const liste=ort==="korb"?d.o.korb.map(x=>x.n):d.o[ort];
      return`<div class="kp-ort"><div class="kp-kopf">${ORT[ort][0]} ${ORT[ort][1]}</div>${liste.map(n=>`<button class="karte${wahl&&wahl.ort===ort&&wahl.n===n?" an":""}" data-ort="${ort}" data-n="${esc(n)}" ${d.erledigt?"disabled":""}>${dico(n,20)}<span>${esc(n)}</span></button>`).join("")||`<p class="muted small" style="margin:0">leer</p>`}</div>`};
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Auftrag ${d.r+1} von ${missionen.length}</p><p class="frage">${M.auftrag}</p>
      <div class="kp">${kasten("laptop")}${kasten("stick")}${kasten("korb")}</div>
      ${d.erledigt?"":`<div class="kp-knoepfe"><span class="muted small">${wahl?`Ausgewählt: <b>${esc(wahl.n)}</b>`:"Tippe zuerst eine Datei an."}</span>
        ${wahl&&wahl.ort==="korb"?`<button class="btn" data-a="zurueck">Wiederherstellen</button>`
          :`<button class="btn" data-a="kopie" ${wahl?"":"disabled"}>Kopieren${anderer?` auf ${ORT[anderer][1]}`:""}</button><button class="btn" data-a="schieb" ${wahl?"":"disabled"}>Verschieben${anderer?` auf ${ORT[anderer][1]}`:""}</button><button class="btn ghost" data-a="weg" ${wahl?"":"disabled"}>Löschen</button>`}</div>`}
      ${frage?`<p class="frage" style="margin-top:18px">${M.frage}</p><div class="antworten">${d.opt.map((o,i)=>`<button class="antwort" data-o="${i}">${o}</button>`).join("")}</div>`:""}${MLD}`;
    el.querySelectorAll("[data-ort]").forEach(b=>b.onclick=()=>{const w={ort:b.dataset.ort,n:b.dataset.n};wahl=wahl&&wahl.ort===w.ort&&wahl.n===w.n?null:w;zeichne()});
    el.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{if(!wahl)return;const {ort,n}=wahl,a=b.dataset.a,ziel=ort==="laptop"?"stick":"laptop";
      if(a==="zurueck"){const x=d.o.korb.find(y=>y.n===n);d.o.korb=d.o.korb.filter(y=>y!==x);if(!d.o[x.von].includes(n))d.o[x.von].push(n)}
      else if(a==="weg"){d.o[ort]=d.o[ort].filter(y=>y!==n);d.o.korb.push({n,von:ort})}
      else{if(!d.o[ziel].includes(n))d.o[ziel].push(n);if(a==="schieb")d.o[ort]=d.o[ort].filter(y=>y!==n)}
      wahl=null;
      if(M.test(hat)){if(M.frage){d.erledigt=true;ctx.speichern();zeichne();meldung(el,true,"Auftrag erledigt. Beantworte noch die Frage.")}else naechste("Auftrag erledigt.")}
      else{ctx.speichern();zeichne()}});
    el.querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{
      if(d.opt[+b.dataset.o]===M.richtig)naechste("Richtig.");
      else{ctx.fehler();b.classList.add("falsch");b.disabled=true;meldung(el,false,"Zähl oben nach: In welchen Kästen liegt die Datei?")}});
  };
  const naechste=t=>{d.r++;d.erledigt=false;d.opt=null;ctx.speichern();zeichne();
    if(d.r>=missionen.length)ctx.geschafft(punkte);else meldung(el,true,t+" Hier kommt der nächste Auftrag.")};
  zeichne();
  ctx.pruefer=()=>{if(d.r>=missionen.length){ctx.geschafft(punkte);return true}
    meldung(el,false,d.erledigt?"Beantworte zuerst die Frage.":"Erledige zuerst den Auftrag. Tippe eine Datei an und wähle dann, was mit ihr passieren soll.");return false};
  ctx.loesung=()=>{d.r=missionen.length;zeichne()};
}}}

/* ---------- Spurensuche: durch Ordner gehen, Textdateien öffnen, Hinweisen folgen, Codewort finden ---------- */
function spurenSuche({titel,punkte=20,merke,text,baum,code,art="Rätsel"}){return{titel,punkte,merke,art,zeige(el,ctx){
  const d=ctx.daten;d.pfad=d.pfad||[];
  const ordner=p=>p.reduce((o,n)=>o[n],baum);
  const zeichne=()=>{
    if(ctx.geloest){el.innerHTML=kopfText(text)+`<div class="msg ok">Das Codewort stimmt. Der Pokal ist wieder da. Tippe auf „Weiter“.</div>`;return}
    const hier=ordner(d.pfad),namen=Object.keys(hier),auf=d.auf&&typeof hier[d.auf]==="string"?d.auf:null;
    el.innerHTML=kopfText(text)+`<div class="tafel"><div class="explorer"><div class="ex-leiste"><button class="btn ghost klein-btn" id="hoch" ${d.pfad.length?"":"disabled"}>Eine Ebene zurück</button>
      <div class="ex-pfad">Vereins-Laptop ${d.pfad.map(n=>`<span>›</span> ${n}`).join(" ")}</div></div>
      <div class="ex-inhalt">${namen.map(n=>typeof hier[n]==="string"?`<button class="ex-ordner datei${auf===n?" an":""}" data-f="${esc(n)}"><span>${dico(n,44)}</span>${n}</button>`:`<button class="ex-ordner" data-n="${esc(n)}"><span>${sym("ordner",44)}</span>${n}</button>`).join("")||`<p class="muted" style="grid-column:1/-1">Dieser Ordner ist leer.</p>`}</div></div>
      ${auf?`<div class="fenster"><div class="f-kopf">${dico(auf,20)} ${esc(auf)}</div><p>${hier[auf]}</p></div>`:""}
      <div class="eing" style="margin-top:14px"><input type="text" id="cw" placeholder="Codewort" autocomplete="off" spellcheck="false" maxlength="20" value="${esc(d.v||"")}"></div></div>${MLD}`;
    el.querySelector("#hoch").onclick=()=>{d.pfad.pop();d.auf=null;ctx.speichern();zeichne()};
    el.querySelectorAll("[data-n]").forEach(b=>b.onclick=()=>{d.pfad.push(b.dataset.n);d.auf=null;ctx.speichern();zeichne()});
    el.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{d.auf=b.dataset.f;ctx.speichern();zeichne()});
    const inp=el.querySelector("#cw");inp.oninput=()=>{d.v=inp.value;ctx.speichern()};
    inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();document.getElementById("weiter")?.click()}};
  };
  zeichne();
  ctx.pruefer=()=>{if(ctx.geloest)return true;const v=(d.v||"").trim().toUpperCase();
    if(!v){meldung(el,false,"Folge den Hinweisen. Das Codewort steht in der letzten Datei.");return false}
    if(v===code){ctx.geschafft(punkte);zeichne();return true}
    if(d.falsch!==v){ctx.fehler();d.falsch=v;ctx.speichern()}
    meldung(el,false,"Das ist nicht das Codewort. Lies den letzten Hinweis noch einmal genau.");return false};
  ctx.loesung=()=>{d.v=code;zeichne()};
}}}

const POKAL={"lies-mich.txt":"Der Pokal ist weg. Wer ihn sucht, beginnt dort, wo die Tore liegen.",
  "Videos":{"Tore":{"hinweis-1.txt":"Gut gefunden. Jetzt zu den Bildern. Schau in die älteste Saison.","freistoss-tor.mp4":"Das Video läuft. Schönes Tor, aber kein Hinweis."},"Training":{}},
  "Bilder":{"Saison 2026":{"notiz.txt":"Falsche Spur. Hier ist nichts."},"Saison 2025":{},"Saison 2024":{"hinweis-2.txt":"Fast da. Geh zu Dokumente, dann Turniere, dann Pokal."}},
  "Dokumente":{"Aufstellungen":{},"Turniere":{"Liga":{"tabelle.txt":"Platz 3. Aber kein Pokal."},"Pokal":{"geheim.txt":"Der Pokal steht im Schrank vom Platzwart. Das Codewort heißt FLANKE."}}}};

station({
  id:"ordner",nr:3,ico:"📁",titel:"Ordnung im Computer",kapitel:"fit",
  kurz:"Dateien, Ordner und Pfade – damit du alles wiederfindest",
  klp:"Informatiksysteme: Dateien und Ordner verwalten (anlegen, benennen, kopieren, verschieben, löschen), Dateitypen an der Endung erkennen, Pfade lesen (hierarchische Ordnerstruktur), Dateien suchen und sortieren",
  schritte:[
    sortieren({titel:"Chaos auf dem Laptop",punkte:10,
      text:vomTrainer("Hi, ich bin der Trainer der U11 vom FC Ruhrwiese. Auf meinem neuen Laptop liegt alles durcheinander. Kannst du aufräumen?")+
        `<p style="margin:12px 0 0">Sortiere die Dateien in die passenden Ordner.</p>`,
      toepfe:[["b","Bilder",ORD],["v","Videos",ORD],["m","Musik",ORD],["d","Dokumente",ORD]],
      karten:["mannschaftsfoto.jpg","sammelkarte-nr7.png","fallrueckzieher.mp4","elfmeter-finale.mp4","torjubel.mp3","kabinen-playlist.mp3","aufstellung-samstag.docx","turnier-mai.pdf"].map((n,i)=>[n,dico(n,24),"bbvvmmdd"[i]]),
      merke:"Das Ende nach dem Punkt heißt <b>Dateiendung</b>."}),
    endungProbe({titel:"Die Endungs-Probe",punkte:15,
      text:vomTrainer("Ich habe aus Versehen die Endungen geändert. Jetzt geht nichts mehr auf. Hilfe!"),
      runden:[
        {name:"fallrueckzieher",start:".jpg",echt:".mp4",auftrag:"Wähle eine Endung und tippe auf „Öffnen“. Probier so lange, bis das Video läuft.",
          frage:"Was hat sich geändert, als du die Endung gewechselt hast?",richtig:"Das Programm, das die Datei öffnet",falsch:["Das Video selbst","Die Länge des Videos"]},
        {name:"aufstellung-samstag",start:".mp3",echt:".docx",auftrag:"Diese Datei ist eine Aufstellung zum Lesen. Finde die passende Endung.",
          frage:"Ist die Aufstellung beim Ausprobieren kaputtgegangen?",richtig:"Nein, nur das Programm war falsch",falsch:["Ja, sie ist jetzt ein Lied","Ja, sie ist jetzt leer"]},
        {name:"torjubel",start:".docx",echt:".mp3",auftrag:"Diese Datei ist ein Lied. Bring sie zum Laufen."},
      ],
      merke:"Die Endung sagt dem Computer, welches <b>Programm</b> die Datei öffnet. Der Inhalt bleibt gleich."}),
    paare({titel:"Endungen merken",punkte:10,text:"Welche Endung gehört zu welcher Datei?",
      paare:[[".jpg / .png","ein Bild"],[".mp4","ein Video"],[".mp3","ein Lied"],[".docx","ein Text aus Word"],[".pdf","ein Blatt zum Lesen und Drucken"],[".exe","ein Programm"]],
      merke:"Eine <b>.exe</b> startet ein Programm. Öffne nie eine .exe von Fremden."}),
    entscheidung({titel:"Eine passt nicht",punkte:10,text:"In jedem Ordner liegt eine Datei, die dort nicht hingehört. Finde sie.",frage:"Welche Datei gehört nicht in diesen Ordner?",
      szenen:[
        {bild:sym("ordner",44),text:"Ordner: Videos › Tore",optionen:[["torjubel.mp3",true,"Richtig. Das ist ein Lied, kein Video."],["freistoss-tor.mp4",false,"Diese Datei passt in den Ordner."],["elfmeter-finale.mp4",false,"Diese Datei passt in den Ordner."]]},
        {bild:sym("ordner",44),text:"Ordner: Bilder › Sammelkarten",optionen:[["aufstellung-pokal.docx",true,"Richtig. Das ist ein Text, kein Bild."],["sammelkarte-nr7.jpg",false,"Diese Datei passt in den Ordner."],["sammelkarte-nr10.png",false,"Auch .png ist ein Bild. Die Datei passt."]]},
        {bild:sym("ordner",44),text:"Ordner: Musik › Kabine",optionen:[["mannschaftsfoto.jpg",true,"Richtig. Ein Foto kann man nicht hören."],["kabinen-playlist.mp3",false,"Diese Datei passt in den Ordner."],["torjubel.mp3",false,"Diese Datei passt in den Ordner."]]},
        {bild:sym("ordner",44),text:"Ordner: Dokumente › Turniere",optionen:[["turnier-video.mp4",true,"Richtig. Das Video gehört zu den Videos."],["turnier-mai.pdf",false,"Diese Datei passt in den Ordner."],["turnier-juni.docx",false,"Diese Datei passt in den Ordner."]]},
      ]}),
    ordnerPfad({titel:"Das Torvideo",punkte:10,datei:dico("a.mp4",22)+" freistoss-tor.mp4",baum:VEREIN,ziel:["Videos","Verein","Tore"],
      text:"Speichere das Video in Videos › Verein › <b>Tore</b>. Klick auf einen Ordner, um hineinzugehen.",
      merke:"Ein <b>Ordner</b> kann Dateien und weitere Ordner enthalten – wie Schubladen im Schrank."}),
    ordnerPfad({titel:"Die Aufstellung",punkte:10,datei:dico("a.docx",22)+" aufstellung-pokal.docx",baum:VEREIN,ziel:["Dokumente","Verein","Aufstellungen"],
      text:"Jetzt ohne Wegbeschreibung. Wo gehört die Aufstellung für das Pokalspiel hin?"}),
    ordnerPfad({titel:"Die Sammelkarten",punkte:15,datei:dico("a.jpg",22)+" sammelkarte-nr10.jpg",baum:VEREIN,ziel:["Bilder","Verein","Sammelkarten","Saison 2026"],
      text:"Der Verein druckt Sammelkarten für diese Saison. Such den Ordner dafür. Er liegt tief."}),
    eingabe({titel:"Einen Pfad lesen",punkte:10,
      text:"Der Weg zu einer Datei heißt <b>Pfad</b>. Lies ihn von links nach rechts.",
      html:`<div class="block pfadzeile">Dieser PC › Videos › Verein › Training › dribbeln.mp4</div>
        <p class="frage">In welchem Ordner liegt das Video direkt?</p>`,
      antwort:["Training","📁 Training"],platz:"Name des Ordners",
      merke:"Der letzte Ordner vor der Datei ist der Ordner, in dem sie <b>liegt</b>."}),
    reihenfolge({titel:"Einen Pfad bauen",punkte:10,text:"Der Trainer sucht die Karte mit der Nummer 7. Bau den Pfad zu ihr, von oben nach unten.",
      schritte:["Dieser PC","Bilder","Verein","Sammelkarten","Saison 2026","sammelkarte-nr7.jpg"]}),
    eingabe({titel:"Wie tief liegt die Datei?",punkte:10,zahl:true,
      text:"Zähl die Ordner im Pfad.",
      html:`<div class="block pfadzeile">Dieser PC › Bilder › Verein › Sammelkarten › Saison 2026 › sammelkarte-nr7.jpg</div>
        <p class="frage">Wie viele Ordner stehen zwischen „Dieser PC“ und der Datei?</p>`,
      antwort:["4","vier"],platz:"Anzahl"}),
    dateiSuche({titel:"Die Suche",punkte:15,
      text:"Der Trainer hat sehr viele Dateien. Mit der <b>Suche</b> findest du sie schneller. Tippe oben ein Wort ein und schau, was übrig bleibt.",
      fragen:[
        {frage:"Wie viele Videos hat der Trainer? Such nach <b>.mp4</b>.",antwort:["4","vier"],zahl:true,platz:"Anzahl",tipp:"Tippe oben .mp4 ins Suchfeld und zähl die Treffer."},
        {frage:"In welchem Monat ist das Turnier? Such nach <b>turnier</b>.",antwort:["Mai","im Mai"],platz:"Monat",tipp:"Tippe oben turnier ins Suchfeld. Der Monat steht im Dateinamen."},
        {frage:"Wie viele Dateien haben „training“ im Namen?",antwort:["3","drei"],zahl:true,platz:"Anzahl",tipp:"Such nach training und zähl alle Treffer, egal welche Endung."},
        {frage:"Zwei Dateien haben einen schlechten Namen. Man weiß nicht, was drin ist. Schreib den Namen von dem <b>Bild</b> auf.",antwort:["bild.jpg","bild"],platz:"Dateiname",tipp:"Such nach .jpg. Welcher Name verrät nicht, was auf dem Bild ist?"},
      ],
      merke:"Die Suche durchsucht alle Ordner. Ein Wort aus dem Namen reicht."}),
    dateiListe({titel:"Der Datei-Detektiv",punkte:15,
      text:"Tippe oben auf <b>Name</b>, <b>Geändert am</b> oder <b>Größe</b>. Dann sortiert der Computer die Liste. Tippe danach auf die gesuchte Datei.",
      dateien:[["aufstellung-samstag.docx","12.11.2026",20261112,"24 KB",24],["elfmeter-finale.mp4","03.06.2026",20260603,"310 MB",310000],["mannschaftsfoto-2026.jpg","20.08.2026",20260820,"4 MB",4000],
        ["torjubel.mp3","15.09.2025",20250915,"6 MB",6000],["turnier-mai.pdf","02.05.2026",20260502,"180 KB",180],["notiz.txt","28.10.2026",20261028,"1 KB",1],["training-dribbeln.mp4","09.10.2026",20261009,"95 MB",95000]],
      fragen:[{frage:"Welche Datei ist am größten?",antwort:"elfmeter-finale.mp4"},{frage:"Welche Datei hat der Trainer zuletzt geändert?",antwort:"aufstellung-samstag.docx"},
        {frage:"Welche Datei ist am kleinsten?",antwort:"notiz.txt"},{frage:"Welche Datei ist die älteste?",antwort:"torjubel.mp3"}],
      merke:"Videos brauchen am meisten <b>Speicherplatz</b>."}),
    auswaehlen({titel:"Gute Dateinamen",punkte:10,
      text:"Stell dir vor, der Trainer sucht die Datei in einem Jahr. Tippe alle <b>guten</b> Namen an.",
      karten:[["aufstellung-pokal-2026.docx",true],["Neues Dokument (3).docx",false],["asdfgh.docx",false],["torwart-training-november.pdf",true],["bild.jpg",false],["mannschaftsfoto-2026.jpg",true],["dings.mp4",false],["elfmeter-finale.mp4",true]],
      merke:"Ein guter Name verrät, was <b>drin</b> ist."}),
    namenGeben({titel:"Du gibst den Namen",punkte:15,
      text:"Jetzt erfindest du selbst gute Dateinamen. Schreib klein und ohne Leerzeichen, zum Beispiel <b>tor-im-finale.mp4</b>.",
      runden:[
        {bild:dico("a.jpg",44),was:"Ein Foto vom Torwart beim Training.",auftrag:"Gib dem Foto einen Namen. Das Wort „torwart“ muss vorkommen. Am Ende steht .jpg.",wort:"torwart",endung:".jpg"},
        {bild:dico("a.mp4",44),was:"Ein Video vom Elfmeter im Finale.",auftrag:"Gib dem Video einen Namen. Das Wort „elfmeter“ muss vorkommen. Welche Endung hat ein Video?",wort:"elfmeter",endung:".mp4"},
        {bild:dico("a.docx",44),was:"Die Einladung zum Sommerfest, geschrieben mit Word.",auftrag:"Gib dem Text einen Namen. Das Wort „sommerfest“ muss vorkommen. Welche Endung hat ein Text aus Word?",wort:"sommerfest",endung:".docx"},
      ]}),
    reihenfolge({titel:"Eine Datei umbenennen",punkte:10,text:"Eine Datei heißt „Neues Dokument (3)“. So bekommt sie einen guten Namen. Bring die Schritte in die richtige Reihenfolge.",
      schritte:["Rechtsklick auf die Datei","„Umbenennen“ auswählen","Den alten Namen löschen","Den neuen Namen eintippen","Enter drücken"],
      merke:"Profi-Trick: Datei anklicken und <b>F2</b> drücken."}),
    kopierProbe({titel:"Kopieren oder verschieben?",punkte:20,
      text:vomTrainer("Morgen ist das Turnier. Ich brauche ein paar Dateien auf dem USB-Stick.")+`<p style="margin:12px 0 0">Tippe eine Datei an. Wähle dann, was mit ihr passieren soll. Ausprobieren kostet nichts.</p>`,
      start:{laptop:["freistoss-tor.mp4","aufstellung-pokal.docx","foto-alt.jpg"],stick:[]},
      missionen:[
        {auftrag:"Das Torvideo soll auf den Stick. Auf dem Laptop soll es auch bleiben.",test:h=>h("laptop","freistoss-tor.mp4")&&h("stick","freistoss-tor.mp4"),
          frage:"Wie oft gibt es das Torvideo jetzt?",richtig:"Zweimal",falsch:["Einmal","Dreimal"]},
        {auftrag:"Die Aufstellung soll nur noch auf dem Stick sein.",test:h=>h("stick","aufstellung-pokal.docx")&&!h("laptop","aufstellung-pokal.docx"),
          frage:"Wie oft gibt es die Aufstellung jetzt auf Laptop und Stick zusammen?",richtig:"Einmal",falsch:["Zweimal","Gar nicht mehr"]},
        {auftrag:"Das alte Foto braucht niemand mehr. Lösche es vom Laptop.",test:h=>!h("laptop","foto-alt.jpg")&&h("korb","foto-alt.jpg")},
        {auftrag:"Der Trainer will das Foto doch behalten. Hol es zurück auf den Laptop.",test:h=>h("laptop","foto-alt.jpg")},
      ],
      merke:"<b>Kopieren</b> macht eine zweite Datei. Verschieben nicht."}),
    auswaehlen({titel:"Der volle Papierkorb",punkte:10,
      text:"Im Papierkorb vom Trainer liegen acht Dateien. Vier davon braucht er noch. Tippe sie an.",
      karten:[["aufstellung-samstag.docx",true],["mannschaftsfoto-2026.jpg",true],["turnier-mai.pdf",true],["elfmeter-finale.mp4",true],["foto-verwackelt.jpg",false],["Neues Dokument (3).docx – leer",false],["test-test.txt",false],["aufstellung-samstag – Kopie.docx",false]],
      merke:"Erst wenn der Papierkorb <b>geleert</b> wird, sind die Dateien wirklich weg."}),
    entscheidung({titel:"Hilfe, die Datei ist weg!",punkte:15,text:"Der Trainer ruft dich an. Was rätst du ihm?",
      szenen:[
        {bild:sym("lupe",44),text:"Er hat die Aufstellung gespeichert, findet sie aber nicht mehr.",optionen:[["Mit der Suche nach „aufstellung“ suchen",true,"Richtig. Die Suche schaut in alle Ordner."],["Die Aufstellung noch einmal schreiben",false,"Das kostet viel Zeit. Erst suchen."],["Den Laptop neu starten",false,"Davon taucht die Datei nicht auf."]]},
        {bild:sym("korb",44),text:"Er hat aus Versehen das Mannschaftsfoto gelöscht.",optionen:[["Im Papierkorb nachschauen und es wiederherstellen",true,"Genau. Gelöschte Dateien liegen erst im Papierkorb."],["Nichts tun, es ist für immer weg",false,"Erst in den Papierkorb schauen."],["Den Papierkorb leeren",false,"Dann wäre das Foto wirklich weg."]]},
        {bild:sym("stick",44),text:"Er braucht das Torvideo auf dem Laptop im Vereinsheim.",optionen:[["Das Video auf einen USB-Stick kopieren und mitnehmen",true,"Richtig. So nimmt man Dateien mit."],["Den Bildschirm abfotografieren",false,"Dann hat er nur ein Foto vom Bildschirm."],["Hoffen, dass es dort auch ist",false,"Dateien wandern nicht von allein auf andere Geräte."]]},
      ]}),
    reihenfolge({titel:"Einen neuen Ordner anlegen",punkte:10,text:"Der Trainer will einen Ordner „Sommerturnier“. Bring die Schritte in die richtige Reihenfolge.",
      schritte:["Rechtsklick auf eine freie Stelle","„Neu“ auswählen","„Ordner“ anklicken","Sommerturnier eintippen","Enter drücken"]}),
    spurenSuche({titel:"Der verschwundene Pokal",punkte:20,baum:POKAL,code:"FLANKE",
      text:vomTrainer("Der Pokal ist aus dem Vereinsheim verschwunden! Auf dem Vereins-Laptop liegt eine seltsame Datei.")+`<p style="margin:12px 0 0">Öffne die Datei und folge den Hinweisen. Am Ende findest du ein <b>Codewort</b>.</p>`}),
    luecken({titel:"Merk-Check",punkte:15,
      saetze:["Das Ende nach dem Punkt heißt {Dateiendung}.","Die Endung sagt, welches {Programm} die Datei öffnet.","Ein {Ordner} kann Dateien und andere Ordner enthalten.","Der Weg zu einer Datei heißt {Pfad}.","Beim {Kopieren} gibt es die Datei danach zweimal.","Gelöschte Dateien liegen zuerst im {Papierkorb}.","Mit der {Suche} findest du Dateien schnell wieder."],
      extra:["Drucker","Prozessor"],
      merke:"Geschafft. Diese sieben Sätze sind das Wichtigste aus der Station."}),
  ],
});
}
