/* Station 3 · Ordnung im Computer – Dateien, Endungen, Ordner, Pfade, Suche
   Rahmen: Der Trainer der U11 vom FC Ruhrwiese hat einen neuen Laptop. Alles liegt durcheinander. Das Kind räumt für ihn auf.
   (Nov. 2026 neu gebaut. Ab jetzt neue Teile nur noch hinten anhängen, sobald Kinder an der Station arbeiten.) */
{
const VEREIN={"Bilder":{"Verein":{"Sammelkarten":{"Saison 2026":{},"Saison 2025":{}},"Mannschaftsfoto":{}},"Privat":{}},
  "Dokumente":{"Verein":{"Aufstellungen":{},"Training":{},"Turniere":{}},"Privat":{}},
  "Musik":{"Kabine":{}},"Videos":{"Verein":{"Tore":{},"Training":{}},"Privat":{}}};

/* Nachricht vom Trainer: ruhige Sprechblase, keine Farbe nötig */
const vomTrainer=t=>`<div class="nachricht"><span class="nv">Nachricht vom Trainer</span><p>${t}</p></div>`;

/* ---------- Endungs-Probe: Endung ändern, „Öffnen“ drücken, sehen was passiert ----------
   Das Kind entdeckt selbst: Die Endung entscheidet, welches Programm die Datei öffnet. Der Inhalt bleibt gleich.
   Falsches Öffnen ist Ausprobieren und kostet nichts. Nur eine falsche Antwort auf die Frage kostet Punkte. */
const ENDUNG={".mp4":["🎬","Video-Player"],".jpg":["🖼️","Fotos"],".mp3":["🎵","Musik-Player"],".docx":["📝","Word"]};
const INHALT={".mp4":"Das Video läuft: der Fallrückzieher.",".docx":"Die Aufstellung für Samstag ist offen.",".mp3":"Das Lied läuft: der Torjubel aus der Kabine."};
function endungProbe({titel,punkte=15,merke,text,runden}){return{titel,punkte,merke,zeige(el,ctx){
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
    return z.ok?`<div class="fenster ok"><div class="f-kopf">${ico} ${prog}</div><p>${INHALT[z.echt]}</p></div>`
      :`<div class="fenster"><div class="f-kopf">${ico} ${prog}</div><p><b>Fehler:</b> ${prog} kann diese Datei nicht öffnen.</p></div>`};
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
function dateiSuche({titel,punkte=15,merke,text,fragen}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.r=d.r||0;d.s=d.s||"";
  const zeichne=(fokus)=>{
    if(d.r>=fragen.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alle ${fragen.length} Fragen gelöst. Tippe auf „Weiter“.</div>`;return}
    const F=fragen[d.r],q=d.s.trim().toLowerCase(),treffer=q?DATEIEN.filter(x=>x.toLowerCase().includes(q)):DATEIEN;
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Frage ${d.r+1} von ${fragen.length}</p><p class="frage">${F.frage}</p>
      <div class="explorer"><div class="ex-leiste"><span aria-hidden="true">🔍</span><input type="text" id="such" placeholder="Suchen" autocomplete="off" spellcheck="false" value="${esc(d.s)}" aria-label="Dateien durchsuchen"></div>
        <p class="muted small" style="margin:8px 12px 0">${q?`${treffer.length} ${treffer.length===1?"Treffer":"Treffer"}`:`Alle ${DATEIEN.length} Dateien`}</p>
        <ul class="treffer">${treffer.map(x=>`<li>${x}</li>`).join("")||`<li class="muted">Nichts gefunden. Probier ein kürzeres Wort.</li>`}</ul></div>
      <div class="eing" style="margin-top:14px"><input type="text" id="antw" ${F.zahl?'inputmode="numeric"':""} placeholder="${F.platz||"Deine Antwort"}" autocomplete="off" spellcheck="false" value="${esc(d.a||"")}"></div>${MLD}`;
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
    if(!v){meldung(el,false,"Schreib zuerst deine Antwort ins untere Feld.");return false}
    if(F.antwort.map(norm).includes(v)){d.r++;d.a="";d.s="";ctx.speichern();
      if(d.r>=fragen.length){zeichne();ctx.geschafft(punkte);return true}
      zeichne();meldung(el,true,"Richtig. Hier kommt die nächste Frage.");return false}
    if(d.falsch!==v){ctx.fehler();d.falsch=v;ctx.speichern()}
    meldung(el,false,F.tipp||"Schau genau in die Trefferliste.");return false};
  ctx.loesung=()=>{d.r=fragen.length;zeichne()};
}}}

station({
  id:"ordner",nr:3,ico:"📁",titel:"Ordnung im Computer",kapitel:"fit",
  kurz:"Dateien, Ordner und Pfade – damit du alles wiederfindest",
  klp:"Informatiksysteme: Dateien und Ordner verwalten, Dateitypen an der Endung erkennen, Pfade lesen (hierarchische Ordnerstruktur), Dateien suchen",
  schritte:[
    sortieren({titel:"Chaos auf dem Laptop",punkte:10,
      text:vomTrainer("Hi, ich bin der Trainer der U11 vom FC Ruhrwiese. Auf meinem neuen Laptop liegt alles durcheinander. Kannst du aufräumen?")+
        `<p style="margin:12px 0 0">Sortiere die Dateien in die passenden Ordner.</p>`,
      toepfe:[["b","Bilder","🖼️"],["v","Videos","🎬"],["m","Musik","🎵"],["d","Dokumente","📄"]],
      karten:[["mannschaftsfoto.jpg","","b"],["sammelkarte-nr7.png","","b"],["fallrueckzieher.mp4","","v"],["elfmeter-finale.mp4","","v"],["torjubel.mp3","","m"],["kabinen-playlist.mp3","","m"],["aufstellung-samstag.docx","","d"],["turnier-mai.pdf","","d"]],
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
      paare:[[".jpg / .png","🖼️ ein Bild"],[".mp4","🎬 ein Video"],[".mp3","🎵 ein Lied"],[".docx","📝 ein Text aus Word"],[".pdf","📄 ein Blatt zum Lesen und Drucken"],[".exe","⚙️ ein Programm"]],
      merke:"Eine <b>.exe</b> startet ein Programm. Öffne nie eine .exe von Fremden."}),
    ordnerPfad({titel:"Das Torvideo",punkte:10,datei:"🎬 freistoss-tor.mp4",baum:VEREIN,ziel:["Videos","Verein","Tore"],
      text:"Speichere das Video in Videos › Verein › <b>Tore</b>. Klick auf einen Ordner, um hineinzugehen.",
      merke:"Ein <b>Ordner</b> kann Dateien und weitere Ordner enthalten – wie Schubladen im Schrank."}),
    ordnerPfad({titel:"Die Aufstellung",punkte:10,datei:"📝 aufstellung-pokal.docx",baum:VEREIN,ziel:["Dokumente","Verein","Aufstellungen"],
      text:"Jetzt ohne Wegbeschreibung. Wo gehört die Aufstellung für das Pokalspiel hin?"}),
    ordnerPfad({titel:"Die Sammelkarten",punkte:15,datei:"🖼️ sammelkarte-nr10.jpg",baum:VEREIN,ziel:["Bilder","Verein","Sammelkarten","Saison 2026"],
      text:"Der Verein druckt Sammelkarten für diese Saison. Such den Ordner dafür. Er liegt tief."}),
    eingabe({titel:"Einen Pfad lesen",punkte:10,
      text:"Der Weg zu einer Datei heißt <b>Pfad</b>. Lies ihn von links nach rechts.",
      html:`<div class="block pfadzeile">Dieser PC › Videos › Verein › Training › dribbeln.mp4</div>
        <p class="frage">In welchem Ordner liegt das Video direkt?</p>`,
      antwort:["Training","📁 Training"],platz:"Name des Ordners",
      merke:"Der letzte Ordner vor der Datei ist der Ordner, in dem sie <b>liegt</b>."}),
    reihenfolge({titel:"Einen Pfad bauen",punkte:10,text:"Der Trainer sucht die Karte mit der Nummer 7. Bau den Pfad zu ihr, von oben nach unten.",
      schritte:["Dieser PC","Bilder","Verein","Sammelkarten","Saison 2026","sammelkarte-nr7.jpg"]}),
    dateiSuche({titel:"Die Suche",punkte:15,
      text:"Der Trainer hat sehr viele Dateien. Mit der <b>Suche</b> findest du sie schneller. Tippe oben ein Wort ein und schau, was übrig bleibt.",
      fragen:[
        {frage:"Wie viele Videos hat der Trainer? Such nach <b>.mp4</b>.",antwort:["4","vier"],zahl:true,platz:"Anzahl",tipp:"Tippe oben .mp4 ins Suchfeld und zähl die Treffer."},
        {frage:"In welchem Monat ist das Turnier? Such nach <b>turnier</b>.",antwort:["Mai","im Mai"],platz:"Monat",tipp:"Tippe oben turnier ins Suchfeld. Der Monat steht im Dateinamen."},
        {frage:"Wie viele Dateien haben „training“ im Namen?",antwort:["3","drei"],zahl:true,platz:"Anzahl",tipp:"Such nach training und zähl alle Treffer, egal welche Endung."},
        {frage:"Zwei Dateien haben einen schlechten Namen. Man weiß nicht, was drin ist. Schreib den Namen von dem <b>Bild</b> auf.",antwort:["bild.jpg","bild"],platz:"Dateiname",tipp:"Such nach .jpg. Welcher Name verrät nicht, was auf dem Bild ist?"},
      ],
      merke:"Die Suche durchsucht alle Ordner. Ein Wort aus dem Namen reicht."}),
    auswaehlen({titel:"Gute Dateinamen",punkte:10,
      text:"Stell dir vor, der Trainer sucht die Datei in einem Jahr. Tippe alle <b>guten</b> Namen an.",
      karten:[["aufstellung-pokal-2026.docx",true],["Neues Dokument (3).docx",false],["asdfgh.docx",false],["torwart-training-november.pdf",true],["bild.jpg",false],["mannschaftsfoto-2026.jpg",true],["dings.mp4",false],["elfmeter-finale.mp4",true]],
      merke:"Ein guter Name verrät, was <b>drin</b> ist."}),
    entscheidung({titel:"Hilfe, die Datei ist weg!",punkte:15,text:"Der Trainer ruft dich an. Was rätst du ihm?",
      szenen:[
        {bild:"🔍",text:"Er hat die Aufstellung gespeichert, findet sie aber nicht mehr.",optionen:[["Mit der Suche nach „aufstellung“ suchen",true,"Richtig. Die Suche schaut in alle Ordner."],["Die Aufstellung noch einmal schreiben",false,"Das kostet viel Zeit. Erst suchen."],["Den Laptop neu starten",false,"Davon taucht die Datei nicht auf."]]},
        {bild:"🗑️",text:"Er hat aus Versehen das Mannschaftsfoto gelöscht.",optionen:[["Im Papierkorb nachschauen und es wiederherstellen",true,"Genau. Gelöschte Dateien liegen erst im Papierkorb."],["Nichts tun, es ist für immer weg",false,"Erst in den Papierkorb schauen."],["Den Papierkorb leeren",false,"Dann wäre das Foto wirklich weg."]]},
        {bild:"🏟️",text:"Er braucht das Torvideo auf dem Laptop im Vereinsheim.",optionen:[["Das Video auf einen USB-Stick kopieren und mitnehmen",true,"Richtig. So nimmt man Dateien mit."],["Den Bildschirm abfotografieren",false,"Dann hat er nur ein Foto vom Bildschirm."],["Hoffen, dass es dort auch ist",false,"Dateien wandern nicht von allein auf andere Geräte."]]},
      ],merke:"Gelöschte Dateien landen zuerst im <b>Papierkorb</b>."}),
    reihenfolge({titel:"Einen neuen Ordner anlegen",punkte:10,text:"Der Trainer will einen Ordner „Sommerturnier“. Bring die Schritte in die richtige Reihenfolge.",
      schritte:["Rechtsklick auf eine freie Stelle","„Neu“ auswählen","„Ordner“ anklicken","Sommerturnier eintippen","Enter drücken"]}),
    luecken({titel:"Merk-Check",punkte:15,
      saetze:["Das Ende nach dem Punkt heißt {Dateiendung}.","Die Endung sagt, welches {Programm} die Datei öffnet.","Ein {Ordner} kann Dateien und andere Ordner enthalten.","Der Weg zu einer Datei heißt {Pfad}.","Gelöschte Dateien liegen zuerst im {Papierkorb}.","Mit der {Suche} findest du Dateien schnell wieder."],
      extra:["Drucker","Prozessor"],
      merke:"Geschafft. Diese sechs Sätze sind das Wichtigste aus der Station."}),
  ],
});
}
