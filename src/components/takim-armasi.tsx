"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Takım sayfası başlığındaki arma. Dokununca armanın büyük hâli, logonun hemen
 * altında küçük bir kart olarak açılır — tam ekran görüntüleyici değil.
 *
 * Kart `document.body`'ye portal ile basılıyor: başlık bölümü `overflow-hidden`
 * olduğu için içinde açılsaydı kırpılırdı. Konum logonun ekrandaki yerinden
 * hesaplanıyor; altta yer yoksa üstte açılır, ekran kenarından taşmaz.
 *
 * Kapatma: çarpı, Esc, kartın dışına dokunmak. Kapanınca odak logoya döner.
 */

const KART_EN = 280;
const KENAR = 16;
const ARA = 12;

type Konum = { top: number; left: number; en: number; yukari: boolean };

export function TakimArmasi({ url, ad }: { url: string; ad: string }) {
  const [acik, setAcik] = useState(false);
  const [gorunur, setGorunur] = useState(false);
  const [konum, setKonum] = useState<Konum | null>(null);
  const dugme = useRef<HTMLButtonElement>(null);
  const kart = useRef<HTMLDivElement>(null);
  const kapatDugmesi = useRef<HTMLButtonElement>(null);

  const yerlestir = useCallback(() => {
    const d = dugme.current;
    if (!d) return;
    const r = d.getBoundingClientRect();
    const en = Math.min(KART_EN, window.innerWidth - KENAR * 2);
    // Kart kare arma + ad satırı; yüksekliği yaklaşık en + 64.
    const boy = kart.current?.offsetHeight ?? en + 64;
    const left = Math.min(Math.max(r.left, KENAR), window.innerWidth - en - KENAR);
    const altaSigar = r.bottom + ARA + boy <= window.innerHeight - KENAR;
    const yukari = !altaSigar && r.top - ARA - boy >= KENAR;
    setKonum({ top: yukari ? r.top - ARA - boy : r.bottom + ARA, left, en, yukari });
  }, []);

  const kapat = useCallback(() => {
    setGorunur(false);
    setAcik(false);
    dugme.current?.focus();
  }, []);

  // Açılışta konumu boyamadan önce hesapla; ardından giriş animasyonu.
  useLayoutEffect(() => {
    if (!acik) return;
    yerlestir();
    const kare = requestAnimationFrame(() => {
      yerlestir(); // kartın gerçek yüksekliğiyle bir kez daha
      setGorunur(true);
      kapatDugmesi.current?.focus();
    });
    return () => cancelAnimationFrame(kare);
  }, [acik, yerlestir]);

  useEffect(() => {
    if (!acik) return;
    const tus = (e: KeyboardEvent) => e.key === "Escape" && kapat();
    const disari = (e: PointerEvent) => {
      const hedef = e.target as Node;
      if (kart.current?.contains(hedef) || dugme.current?.contains(hedef)) return;
      kapat();
    };
    document.addEventListener("keydown", tus);
    document.addEventListener("pointerdown", disari);
    window.addEventListener("resize", yerlestir);
    window.addEventListener("scroll", yerlestir, { passive: true });
    return () => {
      document.removeEventListener("keydown", tus);
      document.removeEventListener("pointerdown", disari);
      window.removeEventListener("resize", yerlestir);
      window.removeEventListener("scroll", yerlestir);
    };
  }, [acik, kapat, yerlestir]);

  return (
    <>
      <button
        ref={dugme}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={acik}
        aria-label={`${ad} armasını büyüt`}
        onClick={() => (acik ? kapat() : setAcik(true))}
        className="group relative grid h-24 w-24 flex-none cursor-zoom-in place-items-center overflow-hidden rounded-full bg-white/10 transition hover:ring-4 hover:ring-brand-lite/40"
      >
        <Image src={url} alt={`${ad} arması`} fill sizes="96px" className="object-contain p-1.5" />
      </button>

      {acik &&
        createPortal(
          <div
            ref={kart}
            role="dialog"
            aria-label={`${ad} arması`}
            style={{
              top: konum?.top ?? -9999,
              left: konum?.left ?? -9999,
              width: konum?.en ?? KART_EN,
              transformOrigin: konum?.yukari ? "bottom left" : "top left",
            }}
            className={`fixed z-50 overflow-hidden rounded border border-line bg-white text-ink shadow-[0_24px_60px_rgba(4,21,11,0.35)] transition duration-200 ease-out motion-reduce:transition-none ${
              gorunur ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <div className="relative aspect-square bg-paper">
              <Image
                src={url}
                alt={`${ad} arması`}
                fill
                sizes={`${KART_EN}px`}
                className="object-contain p-6"
              />
            </div>
            <div className="flex items-center gap-3 border-t border-line px-4 py-3">
              <p className="min-w-0 flex-1 truncate font-[family-name:var(--font-data)] font-bold tracking-wide uppercase">
                {ad}
              </p>
              <button
                ref={kapatDugmesi}
                type="button"
                onClick={kapat}
                aria-label="Kapat"
                className="grid h-11 w-11 flex-none place-items-center rounded-sm text-2xl leading-none text-muted transition hover:bg-paper hover:text-ink"
              >
                ×
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
