import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SITE } from "@/lib/site";
import { getArsivSezonlari } from "@/lib/veri";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Arşiv — Geçmiş Sezonlar",
  description:
    "SahaBizim Ligi'nin geçmiş sezonları: final puan durumları ve şampiyonlar.",
  alternates: { canonical: "/arsiv" },
};

export default async function ArsivSayfasi() {
  const sezonlar = await getArsivSezonlari();

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-12 md:py-16">
      <p className="eyebrow text-gold">Geçmiş sezonlar</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.6rem)]">Arşiv</h1>
      <p className="mt-3 max-w-[62ch] text-muted">
        Kapanan her sezonun final puan durumu olduğu gibi saklanır. Yeni sezon başlarken
        tablo sıfırlanır ama geçmiş buradan hep okunabilir.
      </p>

      {sezonlar.length === 0 ? (
        <div className="mt-8 rounded border border-line bg-white p-8">
          <h2 className="font-[family-name:var(--font-data)] text-xl font-bold tracking-wide uppercase">
            Henüz arşivlenmiş sezon yok
          </h2>
          <p className="mt-3 max-w-[60ch] text-muted">
            {SITE.sezon} sezonu hâlâ devam ediyor. Sezon kapandığında final tablosu
            buraya taşınır.
          </p>
          <p className="mt-5">
            <Link
              href="/puan-durumu"
              className="font-[family-name:var(--font-data)] font-bold text-brand hover:underline"
            >
              Güncel puan durumuna bak →
            </Link>
          </p>
        </div>
      ) : (
        <ul className="mt-9 grid gap-4 md:grid-cols-2">
          {sezonlar.map((s) => (
            <li key={s.id}>
              <Reveal>
                <Link
                  href={`/arsiv/${s.slug}`}
                  className="group block rounded border border-line bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_12px_32px_rgba(4,21,11,0.08)]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="display text-[clamp(1.6rem,4vw,2.2rem)]">{s.ad}</h2>
                    <span className="font-[family-name:var(--font-data)] text-sm text-muted">
                      {s.takimSayisi} takım
                    </span>
                  </div>

                  {s.sampiyon && (
                    <p className="mt-3 flex items-center gap-2.5 rounded-sm bg-gold/10 px-3 py-2.5">
                      <span aria-hidden className="text-gold">
                        ★
                      </span>
                      <span className="font-[family-name:var(--font-data)] text-[15px] font-bold tracking-wide uppercase">
                        {s.sampiyon}
                      </span>
                      <span className="text-sm text-muted">şampiyon</span>
                    </p>
                  )}

                  <p className="mt-3 text-sm text-muted">
                    {s.basladi ?? "—"}
                    {s.bitti ? ` → ${s.bitti}` : ""}
                  </p>

                  <span className="mt-4 inline-block border-b-2 border-brand pb-0.5 font-[family-name:var(--font-data)] text-sm font-bold tracking-wider text-brand uppercase">
                    Final tablosunu aç →
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
