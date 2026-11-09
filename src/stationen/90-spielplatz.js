/* Spielplatz: Bonus-Spiele ohne Note. Öffnet sich, wenn ein Kind heute seine Station geschafft hat.
   Der Stand bleibt nur auf diesem Gerät und wird am Ende gelöscht (jedes Mal neu spielen). */
{
const P=()=>window.PIXEL;
station({id:"atelier",nr:90,spiel:true,ico:"🎨",titel:"Pixel-Atelier",kurz:"Frei malen und als Bild speichern",
  schritte:[{titel:"Dein Kunstwerk",punkte:0,zeige(el,ctx){
    const d=ctx.daten,{PAL,NAMEN}=P();
    el.innerHTML=`<p>Mal, was du willst! Wenn du fertig bist, kannst du dein Bild als Datei speichern.</p><div id="pal"></div><div class="frei" id="b"></div>
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
