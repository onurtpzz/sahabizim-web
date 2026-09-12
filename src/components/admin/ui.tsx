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
