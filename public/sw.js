// Service Worker — кэширует приложение для офлайн-режима.
// Стратегия: stale-while-revalidate для статики, network-first для навигации.

const CACHE_VERSION = "schedule-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon-32.png",
  "/icon.svg",
  "/logo.svg",
];

// Установка: кэшируем базовые ассеты
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {
        // Если что-то не удалось закэшировать — не падаем
      })
  );
});

// Активация: удаляем старые кэши
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Перехват запросов
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Только GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Игнорируем запросы к другим источникам (аналитика и т.п.)
  if (url.origin !== self.location.origin) return;

  // Навигационные запросы (HTML-страницы): network-first с fallback на кэш
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Статика: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
