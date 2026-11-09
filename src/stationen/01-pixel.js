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
  apfel:["00006300","00006000","02222220","22222222","22222222","22222222","02222220","00222200"],
  sonne:["00444400","04444440","04444440","00444400","00000000","55555555","55555555","55555555"],
};

/* Vergleich + Rückmeldung; ab dem 3. Fehlversuch werden falsche Kästchen rot umrandet */
function pruefen(ctx,raster,soll,punkte,box){
  const falsch=[];soll.forEach((x,k)=>{if(raster.werte[k]!==x)falsch.push(k)});
  ctx.daten.versuche=(ctx.daten.versuche||0)+1;ctx.speichern();
  if(!falsch.length){raster.markiere([]);box.className="msg ok";box.textContent="Richtig! Alle Kästchen stimmen.";ctx.geschafft(punkte);return}
  ctx.fehler();
  box.className="msg no";
  box.textContent=falsch.length===1?"Fast! Noch 1 Kästchen ist falsch.":`Noch ${falsch.length} Kästchen sind falsch.`;
  if(ctx.daten.versuche>=3){raster.markiere(falsch);box.textContent+=" Sie sind jetzt rot umrandet."}
}

function abmalen(name,titel,punkte){return{titel,punkte,zeige(el,ctx){
  const soll=zahlen(BILDER[name]);
  el.innerHTML=`<p>Mal das Bild links genau ab. Tippe auf ein Kästchen, dann wird es schwarz. Nochmal tippen macht es wieder weiß. Du kannst auch ziehen.</p>
    <div class="paar"><div><p class="eyebrow">Vorlage</p><div id="a"></div></div><div><p class="eyebrow">Dein Bild</p><div id="b"></div></div></div>
    <div class="row noprint" style="margin-top:14px"><button class="btn" id="p">Prüfen</button><button class="btn ghost" id="l">Alles löschen</button></div><div id="m"></div>`;
  el.querySelector("#a").append(pixelRaster({w:8,h:8,werte:soll,palette:SW}).el);
  const r=pixelRaster({w:8,h:8,werte:ctx.daten.bild,palette:SW,malbar:true,onAenderung:v=>{ctx.daten.bild=v.slice();ctx.speichern()}});
  el.querySelector("#b").append(r.el);
  el.querySelector("#p").onclick=()=>pruefen(ctx,r,soll,punkte,el.querySelector("#m"));
  el.querySelector("#l").onclick=()=>r.setzeAlle(Array(64).fill(0));
  if(ctx.geloest){const m=el.querySelector("#m");m.className="msg ok";m.textContent="Schon gelöst. Weiter geht's!"}
}}}

function codeBild(name,titel,punkte,farbig){return{titel,punkte,zeige(el,ctx){
  const roh=BILDER[name],soll=zahlen(roh),pal=farbig?PAL:SW;
  const genutzt=[...new Set(soll)].sort((a,b)=>a-b);
  el.innerHTML=(farbig
    ?`<p>Jede Zahl ist eine Farbe. Wähl unten eine Farbe aus und mal Zeile für Zeile. Die <b>0</b> bleibt weiß.</p>`
    :`<p>Das ist ein Geheimcode. <b>1</b> heißt schwarz, <b>0</b> heißt weiß. Mal jede Zeile so, wie der Code es sagt. Was kommt heraus?</p>`)+
    `<div class="paar"><div><p class="eyebrow">Code</p><ol class="code">${roh.map(z=>`<li>${z.split("").map(c=>`<span>${c}</span>`).join("")}</li>`).join("")}</ol></div>
    <div><p class="eyebrow">Dein Bild</p><div id="b"></div></div></div>
    ${farbig?`<div class="legende">${genutzt.map(k=>`<span><i style="background:${PAL[k]}"></i>${k} = ${NAMEN[k]}</span>`).join("")}</div><div id="pal"></div>`:""}
    <div class="row noprint" style="margin-top:14px"><button class="btn" id="p">Prüfen</button><button class="btn ghost" id="l">Alles löschen</button></div><div id="m"></div>`;
  let leiste=null;
  if(farbig){leiste=farbLeiste(PAL.slice(0,Math.max(...genutzt)+1),NAMEN,genutzt.find(k=>k>0),true);el.querySelector("#pal").append(leiste.el)}
  const r=pixelRaster({w:8,h:8,werte:ctx.daten.bild,palette:pal,malbar:true,farbe:leiste?leiste.farbe:()=>1,onAenderung:v=>{ctx.daten.bild=v.slice();ctx.speichern()}});
  el.querySelector("#b").append(r.el);
  el.querySelector("#p").onclick=()=>pruefen(ctx,r,soll,punkte,el.querySelector("#m"));
  el.querySelector("#l").onclick=()=>r.setzeAlle(Array(64).fill(0));
  if(ctx.geloest){const m=el.querySelector("#m");m.className="msg ok";m.textContent="Schon gelöst. Weiter geht's!"}
}}}

const MIN_PIXEL=40;
station({
  id:"pixel",nr:1,ico:"🎨",titel:"Pixel-Werkstatt",kreativ:true,
  kurz:"Bilder aus Kästchen – und wie der Computer sie als Zahlen speichert",
  schritte:[
    {titel:"Worum geht's?",punkte:0,zeige(el,ctx){
      el.innerHTML=`<div class="block"><p>Schau ganz nah auf einen Bildschirm: Jedes Bild besteht aus winzigen <b>Kästchen</b>. Ein Kästchen heißt <b>Pixel</b>.</p>
      <p>Der Computer kann keine Bilder sehen. Er merkt sich für jedes Pixel nur eine <b>Zahl</b>, zum Beispiel 1 für schwarz und 0 für weiß.</p>
      <p style="margin:0">Heute bist du der Computer. Du hast 4 Teile vor dir. Am Ende malst du dein eigenes Bild.</p></div>
      <div class="paar"><div id="a"></div><ol class="code klein">${BILDER.herz.map(z=>`<li>${z.split("").map(c=>`<span>${c}</span>`).join("")}</li>`).join("")}</ol></div>`;
      el.querySelector("#a").append(pixelRaster({w:8,h:8,werte:zahlen(BILDER.herz),palette:SW,klein:true}).el);
      ctx.geschafft(0);
    }},
    abmalen("pfeil","Abmalen 1: Der Pfeil",10),
    abmalen("boot","Abmalen 2: Das Boot",10),
    abmalen("alien","Abmalen 3: Das Alien",10),
    codeBild("herz","Geheimcode 1",10),
    codeBild("smiley","Geheimcode 2",10),
    codeBild("haus","Geheimcode 3",10),
    codeBild("apfel","Farbcode 1",15,true),
    codeBild("sonne","Farbcode 2",15,true),
    {titel:"Dein eigenes Bild",punkte:20,zeige(el,ctx){
      el.innerHTML=`<p>Jetzt bist du dran! Mal ein eigenes Bild auf 16 mal 16 Kästchen. Gib ihm einen Namen. Die schönsten und kreativsten Bilder bekommen die beste Note.</p>
        <label class="f" for="t">Name deines Bildes</label><input type="text" id="t" maxlength="40" placeholder="z. B. Mein Haustier">
        <div id="pal" style="margin-top:14px"></div><div class="frei" id="b"></div>
        <div class="row noprint" style="margin-top:14px"><button class="btn" id="p">Bild ist fertig</button><button class="btn ghost" id="l">Alles löschen</button><span class="muted small" id="z"></span></div><div id="m"></div>`;
      const t=el.querySelector("#t");t.value=ctx.daten.titel||"";t.oninput=()=>{ctx.daten.titel=t.value;ctx.speichern()};
      const leiste=farbLeiste(PAL,NAMEN,1);el.querySelector("#pal").append(leiste.el);
      const zaehle=v=>{const n=v.filter(x=>x>0).length;el.querySelector("#z").textContent=n<MIN_PIXEL?`${n} von mindestens ${MIN_PIXEL} Kästchen bemalt`:`${n} Kästchen bemalt`};
      const r=pixelRaster({w:16,h:16,werte:ctx.daten.bild,palette:PAL,malbar:true,farbe:leiste.farbe,onAenderung:v=>{ctx.daten.bild=v.slice();ctx.speichern();zaehle(v)}});
      el.querySelector("#b").append(r.el);zaehle(r.werte);
      el.querySelector("#l").onclick=()=>{if(confirm("Ganzes Bild löschen?"))r.setzeAlle(Array(256).fill(0))};
      el.querySelector("#p").onclick=()=>{const m=el.querySelector("#m"),n=r.werte.filter(x=>x>0).length;
        if(n<MIN_PIXEL){m.className="msg no";m.textContent=`Mal noch etwas mehr: mindestens ${MIN_PIXEL} Kästchen.`;return}
        if(!t.value.trim()){m.className="msg no";m.textContent="Gib deinem Bild noch einen Namen.";t.focus();return}
        m.className="msg ok";m.textContent="Super! Du kannst noch weiter malen oder auf „Fertig“ tippen.";ctx.geschafft(20)};
    }},
  ],
  ergebnis(d){
    const f=d[9]||{};
    return`<p class="eyebrow">Eigenes Bild</p><h2>${esc(f.titel||"ohne Namen")}</h2><div id="erg-bild" style="max-width:340px"></div>`;
  },
  nachErgebnis(d){const f=d[9]||{};const box=document.getElementById("erg-bild");if(box)box.append(pixelRaster({w:16,h:16,werte:f.bild,palette:PAL}).el)}
});
})();
