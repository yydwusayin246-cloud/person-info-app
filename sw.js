// Service Worker - 处理离线缓存和后台服务
const CACHE_NAME = 'person-info-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

// 安装 Service Worker - 缓存所有资源
self.addEventListener('install', event => {
  console.log('📦 开始缓存应用文件...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 缓存已创建，开始添加文件...');
        
        // 逐个缓存文件
        return Promise.all(
          urlsToCache.map((url, index) => {
            return fetch(url)
              .then(response => {
                cache.put(url, response.clone());
                
                // 计算进度
                const progress = Math.round((index + 1) / urlsToCache.length * 100);
                
                // 发送进度消息到客户端
                self.clients.matchAll().then(clients => {
                  clients.forEach(client => {
                    client.postMessage({
                      type: 'CACHE_PROGRESS',
                      progress: progress,
                      file: url,
                      total: urlsToCache.length,
                      current: index + 1
                    });
                  });
                });
                
                console.log(`✅ 已缓存: ${url} (${progress}%)`);
                return response;
              })
              .catch(err => {
                console.log(`⚠️ 缓存失败: ${url}`, err);
                // 即使某个文件失败也继续
                return Promise.resolve();
              });
          })
        );
      })
      .then(() => {
        console.log('✅ 所有文件已缓存完成！');
        
        // 通知客户端缓存完成
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'CACHE_COMPLETE',
              message: '应用已完全缓存到手机，现在可以离线使用！'
            });
          });
        });
      })
      .catch(err => {
        console.log('⚠️ 缓存错误:', err);
      })
  );
  
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  console.log('🔄 激活 Service Worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 处理网络请求 - 离线优先策略
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有，立即返回（离线优先）
        if (response) {
          console.log('✅ 从缓存返回:', event.request.url);
          
          // 同时尝试从网络更新缓存（后台更新）
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, networkResponse);
                    console.log('🔄 后台更新:', event.request.url);
                  });
              }
            })
            .catch(err => {
              console.log('📴 离线模式，无法更新:', event.request.url);
            });
          
          return response;
        }

        // 缓存中没有，尝试从网络获取
        return fetch(event.request)
          .then(response => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // 克隆响应并添加到缓存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('💾 添加到缓存:', event.request.url);
              });

            return response;
          })
          .catch(err => {
            console.log('📴 离线模式 - 无法获取:', event.request.url);
            // 返回缓存中的内容，如果没有则返回离线页面
            return caches.match('/index.html');
          });
      })
  );
});

// 监听推送通知
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || '你有新的通知',
    icon: '/manifest.json',
    badge: '/manifest.json'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '人员管理系统', options)
  );
});
