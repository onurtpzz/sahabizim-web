import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TakimArmasi } from "@/components/takim-armasi";
import { TakimFotograflari } from "@/components/takim-fotograflari";
import { TakimMaclari } from "@/components/takim-maclari";
import { TakimPaylas } from "@/components/takim-paylas";
import { VeriUyarisi } from "@/components/veri-uyarisi";
import { rozet } from "@/lib/puan";
import {
  getPuanDurumu,
  getPuanDurumuSonucu,
  getTakimFotograflari,
  getTakimMaclari,
  getTakimSluglari,
} from "@/lib/veri";
import { SITE } from "@/lib/site";
import type { MacSonucu } from "@/lib/types";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const sluglar = await getTakimSluglari();
  return sluglar.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tablo = await getPuanDurumu();
  const takim = tablo.find((t) => t.slug === slug);
  if (!takim) return {};

  const aciklama = takim.oynadi
    ? `${takim.ad} ${SITE.sezon} sezonunda ${takim.O} maçta ${takim.P} puan topladı; SahaBizim Ligi'nde ${takim.sira}. sırada. Güncel kadro istatistikleri, maç sonuçları ve fikstür.`
    : `${takim.ad} SahaBizim Ligi ${SITE.sezon} sezonu kadrosunda. Maç programı ve sonuçlar bu sayfada yayınlanacak.`;

  return {
    title: `${takim.ad} — Puan Durumu, Fikstür ve Sonuçlar`,
    description: aciklama,
    alternates: { canonical: `/takim/${takim.slug}` },
    openGraph: {
      type: "website",
      title: `${takim.ad} · SahaBizim Ligi`,
      description: aciklama,
      url: `${SITE.url}/takim/${takim.slug}`,
    },
  };
}

const FORM_STIL: Record<Exclude<MacSonucu, "">, string> = {
  G: "bg-brand text-white",
  B: "bg-gold/30 text-white",
  M: "bg-lose text-white",
};
const FORM_AD: Record<Exclude<MacSonucu, "">, string> = {
  G: "Galibiyet",
  B: "Beraberlik",
  M: "Mağlubiyet",
};

export default async function TakimSayfasi({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sonuc = await getPuanDurumuSonucu();

  // Veritabanı okunamadıysa 404 verme: sayfa yok değil, veri yok. 404 Google'a
  // "bu takım kalktı" der ve sayfa dizinden düşer.
  if (sonuc.durum === "hata") {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-5 py-16">
        <h1 className="display text-[clamp(1.9rem,5vw,3rem)]">Takım sayfası</h1>
        <div className="mt-6">
          <VeriUyarisi metin="Sunucu veritabanına ulaşamadı, bu yüzden takımın güncel istatistikleri şu an gösterilemiyor. Birkaç dakika içinde kendiliğinden düzelir." />
        </div>
      </div>
    );
  }

  const tablo = sonuc.veri;
  const sirada = tablo.findIndex((t) => t.slug === slug);
  const takim = tablo[sirada];
  if (!takim) notFound();

  const [fotograflar, maclar] = await Promise.all([
    getTakimFotograflari(takim.takimId),
    getTakimMaclari(slug, 10),
  ]);

  const r = rozet(takim.ad);
  const lider = tablo[0];
  const ustteki = sirada > 0 ? tablo[sirada - 1] : undefined;
  const alttaki = tablo[sirada + 1];
  const farkLider = lider && takim.oynadi ? lider.P - takim.P : 0;
  const macBasiGol = takim.O > 0 ? (takim.A / takim.O).toFixed(1) : "0";
  const macBasiYenen = takim.O > 0 ? (takim.Y / takim.O).toFixed(1) : "0";
  const form = takim.son.filter(Boolean) as Exclude<MacSonucu, "">[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsTeam",
        name: takim.ad,
        sport: "Futbol",
        url: `${SITE.url}/takim/${takim.slug}`,
        memberOf: {
          "@type": "SportsOrganization",
          name: `${SITE.ad} Ligi`,
          url: SITE.url,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Anasayfa", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Takımlar", item: `${SITE.url}/takimlar` },
          { "@type": "ListItem", position: 3, name: takim.ad },
        ],
      },
    ],
  };

  const kutular = [
    { l: "Sıra", v: takim.oynadi ? takim.sira : "–", alt: `${tablo.length} takım içinde` },
    { l: "Puan", v: takim.oynadi ? takim.P : "–", alt: takim.oynadi ? `lidere ${farkLider} puan` : "" },
    { l: "Oynanan", v: takim.O, alt: `${takim.G}G · ${takim.B}B · ${takim.M}M` },
    {
      l: "Averaj",
      v: takim.oynadi ? (takim.AV > 0 ? `+${takim.AV}` : takim.AV) : "–",
      alt: `${takim.A} attı · ${takim.Y} yedi`,
    },
  ];

  return (
    <>
      {/* BAŞLIK */}
      <section className="relative overflow-hidden border-b-[3px] border-brand bg-ink text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #4ADE80 0 2px, transparent 2px 34px)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[1180px] px-5 py-10 md:py-14">
          <Link
            href="/puan-durumu"
            className="font-[family-name:var(--font-data)] text-sm tracking-wider text-brand-lite uppercase hover:underline"
          >
            ← Puan durumu
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-5">
            {takim.logoUrl ? (
              <TakimArmasi url={takim.logoUrl} ad={takim.ad} />
            ) : (
              <span
                aria-hidden
                style={{ background: r.renk }}
                className="grid h-24 w-24 flex-none place-items-center rounded-full font-[family-name:var(--font-data)] text-3xl font-bold text-white ring-4 ring-white/10"
              >
                {r.harf}
              </span>
            )}

            <div className="min-w-0">
              <h1 className="display text-[clamp(2rem,6vw,3.4rem)]">{takim.ad}</h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-[family-name:var(--font-data)] text-[#cfe0d5]">
                <span>{SITE.sezon} sezonu</span>
                {takim.oynadi ? (
                  <>
                    <span aria-hidden className="text-white/25">
                      ·
                    </span>
                    <span>
                      <strong className="text-white">{takim.sira}.</strong> sırada
                    </span>
                    {takim.sira === 1 && (
                      <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[12px] font-bold tracking-[0.12em] text-gold uppercase">
                        ★ Lider
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span aria-hidden className="text-white/25">
                      ·
                    </span>
                    <span>henüz maç oynamadı</span>
                  </>
                )}
              </p>

              {form.length > 0 && (
                <p className="mt-3 flex items-center gap-2">
                  <span className="font-[family-name:var(--font-data)] text-xs tracking-[0.14em] text-muted-dark uppercase">
                    Son maçlar
                  </span>
                  {form.map((s, i) => (
                    <span
                      key={i}
                      title={FORM_AD[s]}
                      className={`grid h-7 w-7 place-items-center rounded-sm font-[family-name:var(--font-data)] text-sm font-bold ${FORM_STIL[s]}`}
                    >
                      {s}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1180px] px-5 py-10 md:py-14">
        {/* ÖZET KUTULARI */}
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kutular.map((k) => (
            <div key={k.l} className="rounded border border-line bg-white p-5">
              <dt className="font-[family-name:var(--font-data)] text-xs tracking-[0.14em] text-muted uppercase">
                {k.l}
              </dt>
              <dd className="display tabular mt-1 text-[clamp(1.9rem,5vw,2.6rem)]">{k.v}</dd>
              {k.alt && (
                <p className="mt-1 font-[family-name:var(--font-data)] text-[13px] text-muted">
                  {k.alt}
                </p>
              )}
            </div>
          ))}
        </dl>

        {/* DETAY */}
        {takim.oynadi && (
          <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded border border-line bg-white">
              <h2 className="border-b border-line bg-paper px-4 py-2.5 font-[family-name:var(--font-data)] text-xs tracking-[0.14em] text-muted uppercase">
                Sezon dökümü
              </h2>
              <table className="w-full border-collapse font-[family-name:var(--font-data)]">
                <tbody>
                  {[
                    ["Galibiyet", takim.G],
                    ["Beraberlik", takim.B],
                    ["Mağlubiyet", takim.M],
                    ["Attığı gol", takim.A],
                    ["Yediği gol", takim.Y],
                    ["Maç başına atılan", macBasiGol],
                    ["Maç başına yenilen", macBasiYenen],
                  ].map(([l, v]) => (
                    <tr key={l as string} className="border-t border-line first:border-t-0">
                      <th scope="row" className="px-4 py-2.5 text-left font-semibold">
                        {l}
                      </th>
                      <td className="tabular px-4 py-2.5 text-right text-lg">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TABLODAKİ KOMŞULAR */}
            <div className="h-fit overflow-hidden rounded border border-line bg-white">
              <h2 className="border-b border-line bg-paper px-4 py-2.5 font-[family-name:var(--font-data)] text-xs tracking-[0.14em] text-muted uppercase">
                Tablodaki yeri
              </h2>
              <ul className="font-[family-name:var(--font-data)]">
                {[ustteki, takim, alttaki]
                  .filter(Boolean)
                  .map((t) => t!)
                  .map((t) => (
                    <li
                      key={t.slug}
                      className={`flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0 ${
                        t.slug === takim.slug ? "bg-brand/8" : ""
                      }`}
                    >
                      <span
                        className={`tabular w-7 text-right font-bold ${
                          t.slug === takim.slug ? "text-brand" : "text-muted"
                        }`}
                      >
                        {t.sira}
                      </span>
                      {t.slug === takim.slug ? (
                        <span className="truncate font-bold">{t.ad}</span>
                      ) : (
                        <Link href={`/takim/${t.slug}`} className="truncate hover:text-brand">
                          {t.ad}
                        </Link>
                      )}
                      <span className="tabular ml-auto font-bold">{t.P}</span>
                    </li>
                  ))}
              </ul>
              <p className="border-t border-line px-4 py-3 text-[13px] text-muted">
                {takim.sira === 1
                  ? `Lider. Takipçisiyle arasında ${alttaki ? takim.P - alttaki.P : 0} puan var.`
                  : `Lidere ${farkLider} puan${ustteki ? `, üstündeki takıma ${ustteki.P - takim.P} puan` : ""} fark var.`}
              </p>
            </div>
          </div>
        )}

        <TakimMaclari
          takimAd={takim.ad}
          slug={takim.slug}
          oynanan={maclar.oynanan}
          sirada={maclar.sirada}
        />

        <TakimFotograflari
          takimAd={takim.ad}
          takimSlug={takim.slug}
          takimId={takim.takimId}
          fotograflar={fotograflar}
        />

        <TakimPaylas
          ad={takim.ad}
          url={`${SITE.url}/takim/${takim.slug}`}
          sira={takim.sira}
          puan={takim.P}
          oynanan={takim.O}
          averaj={takim.AV}
          oynadi={takim.oynadi}
          son3={takim.son}
        />

        {/* ALT GEZİNME */}
        <nav className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
          <Link
            href="/takimlar"
            className="btn-cizgi rounded-sm border-2 border-ink px-5 py-3 font-[family-name:var(--font-data)] text-sm font-bold tracking-wider uppercase transition hover:border-brand hover:text-brand"
          >
            Tüm takımlar
          </Link>
          <Link
            href="/puan-durumu"
            className="btn-cizgi rounded-sm border-2 border-line px-5 py-3 font-[family-name:var(--font-data)] text-sm font-bold tracking-wider text-muted uppercase transition hover:border-brand hover:text-brand"
          >
            Puan durumu
          </Link>
          <Link
            href="/katil"
            className="btn-parla rounded-sm bg-brand px-5 py-3 font-[family-name:var(--font-data)] text-sm font-bold tracking-wider text-white uppercase transition hover:-translate-y-0.5"
          >
            Takımını kaydet
          </Link>
        </nav>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
