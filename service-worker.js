const CACHE_NAME='informe-eds-v10';
const APP_SHELL=['./','./index.html','./manifest.json','./logo.svg','./delete.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const accept=event.request.headers.get('accept')||'';
 if(event.request.mode==='navigate'||accept.includes('text/html')){
  event.respondWith(fetch(event.request).then(async response=>{
   const text=await response.text();
   const css='<style id="eds-v10">.head .logo{width:260px!important;height:auto!important;max-height:90px!important;object-fit:contain!important;background:#fff!important}.report-brand{display:grid!important;grid-template-columns:minmax(180px,260px) 1fr!important;align-items:center!important;gap:18px!important}.report-brand img{display:block!important;width:100%!important;max-width:260px!important;height:auto!important;max-height:110px!important;object-fit:contain!important}@media(max-width:600px){.head .logo{width:190px!important;max-height:70px!important}.report-brand{grid-template-columns:1fr!important;text-align:center!important}.report-brand img{max-width:240px!important;max-height:95px!important;margin:auto!important}.recent-item .delete-btn{display:inline-flex!important;visibility:visible!important;opacity:1!important}}</style>';
   const js='<script>(function(){const L="./logo.svg?v=10";function f(){document.querySelectorAll(".head .logo,.report-brand img").forEach(i=>{i.src=L;i.removeAttribute("srcset");i.alt="Mantenimiento Eléctrico y Mecánico de EDS"});document.querySelectorAll(".recent-item").forEach(item=>{const a=item.querySelector(".recent-actions");if(!a||a.querySelector(".delete-btn,.delete-saved"))return;const o=[...a.querySelectorAll("button")].find(b=>/openSaved/.test(b.getAttribute("onclick")||""));if(!o)return;const m=(o.getAttribute("onclick")||"").match(/openSaved\\([\"']([^\"']+)[\"'],\\s*(\\d+)\\)/);if(!m||typeof window.deleteSaved!=="function")return;const b=document.createElement("button");b.className="btn danger delete-btn";b.type="button";b.textContent="🗑️";b.title="Eliminar documento";b.onclick=()=>window.deleteSaved(m[1],Number(m[2]));a.appendChild(b)})}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",f);else f();window.addEventListener("load",f);new MutationObserver(f).observe(document.documentElement,{subtree:true,childList:true})})();</script>';
   const injected=text.replace('</head>',css+'</head>').replace('</body>',js+'</body>');
   const headers=new Headers(response.headers);headers.set('content-type','text/html; charset=utf-8');headers.delete('content-length');
   return new Response(injected,{status:response.status,statusText:response.statusText,headers});
  }).catch(()=>caches.match('./index.html')));return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));return r}).catch(()=>caches.match('./index.html'))));
});