const CACHE_NAME = 'informe-eds-v5';
const APP_SHELL = ['./', './index.html', './manifest.json', './logo.svg', './delete.js'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const accept = event.request.headers.get('accept') || '';
  if (event.request.mode === 'navigate' || accept.includes('text/html')) {
    event.respondWith(
      fetch(event.request).then(async response => {
        const text = await response.text();
        const logoFix = '<style id="eds-logo-fix">.report-brand{gap:18px;align-items:center}.report-brand img{width:230px!important;height:auto!important;max-height:70px!important;object-fit:contain;flex:0 0 auto}.report-brand h1{font-size:24px}.report-brand p{font-size:13px}@media(max-width:600px){.report-brand{gap:10px}.report-brand img{width:165px!important;max-height:58px!important}.report-brand h1{font-size:21px}}</style>';
        const injected = text.replace('</head>', logoFix + '</head>').replace('</body>', '<script src="./delete.js?v=5"></script></body>');
        const headers = new Headers(response.headers);
        headers.set('content-type','text/html; charset=utf-8');
        headers.delete('content-length');
        return new Response(injected,{status:response.status,statusText:response.statusText,headers});
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});