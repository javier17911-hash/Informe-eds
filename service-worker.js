const CACHE_NAME='informe-eds-v17';
const APP_SHELL=['./','./index.html','./manifest.json','./delete.js'];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE_NAME).then(()=>self.skipWaiting())
));

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

function forceHeader(html){
  const title='INFORME DE TRABAJO Y/O COTIZACION';

  // Keep the original embedded logo already present in index.html.
  // Do not replace its src with logo.jpg.

  // Remove any old wording from visible HTML text/attributes.
  html=html.replace(/Mantenimiento eléctrico y mecánico de EDS/gi,title);
  html=html.replace(/Mantenimiento electrico y mecanico de EDS/gi,title);

  // Replace the complete app header but preserve the existing logo source.
  const headMatch=html.match(/<header class="head">([\s\S]*?)<\/header>/i);
  if(headMatch){
    const logoMatch=headMatch[1].match(/<img[^>]*class="logo"[^>]*src="([^"]+)"[^>]*>/i) || headMatch[1].match(/<img[^>]*src="([^"]+)"[^>]*class="logo"[^>]*>/i);
    const logoSrc=logoMatch?logoMatch[1]:'./logo.jpg';
    html=html.replace(/<header class="head">[\s\S]*?<\/header>/i,
      '<header class="head"><img class="logo" src="'+logoSrc+'" alt="Logo EDS"><div><h1>'+title+'</h1></div></header>'
    );
  }

  // Replace reportHeader() and reuse the same embedded logo source from the main header.
  html=html.replace(/function\s+reportHeader\s*\(\)\s*\{return`[\s\S]*?`\}/,
    'function reportHeader(){const s=document.querySelector(\'.head .logo\')?.getAttribute(\'src\')||\'./logo.jpg\';return`<div class="report-brand"><img src="${s}" alt="Logo EDS"><div><h1>'+title+'</h1></div></div>`}'
  );

  // Fallback for older report markup.
  html=html.replace(/(<div class="report-brand">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/i,'$1'+title+'$2');
  html=html.replace(/(<div class="report-brand">[\s\S]*?<p>)[\s\S]*?(<\/p>)/i,'$1$2');

  const css=`<style id="eds-v17">
.head .logo{width:auto!important;max-width:230px!important;height:88px!important;max-height:88px!important;object-fit:contain!important;background:#fff!important;padding:4px!important;border-radius:10px!important;display:block!important}
.head h1{margin:0!important;color:#fff!important;font-size:25px!important;line-height:1.15!important}
.report-brand{display:flex!important;align-items:center!important;gap:18px!important;border-bottom:3px solid #0b5cff!important;padding:0 0 13px!important;margin-bottom:18px!important}
.report-brand img{display:block!important;width:auto!important;max-width:170px!important;height:78px!important;max-height:78px!important;object-fit:contain!important;background:#fff!important;padding:3px!important;border-radius:8px!important;flex:0 0 auto!important}
.report-brand h1{margin:0!important;color:#0b5cff!important;font-size:22px!important;line-height:1.2!important}
@media(max-width:600px){.head .logo{max-width:180px!important;height:72px!important;max-height:72px!important}.head h1{font-size:20px!important}.report-brand{gap:12px!important}.report-brand img{max-width:125px!important;height:68px!important;max-height:68px!important}.report-brand h1{font-size:19px!important}}
</style>`;
  if(!html.includes('id="eds-v17"')) html=html.replace('</head>',css+'</head>');
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