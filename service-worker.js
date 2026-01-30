const CACHE_NAME = 'spanish-learning-v1.0.10'; // index.html更新(三星手機自動用雲端TTS)
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@600;700&family=Montserrat:wght@400;500;600;700;800&display=swap'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {

  // 🔥🔥🔥 【通用型防禦代碼】開始 🔥🔥🔥
  
  // 1. 取得這個 Service Worker 的管轄範圍 (例如: https://.../spanish-app/)
  const scope = self.registration.scope;
  
  // 2. 智慧判斷邏輯：
  //    如果請求的網址「不是」以 Scope 開頭 (代表是去別的 Repo，如 /kidney-health/)
  //    且「不是」我們允許的外部資源 (如 Google Fonts)
  //    -> 那就不關我的事，直接 return，讓瀏覽器自己去連線，不攔截！
  if (!event.request.url.startsWith(scope) && !event.request.url.includes('fonts.googleapis.com')) {
    return; 
  }
  
  // 🔥🔥🔥 【通用型防禦代碼】結束 🔥🔥🔥


  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // If fetch fails, return offline page (you can create one)
          return caches.match('./index.html');
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
