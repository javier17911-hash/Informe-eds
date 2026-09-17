const CACHE_NAME='informe-eds-v27';

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

function forceHeader(html){
  const service='SERVICIOS TÉCNICOS DE ESTACIONES';
  const title='INFORME DE TRABAJO Y/O COTIZACION';

  // Mantener el logo exactamente como está en index.html.
  // Solo se cambian los textos dentro del encabezado, sin tocar la imagen.
  html=html.replace(
    /(<header class="head">[\s\S]*?<div class="brand-kicker">)[\s\S]*?(<\/div>)/i,
    '$1'+service+'$2'
  );
  html=html.replace(
    /(<header class="head">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/i,
    '$1'+title+'$2'
  );
  html=html.replace(
    /(<header class="head">[\s\S]*?<p>)[\s\S]*?(<\/p>)/i,
    '$1'+'$2'
  );

  return html;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const accept=event.request.headers.get('accept')||'';

  if(event.request.mode==='navigate'||accept.includes('text/html')){
    event.respondWith(
      fetch(new Request(event.request,{cache:'no-store'})).then(async response=>{
        const text=await response.text();
        const modified=forceHeader(text);
        const headers=new Headers(response.headers);
        headers.set('content-type','text/html; charset=utf-8');
        headers.delete('content-length');
        return new Response(modified,{status:response.status,statusText:response.statusText,headers});
      })
    );
    return;
  }

  event.respondWith(fetch(event.request));
});