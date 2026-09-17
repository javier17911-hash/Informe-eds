const CACHE_NAME='informe-eds-v18';
const APP_SHELL=['./','./index.html','./manifest.json','./delete.js'];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE_NAME).then(()=>self.skipWaiting())
));

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

function forceHeader(html){
  const title='INFORME DE TRABAJO Y/O COTIZACION';
  const logo='./logo.jpg?v=18';

  // Remove old wording from visible HTML text and attributes.
  html=html.replace(/Mantenimiento eléctrico y mecánico de EDS/gi,title);
  html=html.replace(/Mantenimiento electrico y mecanico de EDS/gi,title);

  // Use one stable logo asset everywhere. Keep its natural horizontal ratio.
  html=html.replace(/<header class="head">[\s\S]*?<\/header>/i,
    '<header class="head"><img class="logo" src="'+logo+'" alt="Logo EDS"><div><h1>'+title+'</h1></div></header>'
  );

  html=html.replace(/function\s+reportHeader\s*\(\)\s*\{[\s\S]*?\n\}/,
    'function reportHeader(){return`<div class="report-brand"><img src="'+logo+'" alt="Logo EDS"><div><h1>'+title+'</h1></div></div>`}'
  );

  // Fallback for older report markup.
  html=html.replace(/(<div class="report-brand">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/i,'$1'+title+'$2');
  html=html.replace(/(<div class="report-brand">[\s\S]*?<p>)[\s\S]*?(<\/p>)/i,'$1$2');

  const css=`<style id="eds-v18">
.head .logo{display:block!important;width:230px!important;height:auto!important;max-width:42vw!important;max-height:none!important;object-fit:contain!important;background:#fff!important;padding:4px!important;border-radius:10px!important;flex:0 0 auto!important}
.head h1{margin:0!important;color:#fff!important;font-size:25px!important;line-height:1.15!important}
.report-brand{display:flex!important;align-items:center!important;gap:18px!important;border-bottom:3px solid #0b5cff!important;padding:0 0 13px!important;margin-bottom:18px!important}
.report-brand img{display:block!important;width:180px!important;height:auto!important;max-width:36vw!important;max-height:none!important;object-fit:contain!important;background:#fff!important;padding:3px!important;border-radius:8px!important;flex:0 0 auto!important}
.report-brand h1{margin:0!important;color:#0b5cff!important;font-size:22px!important;line-height:1.2!important}
@media(max-width:600px){.head{align-items:center!important}.head .logo{width:160px!important;max-width:45vw!important;height:auto!important}.head h1{font-size:20px!important}.report-brand{gap:12px!important}.report-brand img{width:130px!important;max-width:38vw!important;height:auto!important}.report-brand h1{font-size:19px!important}}
</style>`;
  if(!html.includes('id="eds-v18"')) html=html.replace('</head>',css+'</head>');
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