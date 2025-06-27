const CACHE_NAME = 'habitflow-cache-v2'; // Increment cache version
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './dom.js',
    './state.js',
    './ui.js',
    './gamification.js',
    './handlers.js',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js',
    'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/plugin/isoWeek.js',
    'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/plugin/customParseFormat.js',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    './badge_5_habits.png',
    './badge_7_day_streak.png',
    './badge_locked.png',
    './welcome_illustration.png',
    './settings_icon.png',
    './calendar_icon.png',
    './progress_icon.png',
    './home_icon.png',
    './badge_perfect_month.png',
    './icon-192.png',
    './icon-512.png',
    './Banner-image.jpg'
];

// Install event: cache all essential assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                // Use addAll to fetch and cache all assets. If any fetch fails, the install fails.
                return cache.addAll(ASSETS_TO_CACHE).catch(error => {
                    console.error('Failed to cache one or more resources:', error);
                    // It's crucial to see which resource failed.
                    // Let's try to cache them individually to debug.
                    ASSETS_TO_CACHE.forEach(asset => {
                        cache.add(asset).catch(err => {
                            console.error(`Failed to cache: ${asset}`, err);
                        });
                    });
                });
            })
    );
});

// Fetch event: serve assets from cache first (Cache-First strategy)
self.addEventListener('fetch', event => {
    // We only want to handle GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response from cache
                if (response) {
                    return response;
                }

                // Not in cache - fetch from network
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                           // For third-party resources, we can't always check the type or status, so let's be more lenient
                           if (!networkResponse || networkResponse.status !== 200) {
                                return networkResponse;
                           }
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                );
            }).catch(error => {
                console.error("Error in fetch handler:", error);
                // You could return a fallback offline page here if you have one.
            })
    );
});

// Activate event: clean up old caches
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
});