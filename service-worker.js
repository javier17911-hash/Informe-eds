const CACHE_NAME='informe-eds-v29';

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

function forceHeader(html){
  const service='SERVICIOS TÉCNICOS DE ESTACIONES';
  const title='INFORME DE TRABAJO Y/O COTIZACION';

  // No tocar la imagen del logo ni su leyenda interna.
  // Solo cambiar los textos que están fuera de la imagen.
  html=html.replace(/(<header class="head">[\s\S]*?<div class="brand-kicker">)[\s\S]*?(<\/div>)/i,'$1'+service+'$2');
  html=html.replace(/(<header class="head">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/i,'$1'+title+'$2');
  html=html.replace(/(<header class="head">[\s\S]*?<p>)[\s\S]*?(<\/p>)/i,'$1'+'$2');

  // Presentación final: logo original grande y completo a la izquierda; textos centrados a la derecha.
  const css=`<style id="eds-v29">
.head{display:flex!important;align-items:center!important;gap:22px!important}
.head .logo{display:block!important;width:330px!important;height:auto!important;max-width:42%!important;max-height:none!important;object-fit:contain!important;flex:0 0 330px!important;padding:0!important;background:#fff!important;border-radius:10px!important}
.head>div{flex:1 1 auto!important;min-width:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important}
.head .brand-kicker,.head h1,.head p{width:100%!important;text-align:center!important}
.head .brand-kicker{font-size:14px!important;font-weight:800!important;line-height:1.15!important;margin-bottom:6px!important}
.head h1{font-size:26px!important;line-height:1.15!important;margin:0 0 4px!important}
.head p{font-size:13px!important;margin:0!important}
@media(max-width:700px){.head{gap:12px!important}.head .logo{width:200px!important;flex-basis:200px!important;max-width:42%!important}.head .brand-kicker{font-size:12px!important}.head h1{font-size:19px!important}.head p{font-size:12px!important}}
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