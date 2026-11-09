/* Informatik 5: Offline-Kopie der Seite. Netz zuerst (immer beim Server nachfragen, höchstens 3 Sekunden), sonst gespeicherte Kopie.
   Alle Apps teilen sich talib47.github.io: hier werden nur Caches mit dem Präfix „if5-“ gelöscht. */
const CACHE="if5-v3";
const CORE=["./","index.html","manifest.webmanifest","icon.svg","favicon.ico","fonts/newsreader-latin.woff2","fonts/newsreader-latin-ext.woff2","https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("if5-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request,u=new URL(r.url);
  const lib=u.hostname==="cdn.jsdelivr.net",same=u.origin===location.origin&&u.pathname.startsWith(new URL(self.registration.scope).pathname);
  if(r.method!=="GET"||(!same&&!lib)||(same&&u.pathname.endsWith("version.txt")))return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const net=(r.mode==="navigate"?fetch(r.url,{cache:"no-cache",credentials:"same-origin"}):fetch(r,{cache:"no-cache"})).then(res=>{if(res&&res.ok)c.put(r.mode==="navigate"?"index.html":r,res.clone());return res});
    const t=new Promise(res=>setTimeout(()=>res(null),3000));
    try{const res=await Promise.race([net,t]);if(res)return res}catch(err){}
    return (await c.match(r.mode==="navigate"?"index.html":r,{ignoreSearch:true}))||net;
  })());
});
