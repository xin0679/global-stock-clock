// Service Worker for 全球股市时钟 PWA

const CACHE_NAME = 'stock-clock-v2';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json'
];

// 安装时缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 拦截请求，优先从缓存获取
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有，返回缓存
        if (response) {
          return response;
        }
        // 否则发起网络请求
        return fetch(event.request)
          .then((response) => {
            // 检查是否是有效的响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // 克隆响应（因为 response 只能使用一次）
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
      .catch(() => {
        // 如果网络请求失败，返回缓存中的首页
        return caches.match('./index.html');
      })
  );
});
