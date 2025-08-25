const CACHE_NAME = 'settlement-calculator-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './settlement.html', // 추가
  './history.html',    // 추가
  './app.js',          // 추가
  'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// 서비스 워커를 설치하고 앱의 기본 파일들을 캐시에 저장합니다.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시가 열렸습니다.');
        return cache.addAll(urlsToCache);
      })
  );
});

// 오프라인 상태일 때 캐시에 저장된 데이터를 보여줍니다.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
