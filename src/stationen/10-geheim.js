/* Station 10 · Geheimschrift – Caesar-Verschiebung, Schlüssel knacken, Gartenzaun, Verschlüsselung im Alltag */
{
const zaun=w=>`<div class="zaun" style="--n:${w.length}">${[0,1].map(r=>`<div>${[...w].map((c,i)=>`<span class="${i%2===r?"z":""}">${i%2===r?c:""}</span>`).join("")}</div>`).join("")}</div>`;
station({
  id:"geheim",nr:10,ico:"🕵️",titel:"Geheimschrift",kapitel:"daten",
  kurz:"Nachrichten verschlüsseln und Codes knacken wie ein Spion",
  klp:"Information und Daten / Informatik, Mensch und Gesellschaft: einfache Verschlüsselungsverfahren (Caesar, Transposition) anwenden, Schlüssel, Bedeutung von Verschlüsselung im Alltag",
  schritte:[
    caesarRad({titel:"Die Caesar-Scheibe",punkte:10,wort:"KDOOR",schluessel:3,modus:"ent",antwort:"HALLO",
      text:"Schon der römische Kaiser Caesar hat geheime Briefe geschrieben: Jeder Buchstabe wird im Alphabet um <b>3</b> weitergeschoben. Aus A wird D, aus B wird E … Entschlüssle das Wort! Such jeden Geheim-Buchstaben in der <b>unteren</b> Reihe und lies darüber den normalen Buchstaben.",
      merke:"<b>Caesar-Code:</b> Jeder Buchstabe wird um ein paar Stellen verschoben. Die Zahl heißt <b>Schlüssel</b>."}),
    caesarRad({titel:"Ein längeres Wort",punkte:10,wort:"LQIRUPDWLN",schluessel:3,modus:"ent",antwort:"INFORMATIK",
      text:"Gleicher Schlüssel (3), längeres Wort. Du schaffst das!"}),
    caesarRad({titel:"Selbst verschlüsseln",punkte:10,wort:"PIZZA",schluessel:1,modus:"ver",antwort:"QJAAB",
      text:"Jetzt andersrum: Verschlüssle <b>PIZZA</b> mit dem Schlüssel <b>1</b>. Such jeden Buchstaben in der <b>oberen</b> Reihe und schreib den Buchstaben darunter auf.",
      merke:"<b>Verschlüsseln</b>: normaler Text → Geheimtext. <b>Entschlüsseln</b>: Geheimtext → normaler Text. Achtung: Nach Z kommt wieder A."}),
    caesarRad({titel:"Schlüssel 5",punkte:15,wort:"SCHULE",schluessel:5,modus:"ver",antwort:"XHMZQJ",
      text:"Verschlüssle <b>SCHULE</b> mit dem Schlüssel <b>5</b>."}),
    caesarRad({titel:"Den Code knacken",punkte:15,wort:"WHBZL",schluessel:7,modus:"knacken",antwort:"PAUSE",
      text:"Ein Spion hat eine Nachricht abgefangen – aber der Schlüssel ist unbekannt! Probier mit ◀ und ▶ alle Schlüssel aus, bis ein echtes Wort herauskommt.",
      merke:"Es gibt nur 25 Schlüssel. Ein Computer probiert sie in einer Millisekunde alle durch. Caesar ist also <b>nicht sicher</b>."}),
    eingabe({titel:"Der Gartenzaun",punkte:15,
      text:"Ein ganz anderer Trick: Beim <b>Gartenzaun</b> schreibt man die Buchstaben abwechselnd oben und unten – wie ein Zickzack. Lies diese Geheimnachricht im <b>Zickzack</b>: oben, unten, oben, unten …",
      html:zaun("FREUNDE"),antwort:"FREUNDE",platz:"Lösungswort",
      merke:"Beim Gartenzaun bleiben alle Buchstaben gleich – nur die <b>Reihenfolge</b> wird vertauscht."}),
    eingabe({titel:"Gartenzaun verschlüsseln",punkte:15,
      text:"Das Wort <b>KATZE</b> steht schon im Zickzack. Zum Verschlüsseln liest du erst die ganze <b>obere</b> Reihe und dann die ganze <b>untere</b> Reihe. Wie heißt der Geheimtext?",
      html:zaun("KATZE"),antwort:"KTEAZ",platz:"Geheimtext"}),
    paare({titel:"Spionage-Wörter",punkte:10,text:"Verbinde die Wörter mit ihrer Bedeutung.",
      paare:[["🔑 Schlüssel","das Geheimnis, mit dem man entschlüsselt"],["🔒 Verschlüsseln","normalen Text in Geheimtext verwandeln"],["🔓 Entschlüsseln","Geheimtext wieder lesbar machen"],["🏛️ Caesar","verschiebt jeden Buchstaben"],["🪵 Gartenzaun","vertauscht die Reihenfolge"]]}),
    auswaehlen({titel:"Verschlüsselung im Alltag",punkte:10,text:"Wo wird heute verschlüsselt, damit niemand mitlesen kann? Tippe alles an.",
      karten:[["💬 WhatsApp-Nachrichten",true],["🏦 Online-Banking",true],["🔒 Webseiten mit Schloss neben der Adresse",true],["📶 WLAN mit Passwort",true],["📌 Zettel an der Pinnwand",false],["📻 Radio",false],["📖 Schulbuch",false]],
      merke:"Das <b>Schloss 🔒</b> neben der Internet-Adresse heißt: Die Verbindung ist verschlüsselt. Nur du und die Webseite können mitlesen."}),
    caesarRad({titel:"Die Geheimbotschaft",punkte:20,wort:"VASBEZNGVX VFG FHCRE",schluessel:13,modus:"ent",antwort:"INFORMATIK IST SUPER",
      text:"Letzte Mission, Agent! Diese Botschaft ist mit dem Schlüssel <b>13</b> verschlüsselt. Entschlüssle sie. (Die Abstände zwischen den Wörtern kannst du mittippen.)",
      merke:"Echte Verschlüsselung (wie bei WhatsApp) benutzt riesige Schlüssel mit Millionen Stellen. Die kann kein Computer der Welt durchprobieren."}),
  ],
});
}
