// Service worker cho app "Quản lý cuộc sống"
// Mục đích: cache các file tĩnh để app mở được cả khi không có mạng,
// và để trình duyệt công nhận đây là PWA có thể "Cài đặt" trên điện thoại.
// Dữ liệu (localStorage) KHÔNG đi qua service worker này — service worker
// chỉ cache file HTML/CSS/JS/ảnh, không đụng đến dữ liệu người dùng.

const CACHE_NAME = "life-manager-cache-v1";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Chiến lược: network-first cho index.html (để luôn lấy bản mới nhất khi có
// mạng), fallback về cache khi mất mạng. Các file khác dùng cache-first.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isHtml = event.request.mode === "navigate" || url.pathname.endsWith("index.html") || url.pathname.endsWith("/");

  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
