"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

/**
 * Service worker kaydı + çevrimdışı uyarı şeridi. Kök layout'ta, her sayfada.
 *
 * Kayıt yalnız canlı derlemede: geliştirmede önbellek, yapılan değişikliği
 * gizleyip "kod çalışmıyor" yanılgısına sokar.
 */
export function PwaKaydi() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const kaydet = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") kaydet();
    else window.addEventListener("load", kaydet, { once: true });
  }, []);

  return <CevrimdisiSeridi />;
}

function kopyaZamaniOku(): number | null {
  const isaret = document.querySelector<HTMLMetaElement>('meta[name="sb-onbellek"]');
  if (!isaret) return null;
  const zaman = Number(isaret.content);
  return Number.isFinite(zaman) && zaman > 0 ? zaman : 0;
}

function cevrimiciAbone(d: () => void) {
  window.addEventListener("online", d);
  window.addEventListener("offline", d);
  return () => {
    window.removeEventListener("online", d);
    window.removeEventListener("offline", d);
  };
}

/**
 * İki durumda görünür:
 *   1) Cihaz çevrimdışı.
 *   2) Sayfa, service worker'ın sakladığı KOPYADAN açılmış (`sb-onbellek` işareti).
 * Kopyadan açılan sayfada skorlar eski olabilir; ziyaretçi güncel sanmasın
 * (13.09.2026 "donmuş rakamlar" dersinin çevrimdışı karşılığı).
 */
function CevrimdisiSeridi() {
  const yol = usePathname();
  const cevrimici = useSyncExternalStore(
    cevrimiciAbone,
    () => navigator.onLine,
    () => true,
  );
  // İşaret sayfa açılırken bir kez konuyor, sonradan değişmiyor — abonelik gerekmez.
  const kopyaZamani = useSyncExternalStore(
    () => () => {},
    kopyaZamaniOku,
    () => null,
  );

  if (cevrimici && kopyaZamani === null) return null;

  const panel = yol.startsWith("/admin");
  const zamanYazisi =
    kopyaZamani && kopyaZamani > 0
      ? new Date(kopyaZamani).toLocaleString("tr-TR", {
          timeZone: "Europe/Istanbul",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div
      role="status"
      // Sitede altta (mobilde alt çubuğun hemen üstünde): üstte yapışkan menüyü örtüyordu.
      // Panelde başlık yapışkan değil, orada üstte duruyor.
      style={panel ? undefined : { bottom: "var(--serit-alt)" }}
      className={`fixed inset-x-0 z-[70] border-gold/60 bg-[#2a2109]/95 px-4 py-2 text-center font-[family-name:var(--font-data)] text-[13px] font-semibold tracking-wide text-[#f2e7c4] backdrop-blur ${
        panel
          ? "top-0 border-b pt-[max(0.5rem,env(safe-area-inset-top))]"
          : "border-y [--serit-alt:calc(68px+env(safe-area-inset-bottom))] lg:[--serit-alt:0px]"
      }`}
    >
      <span aria-hidden className="canli-nokta mr-2 inline-block h-2 w-2 rounded-full bg-gold align-middle" />
      {panel
        ? "Çevrimdışısın — bağlantı gelene kadar kayıt yapılamaz."
        : kopyaZamani !== null
          ? `${cevrimici ? "Kaydedilmiş kopya" : "Çevrimdışı"} · Bu sayfa ${zamanYazisi ?? "daha önce"} kaydedildi, skorlar eski olabilir.`
          : "Çevrimdışısın · Gördüğün bilgiler eski olabilir."}
      {cevrimici && kopyaZamani !== null && (
        <button
          type="button"
          onClick={() => location.reload()}
          className="ml-3 rounded-sm border border-gold/60 px-2 py-0.5 text-[12px] uppercase tracking-wider text-gold"
        >
          Yenile
        </button>
      )}
    </div>
  );
}
