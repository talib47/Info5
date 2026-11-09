/* =====================================================================
   Spezial-Bausteine: Robo, Binär, Caesar, Automat, Ampel, Entscheidungsbaum, KI, Passwort, Auswählen
   ===================================================================== */

/* ---------- Auswählen: alle passenden Karten antippen (Mehrfachauswahl) ----------
   auswaehlen({titel,punkte,merke,text,karten:[["Text/HTML",true,"warum"],…]}) */
function auswaehlen({titel,punkte=10,merke,text,karten,spalten}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.an=d.an||[];if(!d.reihe){d.reihe=mischen(karten.map((_,i)=>i));ctx.speichern()}
  const n=karten.filter(k=>k[1]).length;let falsch=new Set();
  const zeichne=()=>{
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Tippe alle passenden Karten an · ${n} sind richtig · ausgewählt: ${d.an.length}</p>
      <div class="wahlkarten"${spalten?` style="grid-template-columns:repeat(auto-fill,minmax(${spalten},1fr))"`:""}>${d.reihe.map(i=>`<button class="wkarte${d.an.includes(i)?" an":""}${falsch.has(i)?" falsch":""}" data-i="${i}">${karten[i][0]}</button>`).join("")}</div>${MLD}`;
    el.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{const i=+b.dataset.i,k=d.an.indexOf(i);if(k<0)d.an.push(i);else d.an.splice(k,1);falsch.clear();ctx.speichern();zeichne()});
  };
  zeichne();
  ctx.pruefer=()=>{const zuviel=d.an.filter(i=>!karten[i][1]),fehlt=karten.map((k,i)=>k[1]&&!d.an.includes(i)?i:-1).filter(i=>i>=0);
    const w=karten.filter(k=>k[1]&&k[2]);
    const r=bewerte(ctx,el,{leer:!d.an.length,leerText:"Tippe zuerst die passenden Karten an.",fehler:zuviel.length+fehlt.length,stand:d.an.slice().sort().join(),punkte,
      okText:`Richtig!${w.length?`<ul class="warum">${w.map(k=>`<li>${k[0]} – ${k[2]}</li>`).join("")}</ul>`:""}`,markiere:()=>{falsch=new Set(zuviel);zeichne()}});
    if(!r&&!zuviel.length&&fehlt.length)meldung(el,false,`Gut so weit! Es fehlen noch <b>${fehlt.length}</b>.`);
    return r};
  ctx.loesung=()=>{d.an=karten.map((k,i)=>k[1]?i:-1).filter(i=>i>=0);zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* =====================================================================
   🤖 Robo-Labyrinth. Karte: # Wand, . Weg, S Start, Z Ziel ⭐, M Münze 🪙 (alle einsammeln)
   Programm-Text für Vorgabe/Lösung: "R R D 3x(R D) U"  (R rechts, L links, U hoch, D runter)
   ===================================================================== */
const RB={U:["↑",0,-1],D:["↓",0,1],L:["←",-1,0],R:["→",1,0]};
function roboParse(t){const out=[];const re=/(\d+)x\(([^)]*)\)|([UDLR])/g;let m;
  while((m=re.exec(t||""))){if(m[3])out.push({c:m[3]});else out.push({w:+m[1],k:m[2].trim().split(/\s+/).filter(Boolean).map(c=>({c}))})}return out}
const roboFlach=p=>p.flatMap(t=>t.w?Array.from({length:t.w},()=>t.k.map(x=>x.c)).flat():[t.c]);
const roboZahl=p=>p.reduce((a,t)=>a+(t.w?1+t.k.length:1),0);
function robo({titel,punkte=10,merke,text,karte,max,schleifen,vorgabe,loesung}){return{titel,punkte,merke,zeige(el,ctx){
  const H=karte.length,W=karte[0].length,feld=karte.map(r=>[...r]);
  let sx,sy;feld.forEach((r,y)=>r.forEach((c,x)=>{if(c==="S"){sx=x;sy=y}}));
  const muenzen=[];feld.forEach((r,y)=>r.forEach((c,x)=>{if(c==="M")muenzen.push(y*W+x)}));
  const d=ctx.daten;if(!d.prog){d.prog=roboParse(vorgabe);ctx.speichern()}
  let pos=[sx,sy],spur=[],gesammelt=new Set(),laeuft=null,crash=null,offen=d.offen??null;
  const simuliere=()=>{let x=sx,y=sy;const sp=[],ge=new Set();const fl=roboFlach(d.prog);
    for(let i=0;i<fl.length;i++){const [,dx,dy]=RB[fl[i]];const nx=x+dx,ny=y+dy;
      if(ny<0||ny>=H||nx<0||nx>=W||feld[ny][nx]==="#")return{ok:false,crash:[nx,ny],x,y,sp,ge,schritt:i};
      x=nx;y=ny;sp.push(y*W+x);if(feld[y][x]==="M")ge.add(y*W+x);
      if(feld[y][x]==="Z"&&ge.size===muenzen.length)return{ok:true,x,y,sp,ge,schritt:i}}
    return{ok:false,x,y,sp,ge,ende:true}};
  const zelle=(c,x,y)=>{const k=y*W+x,hier=pos[0]===x&&pos[1]===y;
    let inh=c==="#"?"":c==="Z"?"⭐":c==="M"&&!gesammelt.has(k)?"🪙":"";
    if(hier)inh=crash?"💥":"🤖";
    return`<span class="rz${c==="#"?" wand":""}${spur.includes(k)?" spur":""}${crash&&crash[0]===x&&crash[1]===y?" crash":""}">${inh}</span>`};
  const chips=()=>d.prog.map((t,i)=>t.w?`<span class="schleife${offen===i?" offen":""}"><span class="sk">🔁 <button data-wm="${i}">−</button><b>${t.w}×</b><button data-wp="${i}">+</button></span>${t.k.map((x,j)=>`<button class="bef" data-li="${i}" data-lj="${j}">${RB[x.c][0]}</button>`).join("")}${offen===i?`<button class="zu-btn" data-zu="${i}">✔ fertig</button>`:""}<button class="weg-btn" data-wl="${i}" title="Schleife löschen">✕</button></span>`
    :`<button class="bef" data-i="${i}" title="Löschen">${RB[t.c][0]}</button>`).join("");
  const zeichne=()=>{
    const n=roboZahl(d.prog);
    el.innerHTML=kopfText(text)+`<div class="robo">
      <div class="rfeld" style="grid-template-columns:repeat(${W},1fr)">${feld.map((r,y)=>r.map((c,x)=>zelle(c,x,y)).join("")).join("")}</div>
      <div class="rsteuer">
        <p class="eyebrow">Dein Programm · ${n} Befehle${max?` · höchstens ${max}`:""}${muenzen.length?` · sammle alle 🪙`:""}</p>
        <div class="rprog">${chips()||`<span class="muted">Noch leer – tippe unten auf die Pfeile.</span>`}</div>
        <div class="rknoepfe">${Object.entries(RB).map(([k,[i]])=>`<button class="btn ghost rk" data-add="${k}" ${laeuft?"disabled":""}>${i}</button>`).join("")}
          ${schleifen?`<button class="btn ghost rk breit" id="rloop" ${laeuft||offen!=null?"disabled":""}>Wiederhole …</button>`:""}</div>
        <div class="row"><button class="btn" id="rstart" ${laeuft?"disabled":""}>Start</button><button class="btn ghost" id="rleer" ${laeuft?"disabled":""}>Alles löschen</button></div>
        <p class="muted small">Tippe auf einen Befehl im Programm, um ihn zu löschen.</p>
      </div></div>${MLD}`;
    const neu=()=>{crash=null;pos=[sx,sy];spur=[];gesammelt=new Set();d.ok=false;ctx.speichern();zeichne()};
    el.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{const c=b.dataset.add;if(offen!=null&&d.prog[offen])d.prog[offen].k.push({c});else d.prog.push({c});neu()});
    el.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{d.prog.splice(+b.dataset.i,1);if(offen!=null&&offen>=d.prog.length)offen=null;d.offen=offen;neu()});
    el.querySelectorAll("[data-li]").forEach(b=>b.onclick=()=>{d.prog[+b.dataset.li].k.splice(+b.dataset.lj,1);neu()});
    el.querySelectorAll("[data-wm]").forEach(b=>b.onclick=()=>{const t=d.prog[+b.dataset.wm];t.w=Math.max(2,t.w-1);neu()});
    el.querySelectorAll("[data-wp]").forEach(b=>b.onclick=()=>{const t=d.prog[+b.dataset.wp];t.w=Math.min(9,t.w+1);neu()});
    el.querySelectorAll("[data-wl]").forEach(b=>b.onclick=()=>{d.prog.splice(+b.dataset.wl,1);offen=null;d.offen=null;neu()});
    el.querySelectorAll("[data-zu]").forEach(b=>b.onclick=()=>{offen=null;d.offen=null;neu()});
    const lp=el.querySelector("#rloop");if(lp)lp.onclick=()=>{d.prog.push({w:2,k:[]});offen=d.prog.length-1;d.offen=offen;neu()};
    el.querySelector("#rleer").onclick=()=>{d.prog=[];offen=null;d.offen=null;neu()};
    el.querySelector("#rstart").onclick=()=>{if(!d.prog.length)return meldung(el,false,"Dein Programm ist noch leer. Tippe auf die Pfeile!");
      if(d.prog.some(t=>t.w&&!t.k.length))return meldung(el,false,"In deiner 🔁 Schleife steht noch nichts drin.");
      offen=null;d.offen=null;const r=simuliere(),fl=roboFlach(d.prog);let i=0;crash=null;pos=[sx,sy];spur=[];gesammelt=new Set();
      const bis=r.ok||r.ende?r.sp.length:r.schritt;
      laeuft=setInterval(()=>{
        if(i<bis){const k=r.sp[i];pos=[k%W,Math.floor(k/W)];spur.push(k);if(r.ge.has(k))gesammelt.add(k);i++;zeichne();return}
        clearInterval(laeuft);laeuft=null;
        if(!r.ok&&!r.ende){crash=r.crash;pos=[r.x,r.y];zeichne();d.fehlLauf=(d.fehlLauf||0)+1;if(d.fehlLauf%2===0)ctx.fehler();
          meldung(el,false,"💥 Bumm! Der Roboter ist gegen eine Wand gefahren. Finde den Fehler in deinem Programm und probier es noch mal.");return}
        zeichne();
        if(!r.ok){d.fehlLauf=(d.fehlLauf||0)+1;if(d.fehlLauf%2===0)ctx.fehler();
          meldung(el,false,muenzen.length&&r.ge.size<muenzen.length&&feld[r.y][r.x]==="Z"?"Du bist am Ziel, aber es fehlen noch Münzen 🪙!":"Das Programm ist zu Ende, aber der Roboter ist noch nicht beim ⭐. Was fehlt noch?");return}
        if(max&&roboZahl(d.prog)>max){meldung(el,false,`⭐ Ziel erreicht! Aber du hast <b>${roboZahl(d.prog)} Befehle</b> gebraucht. Schaffst du es mit höchstens <b>${max}</b>?${schleifen?" Tipp: Nimm 🔁 Wiederhole!":""}`);return}
        d.ok=true;ctx.speichern();meldung(el,true,`⭐ Ziel erreicht! Super programmiert. Tippe auf „Weiter“.`)},300);
      ctx.beimVerlassen(()=>{clearInterval(laeuft)});zeichne()};
  };
  zeichne();
  ctx.pruefer=()=>{if(d.ok){ctx.geschafft(punkte);return true}meldung(el,false,"Bring den Roboter zuerst mit Start zum ⭐.");return false};
  ctx.loesung=()=>{d.prog=roboParse(loesung);offen=null;d.offen=null;const r=simuliere();pos=[r.x,r.y];spur=r.sp;gesammelt=r.ge;d.ok=r.ok&&(!max||roboZahl(d.prog)<=max);if(!d.ok)console.warn("ROBO-LOESUNG FALSCH",titel);ctx.speichern();zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* =====================================================================
   0️⃣ Binär-Karten (16, 8, 4, 2, 1): Karten umdrehen, bis die Zahl stimmt
   ===================================================================== */
const PUNKTE_HTML=n=>`<span class="bpunkte">${"●".repeat(n)}</span>`;
function binaerTresor({titel,punkte=15,merke,text,zahlen,hilfe=true,stellen=5}){return{titel,punkte,merke,zeige(el,ctx){
  const werte=Array.from({length:stellen},(_,i)=>2**(stellen-1-i));
  const d=ctx.daten;d.i=d.i||0;d.k=d.k||werte.map(()=>0);
  const zeichne=()=>{
    if(d.i>=zahlen.length){el.innerHTML=kopfText(text)+`<div class="msg ok">🔓 Alle Tresore offen! Tippe auf „Weiter“.</div>`;return}
    const sum=werte.reduce((a,w,i)=>a+(d.k[i]?w:0),0),ziel=zahlen[d.i];
    el.innerHTML=kopfText(text)+`<div class="tresor"><span class="tico">${sum===ziel?"🔓":"🔒"}</span><div><p class="eyebrow">Tresor ${d.i+1} von ${zahlen.length}</p><h2 style="margin:0">Geheimzahl: ${ziel}</h2></div></div>
      <div class="bkarten">${werte.map((w,i)=>`<button class="bkarte${d.k[i]?" auf":""}" data-k="${i}"><span class="bwert">${w}</span>${d.k[i]?PUNKTE_HTML(w):`<span class="brueck">aus</span>`}</button>`).join("")}</div>
      <div class="bbits">${werte.map((w,i)=>`<span>${d.k[i]?1:0}</span>`).join("")}</div>
      ${hilfe?`<p class="bsum">Punkte zusammen: <b>${sum}</b>${sum>ziel?" – zu viel!":""}</p>`:`<p class="muted">Zähl selbst die Punkte zusammen!</p>`}${MLD}`;
    el.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const i=+b.dataset.k;d.k[i]=d.k[i]?0:1;ctx.speichern();
      const s=werte.reduce((a,w,j)=>a+(d.k[j]?w:0),0);zeichne();
      if(s===zahlen[d.i]){meldung(el,true,`🔓 Tresor offen! ${zahlen[d.i]} heißt in Binär: <b>${d.k.join("")}</b>`);d.i++;d.k=werte.map(()=>0);ctx.speichern();
        setTimeout(()=>{zeichne();if(d.i>=zahlen.length)ctx.geschafft(punkte)},1400)}});
  };
  zeichne();
  ctx.pruefer=()=>{if(d.i>=zahlen.length){ctx.geschafft(punkte);return true}meldung(el,false,`Öffne zuerst alle Tresore. Noch ${zahlen.length-d.i}.`);return false};
  ctx.loesung=()=>{d.i=zahlen.length;zeichne()};
}}}
const bitsHTML=bits=>`<div class="bkarten klein">${[...bits].map((b,i)=>{const w=2**(bits.length-1-i);return`<span class="bkarte${b==="1"?" auf":""}"><span class="bwert">${w}</span>${b==="1"?PUNKTE_HTML(w):`<span class="brueck">aus</span>`}</span>`}).join("")}</div><div class="bbits">${[...bits].map(b=>`<span>${b}</span>`).join("")}</div>`;

/* =====================================================================
   🔤 Caesar-Rad: Buchstaben um eine Zahl verschieben
   caesarRad({titel,punkte,merke,text,wort:"KDOOR",schluessel:3,modus:"ent"|"ver"|"knacken",antwort:"HALLO"})
   ===================================================================== */
const ABC="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const verschiebe=(t,k)=>t.toUpperCase().replace(/[A-Z]/g,c=>ABC[(ABC.indexOf(c)+k+260)%26]);
function caesarRad({titel,punkte=10,merke,text,wort,schluessel,modus="ent",antwort}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;if(d.k==null)d.k=modus==="knacken"?0:schluessel;
  const zeichne=()=>{
    el.innerHTML=kopfText(text)+`<div class="crad">
      <div class="crow"><span class="clab">Normal</span>${[...ABC].map((c,i)=>`<span data-sp="${i}">${c}</span>`).join("")}</div>
      <div class="crow geheim"><span class="clab">Geheim</span>${[...ABC].map((c,i)=>`<span data-sp="${i}">${ABC[(i+d.k)%26]}</span>`).join("")}</div>
      <div class="ckey">${modus==="knacken"?`<button class="btn ghost klein-btn" id="cm">◀</button>`:""}<b>Schlüssel: ${d.k}</b>${modus==="knacken"?`<button class="btn ghost klein-btn" id="cp">▶</button>`:""}</div></div>
      <div class="cwort"><span class="muted">${modus==="ver"?"Normaler Text":"Geheimtext"}:</span> <b>${wort}</b>${modus==="knacken"?`<br><span class="muted">Mit Schlüssel ${d.k} ergibt das:</span> <b class="cvor">${verschiebe(wort,-d.k)}</b>`:""}</div>
      <div class="eing"><input type="text" autocomplete="off" spellcheck="false" placeholder="${modus==="ver"?"Geheimtext":"Lösungswort"}" value="${esc(d.v||"")}"></div>${MLD}`;
    const inp=el.querySelector(".eing input");inp.oninput=()=>{d.v=inp.value;ctx.speichern()};
    inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();document.getElementById("weiter")?.click()}};
    el.querySelectorAll(".crow [data-sp]").forEach(x=>x.onclick=()=>{const an=x.classList.contains("an");el.querySelectorAll(".crow .an").forEach(y=>y.classList.remove("an"));
      if(!an)el.querySelectorAll(`.crow [data-sp="${x.dataset.sp}"]`).forEach(y=>y.classList.add("an"))});
    const m=el.querySelector("#cm"),p=el.querySelector("#cp");
    if(m)m.onclick=()=>{d.k=(d.k+25)%26;ctx.speichern();zeichne()};if(p)p.onclick=()=>{d.k=(d.k+1)%26;ctx.speichern();zeichne()};
  };
  zeichne();
  ctx.pruefer=()=>{const v=(el.querySelector(".eing input").value||"").toUpperCase().replace(/\s+/g,"");
    return bewerte(ctx,el,{leer:!v,leerText:"Tippe zuerst deine Lösung ins Feld.",fehler:v===antwort.replace(/\s+/g,"")?0:1,stand:v,punkte,okText:"Richtig entschlüsselt!"})};
  ctx.loesung=()=>{d.v=antwort;if(modus==="knacken")d.k=schluessel;zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* =====================================================================
   🥤 Automat: Zustände, Knöpfe, Übergänge. Ziele erreichen durch Ausprobieren.
   automat({titel,punkte,merke,text,zustaende:{id:["Name","ico","Anzeige"]},start,knoepfe:[["id","Beschriftung"]],
            ueber:{"zustand|knopf":"neu"},ziele:[["Text",log=>bool]]})
   ===================================================================== */
function automat({titel,punkte=15,merke,text,zustaende,start,knoepfe,ueber,ziele,diagramm=true}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.z=d.z||start;d.log=d.log||[];
  const zeichne=(blitz)=>{
    const erfuellt=ziele.map(([,f])=>d.alle||f(d.log));
    el.innerHTML=kopfText(text)+`<div class="automat">
      <div class="zustaende">${Object.entries(zustaende).map(([id,[n,ico]])=>`<div class="zst${d.z===id?" jetzt":""}"><span>${ico}</span><b>${n}</b></div>`).join("")}</div>
      <div class="anzeige${blitz?" blitz":""}">${zustaende[d.z][2]||""}</div>
      <div class="aknoepfe">${knoepfe.map(([id,t])=>`<button class="btn ghost" data-kn="${id}">${t}</button>`).join("")}<button class="btn ghost" id="areset">Neu starten</button></div>
      ${diagramm?`<details class="diagramm"><summary>📋 So arbeitet der Automat (Zustandsdiagramm)</summary><ul>${Object.entries(ueber).map(([k,neu])=>{const [z,kn]=k.split("|");return`<li><b>${zustaende[z][1]} ${zustaende[z][0]}</b> → bei <b>${(kn==="*"?"jedem anderen Knopf":knoepfe.find(x=>x[0]===kn)[1])}</b> → <b>${zustaende[neu][1]} ${zustaende[neu][0]}</b></li>`}).join("")}</ul><p class="muted small">Alles, was hier nicht steht, ändert nichts.</p></details>`:""}
      <p class="eyebrow" style="margin-top:14px">Deine Aufträge</p>
      <ul class="ziele">${ziele.map(([t],i)=>`<li class="${erfuellt[i]?"ok":""}">${erfuellt[i]?"✅":"⬜"} ${t}</li>`).join("")}</ul></div>${MLD}`;
    el.querySelectorAll("[data-kn]").forEach(b=>b.onclick=()=>{const kn=b.dataset.kn,neu=ueber[d.z+"|"+kn]||ueber[d.z+"|*"]||d.z;
      d.log.push({von:d.z,kn,nach:neu});d.z=neu;ctx.speichern();zeichne(true);
      if(ziele.every(([,f])=>f(d.log))){d.alle=true;ctx.speichern();meldung(el,true,"✅ Alle Aufträge erledigt! Tippe auf „Weiter“.")}});
    el.querySelector("#areset").onclick=()=>{d.z=start;d.log.push({von:"neu",kn:"reset",nach:start});ctx.speichern();zeichne()};
  };
  zeichne();
  ctx.pruefer=()=>{const off=d.alle?0:ziele.filter(([,f])=>!f(d.log)).length;if(!off){ctx.geschafft(punkte);return true}
    meldung(el,false,`Noch <b>${off}</b> ${off===1?"Auftrag":"Aufträge"} offen. Probier die Knöpfe aus!`);return false};
  ctx.loesung=()=>{d.alle=true;zeichne()};
}}}
/* Hilfen für Ziele: Gab es den Übergang von → nach über Knopf? */
const gab=(von,kn,nach)=>log=>log.some(e=>(von==null||e.von===von)&&(kn==null||e.kn===kn)&&(nach==null||e.nach===nach));

/* ---------- 🚦 Ampel bauen: für jede Phase die richtigen Lampen einschalten ---------- */
function ampelBauen({titel,punkte=15,merke,text,phasen,namen}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.a=d.a||phasen.map(()=>[0,0,0]);let falsch=new Set(),spiel=null,an=-1;
  const FARB=["#ff3b30","#ffcc00","#34c759"];
  const zeichne=()=>{
    el.innerHTML=kopfText(text)+`<div class="ampeln">${d.a.map((p,i)=>`<div class="ampelbox${falsch.has(i)?" falsch":""}${an===i?" spielt":""}"><p class="eyebrow">${i+1}. ${namen[i]}</p><div class="ampel">${p.map((v,j)=>`<button class="lampe-a${v?" an":""}" data-p="${i}" data-l="${j}" style="--lc:${FARB[j]}"></button>`).join("")}</div></div>`).join("")}</div>
      <div class="row" style="margin-top:12px"><button class="btn ghost" id="abspiel">Ampel abspielen</button></div>${MLD}`;
    el.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{const i=+b.dataset.p,j=+b.dataset.l;d.a[i][j]=d.a[i][j]?0:1;falsch.delete(i);ctx.speichern();zeichne()});
    el.querySelector("#abspiel").onclick=()=>{clearInterval(spiel);let k=0;an=0;zeichne();spiel=setInterval(()=>{k++;if(k>=d.a.length*2){clearInterval(spiel);an=-1}else an=k%d.a.length;zeichne()},900)};
  };
  ctx.beimVerlassen(()=>clearInterval(spiel));
  zeichne();
  ctx.pruefer=()=>{const fs=phasen.map((p,i)=>p.join()===d.a[i].join()?-1:i).filter(i=>i>=0);
    return bewerte(ctx,el,{leer:d.a.every(p=>!p.some(Boolean)),leerText:"Schalte zuerst die Lampen ein.",fehler:fs.length,stand:JSON.stringify(d.a),punkte,okText:"Richtig! Deine Ampel arbeitet wie ein echter Automat. 🚦",markiere:()=>{falsch=new Set(fs);zeichne()}})};
  ctx.loesung=()=>{d.a=phasen.map(p=>p.slice());zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* =====================================================================
   🌳 Entscheidungsbaum
   Baum: {t:"Frage?",f:"merkmal",ja:{…}|{blatt:"Name",ico},nein:{…}}
   ===================================================================== */
function baumHTML(knoten,pfad,weg=""){
  if(knoten.blatt)return`<div class="bk blatt${pfad.startsWith(weg)&&pfad.length===weg.length?" jetzt":""}"><span>${knoten.ico||""}</span>${knoten.blatt}</div>`;
  const aktiv=pfad===weg;
  return`<div class="bzweig"><div class="bk frage${aktiv?" jetzt":""}${pfad.startsWith(weg)&&!aktiv?" weg":""}">${knoten.t}</div>
    <div class="bkinder"><div><span class="bj">ja</span>${baumHTML(knoten.ja,pfad,weg+"j")}</div><div><span class="bj nein">nein</span>${baumHTML(knoten.nein,pfad,weg+"n")}</div></div></div>`;
}
function baumFolgen({titel,punkte=15,merke,text,baum,dinge}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.i=d.i||0;d.pfad=d.pfad||"";
  const knotenBei=p=>[...p].reduce((k,c)=>c==="j"?k.ja:k.nein,baum);
  const zeichne=()=>{
    if(d.i>=dinge.length){el.innerHTML=kopfText(text)+`<div class="msg ok">Alles einsortiert! Tippe auf „Weiter“.</div><div class="baum">${baumHTML(baum,"x")}</div>`;return}
    const ding=dinge[d.i],k=knotenBei(d.pfad);
    el.innerHTML=kopfText(text)+`<div class="szene"><span class="sz-bild">${ding.ico}</span><div class="sz-text"><p class="eyebrow">Ding ${d.i+1} von ${dinge.length}</p><b style="font-size:1.25rem">${ding.name}</b></div></div>
      ${k.blatt?`<div class="row"><button class="btn" id="naechst">${d.i+1<dinge.length?"Nächstes Ding ▶":"Fertig ✔"}</button></div>`
        :`<p class="frage">${k.t}</p><div class="antworten"><button class="antwort" data-a="j">Ja</button><button class="antwort" data-a="n">Nein</button></div>`}
      <div class="baum">${baumHTML(baum,d.pfad)}</div>${MLD}`;
    if(k.blatt){meldung(el,!ding.hinweis,`${ding.ico} ${ding.name} landet bei <b>${k.ico||""} ${k.blatt}</b>.${ding.hinweis?" "+ding.hinweis:" ✔️"}`);
      el.querySelector("#naechst").onclick=()=>{d.i++;d.pfad="";ctx.speichern();zeichne();if(d.i>=dinge.length)ctx.geschafft(punkte)};return}
    el.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{const ja=b.dataset.a==="j",richtig=!!ding.eig[k.f];
      if(ja!==richtig){ctx.fehler();meldung(el,false,`Hmm, stimmt das? Denk noch mal nach: ${ding.ico} <b>${ding.name}</b> – ${k.t}`);return}
      d.pfad+=b.dataset.a;ctx.speichern();zeichne()});
  };
  zeichne();
  ctx.pruefer=()=>{if(d.i>=dinge.length){ctx.geschafft(punkte);return true}meldung(el,false,"Sortiere zuerst alle Dinge mit dem Baum ein.");return false};
  ctx.loesung=()=>{d.i=dinge.length;zeichne()};
}}}
/* Baum selbst bauen: Wurzel + 2 Unterfragen, 4 Blätter. Jedes Blatt soll genau ein Ding bekommen. */
function baumBauen({titel,punkte=20,merke,text,fragen,dinge}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.w=d.w??null;d.j=d.j??null;d.n=d.n??null;let wahl="w";
  const teile=(liste,f)=>[liste.filter(x=>x.eig[f]),liste.filter(x=>!x.eig[f])];
  const blaetter=()=>{if(d.w==null)return null;const [ja,nein]=teile(dinge,fragen[d.w].f);
    return[d.j!=null?teile(ja,fragen[d.j].f):[ja,null],d.n!=null?teile(nein,fragen[d.n].f):[nein,null]]};
  const zeichne=()=>{
    const b=blaetter(),feldF=k=>d[k]!=null?fragen[d[k]].t:"❓ Frage wählen";
    const blatt=l=>l==null?"":`<div class="bk blatt${l.length===1?" gut":l.length>1?" voll":""}">${l.map(x=>x.ico).join(" ")||"leer"}</div>`;
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Diese Tiere sollen am Ende einzeln in den Blättern landen: ${dinge.map(x=>x.ico+" "+x.name).join(" · ")}</p>
      <div class="baum bauen"><div class="bzweig"><div class="bstart">${dinge.map(x=>x.ico).join("")}</div><button class="bk frage${wahl==="w"?" jetzt":""}" data-feld="w">${feldF("w")}</button>
        <div class="bkinder"><div><span class="bj">ja</span><div class="bzweig"><button class="bk frage${wahl==="j"?" jetzt":""}" data-feld="j">${feldF("j")}</button>
          ${b?`<div class="bkinder"><div><span class="bj">ja</span>${blatt(b[0][0])}</div><div><span class="bj nein">nein</span>${blatt(b[0][1])}</div></div>`:""}</div></div>
        <div><span class="bj nein">nein</span><div class="bzweig"><button class="bk frage${wahl==="n"?" jetzt":""}" data-feld="n">${feldF("n")}</button>
          ${b?`<div class="bkinder"><div><span class="bj">ja</span>${blatt(b[1][0])}</div><div><span class="bj nein">nein</span>${blatt(b[1][1])}</div></div>`:""}</div></div></div></div></div>
      <p class="eyebrow">Tippe oben ein Fragefeld an, dann hier eine Frage</p>
      <div class="karten">${fragen.map((f,i)=>`<button class="karte" data-fr="${i}">${f.t}</button>`).join("")}</div>${MLD}`;
    el.querySelectorAll("[data-feld]").forEach(x=>x.onclick=()=>{wahl=x.dataset.feld;zeichne()});
    el.querySelectorAll("[data-fr]").forEach(x=>x.onclick=()=>{d[wahl]=+x.dataset.fr;wahl=wahl==="w"?"j":wahl==="j"?"n":"w";ctx.speichern();zeichne()});
  };
  zeichne();
  const gut=()=>{const b=blaetter();return b&&b.every(([a,c])=>c&&a.length===1&&c.length===1)};
  ctx.pruefer=()=>bewerte(ctx,el,{leer:d.w==null||d.j==null||d.n==null,leerText:"Setze zuerst in alle drei Felder eine Frage.",fehler:gut()?0:1,stand:[d.w,d.j,d.n].join(),punkte,
    okText:"Richtig! Dein Baum kann jedes Tier erkennen – so ähnlich lernt eine KI. 🌳"});
  ctx.loesung=()=>{for(let w=0;w<fragen.length;w++)for(let j=0;j<fragen.length;j++)for(let n=0;n<fragen.length;n++){d.w=w;d.j=j;d.n=n;if(gut())return zeichne()}};
  if(ctx.geloest)schonGeloest(el);
}}}

/* =====================================================================
   🧠 KI-Zeichenerkennung: Das Kind malt, die „KI“ vergleicht mit gelernten Mustern und rät.
   ===================================================================== */
const KI_MUSTER={
  "❤️ Herz":["00000000","01100110","11111111","11111111","01111110","00111100","00011000","00000000"],
  "🏠 Haus":["00011000","00111100","01111110","11111111","01000010","01011010","01011010","01111110"],
  "🙂 Gesicht":["00111100","01000010","10100101","10000001","10100101","10011001","01000010","00111100"],
  "⬆️ Pfeil":["00011000","00111100","01111110","11111111","00011000","00011000","00011000","00011000"],
  "🌲 Baum":["00011000","00111100","01111110","00111100","01111110","11111111","00011000","00011000"],
  "➕ Plus":["00011000","00011000","00011000","11111111","11111111","00011000","00011000","00011000"],
};
function kiRaten(werte){
  /* Vergleich mit jedem gelernten Muster, auch um 1 Kästchen verschoben (Jaccard: gemeinsame / alle schwarzen Kästchen) */
  const t=Object.entries(KI_MUSTER).map(([n,m])=>{let best=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let schnitt=0,verein=0;
      for(let y=0;y<8;y++)for(let x=0;x<8;x++){const sx=x-dx,sy=y-dy;const v=sx>=0&&sx<8&&sy>=0&&sy<8?+m[sy][sx]:0,w=werte[y*8+x]?1:0;
        if(v&&w)schnitt++;if(v||w)verein++}
      if(verein)best=Math.max(best,schnitt/verein)}
    return[n,best]});
  return t.sort((a,b)=>b[1]-a[1])}
function kiZeichnen({titel,punkte=15,merke,text,ziel=3}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.erkannt=d.erkannt||[];
  el.innerHTML=kopfText(text)+`<div class="paar" style="margin-top:12px"><div><p class="eyebrow">Mal hier</p><div id="kz"></div>
      <div class="row" style="margin-top:10px"><button class="btn ghost" id="kzl">Löschen</button></div></div>
    <div><p class="eyebrow">🤖 Die KI denkt …</p><div class="kidenk" id="kd"></div>
      <p class="eyebrow" style="margin-top:12px">Erkannt (${ziel} verschiedene schaffen)</p><div class="kierk" id="ke"></div></div></div>${MLD}`;
  const r=pixelRaster({w:8,h:8,werte:d.bild,palette:["#FFFFFF","#1B1B1F"],malbar:true,onAenderung:v=>{d.bild=v.slice();ctx.speichern();denke(v)}});
  el.querySelector("#kz").append(r.el);
  const denke=v=>{const t=kiRaten(v),leer=!v.some(Boolean);
    el.querySelector("#kd").innerHTML=leer?`<p class="muted">Mal etwas! Ein Herz, ein Haus, ein Gesicht, einen Pfeil, einen Baum oder ein Plus.</p>`
      :t.slice(0,3).map(([n,p])=>`<div class="kibalken"><span>${n}</span><div><i style="width:${Math.round(p*100)}%"></i></div><b>${Math.round(p*100)} %</b></div>`).join("");
    if(!leer&&t[0][1]>=.6&&!d.erkannt.includes(t[0][0])){d.erkannt.push(t[0][0]);ctx.speichern();toast(`🤖 Erkannt: ${t[0][0]}!`);
      if(d.erkannt.length>=ziel){meldung(el,true,`🎉 Die KI hat ${ziel} verschiedene Bilder erkannt! Tippe auf „Weiter“.`);ctx.geschafft(punkte)}}
    el.querySelector("#ke").innerHTML=d.erkannt.map(n=>`<span class="chip good">${n}</span>`).join(" ")||`<span class="muted">noch nichts</span>`};
  denke(r.werte);
  el.querySelector("#kzl").onclick=()=>r.setzeAlle(Array(64).fill(0));
  ctx.pruefer=()=>{if(d.erkannt.length>=ziel){ctx.geschafft(punkte);return true}meldung(el,false,`Bring die KI dazu, ${ziel} verschiedene Bilder zu erkennen (über 60 %). Bisher: ${d.erkannt.length}.`);return false};
  ctx.loesung=()=>{d.erkannt=Object.keys(KI_MUSTER).slice(0,ziel);r.setzeAlle(KI_MUSTER["❤️ Herz"].join("").split("").map(Number))};
}}}

/* =====================================================================
   🔐 Passwort-Tester: Stärke, Knackzeit, Hacker-Wörterbuch. Das Passwort wird NIE gespeichert.
   ===================================================================== */
const OFT=["123456","1234567","12345678","123456789","passwort","password","hallo","hallo123","qwertz","qwerty","111111","000000","abc123","schatz","fussball","fußball","ficken","iloveyou","lol123","gaming","minecraft","fortnite","pokemon","master","hallo1","admin","geheim"];
function knackzeit(pw){if(!pw)return[0,"–"];if(OFT.includes(pw.toLowerCase()))return[0,"sofort! (steht in der Hacker-Liste)"];
  let n=0;if(/[a-zäöüß]/.test(pw))n+=30;if(/[A-ZÄÖÜ]/.test(pw))n+=29;if(/\d/.test(pw))n+=10;if(/[^a-zA-ZäöüÄÖÜß0-9]/.test(pw))n+=33;
  const sek=Math.pow(n,pw.length)/2e10;
  const t=sek<1?"unter 1 Sekunde":sek<60?Math.round(sek)+" Sekunden":sek<3600?Math.round(sek/60)+" Minuten":sek<86400?Math.round(sek/3600)+" Stunden":sek<3.15e7?Math.round(sek/86400)+" Tage":sek<3.15e10?Math.round(sek/3.15e7).toLocaleString("de-DE")+" Jahre":"über 1000 Jahre";
  return[sek,t]}
const PW_REGELN=[["Mindestens 10 Zeichen",p=>p.length>=10],["Großbuchstaben (A–Z)",p=>/[A-ZÄÖÜ]/.test(p)],["Kleinbuchstaben (a–z)",p=>/[a-zäöüß]/.test(p)],["Zahlen (0–9)",p=>/\d/.test(p)],["Sonderzeichen (! ? # …)",p=>/[^a-zA-ZäöüÄÖÜß0-9]/.test(p)],["Kein bekanntes Passwort",p=>p&&!OFT.includes(p.toLowerCase())]];
function passwortTester({titel,punkte=15,merke,text,regeln=6}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;
  el.innerHTML=kopfText(text)+`<div class="msg no" style="margin:12px 0">⚠️ Tippe hier <b>nicht</b> dein echtes Passwort ein! Erfinde ein neues zum Üben.</div>
    <div class="eing pw"><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Passwort zum Testen"></div>
    <div class="pwmeter"><i></i></div><p class="pwzeit"></p><ul class="pwregeln"></ul>${MLD}`;
  const inp=el.querySelector("input"),mt=el.querySelector(".pwmeter i");
  const pruef=()=>{const p=inp.value,ok=PW_REGELN.map(([,f])=>f(p)),n=ok.filter(Boolean).length,[sek,t]=knackzeit(p);
    mt.style.width=Math.min(100,Math.round(n/6*100))+"%";mt.style.background=n>=6?"var(--good)":n>=4?"#F5C518":"var(--bad)";
    el.querySelector(".pwzeit").innerHTML=p?`🤖 Ein Hacker-Computer bräuchte zum Knacken: <b>${t}</b>`:"";
    el.querySelector(".pwregeln").innerHTML=PW_REGELN.map(([r],i)=>`<li class="${ok[i]?"ok":""}">${ok[i]?"✅":"⬜"} ${r}</li>`).join("");
    return n>=regeln};
  inp.oninput=pruef;pruef();
  ctx.pruefer=()=>{if(d.ok||pruef()){d.ok=true;ctx.speichern();meldung(el,true,"🛡️ Super! Dieses Passwort ist richtig stark.");ctx.geschafft(punkte);return true}
    meldung(el,false,"Dein Passwort erfüllt noch nicht alle Regeln. Schau in die Liste!");return false};
  ctx.loesung=()=>{inp.value="Mein!Hund7Bello";pruef()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* =====================================================================
   🔢 Zahl raten (Binäre Suche): Der Computer denkt sich eine Zahl, das Kind rät, Hinweis größer/kleiner.
   ===================================================================== */
function zahlRaten({titel,punkte=15,merke,text,bis=100,max=7}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;const neu=()=>{d.geheim=1+Math.floor(Math.random()*bis);d.tipps=[];d.lo=1;d.hi=bis;ctx.speichern()};
  if(!d.geheim)neu();d.runden=d.runden||0;
  const zeichne=()=>{const gef=d.tipps.includes(d.geheim);
    const pos=v=>((v-1)/(bis-1)*100).toFixed(2);
    el.innerHTML=kopfText(text)+`<div class="raten">
      <p class="eyebrow">Der Computer denkt sich eine Zahl von 1 bis ${bis} · Versuche: ${d.tipps.length}${d.best?` · dein Rekord: ${d.best}`:""}</p>
      <div class="zstrahl"><div class="zbereich" style="left:${pos(d.lo)}%;width:${Math.max(1,pos(d.hi)-pos(d.lo))}%"></div>
        ${d.tipps.map(t=>`<span class="ztipp${t===d.geheim?" ok":""}" style="left:${pos(t)}%">${t}</span>`).join("")}
        <span class="zende l">1</span><span class="zende r">${bis}</span></div>
      <p class="muted small">Grün = da kann die Zahl noch sein: <b>${d.lo} bis ${d.hi}</b></p>
      ${gef?`<div class="msg ${d.tipps.length<=max?"ok":"no"}">${d.tipps.length<=max?`🎉 Gefunden in <b>${d.tipps.length}</b> Versuchen! Super Strategie.`:`Gefunden! Aber mit ${d.tipps.length} Versuchen. Schaffst du es in höchstens <b>${max}</b>? Tipp: Rate immer genau die <b>Mitte</b> vom grünen Bereich.`}</div>
        <div class="row" style="margin-top:12px"><button class="btn ghost" id="nochmal">Neue Zahl</button></div>`
      :`<div class="row raten-ein"><input type="text" inputmode="numeric" autocomplete="off" placeholder="Deine Zahl" maxlength="3"><button class="btn" id="raten">Raten</button></div>`}
    </div>${MLD}`;
    if(gef){el.querySelector("#nochmal").onclick=()=>{neu();zeichne()};return}
    const inp=el.querySelector("input"),los=()=>{const v=parseInt(inp.value,10);
      if(!(v>=1&&v<=bis))return meldung(el,false,`Tippe eine Zahl von 1 bis ${bis}.`);
      d.tipps.push(v);if(v<d.geheim)d.lo=Math.max(d.lo,v+1);if(v>d.geheim)d.hi=Math.min(d.hi,v-1);
      if(v===d.geheim){d.lo=d.hi=v;d.runden++;if(!d.best||d.tipps.length<d.best)d.best=d.tipps.length;if(d.tipps.length<=max)d.ok=true}
      ctx.speichern();zeichne();
      if(v!==d.geheim){meldung(el,null,v<d.geheim?`⬆️ <b>${v}</b> ist zu klein. Die Zahl ist größer.`:`⬇️ <b>${v}</b> ist zu groß. Die Zahl ist kleiner.`);el.querySelector("input").focus()}
      else if(d.ok)ctx.geschafft(punkte)};
    el.querySelector("#raten").onclick=los;inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();los()}};
    setTimeout(()=>inp.focus(),50);
  };
  zeichne();
  ctx.pruefer=()=>{if(d.ok){ctx.geschafft(punkte);return true}meldung(el,false,`Finde die Zahl in höchstens ${max} Versuchen.`);return false};
  ctx.loesung=()=>{d.tipps=[];let lo=1,hi=bis;while(true){const m=Math.floor((lo+hi)/2);d.tipps.push(m);if(m===d.geheim)break;if(m<d.geheim)lo=m+1;else hi=m-1}d.lo=d.hi=d.geheim;d.ok=true;zeichne()};
}}}

/* =====================================================================
   ⚖️ Waage: Kisten mit verstecktem Gewicht. Immer zwei vergleichen, dann von leicht nach schwer ordnen.
   ===================================================================== */
const KISTEN=["🟥","🟧","🟨","🟩","🟦","🟪","🟫","⬛"];
function waage({titel,punkte=15,merke,text,n=5,ziel}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;if(!d.w){d.w=mischen(Array.from({length:n},(_,i)=>i+1));d.log=[];d.gew=[];ctx.speichern()}
  let wahl=[],falsch=false;
  const zeichne=()=>{const [a,b]=d.letzt||[];
    const kipp=d.letzt?(d.w[a]>d.w[b]?"links":"rechts"):"";
    el.innerHTML=kopfText(text)+`<div class="waage-box">
      <div class="waage ${kipp}"><div class="balken-w"><div class="schale">${d.letzt?KISTEN[a]:""}</div><div class="schale">${d.letzt?KISTEN[b]:""}</div></div><div class="fuss">▲</div></div>
      <p class="eyebrow">Tippe zwei Kisten an, um sie zu wiegen · gewogen: ${d.log.length}-mal${ziel?` · Profis schaffen es mit ${ziel}`:""}</p>
      <div class="kisten">${d.w.map((_,i)=>`<button class="kiste${wahl.includes(i)?" an":""}${d.gew.includes(i)?" weg":""}" data-k="${i}">${KISTEN[i]}</button>`).join("")}</div>
      ${d.log.length?`<p class="eyebrow" style="margin-top:12px">Das weißt du schon</p><div class="wlog">${d.log.map(([x,y])=>`<span>${KISTEN[x]} ${d.w[x]>d.w[y]?"ist schwerer als":"ist leichter als"} ${KISTEN[y]}</span>`).join("")}</div>`:""}
      <p class="eyebrow" style="margin-top:14px">Deine Reihenfolge: leicht → schwer <span class="muted">(tippe unten die Kisten der Reihe nach an)</span></p>
      <div class="reihe-w${falsch?" falsch":""}">${d.gew.map((i,k)=>`<button class="kiste klein" data-g="${k}" title="Zurücklegen">${KISTEN[i]}</button>`).join("<i>‹</i>")}${d.gew.length<n?`<span class="muted">… noch ${n-d.gew.length}</span>`:""}</div>
      <div class="karten" style="margin-top:8px">${d.w.map((_,i)=>d.gew.includes(i)?"":`<button class="karte" data-r="${i}">${KISTEN[i]} einordnen</button>`).join("")}</div>
    </div>${MLD}`;
    el.querySelectorAll("[data-k]").forEach(x=>x.onclick=()=>{const i=+x.dataset.k;if(wahl.includes(i))wahl=wahl.filter(j=>j!==i);else wahl.push(i);
      if(wahl.length===2){d.letzt=wahl.slice();d.log.push(wahl.slice());wahl=[];ctx.speichern()}zeichne()});
    el.querySelectorAll("[data-r]").forEach(x=>x.onclick=()=>{d.gew.push(+x.dataset.r);falsch=false;ctx.speichern();zeichne()});
    el.querySelectorAll("[data-g]").forEach(x=>x.onclick=()=>{d.gew.splice(+x.dataset.g,1);falsch=false;ctx.speichern();zeichne()});
  };
  zeichne();
  ctx.pruefer=()=>{const ok=d.gew.every((i,k)=>k===0||d.w[d.gew[k-1]]<d.w[i]);
    const r=bewerte(ctx,el,{leer:d.gew.length<n,leerText:"Ordne zuerst alle Kisten ein (unten).",fehler:ok?0:1,stand:d.gew.join(),punkte,
      okText:`Richtig sortiert! Du hast ${d.log.length}-mal gewogen. ⚖️`});
    if(!r&&d.gew.length===n){falsch=true;const l=el.querySelector(".mld").innerHTML;zeichne();meldung(el,false,l+" Wiege noch ein paar Kisten nach!")}return r};
  ctx.loesung=()=>{d.gew=d.w.map((_,i)=>i).sort((a,b)=>d.w[a]-d.w[b]);zeichne()};
  if(ctx.geloest)schonGeloest(el);
}}}

/* ---------- ⇄ Tausch-Sortieren: Nur Nachbarn tauschen (wie Bubblesort) ---------- */
function tauschSortieren({titel,punkte=15,merke,text,zahlen:start}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;d.z=d.z||start.slice();d.t=d.t||0;
  const fehlst=a=>{let n=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(a[i]>a[j])n++;return n};
  const best=fehlst(start);
  const zeichne=()=>{const fertig=fehlst(d.z)===0;
    el.innerHTML=kopfText(text)+`<p class="eyebrow" style="margin-top:12px">Getauscht: ${d.t}-mal${fertig?"":" · Ziel: von klein nach groß"}</p>
      <div class="tausch">${d.z.map((v,i)=>`${i?`<button class="tbtn" data-t="${i-1}" ${fertig?"disabled":""} title="Tauschen">⇄</button>`:""}<span class="tkarte${fertig?" ok":""}">${v}</span>`).join("")}</div>
      ${fertig?`<div class="msg ok">Sortiert mit ${d.t} Tauschen${d.t===best?" – kürzer geht es nicht! 🏆":""}. Tippe auf „Weiter“.</div>`:""}
      <div class="row" style="margin-top:12px"><button class="btn ghost" id="treset">Von vorn</button></div>${MLD}`;
    el.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{const i=+b.dataset.t;[d.z[i],d.z[i+1]]=[d.z[i+1],d.z[i]];d.t++;ctx.speichern();zeichne();
      if(fehlst(d.z)===0)ctx.geschafft(punkte)});
    el.querySelector("#treset").onclick=()=>{d.z=start.slice();d.t=0;ctx.speichern();zeichne()};
  };
  zeichne();
  ctx.pruefer=()=>{if(fehlst(d.z)===0){ctx.geschafft(punkte);return true}meldung(el,false,"Sortiere zuerst alle Zahlen von klein nach groß.");return false};
  ctx.loesung=()=>{d.z=start.slice().sort((a,b)=>a-b);d.t=best;zeichne()};
}}}

/* =====================================================================
   🧠 KI-Trainer: Beispiele beschriften, die KI lernt (ähnlichstes Beispiel) und testet an neuen Dingen.
   kiTrainer({titel,punkte,merke,text,klassen:[["o","Obst","🍎"],…],merkmale:[["süß","🍬"],…],
              beispiele:[{ico,name,f:[1,0,…],ist:"o",label:"g"}],tests:[{ico,name,f,ist}]})
   ===================================================================== */
function kiTrainer({titel,punkte=20,merke,text,klassen,merkmale,beispiele,tests}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;if(!d.lab){d.lab=beispiele.map(b=>b.label||b.ist);ctx.speichern()}
  const kl=id=>klassen.find(k=>k[0]===id);
  const abst=(a,b)=>a.reduce((s,v,i)=>s+(v!==b[i]?1:0),0);
  const rate=t=>{let best=null,bd=1e9;beispiele.forEach((b,i)=>{const x=abst(t.f,b.f);if(x<bd){bd=x;best=i}});return{i:best,lab:d.lab[best]}};
  const chips=f=>merkmale.map(([n,ico],i)=>f[i]?`<span class="mm" title="${n}">${ico}</span>`:"").join("");
  const zeichne=()=>{
    el.innerHTML=kopfText(text)+`<p class="muted small" style="margin-top:10px">Merkmale: ${merkmale.map(([n,ico])=>`${ico} ${n}`).join(" · ")}</p>
      <p class="eyebrow" style="margin-top:10px">Trainings-Beispiele · tippe an, um die Beschriftung zu ändern</p>
      <div class="kibsp">${beispiele.map((b,i)=>{const k=kl(d.lab[i]);return`<button class="kib k-${d.lab[i]}" data-b="${i}"><span class="kico2">${b.ico}</span><b>${b.name}</b><span class="mms">${chips(b.f)}</span><span class="chip">${k[2]} ${k[1]}</span></button>`}).join("")}</div>
      <div class="row" style="margin-top:12px"><button class="btn" id="kitest">KI lernen lassen und testen</button></div>
      ${d.test?`<p class="eyebrow" style="margin-top:14px">Test mit neuen Dingen, die die KI noch nie gesehen hat</p>
        <div class="kitests">${tests.map(t=>{const r=rate(t),ok=r.lab===t.ist,k=kl(r.lab),b=beispiele[r.i];
          return`<div class="kit ${ok?"ok":"no"}"><span class="kico2">${t.ico}</span><div><b>${t.name}</b> <span class="mms">${chips(t.f)}</span><br><span class="small">KI sagt: <b>${k[2]} ${k[1]}</b> ${ok?"✅":"❌"}<br><span class="muted">weil es so ähnlich ist wie ${b.ico} ${b.name}</span></span></div></div>`}).join("")}</div>`:""}${MLD}`;
    el.querySelectorAll("[data-b]").forEach(x=>x.onclick=()=>{const i=+x.dataset.b,k=klassen.findIndex(c=>c[0]===d.lab[i]);d.lab[i]=klassen[(k+1)%klassen.length][0];d.test=false;ctx.speichern();zeichne()});
    el.querySelector("#kitest").onclick=()=>{d.test=true;const falsch=tests.filter(t=>rate(t).lab!==t.ist).length;ctx.speichern();zeichne();
      if(!falsch){d.ok=true;ctx.speichern();meldung(el,true,"🎉 Die KI erkennt jetzt alles richtig! Tippe auf „Weiter“.")}
      else{d.fl=(d.fl||0)+1;if(d.fl%2===0)ctx.fehler();
        meldung(el,false,`Die KI liegt ${falsch}-mal falsch. Schau dir die Trainings-Beispiele genau an: Ist eins falsch beschriftet? Dann lernt die KI etwas Falsches!`)}};
  };
  zeichne();
  ctx.pruefer=()=>{if(d.ok){ctx.geschafft(punkte);return true}meldung(el,false,d.test?"Die KI macht noch Fehler. Verbessere die Beispiele und teste noch mal.":"Tippe zuerst auf „KI lernen lassen und testen“.");return false};
  ctx.loesung=()=>{d.lab=beispiele.map(b=>b.ist);d.test=true;d.ok=true;zeichne()};
}}}

/* ---------- 🔓 PIN-Knacker: Wie schnell probiert ein Computer alle Zahlen durch? (Die PIN wird nicht gespeichert) ---------- */
function pinKnacker({titel,punkte=5,merke,text}){return{titel,punkte,merke,zeige(el,ctx){
  const d=ctx.daten;let lauf=null;
  el.innerHTML=kopfText(text)+`<div class="row raten-ein" style="margin-top:12px"><input type="text" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="4 Ziffern, z. B. 2580"><button class="btn" id="hack">Hacker starten</button></div>
    <div class="hacker"><div class="hzahl">0000</div><div class="small" id="hinfo">Der Computer probiert einfach alle Zahlen durch: 0000, 0001, 0002 …</div></div>${MLD}`;
  const inp=el.querySelector("input"),z=el.querySelector(".hzahl");
  inp.oninput=()=>{inp.value=inp.value.replace(/\D/g,"").slice(0,4)};
  el.querySelector("#hack").onclick=()=>{const pin=inp.value;if(pin.length!==4)return meldung(el,false,"Tippe eine ausgedachte PIN mit 4 Ziffern ein.");
    clearInterval(lauf);const ziel=+pin;let i=0;const schritt=Math.max(7,Math.ceil(ziel/60));
    lauf=setInterval(()=>{i=Math.min(ziel,i+schritt);z.textContent=String(i).padStart(4,"0");
      if(i>=ziel){clearInterval(lauf);z.classList.add("geknackt");
        el.querySelector("#hinfo").innerHTML=`Geknackt nach <b>${(ziel+1).toLocaleString("de-DE")}</b> Versuchen! Ein echter Computer braucht dafür weniger als <b>1 Tausendstel Sekunde</b>.`;
        d.ok=true;ctx.speichern();meldung(el,true,"Eine 4-stellige PIN hat nur 10.000 Möglichkeiten. Ein Passwort mit 12 Zeichen hat mehr Möglichkeiten, als es Sandkörner auf der Erde gibt!");ctx.geschafft(punkte)}},30)};
  ctx.beimVerlassen(()=>clearInterval(lauf));
  ctx.pruefer=()=>{if(d.ok){ctx.geschafft(punkte);return true}meldung(el,false,"Probier den Hacker-Computer zuerst einmal aus.");return false};
  ctx.loesung=()=>{inp.value="2580";el.querySelector("#hack").click()};
  if(ctx.geloest)schonGeloest(el);
}}}
