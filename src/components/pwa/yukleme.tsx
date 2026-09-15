"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useYuklemeDurumu, yuklemeyiBaslat } from "@/lib/pwa";

/**
 * "Uygulamayı yükle" arayüzü:
 *   `UygulamaDaveti` — mobilde alttan çıkan, kapatılabilir şerit (yalnız site).
 *   `YukleDugmesi`   — menü / altbilgi / panel başlığındaki kalıcı düğme.
 *   `YuklemeTarifi`  — iPhone'da "Ana Ekrana Ekle" adımları.
 * Durum `@/lib/pwa` içinde; yükleme mümkün değilse (yüklü, Firefox…) hiçbiri görünmez.
 */

const KAPATMA_ANAHTARI = "sb-yukleme-kapatildi";
const KAPATMA_SURESI = 14 * 24 * 60 * 60 * 1000; // 2 hafta
const GECIKME = 6000;

function yakinZamandaKapatildi() {
  try {
    const t = Number(localStorage.getItem(KAPATMA_ANAHTARI));
    return Number.isFinite(t) && Date.now() - t < KAPATMA_SURESI;
  } catch {
    return false;
  }
}

function kapatildiIsaretle() {
  try {
    localStorage.setItem(KAPATMA_ANAHTARI, String(Date.now()));
  } catch {
    /* gizli sekme vb. — şerit bu oturumda yine kapanır */
  }
}

/** Yükleme eylemi: Chrome ailesinde pencere, iPhone'da tarif. */
function useYukleme() {
  const durum = useYuklemeDurumu();
  const [tarifAcik, setTarifAcik] = useState(false);
  const mumkun = durum === "tarayici" || durum === "ios";
  async function yukle() {
    if (durum === "ios") setTarifAcik(true);
    else if (durum === "tarayici") await yuklemeyiBaslat();
  }
  return { durum, mumkun, yukle, tarifAcik, tarifKapat: () => setTarifAcik(false) };
}

function useIstemcide() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function UygulamaDaveti() {
  const { durum, mumkun, yukle, tarifAcik, tarifKapat } = useYukleme();
  const [gorunur, setGorunur] = useState(false);
  const [kapandi, setKapandi] = useState(false);

  useEffect(() => {
    if (!mumkun || yakinZamandaKapatildi()) return;
    const z = setTimeout(() => setGorunur(true), GECIKME);
    return () => clearTimeout(z);
  }, [mumkun]);

  const kapat = () => {
    kapatildiIsaretle();
    setKapandi(true);
  };

  const acik = gorunur && mumkun && !kapandi;

  return (
    <>
      <div
        role="dialog"
        aria-label="Uygulamayı yükle"
        aria-hidden={!acik}
        inert={!acik}
        className={`fixed inset-x-3 z-[45] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:hidden ${
          acik ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
        style={{ bottom: "calc(68px + env(safe-area-inset-bottom) + 12px)" }}
      >
        <div className="yukleme-serit relative flex items-center gap-3 overflow-hidden rounded border border-brand-lite/40 bg-ink/95 p-3 pr-2 text-white shadow-[0_18px_40px_-12px_rgb(0_0_0/0.6),0_0_24px_-8px_rgb(74_222_128/0.5)] backdrop-blur">
          <Image
            src="/icons/site-192.png"
            alt=""
            width={48}
            height={48}
            unoptimized
            className="h-12 w-12 flex-none rounded-[12px]"
          />
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-data)] text-[15px] leading-tight font-bold tracking-wide uppercase">
              SahaBizim uygulaması
            </p>
            <p className="mt-0.5 text-[13px] leading-snug text-[#cfe0d5]">
              Ana ekrana ekle, fikstür ve puan durumu tek dokunuşta.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await yukle();
              if (durum !== "ios") kapat();
            }}
            className="btn-parla flex-none rounded-sm bg-brand px-3.5 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold tracking-wider text-white uppercase"
          >
            {durum === "ios" ? "Nasıl?" : "Yükle"}
          </button>
          <button
            type="button"
            onClick={kapat}
            aria-label="Daveti kapat"
            className="grid h-10 w-8 flex-none place-items-center text-xl leading-none text-muted-dark"
          >
            ×
          </button>
        </div>
      </div>
      {tarifAcik && <YuklemeTarifi kapat={() => { tarifKapat(); kapat(); }} />}
    </>
  );
}

/**
 * Kalıcı düğme. `gorunum`:
 *   "menu"     — mobil açılır menüde satır
 *   "altbilgi" — altbilgi bağlantısı
 *   "panel"    — yönetim başlığında küçük düğme
 */
export function YukleDugmesi({
  gorunum,
  panel = false,
  tiklaninca,
}: {
  gorunum: "menu" | "altbilgi" | "panel";
  panel?: boolean;
  tiklaninca?: () => void;
}) {
  const { mumkun, yukle, tarifAcik, tarifKapat } = useYukleme();
  const hazir = useIstemcide();
  if (!hazir || !mumkun) return null;

  const stil = {
    menu: "neon-satir flex w-full items-center gap-3 rounded-sm px-2 py-3 text-left font-[family-name:var(--font-data)] text-lg font-semibold tracking-wide text-brand-lite uppercase",
    altbilgi: "alt-link text-left",
    panel:
      "btn-cizgi rounded-sm border border-brand-lite/50 px-2.5 py-1.5 font-[family-name:var(--font-data)] text-xs tracking-wider text-brand-lite uppercase",
  }[gorunum];

  return (
    <>
      <button
        type="button"
        className={stil}
        onClick={async () => {
          tiklaninca?.();
          await yukle();
        }}
      >
        {gorunum === "menu" && <IndirSimgesi />}
        {gorunum === "panel" ? "Yükle" : "Uygulamayı yükle"}
      </button>
      {tarifAcik && <YuklemeTarifi kapat={tarifKapat} panel={panel} />}
    </>
  );
}

function IndirSimgesi() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-5 w-5 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M12 7.5v7M9 11.5l3 3 3-3M10 18.5h4" />
    </svg>
  );
}

function PaylasSimgesi() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="inline h-5 w-5 align-[-4px] text-[#5aa9ff]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

/** iPhone'da ana ekrana ekleme adımları — alttan açılan kart. */
export function YuklemeTarifi({ kapat, panel = false }: { kapat: () => void; panel?: boolean }) {
  useEffect(() => {
    const tus = (e: KeyboardEvent) => e.key === "Escape" && kapat();
    document.addEventListener("keydown", tus);
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tus);
      document.body.style.overflow = eski;
    };
  }, [kapat]);

  const adimlar = [
    <>
      Tarayıcının alt ya da üst çubuğundaki <strong>Paylaş</strong> simgesine dokun <PaylasSimgesi />
    </>,
    <>
      Açılan listeyi kaydırıp <strong>“Ana Ekrana Ekle”</strong>yi seç
    </>,
    <>
      Sağ üstteki <strong>Ekle</strong>ye dokun — {panel ? "SahaBizim Yönetim" : "SahaBizim"} simgesi ana
      ekranında belirir
    </>,
  ];

  return createPortal(
    <div
      className="pencere-zemin fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-3 backdrop-blur-[2px] sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && kapat()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ana ekrana ekleme adımları"
        className="pencere-kutu w-full max-w-md rounded border border-brand-lite/30 bg-ink p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-white"
      >
        <div className="flex items-center gap-3">
          <Image
            src={panel ? "/icons/admin-192.png" : "/icons/site-192.png"}
            alt=""
            width={48}
            height={48}
            unoptimized
            className="h-12 w-12 rounded-[12px]"
          />
          <div className="min-w-0 flex-1">
            <p className="display text-2xl">
              Ana ekrana <span className="text-brand-lite">ekle</span>
            </p>
            <p className="text-[13px] text-muted-dark">iPhone ve iPad · 3 adım</p>
          </div>
          <button
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="grid h-11 w-11 place-items-center text-2xl leading-none text-muted-dark"
          >
            ×
          </button>
        </div>
        <ol className="mt-4 grid gap-2.5">
          {adimlar.map((a, i) => (
            <li key={i} className="flex items-start gap-3 rounded-sm bg-white/[0.05] p-3 text-[15px] leading-snug text-[#dcebe0]">
              <span className="display grid h-7 w-7 flex-none place-items-center rounded-full bg-brand/25 text-base text-brand-lite">
                {i + 1}
              </span>
              <span className="pt-0.5">{a}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[12.5px] text-muted-dark">
          Chrome veya başka bir tarayıcıdaysan da aynı Paylaş menüsünü kullanabilirsin.
        </p>
      </div>
    </div>,
    document.body,
  );
}
