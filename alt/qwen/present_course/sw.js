// Basic Service Worker for offline support
const CACHE_NAME = 'ai-playbook-v1';
const urlsToCache = [
    './',
    './main.html',
    './assets/css/variables.css',
    './assets/css/components.css',
    './assets/css/presentation.css',
    './assets/js/navigation.js',
    './assets/js/interactions.js',
    './assets/js/animations.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});