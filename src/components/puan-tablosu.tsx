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

      <p className="border-b border-line px-4 py-2 font-[family-name:var(--font-data)] text-xs uppercase tracking-wider text-muted md:hidden">
        Sıra ve takım adı sabit — tabloyu yana kaydır →
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse font-[family-name:var(--font-data)] text-[17px]">
          <caption className="sr-only">
            SahaBizim Ligi puan durumu — puan, averaj ve atılan gole göre sıralı
          </caption>
          <thead>
            <tr className="bg-ink-2 text-[#cfe0d5]">
              {[
                { h: "#", gizle: false },
                { h: "Takım", gizle: false },
                { h: "O", gizle: false },
                { h: "G", gizle: false },
                { h: "B", gizle: false },
                { h: "M", gizle: false },
                { h: "A", gizle: false },
                { h: "Y", gizle: false },
                { h: "AV", gizle: false },
                { h: "P", gizle: false },
                { h: "Son 3", gizle: false },
              ].map((s, i) => (
                <th
                  key={s.h}
                  scope="col"
                  className={`bg-ink-2 px-1.5 py-3 md:px-2 text-[13px] font-semibold uppercase tracking-[0.14em] ${
                    i === 1 ? "pl-1.5 text-left md:pl-4" : "text-center"
                  } ${
                    i === 0
                      ? "sticky left-0 z-20 w-8 md:static md:w-12"
                      : i === 1
                        ? "sticky left-8 z-20 shadow-[2px_0_0_0_rgba(0,0,0,0.12)] md:static md:left-auto md:shadow-none"
                        : ""
                  }`}
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
                <tr key={t.slug} className="group border-b border-line transition-colors hover:bg-[#eaf4eb]">
                  <td
                    className={`sticky left-0 z-10 w-8 bg-white px-1 py-2.5 text-center font-[family-name:var(--font-display)] text-base transition-colors group-hover:bg-[#eaf4eb] md:static md:w-12 md:px-2 md:text-lg ${
                      t.sira === 1 ? "text-gold" : t.sira <= 3 ? "text-brand" : "text-muted"
                    }`}
                  >
                    {t.sira}
                  </td>
                  <td className="sticky left-8 z-10 w-[124px] max-w-[124px] bg-white py-2.5 pr-1.5 pl-1.5 text-left shadow-[2px_0_0_0_rgba(0,0,0,0.08)] transition-colors group-hover:bg-[#eaf4eb] md:static md:left-auto md:w-auto md:max-w-none md:pr-2 md:pl-4 md:shadow-none">
                    <Link
                      href={`/takim/${t.slug}`}
                      className="flex items-center gap-1.5 text-[13px] leading-tight font-bold hover:text-brand md:gap-2.5 md:text-[17px]"
                    >
                      {t.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.logoUrl}
                          alt=""
                          width={30}
                          height={30}
                          loading="lazy"
                          className="h-5 w-5 flex-none rounded-full object-contain md:h-[30px] md:w-[30px]"
                        />
                      ) : (
                        <span
                          aria-hidden
                          style={{ background: r.renk }}
                          className="grid h-5 w-5 flex-none place-items-center rounded-full font-[family-name:var(--font-data)] text-[9px] font-bold text-white md:h-[30px] md:w-[30px] md:text-[12px]"
                        >
                          {r.harf}
                        </span>
                      )}
                      <span className="truncate">{t.ad}</span>
                    </Link>
                  </td>
                  {[t.O, t.G, t.B, t.M, t.A, t.Y].map((v, i) => (
                    <td key={i} className="tabular px-1.5 py-2.5 text-center font-semibold md:px-2">
                      {t.oynadi ? v : "–"}
                    </td>
                  ))}
                  <td className="tabular px-1.5 py-2.5 text-center font-semibold md:px-2">
                    {t.oynadi ? (t.AV > 0 ? `+${t.AV}` : t.AV) : "–"}
                  </td>
                  <td className="tabular px-1.5 py-2.5 text-center font-[family-name:var(--font-display)] text-xl text-ink md:px-2">
                    {t.oynadi ? t.P : "–"}
                  </td>
                  <td className="px-2 py-2.5">
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
