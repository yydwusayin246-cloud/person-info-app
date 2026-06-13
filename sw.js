// Service Worker - 自动更新版
var CACHE_NAME = 'person-info-app-v2-' + Date.now();
var urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

// 安装 - 预缓存核心文件，完成后立即激活
self.addEventListener('install', function(event) {
  console.log('[SW] 安装新版本...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.all(
        urlsToCache.map(function(url) {
          return fetch(url, { cache: 'no-cache' }).then(function(response) {
            if (response.ok) cache.put(url, response.clone());
            return response;
          }).catch(function() {});
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 激活 - 清理旧缓存，通知客户端更新
self.addEventListener('activate', function(event) {
  console.log('[SW] 激活新版本...');
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME) {
            console.log('[SW] 删除旧缓存:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      return self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'UPDATE_READY' });
        });
      });
    })
  );
});

// 请求拦截
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  // HTML：网络优先（确保总是最新版本）
  if (event.request.destination === 'document' || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        var cloned = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, cloned);
        });
        return response;
      }).catch(function() {
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
  }

  // JS/CSS 等：缓存优先 + 后台静默更新
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var fetchPromise = fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.ok) {
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(function() {});

      return cached || fetchPromise;
    })
  );
});
