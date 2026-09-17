const CACHE_NAME='informe-eds-v32-logo-fixed';

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

function forceHeader(html){
  const service='SERVICIOS TÉCNICOS DE ESTACIONES';
  const title='INFORME DE TRABAJO Y/O COTIZACION';

  // Solo cambiar los textos del encabezado principal. La imagen del logo se conserva.
  html=html.replace(
    /(<header class="head">[\s\S]*?<div class="brand-kicker">)[\s\S]*?(<\/div>)/i,
    '$1'+service+'$2'
  );
  html=html.replace(/(<img id="headLogo" class="logo" src=")[^"]+(")/i, '$1./logo.jpg?v=20260917-2$2');
  html=html.replace(
    /(<header class="head">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/i,
    '$1'+title+'$2'
  );
  html=html.replace(
    /(<header class="head">[\s\S]*?<p>)[\s\S]*?(<\/p>)/i,
    '$1$2'
  );

  const css=`<style id="eds-v31">
/* Encabezado principal: logo intacto, más legible y sin deformación */
.head>div{flex:1 1 auto!important;text-align:center!important;min-width:0!important}
.head .logo{width:230px!important;height:90px!important;object-fit:contain!important;padding:2px!important;flex:0 0 auto!important}
.head .brand-kicker,.head h1,.head p{width:100%!important;text-align:center!important}
/* Encabezado del informe: mismo logo y textos centrados */
.report-brand{display:flex!important;align-items:center!important;gap:18px!important}
.report-brand img{width:220px!important;height:90px!important;object-fit:contain!important;padding:2px!important;flex:0 0 auto!important}
.report-brand>div{flex:1 1 auto!important;text-align:center!important;min-width:0!important}
.report-brand .report-kicker{margin:0 0 6px!important;font-size:13px!important;font-weight:700!important;text-transform:uppercase!important;letter-spacing:.4px!important;color:#475467!important}
.report-brand h1{margin:0!important;color:#0b5cff!important;font-size:23px!important;line-height:1.2!important;text-align:center!important}
.report-brand p{display:none!important}
@media(max-width:600px){
  .head .logo{width:165px!important;height:68px!important}
  .head{gap:10px!important}
  .head h1{font-size:18px!important}
  .report-brand{gap:10px!important}
  .report-brand img{width:150px!important;height:68px!important}
  .report-brand h1{font-size:18px!important}
}
</style>`;

  const patch=`<script id="eds-report-v31">
reportHeader=function(){
  const logo=(document.getElementById('headLogo')||{}).src||'';
  return '<div class="report-brand"><img src="'+logo+'" alt="Logo de Mantenimiento Eléctrico y Mecánico de EDS"><div><div class="report-kicker">SERVICIOS TÉCNICOS DE ESTACIONES</div><h1>INFORME DE TRABAJO Y/O COTIZACION</h1></div></div>';
};
</script>`;

  if(!html.includes('id="eds-v31"')) html=html.replace('</head>',css+'</head>');
  if(!html.includes('id="eds-report-v31"')) html=html.replace('</body>',patch+'</body>');
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