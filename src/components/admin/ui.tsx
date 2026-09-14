"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function Panel({
  baslik,
  sag,
  children,
}: {
  baslik: string;
  sag?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded border border-white/12 bg-ink-3">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/12 px-4 py-3">
        <h2 className="font-[family-name:var(--font-data)] text-sm uppercase tracking-[0.12em] text-[#cfe0d5]">
          {baslik}
        </h2>
        {sag && <div className="ml-auto text-sm text-gold">{sag}</div>}
      </header>
      {children}
    </section>
  );
}

export function Alan({
  etiket,
  children,
}: {
  etiket: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-[family-name:var(--font-data)] text-xs uppercase tracking-[0.12em] text-muted-dark">
        {etiket}
      </span>
      {children}
    </label>
  );
}

const girdiSinif =
  "w-full rounded-sm border border-white/15 bg-[#07200f] px-3 py-2.5 text-white placeholder:text-white/30 focus:border-brand-lite";

export function Girdi(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${girdiSinif} ${props.className ?? ""}`} />;
}

export function Secim(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${girdiSinif} font-[family-name:var(--font-data)] ${props.className ?? ""}`}
    />
  );
}

export function Dugme({
  tur = "birincil",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tur?: "birincil" | "ikincil" | "tehlike";
}) {
  const stiller = {
    birincil: "bg-brand text-white hover:bg-[#15c244]",
    ikincil: "border border-white/20 text-[#cfe0d5] hover:border-brand-lite hover:text-white",
    tehlike: "border border-lose/60 text-[#ff9a8f] hover:bg-lose/15",
  } as const;
  return (
    <button
      {...props}
      className={`rounded-sm px-4 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 ${stiller[tur]} ${props.className ?? ""}`}
    />
  );
}

/**
 * Kaydetme/hata bildirimi — sayfanın SAĞ ALTINDA belirir, birkaç saniyede
 * kendiliğinden kaybolur.
 *
 * Neden buradan: mesajlar eskiden sayfanın en üstünde çıkıyordu. Uzun maç
 * listesinin ortasında skor kaydedince mesaj ekranın dışında kalıyor, kaydın
 * gidip gitmediği anlaşılmıyordu.
 */
export function Bildirim({
  mesaj,
  kapat,
  saniye = 4,
}: {
  mesaj: { tur: "basari" | "hata"; metin: string } | null;
  kapat: () => void;
  saniye?: number;
}) {
  useEffect(() => {
    if (!mesaj) return;
    // Hatalar biraz daha uzun kalsın — okunacak bir sebep içeriyorlar.
    const sure = (mesaj.tur === "hata" ? saniye * 2 : saniye) * 1000;
    const zaman = setTimeout(kapat, sure);
    return () => clearTimeout(zaman);
  }, [mesaj, kapat, saniye]);

  if (!mesaj) return null;

  const stil =
    mesaj.tur === "hata"
      ? "border-lose/60 bg-[#2a0f0c] text-[#ffd7d2]"
      : "border-brand/60 bg-[#06240f] text-[#d7f5df]";

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6 sm:justify-end"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-[420px] items-start gap-3 rounded border px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.45)] ${stil}`}
      >
        <span aria-hidden className="mt-0.5 text-base">
          {mesaj.tur === "hata" ? "⚠" : "✓"}
        </span>
        <p className="flex-1 text-sm">{mesaj.metin}</p>
        <button
          type="button"
          onClick={kapat}
          aria-label="Bildirimi kapat"
          className="-mr-1 -mt-1 px-1.5 text-lg leading-none opacity-60 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/** Menüdeki bekleyen iş sayısı. 0 ise hiç çıkmaz. */
export function Rakam({ sayi }: { sayi: number }) {
  if (!sayi) return null;
  return (
    <span className="ml-1.5 inline-grid min-w-[19px] place-items-center rounded-full bg-gold px-1.5 py-px text-[11px] font-bold text-ink tabular-nums">
      {sayi > 99 ? "99+" : sayi}
    </span>
  );
}

/**
 * Geri alınamayan işlemlerin kutusu — kırmızı çerçeve, ayrı başlık.
 *
 * Sezon sıfırlama sıradan bir panelin içinde duruyordu; diğerleriyle aynı
 * göründüğü için yanlışlıkla dokunma ihtimali vardı. Görsel olarak ayırmak
 * en ucuz korumadır.
 */
export function TehlikeliBolge({
  baslik,
  aciklama,
  children,
}: {
  baslik: string;
  aciklama?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded border-2 border-lose/55 bg-[#1a0806]">
      <header className="border-b border-lose/35 bg-lose/10 px-4 py-3">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-[0.12em] text-[#ff9a8f]">
          <span aria-hidden>⚠</span>
          {baslik}
        </h2>
        {aciklama && <p className="mt-1.5 text-sm text-[#ffd7d2]">{aciklama}</p>}
      </header>
      {children}
    </section>
  );
}

/**
 * Bir şeyin olmadığı durum. Düz "kayıt yok" yerine ne yapılacağını söyler.
 */
export function BosDurum({
  simge = "—",
  baslik,
  metin,
  eylem,
}: {
  simge?: ReactNode;
  baslik: string;
  metin?: string;
  eylem?: ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-2 px-5 py-10 text-center">
      <span aria-hidden className="text-3xl opacity-40">
        {simge}
      </span>
      <p className="font-[family-name:var(--font-data)] text-lg font-bold">{baslik}</p>
      {metin && <p className="max-w-[46ch] text-sm text-muted-dark">{metin}</p>}
      {eylem && <div className="mt-2">{eylem}</div>}
    </div>
  );
}

/**
 * Yükleme iskeleti. Düz "Yükleniyor…" yazısı sayfanın boş kaldığı hissini
 * veriyordu; gelecek içeriğin kabası gösterilince bekleme kısa hissediliyor.
 */
export function Iskelet({ satir = 3 }: { satir?: number }) {
  return (
    <div className="grid gap-3" aria-hidden>
      {Array.from({ length: satir }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded border border-white/10 bg-ink-3">
          <div className="h-11 border-b border-white/8 bg-white/4" />
          <div className="grid gap-2.5 p-4">
            <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-white/10" />
            <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-white/8" />
            <div className="h-3.5 w-3/5 animate-pulse rounded-full bg-white/6" />
          </div>
        </div>
      ))}
      <span className="sr-only">Yükleniyor</span>
    </div>
  );
}

export function Rozet({ ad, renk }: { ad: string; renk: string }) {
  const parcalar = ad.split(" ").filter(Boolean);
  const harf = (
    (parcalar[0]?.[0] ?? "?") + (parcalar[1]?.[0] ?? parcalar[0]?.[1] ?? "")
  ).toLocaleUpperCase("tr");
  return (
    <span
      aria-hidden
      style={{ background: renk }}
      className="grid h-9 w-9 flex-none place-items-center rounded-full font-[family-name:var(--font-data)] text-xs font-bold text-white"
    >
      {harf}
    </span>
  );
}

export function Uyari({
  tur = "bilgi",
  children,
}: {
  tur?: "bilgi" | "basari" | "hata";
  children: ReactNode;
}) {
  const stiller = {
    bilgi: "border-gold/40 bg-gold/10 text-[#e4efe7]",
    basari: "border-brand/50 bg-brand/10 text-[#d7f5df]",
    hata: "border-lose/50 bg-lose/10 text-[#ffd7d2]",
  } as const;
  return (
    <p className={`rounded border px-4 py-3 text-sm ${stiller[tur]}`}>{children}</p>
  );
}

/**
 * Aranabilir takım seçici. 61 takım arasında listeyi kaydırmak yerine
 * birkaç harf yazıp seçmeyi sağlar ("cur" → CURCUNA FC).
 */
export function TakimSecici({
  takimlar,
  deger,
  degistir,
  yerTutucu = "Takım ara veya seç",
}: {
  takimlar: { id: string; ad: string }[];
  deger: string;
  degistir: (id: string) => void;
  yerTutucu?: string;
}) {
  const [metin, setMetin] = useState("");
  const [acik, setAcik] = useState(false);
  const sarmal = useRef<HTMLDivElement>(null);

  const secili = takimlar.find((t) => t.id === deger);

  useEffect(() => {
    function disariTikla(e: MouseEvent) {
      if (sarmal.current && !sarmal.current.contains(e.target as Node)) setAcik(false);
    }
    document.addEventListener("mousedown", disariTikla);
    return () => document.removeEventListener("mousedown", disariTikla);
  }, []);

  const arama = metin.trim().toLocaleLowerCase("tr");
  const liste = arama
    ? takimlar.filter((t) => t.ad.toLocaleLowerCase("tr").includes(arama)).slice(0, 12)
    : takimlar.slice(0, 12);

  return (
    <div ref={sarmal} className="relative">
      <input
        type="text"
        value={acik ? metin : (secili?.ad ?? "")}
        placeholder={yerTutucu}
        onFocus={() => {
          setMetin("");
          setAcik(true);
        }}
        onChange={(e) => {
          setMetin(e.target.value);
          setAcik(true);
        }}
        className="w-full rounded-sm border border-white/15 bg-[#07200f] px-3 py-2.5 text-white placeholder:text-white/30 focus:border-brand-lite"
      />

      {acik && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-sm border border-white/20 bg-[#07200f] shadow-lg">
          {liste.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-muted-dark">Eşleşen takım yok</li>
          )}
          {liste.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  degistir(t.id);
                  setAcik(false);
                  setMetin("");
                }}
                className={`block w-full px-3 py-2.5 text-left font-[family-name:var(--font-data)] text-[15px] hover:bg-white/10 ${
                  t.id === deger ? "text-brand-lite" : "text-white"
                }`}
              >
                {t.ad}
              </button>
            </li>
          ))}
          {!arama && takimlar.length > liste.length && (
            <li className="px-3 py-2 text-xs text-muted-dark">
              Aramak için yazmaya başla — {takimlar.length} takım var
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
