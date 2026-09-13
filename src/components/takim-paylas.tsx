"use client";

import { useState } from "react";

type Props = {
  ad: string;
  url: string;
  sira: number;
  puan: number;
  oynanan: number;
  averaj: number;
  oynadi: boolean;
  son3: string[];
};

/** Sıraya göre değişen, biraz iddialı bir üst satır. */
function basSatiri(sira: number, oynadi: boolean) {
  if (!oynadi) return "yeni sezona hazırlanıyor";
  if (sira === 1) return "SahaBizim Ligi'nde ZİRVEDE — 1. sırada";
  if (sira <= 3) return `SahaBizim Ligi'nde kürsüde — ${sira}. sırada`;
  if (sira <= 10) return `SahaBizim Ligi'nde ilk 10'da — ${sira}. sırada`;
  return `SahaBizim Ligi'nde ${sira}. sırada`;
}

function formSatiri(son3: string[]) {
  const isaret: Record<string, string> = { G: "✅", B: "➖", M: "❌" };
  const goster = son3.filter(Boolean).map((s) => isaret[s] ?? "").join(" ");
  return goster ? `Son maçlar: ${goster}` : "";
}

export function TakimPaylas(props: Props) {
  const { ad, url, sira, puan, oynanan, averaj, oynadi, son3 } = props;
  const [kopyalandi, setKopyalandi] = useState(false);

  const satirlar = [
    `⚽ ${ad.toLocaleUpperCase("tr")}`,
    basSatiri(sira, oynadi),
    oynadi
      ? `📊 ${oynanan} maç · ${puan} puan · averaj ${averaj > 0 ? `+${averaj}` : averaj}`
      : "",
    oynadi ? formSatiri(son3) : "",
    "",
    "Güncel puan durumu, fikstür ve maç sonuçları:",
    url,
  ].filter((s) => s !== undefined);

  const metin = satirlar.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  async function kopyala() {
    try {
      await navigator.clipboard.writeText(metin);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2200);
    } catch {
      setKopyalandi(false);
    }
  }

  async function paylas() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${ad} · SahaBizim`, text: metin, url });
      } catch {
        /* kullanıcı vazgeçti */
      }
    } else {
      kopyala();
    }
  }

  return (
    <section className="mt-8 rounded border border-line bg-white p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-[220px] flex-1">
          <h2 className="font-[family-name:var(--font-data)] text-lg font-bold uppercase tracking-wide">
            Takımı paylaş
          </h2>
          <p className="mt-1 text-sm text-muted">
            Arkadaşlarına gönder — sıran, puanın ve sayfanın linki hazır metinde.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(metin)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-sm bg-[#25D366] px-4 py-3 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider text-white transition hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M16.02 3.2c-7.06 0-12.8 5.73-12.8 12.79 0 2.25.59 4.45 1.72 6.39L3.1 28.8l6.6-1.73a12.77 12.77 0 0 0 6.32 1.65c7.06 0 12.8-5.74 12.8-12.8 0-3.41-1.34-6.62-3.75-9.03a12.7 12.7 0 0 0-9.05-3.7Zm0 23.34a10.6 10.6 0 0 1-5.41-1.48l-.39-.23-4.02 1.05 1.07-3.92-.25-.4a10.6 10.6 0 0 1-1.63-5.67c0-5.87 4.77-10.64 10.64-10.64 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.53c0 5.87-4.77 10.64-10.64 10.64Z" />
            </svg>
            WhatsApp
          </a>

          <button
            type="button"
            onClick={paylas}
            className="rounded-sm border-2 border-ink px-4 py-3 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider transition hover:border-brand hover:text-brand"
          >
            Diğer uygulamalar
          </button>

          <button
            type="button"
            onClick={kopyala}
            className="rounded-sm border-2 border-line px-4 py-3 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider text-muted transition hover:border-brand hover:text-brand"
          >
            {kopyalandi ? "Kopyalandı ✓" : "Metni kopyala"}
          </button>
        </div>
      </div>

      <pre className="mt-4 overflow-x-auto rounded border border-line bg-paper p-4 font-[family-name:var(--font-data)] text-[13.5px] leading-relaxed whitespace-pre-wrap text-muted">
        {metin}
      </pre>
    </section>
  );
}
