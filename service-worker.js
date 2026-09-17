const CACHE_NAME='informe-eds-v28';

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

function forceHeader(html){
  const service='SERVICIOS TÉCNICOS DE ESTACIONES';
  const title='INFORME DE TRABAJO Y/O COTIZACION';

  // Mantener intacta la imagen del logo y su leyenda original.
  // Solo se cambian los textos visibles fuera de la imagen.
  html=html.replace(/(<header class="head">[\s\S]*?<div class="brand-kicker">)[\s\S]*?(<\/div>)/i,'$1'+service+'$2');
  html=html.replace(/(<header class="head">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/i,'$1'+title+'$2');
  html=html.replace(/(<header class="head">[\s\S]*?<p>)[\s\S]*?(<\/p>)/i,'$1'+title+'$2');

  // Centrar los textos y ampliar el espacio del logo sin recortarlo ni deformarlo.
  const css=`<style id="eds-v28">
.head{align-items:center!important}
.head .logo{width:260px!important;height:auto!important;max-width:36vw!important;object-fit:contain!important;padding:4px!important;flex:0 0 auto!important}
.head>div{flex:1 1 auto!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;text-align:center!important;min-width:0!important}
.head .brand-kicker,.head h1,.head p{width:100%!important;text-align:center!important}
.head .brand-kicker{margin-bottom:5px!important;font-size:13px!important}
.head h1{margin:0 0 4px!important;font-size:25px!important;line-height:1.15!important}
@media(max-width:600px){.head{gap:10px!important}.head .logo{width:155px!important;max-width:40vw!important}.head .brand-kicker{font-size:13px!important}.head h1{font-size:18px!important}}
</style>`;
  if(!html.includes('id="eds-v28"')) html=html.replace('</head>',css+'</head>');
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