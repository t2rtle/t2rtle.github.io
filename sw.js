/* Burger Clicker PWA Service Worker — update-aware cache */
const CACHE_PREFIX = "burger-clicker-";
const CACHE_NAME = "burger-clicker-v68";
const APP_SHELL = [
    "/", "/index.html", "/manifest.json", "/style.css",
    "/css/pets.css", "/css/tooltips.css", "/css/settings.css", "/css/navigation.css", "/css/welcome.css", "/css/glass-ui.css", "/css/info-pages.css", "/css/animations.css", "/css/pwa.css",
    "/js/info-language.js", "/js/game-i18n.js", "/js/core.js", "/js/systems.js", "/js/main.js", "/js/audio.js", "/js/audio-diagnostics.js", "/js/welcome.js", "/js/tooltips.js", "/js/settings.js", "/js/settings-compat.js",
    "/js/expansion-bridge.js", "/js/expansion.js", "/js/expansion-ui.js", "/js/statistics.js", "/js/statistics-accuracy.js",
    "/js/pwa.js", "/js/pwa-diagnostics.js", "/js/reset.js", "/js/navigation.js", "/js/content-expansion.js", "/js/animations.js",
    "/about.html", "/privacy.html", "/contact.html", "/media/background.jpg", "/media/art_1.png", "/media/art_2.png", "/media/pwa-icon.svg"
];

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await Promise.allSettled(APP_SHELL.map(async path => {
            try {
                const response = await fetch(path, { cache: "no-cache" });
                if (response.ok && response.type === "basic") await cache.put(path, response);
            } catch (error) {
                console.warn("[Burger Clicker PWA] Recurso não pré-cacheado:", path, error);
            }
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(names
            .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
            .map(name => caches.delete(name)));
        await self.clients.claim();
    })());
});

self.addEventListener("message", event => {
    if (event.data?.type === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
    if (event.data?.type === "CLEAR_APP_CACHE") {
        event.waitUntil(caches.keys().then(names => Promise.all(
            names.filter(name => name.startsWith(CACHE_PREFIX)).map(name => caches.delete(name))
        )));
    }
});

self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    if (request.mode === "navigate") {
        event.respondWith((async () => {
            try {
                const response = await fetch(request, { cache: "no-store" });
                if (response?.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put("/index.html", response.clone());
                }
                return response;
            } catch {
                const cache = await caches.open(CACHE_NAME);
                return await caches.match(request, { ignoreSearch: true }) || await cache.match("/index.html") || await cache.match("/") || new Response("Sem conexão. Conecte-se à internet e tente novamente.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
            }
        })());
        return;
    }

    const path = url.pathname.toLowerCase();
    if (path === "/media/music.mp3" || path === "/media/click.mp3") {
        event.respondWith(fetch(request, { cache: "no-store" }));
        return;
    }
    const codeAsset = path.endsWith(".js") || path.endsWith(".css") || path.endsWith(".json");
    if (codeAsset) {
        event.respondWith((async () => {
            try {
                const response = await fetch(request, { cache: "no-store" });
                if (response?.ok && response.type === "basic") {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(request, response.clone());
                }
                return response;
            } catch {
                return await caches.match(request) || new Response("", { status: 504, statusText: "Offline" });
            }
        })());
        return;
    }

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
            const response = await fetch(request);
            if (response?.ok && response.type === "basic") await cache.put(request, response.clone());
            return response;
        } catch {
            return new Response("", { status: 504, statusText: "Offline" });
        }
    })());
});
