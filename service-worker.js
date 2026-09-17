const CACHE_NAME='informe-eds-v23';
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
  const logo='./logo.jpg?v=23';

  // Elimina solo la leyenda antigua que aparecía fuera del logo.
  // La leyenda que forma parte de la imagen del logo permanece intacta.
  html=html.replace(/Mantenimiento eléctrico y mecánico de EDS/gi,'');
  html=html.replace(/Mantenimiento electrico y mecanico de EDS/gi,'');

  // Logo completo a la izquierda; textos a la derecha.
  html=html.replace(/<header class="head">[\s\S]*?<\/header>/i,
    '<header class="head"><img class="logo" src="'+logo+'" alt="Logo EDS"><div class="head-copy"><div class="service-title">'+service+'</div><h1>'+title+'</h1></div></header>'
  );

  // Mismo diseño para el informe/cotización: logo a la izquierda.
  html=html.replace(/function\s+reportHeader\s*\(\)\s*\{[\s\S]*?\n\}/,
    'function reportHeader(){return`<div class="report-brand"><img class="report-logo" src="'+logo+'" alt="Logo EDS"><div class="report-copy"><div class="service-title">'+service+'</div><h1>'+title+'</h1></div></div>`}'
  );

  const css=`<style id="eds-v23">
.head{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:18px!important;text-align:left!important}
.head .logo{display:block!important;width:210px!important;height:auto!important;max-width:36vw!important;max-height:95px!important;object-fit:contain!important;background:#fff!important;padding:2px!important;border-radius:10px!important;flex:0 0 auto!important}
.head-copy{display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;gap:6px!important;min-width:0!important}
.service-title{font-weight:800!important;letter-spacing:.4px!important;line-height:1.15!important}
.head .service-title{color:#fff!important;font-size:19px!important}
.head h1{margin:0!important;color:#fff!important;font-size:25px!important;line-height:1.15!important}
.report-brand{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:16px!important;border-bottom:3px solid #0b5cff!important;padding:0 0 13px!important;margin-bottom:18px!important}
.report-logo{display:block!important;width:165px!important;height:auto!important;max-width:32vw!important;max-height:85px!important;object-fit:contain!important;background:#fff!important;padding:2px!important;border-radius:8px!important;flex:0 0 auto!important}
.report-copy{display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;gap:5px!important;min-width:0!important}
.report-brand .service-title{color:#0b5cff!important;font-size:16px!important}
.report-brand h1{margin:0!important;color:#0b5cff!important;font-size:22px!important;line-height:1.2!important}
@media(max-width:600px){.head{gap:10px!important}.head .logo{width:145px!important;max-width:42vw!important;max-height:78px!important}.head .service-title{font-size:14px!important}.head h1{font-size:18px!important}.report-brand{gap:10px!important}.report-logo{width:115px!important;max-width:36vw!important;max-height:68px!important}.report-brand .service-title{font-size:13px!important}.report-brand h1{font-size:17px!important}}
</style>`;
  if(!html.includes('id="eds-v23"')) html=html.replace('</head>',css+'</head>');
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