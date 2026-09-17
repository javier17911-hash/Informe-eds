const CACHE_NAME='informe-eds-v19';
const APP_SHELL=['./','./index.html','./manifest.json','./delete.js'];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE_NAME).then(()=>self.skipWaiting())
));

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

function forceHeader(html){
  const title='INFORME DE TRABAJO Y/O COTIZACION';

  // Change only the old wording. Do not replace or resize the original logo/header markup.
  html=html.replace(/Mantenimiento eléctrico y mecánico de EDS/gi,title);
  html=html.replace(/Mantenimiento electrico y mecanico de EDS/gi,title);

  // Keep the original embedded logo and reuse it in the report/cotization preview.
  html=html.replace(/function\s+reportHeader\s*\(\)\s*\{[\s\S]*?\}/,
    'function reportHeader(){const s=document.querySelector(\'.head .logo\')?.src||\'./logo.jpg\';return`<div class="report-brand"><img src="${s}" alt="Logo EDS"><div><h1>'+title+'</h1></div></div>`}'
  );

  // Fallback for already-rendered report markup.
  html=html.replace(/(<div class="report-brand">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/i,'$1'+title+'$2');
  html=html.replace(/(<div class="report-brand">[\s\S]*?<p>)[\s\S]*?(<\/p>)/i,'$1$2');

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