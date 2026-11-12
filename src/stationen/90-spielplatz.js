/* Spielplatz: Bonus-Spiele ohne Note. Öffnet sich, wenn ein Kind heute seine Station geschafft hat.
   Der Stand bleibt nur auf diesem Gerät und wird am Ende gelöscht (jedes Mal neu spielen). */
{
const P=()=>window.PIXEL;
/* ===== Neue Spiele (Nov. 2026): mit eigenem Rekord. rekord(id,wert,kleinerIstBesser) und spielRekord(id) kommen aus app.js ===== */
const zuf=n=>Math.floor(Math.random()*n);
const rekText=(id,einheit)=>{const r=spielRekord(id);return r==null?"Noch kein Rekord":`Dein Rekord: <b>${r}</b> ${einheit}`};

station({id:"schlange",nr:86,spiel:true,ico:"🐍",titel:"Schlange",kurz:"Friss Äpfel mit den Pfeiltasten",
  schritte:[{titel:"Schlange",punkte:0,zeige(el,ctx){
    const W=20,H=14,Z=24;
    el.innerHTML=`<p>Steuere die Schlange mit den <b>Pfeiltasten</b>. Friss die roten Äpfel. Fahr nicht gegen die Wand und nicht in dich selbst.</p>
      <div class="sp-kopf"><span id="pk">Äpfel: <b>0</b></span><span id="rk">${rekText("schlange","Äpfel")}</span></div>
      <canvas id="cv" width="${W*Z}" height="${H*Z}" class="sp-feld"></canvas>
      <div class="sp-pfeile" aria-label="Steuerung für Tablets"><button data-d="0,-1">▲</button><div><button data-d="-1,0">◀</button><button data-d="0,1">▼</button><button data-d="1,0">▶</button></div></div>
      <div class="row" style="margin-top:12px"><button class="btn" id="st">Start</button><span class="muted" id="inf"></span></div>`;
    const cv=el.querySelector("#cv"),g=cv.getContext("2d"),css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    let sn=[{x:5,y:7},{x:4,y:7},{x:3,y:7}],dir={x:1,y:0},nd=dir,apfel={x:12,y:7},timer=null,pkt=0,laeuft=false;
    const male=()=>{g.clearRect(0,0,cv.width,cv.height);g.fillStyle=css("--fill")||"#F1F3F8";g.fillRect(0,0,cv.width,cv.height);
      g.fillStyle="#D24B3E";g.fillRect(apfel.x*Z+4,apfel.y*Z+4,Z-8,Z-8);
      sn.forEach((s,i)=>{g.fillStyle=i?"#2DA44E":"#17683A";g.fillRect(s.x*Z+1,s.y*Z+1,Z-2,Z-2)})};
    const neuApfel=()=>{do{apfel={x:zuf(W),y:zuf(H)}}while(sn.some(s=>s.x===apfel.x&&s.y===apfel.y))};
    const ende=()=>{laeuft=false;clearTimeout(timer);const neu=rekord("schlange",pkt);
      el.querySelector("#inf").innerHTML=`Vorbei! Du hast <b>${pkt}</b> ${pkt===1?"Apfel":"Äpfel"} gefressen.${neu?" <b>Neuer Rekord!</b>":""}`;
      el.querySelector("#rk").innerHTML=rekText("schlange","Äpfel");el.querySelector("#st").textContent="Noch mal";el.querySelector("#st").disabled=false};
    const tick=()=>{dir=nd;const k={x:sn[0].x+dir.x,y:sn[0].y+dir.y};
      if(k.x<0||k.y<0||k.x>=W||k.y>=H||sn.some(s=>s.x===k.x&&s.y===k.y))return ende();
      sn.unshift(k);if(k.x===apfel.x&&k.y===apfel.y){pkt++;el.querySelector("#pk").innerHTML=`Äpfel: <b>${pkt}</b>`;neuApfel()}else sn.pop();male()};
    const lauf=()=>{if(!laeuft)return;tick();if(laeuft)timer=setTimeout(lauf,Math.max(85,170-pkt*4))};
    const start=()=>{sn=[{x:5,y:7},{x:4,y:7},{x:3,y:7}];dir=nd={x:1,y:0};pkt=0;neuApfel();laeuft=true;
      el.querySelector("#pk").innerHTML="Äpfel: <b>0</b>";el.querySelector("#inf").textContent="";el.querySelector("#st").disabled=true;male();clearTimeout(timer);timer=setTimeout(lauf,400)};
    const lenke=(x,y)=>{if(laeuft&&!(dir.x===-x&&dir.y===-y))nd={x,y}};
    const taste=e=>{const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key];
      if(!m)return;if(laeuft)e.preventDefault();lenke(m[0],m[1])};
    document.addEventListener("keydown",taste);ctx.beimVerlassen(()=>{document.removeEventListener("keydown",taste);clearTimeout(timer);laeuft=false});
    el.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{const [x,y]=b.dataset.d.split(",").map(Number);lenke(x,y)});
    el.querySelector("#st").onclick=start;male();
  }}]});

station({id:"jagd",nr:87,spiel:true,ico:"🎯",titel:"Klick-Jagd",kurz:"Triff so viele Ziele wie möglich",
  schritte:[{titel:"Klick-Jagd",punkte:0,zeige(el,ctx){
    const ZEIT=30;
    el.innerHTML=`<p>Du hast <b>${ZEIT} Sekunden</b>. Klick so viele Ziele an, wie du schaffst. Die Ziele werden immer kleiner.</p>
      <div class="sp-kopf"><span id="pk">Treffer: <b>0</b> · Zeit: <b>${ZEIT}</b></span><span id="rk">${rekText("jagd","Treffer")}</span></div>
      <div class="sp-jagd" id="feld"><button class="btn" id="st">Start</button></div><p class="muted" id="inf" style="margin-top:10px"></p>`;
    const feld=el.querySelector("#feld");let pkt=0,rest=ZEIT,timer=null,laeuft=false;
    const kopf=()=>el.querySelector("#pk").innerHTML=`Treffer: <b>${pkt}</b> · Zeit: <b>${rest}</b>`;
    const ziel=()=>{const gr=Math.max(34,70-pkt*2),b=document.createElement("button");b.className="sp-ziel";b.setAttribute("aria-label","Ziel");
      b.style.width=b.style.height=gr+"px";b.style.left=zuf(Math.max(1,feld.clientWidth-gr))+"px";b.style.top=zuf(Math.max(1,feld.clientHeight-gr))+"px";
      b.onclick=e=>{e.stopPropagation();if(!laeuft)return;pkt++;kopf();b.remove();ziel()};feld.append(b)};
    const ende=()=>{laeuft=false;clearInterval(timer);feld.innerHTML=`<button class="btn" id="st">Noch mal</button>`;feld.querySelector("#st").onclick=start;
      const neu=rekord("jagd",pkt);el.querySelector("#inf").innerHTML=`Zeit um! <b>${pkt}</b> Treffer in ${ZEIT} Sekunden.${neu?" <b>Neuer Rekord!</b>":""}`;el.querySelector("#rk").innerHTML=rekText("jagd","Treffer")};
    function start(){pkt=0;rest=ZEIT;laeuft=true;feld.innerHTML="";el.querySelector("#inf").textContent="";kopf();ziel();
      clearInterval(timer);timer=setInterval(()=>{rest--;kopf();if(rest<=0)ende()},1000)}
    el.querySelector("#st").onclick=start;ctx.beimVerlassen(()=>{clearInterval(timer);laeuft=false});
  }}]});

station({id:"memory",nr:88,spiel:true,ico:"🃏",titel:"Memory",kurz:"Finde alle Paare mit wenigen Zügen",
  schritte:[{titel:"Memory",punkte:0,zeige(el,ctx){
    const BILDER=["🖱️","⌨️","🖥️","🖨️","💾","🔒","🤖","📶"];let karten,offen,gefunden,zuege,sperre;
    const neu=()=>{karten=mischen([...BILDER,...BILDER]);offen=[];gefunden=new Set();zuege=0;sperre=false;zeichne()};
    const zeichne=()=>{const fertig=gefunden.size===karten.length;
      el.innerHTML=`<p>Deck immer zwei Karten auf. Gleiche Bilder bleiben offen. Schaffst du alle 8 Paare mit wenigen Zügen?</p>
        <div class="sp-kopf"><span>Züge: <b>${zuege}</b></span><span>${(()=>{const r=spielRekord("memory");return r==null?"Noch kein Rekord":`Dein Rekord: <b>${r}</b> Züge`})()}</span></div>
        <div class="sp-memo">${karten.map((b,i)=>{const auf=offen.includes(i)||gefunden.has(i);return`<button class="${auf?"auf":""}${gefunden.has(i)?" ok":""}" data-i="${i}" ${auf?"disabled":""} aria-label="${auf?b:"verdeckte Karte"}">${auf?b:""}</button>`}).join("")}</div>
        ${fertig?`<div class="msg ok" style="margin-top:12px">Alle Paare gefunden in <b>${zuege}</b> Zügen.${el.dataset.neu==="1"?" <b>Neuer Rekord!</b>":""}</div>`:""}
        <div class="row" style="margin-top:12px"><button class="btn ghost" id="nm">Neu mischen</button></div>`;
      el.querySelector("#nm").onclick=()=>{el.dataset.neu="";neu()};
      el.querySelectorAll("[data-i]").forEach(k=>k.onclick=()=>{if(sperre)return;const i=+k.dataset.i;offen.push(i);
        if(offen.length===2){zuege++;const [a,b]=offen;
          if(karten[a]===karten[b]){gefunden.add(a);gefunden.add(b);offen=[];
            if(gefunden.size===karten.length)el.dataset.neu=rekord("memory",zuege,true)?"1":"";zeichne()}
          else{sperre=true;zeichne();setTimeout(()=>{offen=[];sperre=false;if(el.isConnected)zeichne()},900)}}
        else zeichne()});
    };
    neu();
  }}]});

station({id:"lampen",nr:89,spiel:true,ico:"💡",titel:"Lampen-Blitz",kurz:"Schalte die richtigen Lampen an",
  schritte:[{titel:"Lampen-Blitz",punkte:0,zeige(el,ctx){
    const ZEIT=60,WERT=[16,8,4,2,1];let an,soll,pkt=0,rest=ZEIT,timer=null,laeuft=false,gespielt=false;
    const summe=()=>WERT.reduce((a,w,i)=>a+(an[i]?w:0),0);
    const zeichne=()=>{
      el.innerHTML=`<p>Jede Lampe hat einen Wert. Schalte die Lampen so an, dass die <b>Summe</b> genau die Zahl ergibt. Wie viele Zahlen schaffst du in ${ZEIT} Sekunden?</p>
        <div class="sp-kopf"><span>Geschafft: <b>${pkt}</b> · Zeit: <b id="zt">${rest}</b></span><span>${rekText("lampen","Zahlen")}</span></div>
        ${laeuft?`<p class="sp-zahl">Zahl: <b>${soll}</b> <span class="muted">· deine Summe: ${summe()}</span></p>
          <div class="sp-lampen">${WERT.map((w,i)=>`<button class="${an[i]?"an":""}" data-l="${i}"><span>💡</span><b>${w}</b></button>`).join("")}</div>`
          :`<div class="row"><button class="btn" id="st">${gespielt?"Noch mal":"Start"}</button><span class="muted" id="inf">${el.dataset.inf||""}</span></div>`}`;
      const st=el.querySelector("#st");if(st)st.onclick=start;
      el.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{const i=+b.dataset.l;an[i]=!an[i];
        if(summe()===soll){pkt++;runde()}zeichne()});
    };
    const runde=()=>{an=[false,false,false,false,false];let z;do{z=1+zuf(31)}while(z===soll);soll=z};
    const ende=()=>{laeuft=false;clearInterval(timer);const neu=rekord("lampen",pkt);
      el.dataset.inf=`Zeit um! ${pkt} ${pkt===1?"Zahl":"Zahlen"} geschafft.${neu?" Neuer Rekord!":""}`;gespielt=true;zeichne()};
    function start(){pkt=0;rest=ZEIT;laeuft=true;el.dataset.inf="";runde();zeichne();
      clearInterval(timer);timer=setInterval(()=>{rest--;const z=el.querySelector("#zt");if(z)z.textContent=rest;if(rest<=0)ende()},1000)}
    ctx.beimVerlassen(()=>{clearInterval(timer);laeuft=false});
    an=[false,false,false,false,false];soll=0;zeichne();
  }}]});

station({id:"atelier",nr:90,spiel:true,ico:"🎨",titel:"Pixel-Atelier",kurz:"Frei malen und als Bild speichern",
  schritte:[{titel:"Dein Kunstwerk",punkte:0,zeige(el,ctx){
    const d=ctx.daten,{PAL,NAMEN}=P();
    el.innerHTML=`<p>Mal, was du willst! Wenn du fertig bist, kannst du dein Bild als Datei speichern.</p><p class="muted small">Ideen: dein Lieblingstier · ein Fußball · ein Minecraft-Block · dein Name · eine Figur aus deinem Lieblingsspiel</p><div id="pal"></div><div class="frei" id="b"></div>
      <div class="row" style="margin-top:14px"><button class="btn" id="png">💾 Als Bild speichern</button><button class="btn ghost" id="l">🧽 Alles löschen</button></div>`;
    const leiste=farbLeiste(PAL,NAMEN,1,false,false);el.querySelector("#pal").append(leiste.el);
    const r=pixelRaster({w:16,h:16,werte:d.bild,palette:PAL,malbar:true,farbe:leiste.farbe,onAenderung:v=>{d.bild=v.slice();ctx.speichern()}});
    el.querySelector("#b").append(r.el);
    el.querySelector("#l").onclick=()=>{if(confirm("Ganzes Bild löschen?"))r.setzeAlle(Array(256).fill(0))};
    el.querySelector("#png").onclick=()=>{const c=document.createElement("canvas");c.width=c.height=320;const g=c.getContext("2d");
      r.werte.forEach((v,k)=>{g.fillStyle=PAL[v];g.fillRect(k%16*20,Math.floor(k/16)*20,20,20)});
      const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download="mein-pixelbild.png";a.click();toast("Bild gespeichert! 🎨")};
  }}]});
station({id:"robobonus",nr:91,spiel:true,ico:"🤖",titel:"Robo-Bonus",kurz:"Knifflige Labyrinthe für Profis",
  schritte:[
    robo({titel:"Die Spirale",punkte:0,schleifen:true,max:14,karte:["#########","#S......#","#######.#","#.....#.#","#.###.#.#","#.#Z..#.#","#.#####.#","#.......#","#########"],loesung:"6x(R) 6x(D) 6x(L) 4x(U) 4x(R) 2x(D) 2x(L)",
      text:"Ab ins Zentrum der Spirale – mit höchstens 14 Befehlen!"}),
    robo({titel:"Münz-Schlange",punkte:0,schleifen:true,max:10,karte:["#########","#SM.M.M.#","#######.#","#.M.M.M.#","#.#######","#......Z#","#########"],loesung:"6x(R) 2x(D) 6x(L) 2x(D) 6x(R)",
      text:"Sammle alle Münzen. Höchstens 10 Befehle!"}),
    robo({titel:"Treppe nach oben",punkte:0,schleifen:true,max:4,karte:["########","#####.Z#","####..##","###..###","##..####","#S.#####","########"],loesung:"4x(R U) R",
      text:"Diesmal geht es nach oben. Höchstens 4 Befehle!"}),
    robo({titel:"Diagonal-Münzen",punkte:0,schleifen:true,max:4,karte:["########","#SM#####","##.M####","###.M###","####.M##","#####.Z#","########"],loesung:"4x(R D) R",
      text:"Alle Münzen auf der Diagonale – höchstens 4 Befehle!"}),
    robo({titel:"Der Irrgarten",punkte:0,schleifen:true,karte:["###########","#S..#.....#","##.##.###.#","#..#..#...#","#.##.##.###","#....#..MZ#","###########"],loesung:"R D D L D D R R R U U R U U R R R R D D L L D D R R",
      text:"Der schwerste Irrgarten. Kein Limit – aber findest du überhaupt den Weg?"}),
  ]});
station({id:"raetsel",nr:92,spiel:true,ico:"🧩",titel:"Rätsel-Ecke",kurz:"Pixel-Rätsel, Tresore und Geheimcodes",
  schritte:[
    P().nonogramm("herz5","Pixel-Rätsel",0),
    binaerTresor({titel:"Tresor ohne Hilfe",punkte:0,zahlen:[29,14,23,6],hilfe:false,text:"Knack die Tresore – ganz ohne Summen-Hilfe!"}),
    caesarRad({titel:"Spion gegen Spion",punkte:0,wort:"POBSOX",schluessel:10,modus:"knacken",antwort:"FERIEN",text:"Ein Geheimwort mit unbekanntem Schlüssel. Knack es!"}),
    P().zauber("Zaubertrick",0,3,false),
    P().nonogramm("pfeil","Pixel-Rätsel für Profis",0),
  ]});
station({id:"tipprennen",nr:93,spiel:true,ico:"🏎️",titel:"Tipp-Rennen",kurz:"Wie schnell tippst du?",
  schritte:[
    tippen({titel:"Runde 1",punkte:0,zeilen:["Der schnelle Fuchs springt.","Die Maus klickt sehr leise."],text:"Die Zeit läuft ab dem ersten Buchstaben. Wie schnell schaffst du es ohne Fehler?"}),
    tippen({titel:"Runde 2",punkte:0,zeigeTastatur:false,zeilen:["Informatik macht richtig Spaß!","Mein Roboter fährt durchs Labyrinth.","Strg und Z macht alles rückgängig."],text:"Profi-Runde ohne Hilfe-Tastatur!"}),
  ]});
station({id:"kimalen",nr:94,spiel:true,ico:"🧠",titel:"KI-Zeichnen",kurz:"Erkennt die KI alle 6 Bilder?",
  schritte:[kiZeichnen({titel:"Alle sechs!",punkte:0,ziel:6,text:"Bring die KI dazu, alle 6 Bilder zu erkennen: ❤️ Herz, 🏠 Haus, 🙂 Gesicht, ⬆️ Pfeil, 🌲 Baum und ➕ Plus."})]});
station({id:"zahlen",nr:95,spiel:true,ico:"🔢",titel:"Zahlen-Detektiv",kurz:"Finde die Geheimzahl bis 1000",
  schritte:[zahlRaten({titel:"Zahl bis 1000",punkte:0,bis:1000,max:10,text:"Schaffst du es in 10 Versuchen? Oder sogar in 9?"})]});
}
