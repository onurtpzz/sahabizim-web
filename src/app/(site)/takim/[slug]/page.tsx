import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TakimFotograflari } from "@/components/takim-fotograflari";
import { TakimPaylas } from "@/components/takim-paylas";
import { rozet } from "@/lib/puan";
import { getPuanDurumu, getTakim, getTakimFotograflari } from "@/lib/veri";
import { SITE } from "@/lib/site";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const tablo = await getPuanDurumu();
  return tablo.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const takim = await getTakim(slug);
  if (!takim) return {};
  return {
    title: `${takim.ad} — Puan Durumu ve İstatistik`,
    description: `${takim.ad} ${SITE.sezon} sezonunda ${takim.O} maçta ${takim.P} puan topladı. SahaBizim Ligi'ndeki güncel sırası ${takim.sira}.`,
    alternates: { canonical: `/takim/${takim.slug}` },
  };
}

export default async function TakimSayfasi({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const takim = await getTakim(slug);
  if (!takim) notFound();

  const fotograflar = await getTakimFotograflari(takim.takimId);
  const r = rozet(takim.ad);
  const kutular = [
    { l: "Sıra", v: takim.oynadi ? takim.sira : "–" },
    { l: "Puan", v: takim.oynadi ? takim.P : "–" },
    { l: "Oynanan", v: takim.oynadi ? takim.O : "–" },
    { l: "Averaj", v: takim.oynadi ? (takim.AV > 0 ? `+${takim.AV}` : takim.AV) : "–" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-12 md:py-16">
      <Link href="/puan-durumu" className="font-[family-name:var(--font-data)] text-brand">
        ← Puan durumu
      </Link>

      <header className="mt-5 flex flex-wrap items-center gap-4">
        <span
          aria-hidden
          style={{ background: r.renk }}
          className="grid h-20 w-20 place-items-center rounded-full font-[family-name:var(--font-data)] text-2xl font-bold text-white"
        >
          {r.harf}
        </span>
        <div>
          <h1 className="display text-[clamp(2rem,5.5vw,3.2rem)]">{takim.ad}</h1>
          <p className="font-[family-name:var(--font-data)] text-muted">
            {SITE.sezon} sezonu{takim.oynadi ? "" : " · henüz maç oynamadı"}
          </p>
        </div>
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {kutular.map((k) => (
          <div key={k.l} className="rounded border border-line bg-white p-5">
            <dt className="font-[family-name:var(--font-data)] text-xs uppercase tracking-[0.14em] text-muted">
              {k.l}
            </dt>
            <dd className="display tabular mt-1 text-4xl">{k.v}</dd>
          </div>
        ))}
      </dl>

      {takim.oynadi && (
        <table className="mt-8 w-full max-w-md border-collapse font-[family-name:var(--font-data)] text-lg">
          <tbody>
            {[
              ["Galibiyet", takim.G],
              ["Beraberlik", takim.B],
              ["Mağlubiyet", takim.M],
              ["Attığı gol", takim.A],
              ["Yediği gol", takim.Y],
            ].map(([l, v]) => (
              <tr key={l as string} className="border-b border-line">
                <th scope="row" className="py-2.5 text-left font-semibold">{l}</th>
                <td className="tabular py-2.5 text-right">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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
    </div>
  );
}
