import type { Metadata } from "next";
import Link from "next/link";
import { rozet } from "@/lib/puan";
import { getPuanDurumu } from "@/lib/veri";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Takımlar",
  description: `SahaBizim Ligi ${SITE.sezon} sezonunda mücadele eden tüm takımlar.`,
  alternates: { canonical: "/takimlar" },
};

export const revalidate = 60;

export default async function TakimlarSayfasi() {
  const tablo = await getPuanDurumu();
  const takimlar = [...tablo].sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-12 md:py-16">
      <p className="eyebrow text-brand">{SITE.sezon} Sezonu</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.4rem)]">Takımlar</h1>
      <p className="mt-3 text-muted">{takimlar.length} takım, alfabetik sırayla.</p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {takimlar.map((t) => {
          const r = rozet(t.ad);
          return (
            <li key={t.slug}>
              <Link
                href={`/takim/${t.slug}`}
                className="flex items-center gap-3 rounded border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand"
              >
                <span
                  aria-hidden
                  style={{ background: r.renk }}
                  className="grid h-11 w-11 flex-none place-items-center rounded-full font-[family-name:var(--font-data)] font-bold text-white"
                >
                  {r.harf}
                </span>
                <span>
                  <span className="block font-[family-name:var(--font-data)] text-lg font-bold">
                    {t.ad}
                  </span>
                  <span className="font-[family-name:var(--font-data)] text-sm text-muted">
                    {t.oynadi ? `${t.sira}. sıra · ${t.P} puan` : "Maç bekliyor"}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
