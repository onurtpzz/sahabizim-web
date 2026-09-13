"use client";

import Image from "next/image";
import { useCallback, useEffect } from "react";

/**
 * Tam ekran fotoğraf görüntüleyici. Oklarla, klavyeyle veya parmakla
 * kaydırarak fotoğraflar arasında geçilir. Galeri ve takım sayfası
 * aynı bileşeni kullanıyor.
 */

export type BuyutecFoto = {
  id: string;
  url: string;
  baslik?: string | null;
  altBilgi?: string | null;
};

export function FotoBuyutec({
  fotograflar,
  sira,
  setSira,
}: {
  fotograflar: BuyutecFoto[];
  sira: number | null;
  setSira: (s: number | null) => void;
}) {
  const adet = fotograflar.length;

  const ilerle = useCallback(
    (yon: number) => {
      setSira(sira === null ? null : (sira + yon + adet) % adet);
    },
    [sira, adet, setSira],
  );

  useEffect(() => {
    if (sira === null) return;
    function tus(e: KeyboardEvent) {
      if (e.key === "Escape") setSira(null);
      if (e.key === "ArrowRight") ilerle(1);
      if (e.key === "ArrowLeft") ilerle(-1);
    }
    document.addEventListener("keydown", tus);
    // Arka plan kaymasın
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tus);
      document.body.style.overflow = eski;
    };
  }, [sira, ilerle, setSira]);

  if (sira === null || !fotograflar[sira]) return null;
  const foto = fotograflar[sira];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fotoğraf görüntüleyici"
      className="fixed inset-0 z-[60] flex flex-col bg-black/92 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSira(null);
      }}
    >
      {/* Üst çubuk */}
      <div className="flex flex-none items-center gap-3 px-4 py-3 text-white sm:px-6">
        <span className="font-[family-name:var(--font-data)] text-sm tracking-[0.12em] text-white/60 uppercase">
          {sira + 1} / {adet}
        </span>
        <button
          type="button"
          onClick={() => setSira(null)}
          aria-label="Kapat"
          className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-white/25 text-xl text-white transition hover:border-white hover:bg-white/10"
        >
          ✕
        </button>
      </div>

      {/* Fotoğraf */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 sm:px-16">
        {adet > 1 && (
          <button
            type="button"
            onClick={() => ilerle(-1)}
            aria-label="Önceki fotoğraf"
            className="absolute left-2 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/40 text-2xl text-white transition hover:border-white hover:bg-black/70 sm:left-4"
          >
            ‹
          </button>
        )}

        <div className="relative h-full w-full">
          <Image
            key={foto.id}
            src={foto.url}
            alt={foto.baslik ?? "Fotoğraf"}
            fill
            sizes="100vw"
            priority
            className="object-contain"
          />
        </div>

        {adet > 1 && (
          <button
            type="button"
            onClick={() => ilerle(1)}
            aria-label="Sonraki fotoğraf"
            className="absolute right-2 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/40 text-2xl text-white transition hover:border-white hover:bg-black/70 sm:right-4"
          >
            ›
          </button>
        )}
      </div>

      {/* Alt bilgi */}
      {(foto.baslik || foto.altBilgi) && (
        <div className="flex-none px-4 pt-3 pb-5 text-center sm:px-6">
          {foto.baslik && <p className="text-[15px] text-white">{foto.baslik}</p>}
          {foto.altBilgi && (
            <p className="mt-0.5 font-[family-name:var(--font-data)] text-[13px] text-white/55">
              {foto.altBilgi}
            </p>
          )}
        </div>
      )}

      {/* Küçük önizlemeler */}
      {adet > 1 && (
        <div className="flex-none overflow-x-auto px-4 pb-4 sm:px-6">
          <div className="mx-auto flex w-max gap-2">
            {fotograflar.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSira(i)}
                aria-label={`${i + 1}. fotoğrafa git`}
                aria-current={i === sira}
                className={`relative h-14 w-20 flex-none overflow-hidden rounded-sm border-2 transition ${
                  i === sira ? "border-brand-lite" : "border-transparent opacity-55 hover:opacity-100"
                }`}
              >
                <Image src={f.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
