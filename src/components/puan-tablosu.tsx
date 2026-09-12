"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { rozet } from "@/lib/puan";
import type { MacSonucu, PuanSatiri } from "@/lib/types";

const FORM_RENK: Record<string, string> = {
  G: "bg-brand text-white",
  B: "bg-[#9aa79c] text-white",
  M: "bg-lose text-white",
};

function Form({ son }: { son: MacSonucu[] }) {
  return (
    <span className="flex justify-center gap-1">
      {son.map((s, i) => (
        <span
          key={i}
          title={s === "G" ? "Galibiyet" : s === "B" ? "Beraberlik" : s === "M" ? "Mağlubiyet" : "Maç yok"}
          className={`grid h-5 w-5 place-items-center rounded-[3px] font-[family-name:var(--font-data)] text-[11px] font-bold ${
            s ? FORM_RENK[s] : "border border-dashed border-line"
          }`}
        >
          {s}
        </span>
      ))}
    </span>
  );
}

type Satir = PuanSatiri & { logoUrl?: string | null };

export function PuanTablosu({
  satirlar,
  baslangicAdet,
  aramaVar = true,
}: {
  satirlar: Satir[];
  /** Başta kaç satır gösterilsin; verilmezse hepsi açık gelir. */
  baslangicAdet?: number;
  aramaVar?: boolean;
}) {
  const [q, setQ] = useState("");
  const [hepsi, setHepsi] = useState(baslangicAdet === undefined);

  const gosterilecek = useMemo(() => {
    const arama = q.trim().toLocaleLowerCase("tr");
    if (arama) {
      return satirlar.filter((t) => t.ad.toLocaleLowerCase("tr").includes(arama));
    }
    return hepsi ? satirlar : satirlar.slice(0, baslangicAdet);
  }, [q, hepsi, satirlar, baslangicAdet]);

  return (
    <div className="overflow-hidden rounded border border-line bg-white">
      {aramaVar && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <label className="flex-1" htmlFor="takim-ara">
            <span className="sr-only">Takım ara</span>
            <input
              id="takim-ara"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Takım ara — örn. Curcuna"
              className="w-full min-w-[180px] rounded-sm border border-line bg-paper px-3 py-2.5 text-[15px]"
            />
          </label>
          <p className="font-[family-name:var(--font-data)] text-sm tracking-wide text-muted">
            {satirlar.length} takım
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-0 border-collapse font-[family-name:var(--font-data)] text-[17px] md:min-w-[660px]">
          <caption className="sr-only">
            SahaBizim Ligi puan durumu — puan, averaj ve atılan gole göre sıralı
          </caption>
          <thead>
            <tr className="bg-ink-2 text-[#cfe0d5]">
              {[
                { h: "#", gizle: false },
                { h: "Takım", gizle: false },
                { h: "O", gizle: false },
                { h: "G", gizle: true },
                { h: "B", gizle: true },
                { h: "M", gizle: true },
                { h: "A", gizle: true },
                { h: "Y", gizle: true },
                { h: "AV", gizle: false },
                { h: "P", gizle: false },
                { h: "Son 3", gizle: true },
              ].map((s, i) => (
                <th
                  key={s.h}
                  scope="col"
                  className={`px-2 py-3 text-[13px] font-semibold uppercase tracking-[0.14em] ${
                    i === 1 ? "pl-4 text-left" : "text-center"
                  } ${s.gizle ? "hidden md:table-cell" : ""}`}
                >
                  {s.h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gosterilecek.map((t) => {
              const r = rozet(t.ad);
              return (
                <tr key={t.slug} className="border-b border-line transition-colors hover:bg-[#eaf4eb]">
                  <td
                    className={`w-12 px-2 py-2.5 text-center font-[family-name:var(--font-display)] text-lg ${
                      t.sira === 1 ? "text-gold" : t.sira <= 3 ? "text-brand" : "text-muted"
                    }`}
                  >
                    {t.sira}
                  </td>
                  <td className="py-2.5 pl-2 text-left md:pl-4">
                    <Link
                      href={`/takim/${t.slug}`}
                      className="flex items-center gap-2 text-[15px] font-bold hover:text-brand md:gap-2.5 md:text-[17px]"
                    >
                      {t.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.logoUrl}
                          alt=""
                          width={30}
                          height={30}
                          loading="lazy"
                          className="h-6 w-6 flex-none rounded-full object-contain md:h-[30px] md:w-[30px]"
                        />
                      ) : (
                        <span
                          aria-hidden
                          style={{ background: r.renk }}
                          className="grid h-6 w-6 flex-none place-items-center rounded-full font-[family-name:var(--font-data)] text-[10px] font-bold text-white md:h-[30px] md:w-[30px] md:text-[12px]"
                        >
                          {r.harf}
                        </span>
                      )}
                      {t.ad}
                    </Link>
                  </td>
                  {[t.O, t.G, t.B, t.M, t.A, t.Y].map((v, i) => (
                    <td
                      key={i}
                      className={`tabular px-2 py-2.5 text-center font-semibold ${
                        i > 0 ? "hidden md:table-cell" : ""
                      }`}
                    >
                      {t.oynadi ? v : "–"}
                    </td>
                  ))}
                  <td className="tabular px-2 py-2.5 text-center font-semibold">
                    {t.oynadi ? (t.AV > 0 ? `+${t.AV}` : t.AV) : "–"}
                  </td>
                  <td className="tabular px-2 py-2.5 text-center font-[family-name:var(--font-display)] text-xl text-ink">
                    {t.oynadi ? t.P : "–"}
                  </td>
                  <td className="hidden px-2 py-2.5 md:table-cell">
                    <Form son={t.son} />
                  </td>
                </tr>
              );
            })}
            {gosterilecek.length === 0 && (
              <tr>
                <td colSpan={11} className="p-8 text-center text-muted">
                  “{q}” ile eşleşen takım yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {baslangicAdet !== undefined && !q && (
        <div className="flex justify-center p-4">
          <button
            type="button"
            onClick={() => setHepsi((v) => !v)}
            className="rounded-sm bg-ink px-6 py-3 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-white transition hover:-translate-y-0.5"
          >
            {hepsi ? `İlk ${baslangicAdet} takımı göster` : `Tüm ${satirlar.length} takımı göster`}
          </button>
        </div>
      )}
    </div>
  );
}
