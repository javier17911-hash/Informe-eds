const CACHE_NAME='informe-eds-v12';
const APP_SHELL=['./','./index.html','./manifest.json','./delete.js','./logo.jpg'];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())
));

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const accept=event.request.headers.get('accept')||'';

  if(event.request.mode==='navigate'||accept.includes('text/html')){
    event.respondWith(
      fetch(event.request).then(async response=>{
        const text=await response.text();
        const oldHeader='function reportHeader(){return`<div class="report-brand"><img src="./logo.jpg" alt="Logo de Mantenimiento Eléctrico y Mecánico de EDS"><div><h1>Mantenimiento eléctrico y mecánico de EDS</h1><p>Informe de trabajo</p></div></div>`}';
        const newHeader='function reportHeader(){return`<div class="report-brand"><img src="./logo.jpg" alt="Logo EDS"><div><h1>INFORME DE TRABAJO</h1></div></div>`}';
        const modified=text.includes(oldHeader) ? text.replace(oldHeader,newHeader) : text;
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