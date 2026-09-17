const CACHE_NAME='informe-eds-v20';
const APP_SHELL=['./','./index.html','./manifest.json','./delete.js'];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE_NAME).then(()=>self.skipWaiting())
));

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

function forceHeader(html){
  const title='INFORME DE TRABAJO Y/O COTIZACION';

  // Remove old wording from normal HTML text/attributes.
  html=html.replace(/Mantenimiento eléctrico y mecánico de EDS/gi,title);
  html=html.replace(/Mantenimiento electrico y mecanico de EDS/gi,title);

  // Capture the original embedded logo source from index.html.
  const headMatch=html.match(/<header class="head">([\s\S]*?)<\/header>/i);
  let logoSrc='./logo.jpg';
  if(headMatch){
    const m=headMatch[1].match(/<img[^>]*class="logo"[^>]*src="([^"]+)"[^>]*>/i) || headMatch[1].match(/<img[^>]*src="([^"]+)"[^>]*class="logo"[^>]*>/i);
    if(m) logoSrc=m[1];
  }

  // Show only the left pictorial portion of the original horizontal logo.
  const mainLogo='<div class="logo-crop"><img src="'+logoSrc+'" alt="Logo EDS"></div>';
  if(headMatch){
    html=html.replace(/<header class="head">[\s\S]*?<\/header>/i,
      '<header class="head">'+mainLogo+'<div><h1>'+title+'</h1></div></header>'
    );
  }

  // Report/cotization header uses the same cropped original logo.
  html=html.replace(/function\s+reportHeader\s*\(\)\s*\{[\s\S]*?\n\}/,
    'function reportHeader(){return`<div class="report-brand"><div class="logo-crop report-logo"><img src="'+logoSrc+'" alt="Logo EDS"></div><div><h1>'+title+'</h1></div></div>`}'
  );

  // Fallback for older rendered report markup.
  html=html.replace(/(<div class="report-brand">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/i,'$1'+title+'$2');

  const css=`<style id="eds-v20">
.logo-crop{position:relative;overflow:hidden;flex:0 0 auto;width:125px;height:88px;background:#fff;border-radius:10px;padding:0;display:flex;align-items:center;justify-content:flex-start}
.logo-crop img{display:block!important;width:220px!important;height:88px!important;max-width:none!important;object-fit:fill!important;object-position:left center!important;flex:0 0 auto!important}
.head h1{margin:0!important;color:#fff!important;font-size:25px!important;line-height:1.15!important}
.report-brand{display:flex!important;align-items:center!important;gap:18px!important;border-bottom:3px solid #0b5cff!important;padding:0 0 13px!important;margin-bottom:18px!important}
.report-logo{width:125px;height:78px;border:1px solid #eee;border-radius:8px}
.report-logo img{width:195px!important;height:78px!important}
.report-brand h1{margin:0!important;color:#0b5cff!important;font-size:22px!important;line-height:1.2!important}
@media(max-width:600px){.head{align-items:center!important}.logo-crop{width:100px;height:72px}.logo-crop img{width:180px!important;height:72px!important}.head h1{font-size:20px!important}.report-brand{gap:12px!important}.report-logo{width:105px;height:66px}.report-logo img{width:165px!important;height:66px!important}.report-brand h1{font-size:19px!important}}
</style>`;
  if(!html.includes('id="eds-v20"')) html=html.replace('</head>',css+'</head>');
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