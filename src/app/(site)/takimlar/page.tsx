import type { Metadata } from "next";
import Link from "next/link";
import { VeriUyarisi } from "@/components/veri-uyarisi";
import { rozet } from "@/lib/puan";
import { getPuanDurumuSonucu } from "@/lib/veri";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Takımlar",
  description: `SahaBizim Ligi ${SITE.sezon} sezonunda mücadele eden tüm takımlar.`,
  alternates: { canonical: "/takimlar" },
};

export const revalidate = 60;

export default async function TakimlarSayfasi() {
  const sonuc = await getPuanDurumuSonucu();
  const takimlar = [...sonuc.veri].sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-12 md:py-16">
      <p className="eyebrow text-brand">{SITE.sezon} Sezonu</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.4rem)]">Takımlar</h1>
      {sonuc.durum === "hata" ? (
        <div className="mt-7">
          <VeriUyarisi metin="Sunucu veritabanına ulaşamadı, bu yüzden takım listesi şu an gösterilemiyor. Birkaç dakika içinde kendiliğinden düzelir." />
        </div>
      ) : (
        <>
      <p className="mt-3 text-muted">{takimlar.length} takım, alfabetik sırayla.</p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {takimlar.map((t) => {
          const r = rozet(t.ad);
          return (
            <li key={t.slug}>
              <Link
                href={`/takim/${t.slug}`}
                className="kart-hover group flex items-center gap-3 rounded border border-line bg-white p-4"
              >
                <span
                  aria-hidden
                  style={{ background: r.renk }}
                  className="grid h-11 w-11 flex-none place-items-center rounded-full font-[family-name:var(--font-data)] font-bold text-white transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
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
        </>
      )}
    </div>
  );
}
