/*
 * SahaBizim — service worker (uygulama olarak yükleme + çevrimdışı)
 *
 * NE YAPAR
 *   Sayfalar   → AĞ ÖNCE. İnternet varsa her zaman canlı sayfa gelir ve bir
 *                kopyası saklanır. İnternet yoksa son saklanan kopya açılır;
 *                sayfanın <head>'ine "sb-onbellek" işareti eklenir, sitedeki
 *                `CevrimdisiSeridi` bunu görüp "veriler eski olabilir" uyarısı basar.
 *                Hiç kopya yoksa /cevrimdisi.html.
 *   Yönetim    → /admin sayfaları SAKLANMAZ. Panel canlı veriyle çalışır;
 *                eski bir kopya üzerinde skor girmek tehlikeli olurdu.
 *   /api, POST → Hiç dokunulmaz.
 *   _next/static → ÖNBELLEK ÖNCE (dosya adları içerik özetli, değişmez).
 *   Görseller  → Önbellekten hemen ver, arkada tazele.
 *
 * Başka sitelere (Supabase vb.) giden istekler hiç yakalanmaz.
 *
 * SÜRÜM: davranış değişince SURUM'ü artır; eski önbellekler silinir.
 */
const SURUM = "v1";
const SAYFALAR = `sb-sayfalar-${SURUM}`;
const STATIK = `sb-statik-${SURUM}`;
const GORSEL = `sb-gorsel-${SURUM}`;
const CEVRIMDISI = "/cevrimdisi.html";

const SAYFA_SINIRI = 40;
const GORSEL_SINIRI = 120;

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(STATIK);
      await c.addAll([CEVRIMDISI, "/images/logo-kucuk.png", "/icons/site-192.png"]);
      // Anasayfayı da peşin sakla (başarısız olursa kurulum yine sürsün).
      try {
        const yanit = await fetch("/", { credentials: "same-origin" });
        if (yanit.ok) await sayfaSakla(new Request("/"), yanit);
      } catch {}
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const gecerli = new Set([SAYFALAR, STATIK, GORSEL]);
      for (const ad of await caches.keys()) {
        if (ad.startsWith("sb-") && !gecerli.has(ad)) await caches.delete(ad);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (e) => {
  const istek = e.request;
  if (istek.method !== "GET") return;
  const url = new URL(istek.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (istek.mode === "navigate") {
    e.respondWith(sayfa(istek, url));
    return;
  }

  // RSC (sayfa geçişi verisi) saklanmıyor: bayat veri karışmasın.
  if (istek.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(onbellekOnce(istek));
    return;
  }
  if (
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/")
  ) {
    e.respondWith(arkadaTazele(istek, e));
  }
});

async function sayfa(istek, url) {
  const panel = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
  try {
    const yanit = await fetch(istek);
    if (!panel && yanit.ok && yanit.type === "basic") {
      sayfaSakla(istek, yanit.clone()).catch(() => {});
    }
    return yanit;
  } catch {
    if (!panel) {
      const kopya = await caches.match(istek, { cacheName: SAYFALAR });
      if (kopya) return isaretle(kopya);
    }
    return (await caches.match(CEVRIMDISI)) || new Response("Çevrimdışı", { status: 503 });
  }
}

/** Kopyayı kaydedildiği zamanla birlikte sakla; sınır aşılırsa en eskiyi at. */
async function sayfaSakla(istek, yanit) {
  const govde = await yanit.blob();
  const basliklar = new Headers(yanit.headers);
  basliklar.set("x-sb-kaydedildi", String(Date.now()));
  const c = await caches.open(SAYFALAR);
  await c.put(istek, new Response(govde, { status: 200, headers: basliklar }));
  const anahtarlar = await c.keys();
  for (let i = 0; i < anahtarlar.length - SAYFA_SINIRI; i++) await c.delete(anahtarlar[i]);
}

/** Saklanan sayfaya "bu bir kopya" işareti ekle. */
async function isaretle(kopya) {
  const zaman = kopya.headers.get("x-sb-kaydedildi") || "";
  const html = await kopya.text();
  const isaret = `<meta name="sb-onbellek" content="${zaman}">`;
  const yeni = html.includes("<head>") ? html.replace("<head>", `<head>${isaret}`) : isaret + html;
  const basliklar = new Headers(kopya.headers);
  basliklar.set("content-type", "text/html; charset=utf-8");
  return new Response(yeni, { status: 200, headers: basliklar });
}

async function onbellekOnce(istek) {
  const c = await caches.open(STATIK);
  const var_ = await c.match(istek);
  if (var_) return var_;
  const yanit = await fetch(istek);
  if (yanit.ok) c.put(istek, yanit.clone()).catch(() => {});
  return yanit;
}

async function arkadaTazele(istek, olay) {
  const c = await caches.open(GORSEL);
  const var_ = await c.match(istek);
  const tazele = fetch(istek)
    .then(async (yanit) => {
      if (yanit.ok) {
        await c.put(istek, yanit.clone());
        const anahtarlar = await c.keys();
        for (let i = 0; i < anahtarlar.length - GORSEL_SINIRI; i++) await c.delete(anahtarlar[i]);
      }
      return yanit;
    })
    .catch(() => var_);
  if (var_) {
    olay.waitUntil(tazele);
    return var_;
  }
  return tazele.then((y) => y || new Response("", { status: 504 }));
}
