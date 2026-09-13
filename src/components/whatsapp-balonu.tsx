"use client";

import { useEffect, useState } from "react";

/**
 * Sayfa boyunca eşlik eden yüzen WhatsApp butonu.
 * Mobilde alt navigasyonun üstünde durur, masaüstünde sağ altta.
 * Biraz aşağı kaydırılınca belirir — hero'nun üstünü kapatmasın diye.
 */
export function WhatsappBalonu({
  numara,
  mesaj = "Merhaba, SahaBizim hakkında bilgi almak istiyorum.",
}: {
  numara: string;
  mesaj?: string;
}) {
  const [gorunur, setGorunur] = useState(false);
  const [etiket, setEtiket] = useState(false);

  useEffect(() => {
    function kaydir() {
      setGorunur(window.scrollY > 260);
    }
    kaydir();
    window.addEventListener("scroll", kaydir, { passive: true });
    return () => window.removeEventListener("scroll", kaydir);
  }, []);

  // Belirdikten kısa süre sonra etiket bir kez açılır, sonra kendiliğinden kapanır.
  useEffect(() => {
    if (!gorunur) return;
    const ac = setTimeout(() => setEtiket(true), 700);
    const kapa = setTimeout(() => setEtiket(false), 5200);
    return () => {
      clearTimeout(ac);
      clearTimeout(kapa);
    };
  }, [gorunur]);

  const temizNumara = numara.replace(/\D/g, "");

  return (
    <div
      className={`fixed right-4 bottom-[80px] z-40 flex items-center gap-2 transition-all duration-300 lg:right-6 lg:bottom-6 ${
        gorunur ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <span
        aria-hidden
        className={`hidden rounded-full bg-ink/95 px-3.5 py-2 font-[family-name:var(--font-data)] text-sm font-semibold text-white shadow-lg transition-all duration-300 sm:block ${
          etiket ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-2 opacity-0"
        }`}
      >
        Bir sorun mu var? Yaz bize
      </span>

      <a
        href={`https://wa.me/${temizNumara}?text=${encodeURIComponent(mesaj)}`}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setEtiket(true)}
        onMouseLeave={() => setEtiket(false)}
        aria-label="WhatsApp'tan yaz"
        className="wa-balon relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(4,21,11,0.35)] transition-transform hover:scale-105 active:scale-95"
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden>
          <path d="M16.02 3.2c-7.06 0-12.8 5.73-12.8 12.79 0 2.25.59 4.45 1.72 6.39L3.1 28.8l6.6-1.73a12.77 12.77 0 0 0 6.32 1.65h.01c7.05 0 12.79-5.74 12.79-12.8 0-3.41-1.33-6.62-3.74-9.03a12.7 12.7 0 0 0-9.06-3.7Zm0 23.34h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4.02 1.05 1.07-3.92-.25-.4a10.6 10.6 0 0 1-1.63-5.67c0-5.87 4.77-10.64 10.64-10.64 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.53c0 5.87-4.77 10.64-10.64 10.64Zm5.83-7.97c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.89-1.78-2.21-.19-.32-.02-.5.14-.66.15-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.08 1.3 3.29c.16.21 2.25 3.44 5.45 4.82.76.33 1.35.53 1.82.68.76.24 1.46.21 2.01.13.61-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
        </svg>
      </a>
    </div>
  );
}
