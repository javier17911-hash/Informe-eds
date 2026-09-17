const CACHE_NAME='informe-eds-v13';
const APP_SHELL=['./','./index.html','./manifest.json','./delete.js','./logo.jpg'];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())
));

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

function forceHeader(html){
  // Use the real repository logo instead of the embedded/old image.
  html=html.replace(/(<header class="head">\s*<img class="logo")\s+src="[^"]*"/i,'$1 src="./logo.jpg"');

  // Replace any existing reportHeader() function, regardless of its previous wording.
  html=html.replace(/function\s+reportHeader\s*\(\)\s*\{return`[\s\S]*?`\}/,
    'function reportHeader(){return`<div class="report-brand"><img src="./logo.jpg" alt="Logo EDS"><div><h1>INFORME DE TRABAJO</h1></div></div>`}'
  );

  // Fallback: remove the old phrase only inside the report-brand text if an older structure remains.
  html=html.replace(/(<div class="report-brand">[\s\S]*?<h1>)Mantenimiento eléctrico y mecánico de EDS(<\/h1>)/i,'$1INFORME DE TRABAJO$2');
  html=html.replace(/(<div class="report-brand">[\s\S]*?<p>)[\s\S]*?(<\/p>)/i,'$1$2');

  // Keep the requested layout and make the logo fit without distortion.
  const css=`<style id="eds-v13">\n.head .logo{width:220px!important;height:88px!important;object-fit:contain!important;background:#fff!important;padding:4px!important;border-radius:10px!important}\n.report-brand{display:flex!important;align-items:center!important;gap:18px!important;border-bottom:3px solid #0b5cff!important;padding:0 0 13px!important;margin-bottom:18px!important}\n.report-brand img{display:block!important;width:150px!important;height:78px!important;object-fit:contain!important;background:#fff!important;padding:3px!important;border-radius:8px!important;flex:0 0 auto!important}\n.report-brand h1{margin:0!important;color:#0b5cff!important;font-size:22px!important;line-height:1.2!important}\n@media(max-width:600px){.head .logo{width:160px!important;height:72px!important}.report-brand{gap:12px!important}.report-brand img{width:115px!important;height:68px!important}.report-brand h1{font-size:19px!important}}\n</style>`;
  if(!html.includes('id="eds-v13"')) html=html.replace('</head>',css+'</head>');
  return html;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const accept=event.request.headers.get('accept')||'';

  if(event.request.mode==='navigate'||accept.includes('text/html')){
    event.respondWith(
      fetch(event.request).then(async response=>{
        const text=await response.text();
        const modified=forceHeader(text);
        const headers=new Headers(response.headers);
        headers.set('content-type','text/html; charset=utf-8');
        headers.delete('content-length');
        const out=new Response(modified,{status:response.status,statusText:response.statusText,headers});
        const cache=await caches.open(CACHE_NAME);
        await cache.put(event.request,out.clone());
        return out;
      }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));
      return response;
    }).catch(()=>caches.match(event.request))
  );
});