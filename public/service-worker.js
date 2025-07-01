// This is a basic, no-op service worker that allows the app to be installed.

self.addEventListener('install', event => {
  console.log('Service worker installing...');
  // Immediately activate the new service worker.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service worker activating.');
});

// A basic fetch handler to make the app installable.
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
