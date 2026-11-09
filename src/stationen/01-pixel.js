/* Station: Pixel-Werkstatt — Bilder bestehen aus Kästchen, und Kästchen kann man als Zahlen aufschreiben.
   Teil 1 abmalen (Auge), Teil 2 Geheimcode 0/1 (Binär), Teil 3 Farbcode (Zahlen = Farben), Teil 4 freies Bild (kreativ). */
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

function abmalen(name,titel,punkte){return{titel,punkte,zeige(el,ctx){
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

function codeBild(name,titel,punkte,farbig){return{titel,punkte,zeige(el,ctx){
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

const MIN_PIXEL=40;
let FREI=0; // Index des Teils „Dein eigenes Bild“ (wird unten gesetzt)
station({
  id:"pixel",nr:1,ico:"🎨",titel:"Pixel-Werkstatt",kreativ:true,
  kurz:"Bilder aus Kästchen – und wie der Computer sie als Zahlen speichert",
  schritte:[
    {titel:"Worum geht's?",punkte:0,zeige(el,ctx){
      el.innerHTML=`<div class="block"><p>Schau ganz nah auf einen Bildschirm: Jedes Bild besteht aus winzigen <b>Kästchen</b>. Ein Kästchen heißt <b>Pixel</b>.</p>
      <p>Der Computer kann keine Bilder sehen. Er merkt sich für jedes Pixel nur eine <b>Zahl</b>, zum Beispiel 1 für schwarz und 0 für weiß.</p>
      <p style="margin:0">Heute bist du der Computer: Du malst ab, knackst Geheimcodes und beantwortest kurze Fragen. Am Ende malst du dein eigenes Bild.</p></div>
      <div class="paar"><div id="a"></div><ol class="code klein">${BILDER.herz.map(z=>`<li>${z.split("").map(c=>`<span>${c}</span>`).join("")}</li>`).join("")}</ol></div>`;
      el.querySelector("#a").append(pixelRaster({w:8,h:8,werte:zahlen(BILDER.herz),palette:SW,klein:true}).el);
      ctx.geschafft(0);
    }},
    abmalen("pfeil","Abmalen 1: Der Pfeil",10),
    abmalen("boot","Abmalen 2: Das Boot",10),
    abmalen("alien","Abmalen 3: Das Alien",10),
    frage("Frage","Ein Bild am Computer besteht aus kleinen …",["🟦 Kästchen","🍕 Pizzastücken"],
      "Die kleinen Kästchen heißen <b>Pixel</b>. Jedes Bild auf dem Handy oder Computer besteht aus Pixeln.",5,
      `<div class="bildchen">⬜⬛⬛⬜<br>⬛⬛⬛⬛<br>⬜⬛⬛⬜</div>`),
    codeBild("herz","Geheimcode 1",10),
    codeBild("smiley","Geheimcode 2",10),
    codeBild("haus","Geheimcode 3",10),
    frage("Frage","Im Geheimcode heißt die 1 …",["⬛ schwarz","⬜ weiß"],
      "Der Computer kennt nur <b>0</b> und <b>1</b>. Daraus macht er Bilder, Musik und Spiele.",5),
    frage("Frage","Welcher Code passt zu dieser Reihe?",["11111111","00000000"],
      "Jede <b>1</b> ist ein schwarzes Kästchen. Du kannst jetzt lesen wie ein Computer! 🤖",5,
      `<div class="bildchen">⬛⬛⬛⬛⬛⬛⬛⬛</div>`),
    codeBild("apfel","Farbcode 1",15,true),
    codeBild("sonne","Farbcode 2",15,true),
    frage("Frage","Für den Computer ist jede Farbe eine …",["🔢 Zahl","🖍️ Wachsmalstift"],
      "Richtig! Beim Apfel war Rot die Zahl 1. <b>Jede Farbe ist für den Computer eine Zahl.</b>",5),
    {titel:"Dein eigenes Bild",punkte:20,zeige(el,ctx){
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
    return`<p class="eyebrow">Eigenes Bild</p><h2>${esc(f.titel||"ohne Namen")}</h2><div id="erg-bild" style="max-width:340px"></div>`;
  },
  nachErgebnis(d){const f=d[FREI]||{};const box=document.getElementById("erg-bild");if(box)box.append(pixelRaster({w:16,h:16,werte:f.bild,palette:PAL}).el)}
});
FREI=STATIONEN.find(x=>x.id==="pixel").schritte.findIndex(x=>x.titel==="Dein eigenes Bild");
})();
