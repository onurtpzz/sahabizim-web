"use client";

import { useId, useState } from "react";

/**
 * Anasayfadaki kısa kural listesi — başlığa dokununca açıklama YUMUŞAK açılır.
 *
 * Neden `<details>` değil: `<details>` açılıp kapanırken yüksekliği anında
 * değişiyor ve animasyon verilemiyor (tarayıcı desteği yok denecek kadar az).
 * Bölüm bir anda uzayıp kısalınca koyu zemindeki geçişler de sıçramış gibi
 * görünüyordu. Burada `grid-template-rows: 0fr → 1fr` geçişi kullanılıyor;
 * içerik yüksekliği bilinmeden, JS ile ölçmeden animasyon yapmanın yolu bu.
 *
 * Kapalı içerik `inert`: klavye ve ekran okuyucu görünmeyen metne girmesin.
 */

type Kural = { id: string; baslik: string; metin: string };

export function KuralListesi({ kurallar }: { kurallar: Kural[] }) {
  return (
    <ol className="divide-y divide-white/10 rounded-sm border border-white/12 bg-white/[0.04]">
      {kurallar.map((k, i) => (
        <KuralSatiri key={k.id} kural={k} no={i + 1} />
      ))}
    </ol>
  );
}

function KuralSatiri({ kural, no }: { kural: Kural; no: number }) {
  const [acik, setAcik] = useState(false);
  const icerikId = useId();
  const metinVar = kural.metin.trim().length > 0;

  const baslik = (
    <>
      <span
        aria-hidden
        className={`display w-6 flex-none text-lg transition-colors duration-300 ${
          acik ? "text-gold" : "text-white/50"
        }`}
      >
        {String(no).padStart(2, "0")}
      </span>
      <span className="min-w-0 flex-1 font-[family-name:var(--font-data)] text-[15px] font-semibold tracking-wide text-white uppercase">
        {kural.baslik}
      </span>
    </>
  );

  // Açıklaması olmayan kural düğme değil, düz satır.
  if (!metinVar) {
    return <li className="flex min-h-11 items-center gap-3 px-4 py-2.5">{baslik}</li>;
  }

  return (
    <li>
      <button
        type="button"
        aria-expanded={acik}
        aria-controls={icerikId}
        onClick={() => setAcik((a) => !a)}
        className="flex min-h-11 w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
      >
        {baslik}
        <span
          aria-hidden
          className={`flex-none text-lg leading-none text-muted-dark transition-transform duration-300 motion-reduce:transition-none ${
            acik ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      <div
        id={icerikId}
        inert={!acik}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          acik ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-3 pl-[52px] text-[15px] leading-relaxed text-[#cfe0d5]">
            {kural.metin}
          </p>
        </div>
      </div>
    </li>
  );
}
