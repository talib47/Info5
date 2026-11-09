/* Station 16 · Wie lernt eine KI? – Entscheidungsbäume, aus Beispielen lernen, Grenzen von KI */
{
const TIERBAUM={t:"Kann es fliegen?",f:"fliegt",
  ja:{t:"Hat es Federn?",f:"federn",ja:{blatt:"Vogel",ico:"🐦"},nein:{blatt:"Insekt",ico:"🐞"}},
  nein:{t:"Lebt es im Wasser?",f:"wasser",ja:{blatt:"Fisch",ico:"🐟"},nein:{blatt:"Landtier",ico:"🐾"}}};
const KLASSEN_OG=[["o","Obst","🍎"],["g","Gemüse","🥦"]];
const MERKMALE_OG=[["süß","🍬"],["wächst an Baum oder Strauch","🌳"],["wächst in der Erde","🟫"],["hat Kerne oder einen Stein","🌰"],["wird oft gekocht","🍳"],["ist grün","🟢"]];
station({
  id:"ki",nr:16,ico:"🧠",titel:"Wie lernt eine KI?",kapitel:"ki",
  kurz:"Entscheidungsbäume bauen, eine KI trainieren – und sie austricksen",
  klp:"Automaten und künstliche Intelligenz: Grundprinzip des maschinellen Lernens (aus Beispielen lernen, Trainingsdaten, Entscheidungsbaum), Chancen und Grenzen von KI",
  schritte:[
    baumFolgen({titel:"Der Tier-Baum",punkte:15,baum:TIERBAUM,
      text:"Ein <b>Entscheidungsbaum</b> sortiert Dinge mit Ja-Nein-Fragen. Beantworte die Fragen für jedes Tier – der Baum zeigt dir den Weg.",
      dinge:[{ico:"🦅",name:"Adler",eig:{fliegt:1,federn:1}},{ico:"🦋",name:"Schmetterling",eig:{fliegt:1}},{ico:"🐟",name:"Hecht",eig:{wasser:1}},{ico:"🐕",name:"Hund",eig:{}},
        {ico:"🐳",name:"Wal",eig:{wasser:1},hinweis:"Moment mal! Ein Wal ist gar kein Fisch, sondern ein Säugetier. <b>Der Baum hat sich geirrt</b>, weil seine Fragen nicht gut genug sind. Auch eine KI macht solche Fehler!"}],
      merke:"Ein <b>Entscheidungsbaum</b> stellt Ja-Nein-Fragen, bis die Antwort feststeht. Viele KIs arbeiten so."}),
    baumBauen({titel:"Bau deinen eigenen Baum",punkte:20,
      text:"Jetzt baust du selbst einen Baum! Er soll diese vier Tiere <b>auseinanderhalten</b>: Am Ende soll in jedem Blatt genau <b>ein</b> Tier stehen. Wähle für die drei Felder gute Fragen.",
      fragen:[{t:"Hat es Fell?",f:"fell"},{t:"Kann es fliegen?",f:"fliegt"},{t:"Lebt es (auch) im Wasser?",f:"wasser"},{t:"Hat es mehr als 4 Beine?",f:"beine"},{t:"Ist es grün?",f:"gruen"}],
      dinge:[{ico:"🐸",name:"Frosch",eig:{wasser:1,gruen:1}},{ico:"🐕",name:"Hund",eig:{fell:1}},{ico:"🐧",name:"Pinguin",eig:{wasser:1}},{ico:"🐞",name:"Marienkäfer",eig:{fliegt:1,beine:1}}],
      merke:"Gute Fragen teilen die Dinge in <b>zwei Gruppen</b>. Eine Frage, auf die alle mit „Nein“ antworten, hilft nicht weiter."}),
    reihenfolge({titel:"So lernt eine KI",punkte:10,text:"Wie bringt man einem Computer bei, Katzen auf Fotos zu erkennen? Bring die Schritte in die richtige Reihenfolge.",
      schritte:["Ganz viele Fotos sammeln – mit und ohne Katze","Jedes Foto beschriften: „Katze“ oder „keine Katze“","Die KI sucht in den Fotos nach Mustern (Ohren, Fell, Schnurrhaare …)","Die KI mit neuen Fotos testen","Bei Fehlern: mit mehr Beispielen nachtrainieren"],
      merke:"Eine KI wird nicht programmiert wie der Roboter – sie <b>lernt aus Beispielen</b>. Das heißt <b>maschinelles Lernen</b>."}),
    kiTrainer({titel:"KI-Trainer: Obst oder Gemüse?",punkte:20,klassen:KLASSEN_OG,merkmale:MERKMALE_OG,
      text:"Diese KI soll Obst und Gemüse erkennen. Sie lernt aus den Trainings-Beispielen und sucht für jedes neue Ding das <b>ähnlichste Beispiel</b>. Drück auf „KI lernen lassen und testen“. Aber Achtung: Beim Beschriften der Beispiele hat jemand geschummelt!",
      beispiele:[
        {ico:"🍒",name:"Kirsche",f:[1,1,0,1,0,0],ist:"o",label:"g"},{ico:"🍌",name:"Banane",f:[1,1,0,0,0,0],ist:"o"},{ico:"🍓",name:"Erdbeere",f:[1,0,0,0,0,0],ist:"o"},{ico:"🍎",name:"Apfel",f:[1,1,0,1,0,0],ist:"o"},
        {ico:"🥕",name:"Karotte",f:[0,0,1,0,0,0],ist:"g"},{ico:"🥦",name:"Brokkoli",f:[0,0,0,0,1,1],ist:"g"},{ico:"🥔",name:"Kartoffel",f:[0,0,1,0,1,0],ist:"g",label:"o"},{ico:"🥒",name:"Gurke",f:[0,0,0,1,0,1],ist:"g"}],
      tests:[{ico:"🍐",name:"Birne",f:[1,1,0,1,0,0],ist:"o"},{ico:"🧅",name:"Zwiebel",f:[0,0,1,0,1,0],ist:"g"},{ico:"🫑",name:"Paprika",f:[0,0,0,1,0,1],ist:"g"},{ico:"🍋",name:"Zitrone",f:[0,1,0,1,0,0],ist:"o"},{ico:"🥬",name:"Salat",f:[0,0,0,0,0,1],ist:"g"},{ico:"🫐",name:"Heidelbeeren",f:[1,1,0,0,0,0],ist:"o"}],
      merke:"Eine KI ist nur so gut wie ihre Beispiele. <b>Falsche Trainingsdaten → falsche KI.</b>"}),
    kiZeichnen({titel:"Die Zeichen-KI",punkte:15,ziel:3,
      text:"Diese KI hat 6 Bilder gelernt: ❤️ Herz, 🏠 Haus, 🙂 Gesicht, ⬆️ Pfeil, 🌲 Baum und ➕ Plus. Mal eins davon – die KI rät live mit. Schaffst du es, dass sie <b>3 verschiedene</b> Bilder erkennt?",
      merke:"Die KI vergleicht dein Bild mit Mustern, die sie gelernt hat. Sie <b>versteht</b> nicht wirklich, was ein Herz ist – sie rechnet nur, wie ähnlich die Kästchen sind."}),
    sortieren({titel:"KI oder keine KI?",punkte:10,text:"Wo steckt künstliche Intelligenz (KI) drin – und wo nur ein normales Programm?",
      toepfe:[["ki","Mit KI (lernt aus Beispielen)","🧠"],["no","Ohne KI (feste Regeln)","⚙️"]],
      karten:[["Sprachassistent versteht deine Frage","🗣️","ki"],["Handy erkennt dein Gesicht","📱","ki"],["Taschenrechner","🧮","no"],["Video-Vorschläge, die zu dir passen","📺","ki"],["Übersetzer-App","🌍","ki"],["Wecker klingelt um 7 Uhr","⏰","no"],["Ampel schaltet nach Zeit","🚦","no"]],
      merke:"KI steckt in vielen Apps. Sie <b>rät</b> mit Mustern aus Beispielen – ein Taschenrechner dagegen rechnet mit festen Regeln."}),
    entscheidung({titel:"KI mit Köpfchen nutzen",punkte:15,
      szenen:[
        {bild:"🤖",text:"Ein Chatbot sagt dir: „Der Rhein fließt durch Berlin.“",optionen:[["Nachprüfen – eine KI kann sich irren",true,"Richtig! Der Rhein fließt nicht durch Berlin. KIs klingen oft sicher, liegen aber manchmal falsch."],["Glauben, Computer wissen alles",false,"KIs machen Fehler – sie raten nur sehr gut."]]},
        {bild:"🎬",text:"Ein Video zeigt einen berühmten Fußballer, der komische Sachen sagt. Es sieht total echt aus.",optionen:[["Vorsicht – das könnte ein Fake-Video sein, das mit KI gemacht wurde",true,"Genau. Solche Fake-Videos heißen <b>Deepfakes</b>."],["Sofort an alle weiterschicken",false,"Erst prüfen! Mit KI kann man heute echt aussehende Fake-Videos machen."]]},
        {bild:"📝",text:"Eine KI könnte deine Hausaufgabe komplett schreiben.",optionen:[["Die KI höchstens als Hilfe nutzen und selbst denken",true,"Super! Lernen musst du selbst – die KI kann es nicht für dich."],["Alles abschreiben lassen",false,"Dann lernst du nichts – und in der Klassenarbeit hilft dir keine KI."]]},
      ],merke:"KI ist ein <b>Werkzeug</b>. Sie kann sich irren – darum musst du immer mitdenken."}),
  ],
});
}
