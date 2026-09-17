const CACHE_NAME='informe-eds-v25';
const APP_SHELL=['./','./index.html','./manifest.json','./delete.js','./logo.jpg'];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE_NAME).then(()=>self.skipWaiting())
));

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

function forceHeader(html){
  const service='SERVICIOS TÉCNICOS DE ESTACIONES';
  const title='INFORME DE TRABAJO Y/O COTIZACION';

  // Mantener exactamente el logo original y su imagen completa.
  // Solo se cambia el texto visible del encabezado.
  html=html.replace(/(<header class="head">[\s\S]*?<div class="brand-kicker">)[\s\S]*?(<\/div>)/i,'$1'+service+'$2');
  html=html.replace(/(<header class="head">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/i,'$1'+title+'$2');
  html=html.replace(/(<header class="head">[\s\S]*?<p>)[\s\S]*?(<\/p>)/i,'$1$2');

  const css=`<style id="eds-v25">
.head>div{flex:1 1 auto!important;text-align:center!important}
.head .brand-kicker{width:100%!important;text-align:center!important}
.head h1{width:100%!important;text-align:center!important}
@media(max-width:600px){.head>div{text-align:center!important}.head .brand-kicker,.head h1{text-align:center!important}}
</style>`;
  if(!html.includes('id="eds-v25"')) html=html.replace('</head>',css+'</head>');
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