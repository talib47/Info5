# Baut index.html und version.txt aus src/. Nach jeder Änderung: python3 build.py, dann beides committen.
# Stationen: jede Datei in src/stationen/*.js wird in Dateinamen-Reihenfolge eingebaut.
import hashlib, glob
base=open('src/base.css').read(); stc=open('src/stationen.css').read()
js=open('src/app.js').read().replace('/*@@DATEN@@*/',open('src/daten.js').read())
teile=js.split('/* ---------- Start ---------- */')
stat=''.join(open(f).read()+'\n' for f in sorted(glob.glob('src/stationen/*.js')))
VER=hashlib.sha1((base+stc+js+stat).encode()).hexdigest()[:10]
alles=(teile[0]+stat+'/* ---------- Start ---------- */'+teile[1]).replace('__VERSION__',VER)
FACE='''@font-face{font-family:"Hyperlegible";font-style:normal;font-weight:200 800;font-display:swap;src:url("fonts/ahl-latin.woff2") format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Hyperlegible";font-style:normal;font-weight:200 800;font-display:swap;src:url("fonts/ahl-latin-ext.woff2") format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Hyperlegible Mono";font-style:normal;font-weight:200 800;font-display:swap;src:url("fonts/ahm-latin.woff2") format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
'''
html=f'''<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Informatik 5</title>
<meta name="theme-color" content="#1F44C8">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="icon.svg">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Informatik 5">
<style>{FACE}{base}{stc}</style>
</head>
<body>
<main id="app"></main>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script>
{alles}
</script>
</body>
</html>
'''
open('index.html','w').write(html);open('version.txt','w').write(VER+'\n');print(VER)
