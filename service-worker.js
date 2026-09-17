const CACHE_NAME = 'informe-eds-v8';
const APP_SHELL = ['./', './index.html', './manifest.json', './logo.svg', './delete.js'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const accept = event.request.headers.get('accept') || '';

  if (event.request.mode === 'navigate' || accept.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(async response => {
          const text = await response.text();
          const fix = `<style id="eds-ui-fix">
.report-brand{display:grid!important;grid-template-columns:minmax(180px,260px) 1fr!important;align-items:center!important;gap:18px!important;border-bottom:3px solid #0b5cff!important;padding-bottom:12px!important;margin-bottom:18px!important}
.report-brand img{display:block!important;width:100%!important;max-width:260px!important;height:auto!important;max-height:110px!important;object-fit:contain!important;justify-self:start!important}
.head .logo{width:260px!important;height:78px!important;object-fit:contain!important;background:#fff!important}
.delete-btn,.delete-saved{display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;min-width:44px!important}
@media(max-width:600px){.report-brand{grid-template-columns:1fr!important;text-align:center!important}.report-brand img{max-width:240px!important;max-height:90px!important;justify-self:center!important}.head .logo{width:190px!important;height:64px!important}}
</style>`;

          const script = `<script>(function(){
function applyLogo(){
  const headerLogo=document.querySelector('.head .logo');
  if(!headerLogo || !headerLogo.src)return;
  document.querySelectorAll('.report-brand img').forEach(img=>{
    if(img.src!==headerLogo.src){img.src=headerLogo.src;img.removeAttribute('srcset');}
    img.alt='Logo Mantenimiento Eléctrico y Mecánico de EDS';
  });
}
function restoreDeleteButtons(){
  document.querySelectorAll('.recent-item').forEach(item=>{
    const actions=item.querySelector('.recent-actions');
    if(!actions || actions.querySelector('.delete-btn,.delete-saved'))return;
    const open=[...actions.querySelectorAll('button')].find(b=>/openSaved/.test(b.getAttribute('onclick')||''));
    if(!open)return;
    const m=(open.getAttribute('onclick')||'').match(/openSaved\\(['\"]([^'\"]+)['\"],\\s*(\\d+)\\)/);
    if(!m)return;
    const b=document.createElement('button');
    b.className='btn danger delete-btn';b.type='button';b.textContent='🗑️';b.title='Eliminar documento';
    b.addEventListener('click',function(){if(typeof window.deleteSaved==='function')window.deleteSaved(m[1],Number(m[2]));});
    actions.appendChild(b);
  });
}
function fix(){applyLogo();restoreDeleteButtons();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix);else fix();
window.addEventListener('load',fix);
new MutationObserver(fix).observe(document.documentElement,{subtree:true,childList:true});
})();</script>`;

          const injected = text
            .replace('</head>', fix + '</head>')
            .replace('</body>', '<script src="./delete.js?v=8"></script>' + script + '</body>');

          const headers = new Headers(response.headers);
          headers.set('content-type','text/html; charset=utf-8');
          headers.delete('content-length');
          return new Response(injected,{status:response.status,statusText:response.statusText,headers});
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match('./index.html'))
    )
  );
});