const CACHE_NAME='informe-eds-v29';

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

function forceHeader(html){
  const service='SERVICIOS TÉCNICOS DE ESTACIONES';
  const title='INFORME DE TRABAJO Y/O COTIZACION';

  // Cambiar únicamente los textos existentes del encabezado.
  // La imagen del logo y su CSS original quedan intactos.
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
    '$1$2'
  );

  // Solo centrar el texto a la derecha del logo. No se modifica .logo.
  const css=`<style id="eds-v29">
.head>div{flex:1 1 auto!important;text-align:center!important;min-width:0!important}
.head .brand-kicker,.head h1,.head p{width:100%!important;text-align:center!important}
</style>`;
  if(!html.includes('id="eds-v29"')) html=html.replace('</head>',css+'</head>');
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