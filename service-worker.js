const CACHE_NAME='informe-eds-v24';
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

  // Toma el mismo logo completo que ya está dentro del index.html.
  // Así se conserva exactamente la imagen y su leyenda original.
  const logoMatch=html.match(/<header class="head">[\s\S]*?<img[^>]*class="logo"[^>]*src="([^"]+)"/i);
  const logo=logoMatch?logoMatch[1]:'./logo.jpg?v=24';

  // Elimina únicamente la leyenda antigua que aparecía fuera de la imagen.
  html=html.replace(/Mantenimiento eléctrico y mecánico de EDS/gi,'');
  html=html.replace(/Mantenimiento electrico y mecanico de EDS/gi,'');

  // Logo fijo a la izquierda; textos centrados en el espacio restante.
  html=html.replace(/<header class="head">[\s\S]*?<\/header>/i,
    '<header class="head"><img class="logo" src="'+logo+'" alt="Logo EDS"><div class="head-copy"><div class="service-title">'+service+'</div><h1>'+title+'</h1></div></header>'
  );

  // En el informe/cotización: logo a la izquierda y textos centrados.
  html=html.replace(/function\s+reportHeader\s*\(\)\s*\{[\s\S]*?\n\}/,
    'function reportHeader(){return`<div class="report-brand"><img class="report-logo" src="'+logo+'" alt="Logo EDS"><div class="report-copy"><div class="service-title">'+service+'</div><h1>'+title+'</h1></div></div>`}'
  );

  const css=`<style id="eds-v24">
.head{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:18px!important;text-align:center!important}
.head .logo{display:block!important;width:170px!important;height:auto!important;max-width:34vw!important;max-height:none!important;object-fit:contain!important;background:#fff!important;padding:3px!important;border-radius:10px!important;flex:0 0 auto!important}
.head-copy{flex:1 1 auto!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;text-align:center!important;min-width:0!important;padding:0 8px!important}
.head .service-title{color:#fff!important;font-weight:800!important;font-size:19px!important;letter-spacing:.4px!important;line-height:1.15!important}
.head h1{margin:6px 0 0!important;color:#fff!important;font-size:25px!important;line-height:1.15!important;text-align:center!important}
.report-brand{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:16px!important;border-bottom:3px solid #0b5cff!important;padding:0 0 13px!important;margin-bottom:18px!important}
.report-logo{display:block!important;width:150px!important;height:auto!important;max-width:30vw!important;max-height:none!important;object-fit:contain!important;background:#fff!important;padding:3px!important;border-radius:8px!important;flex:0 0 auto!important}
.report-copy{flex:1 1 auto!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;text-align:center!important;min-width:0!important;padding:0 6px!important}
.report-brand .service-title{color:#0b5cff!important;font-weight:800!important;font-size:16px!important;letter-spacing:.35px!important;line-height:1.15!important}
.report-brand h1{margin:6px 0 0!important;color:#0b5cff!important;font-size:22px!important;line-height:1.2!important;text-align:center!important}
@media(max-width:600px){.head{gap:10px!important}.head .logo{width:135px!important;max-width:38vw!important}.head .service-title{font-size:14px!important}.head h1{font-size:18px!important}.report-brand{gap:10px!important}.report-logo{width:112px!important;max-width:34vw!important}.report-brand .service-title{font-size:13px!important}.report-brand h1{font-size:17px!important}}
</style>`;
  if(!html.includes('id="eds-v24"')) html=html.replace('</head>',css+'</head>');
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