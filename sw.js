self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open('marsig').then(function (cache) {
            return cache.addAll([
                './',
                './index.html',
                './style.css',
                './main.js',
                './Symbola.ttf',
            ]);
        })
    );
});

self.addEventListener('fetch', function(e) {
    e.respondWith(
        caches.match(e.request).then(function (response) {
            return response || fetch(e.request);
        })
    );
});
