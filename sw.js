/**
 * Service Worker for ChessMind AI (PWA)
 * Aggressive Network-First Strategy Falling Back to Cache
 */

const CACHE_NAME = 'chessmind-pwa-v1';

const PRECACHE_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './engine.js',
    './engine-worker.js',
    './worker-pool.js',
    './vision.js',
    './favicon.svg',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching PWA App Shell...');
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW] Optional pre-cache item skipped:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Deleting obsolete cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Aggressive Network-First Strategy
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Ignore Gemini API calls so network errors are handled gracefully in app.js
    if (event.request.url.includes('generativelanguage.googleapis.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});
