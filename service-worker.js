const CACHE_NAME='informe-eds-v26';

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

function forceHeader(html){
  const service='SERVICIOS TÉCNICOS DE ESTACIONES';
  const title='INFORME DE TRABAJO Y/O COTIZACION';

  // NO modifica el bloque del logo ni su CSS. Solo cambia textos existentes.
  html=html.replace(/Mantenimiento eléctrico y mecánico de EDS/gi, service);
  html=html.replace(/Mantenimiento electrico y mecanico de EDS/gi, service);
  html=html.replace(/Servicios técnicos en estaciones de servicio/gi, service);
  html=html.replace(/Servicios tecnicos en estaciones de servicio/gi, service);
  html=html.replace(/Informes de trabajo y cotizaciones/gi, '');
  html=html.replace(/Informes de trabajo y cotizaciones/gi, title);

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