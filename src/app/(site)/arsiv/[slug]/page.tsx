import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArsivSezonlari, getArsivTablosu } from "@/lib/veri";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const sezonlar = await getArsivSezonlari();
  return sezonlar.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const veri = await getArsivTablosu(slug);
  if (!veri) return {};
  const { sezon } = veri;
  return {
    title: `${sezon.ad} Sezonu — Final Puan Durumu`,
    description: `SahaBizim Ligi ${sezon.ad} sezonunun final puan durumu. ${
      sezon.sampiyon ? `Şampiyon: ${sezon.sampiyon}. ` : ""
    }${sezon.takimSayisi} takım.`,
    alternates: { canonical: `/arsiv/${sezon.slug}` },
  };
}

const BASLIKLAR = [
  { k: "o", l: "O", hep: true },
  { k: "g", l: "G", hep: false },
  { k: "b", l: "B", hep: false },
  { k: "m", l: "M", hep: false },
  { k: "a", l: "A", hep: false },
  { k: "y", l: "Y", hep: false },
  { k: "av", l: "AV", hep: true },
  { k: "p", l: "P", hep: true },
] as const;

export default async function ArsivSezonSayfasi({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const veri = await getArsivTablosu(slug);
  if (!veri) notFound();
  const { sezon, satirlar } = veri;

  const toplamGol = satirlar.reduce((s, r) => s + r.a, 0);
  const toplamMac = Math.round(satirlar.reduce((s, r) => s + r.o, 0) / 2);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-12 md:py-16">
      <Link href="/arsiv" className="font-[family-name:var(--font-data)] text-brand">
        ← Arşiv
      </Link>

      <p className="eyebrow mt-5 text-gold">Kapanmış sezon</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.6rem)]">{sezon.ad}</h1>

      {sezon.sampiyon && (
        <p className="mt-4 inline-flex flex-wrap items-center gap-3 rounded border border-gold/50 bg-gold/10 px-4 py-3">
          <span aria-hidden className="text-xl text-gold">
            ★
          </span>
          <span className="font-[family-name:var(--font-data)] text-lg font-bold tracking-wide uppercase">
            {sezon.sampiyon}
          </span>
          <span className="text-muted">sezonu şampiyon tamamladı</span>
        </p>
      )}

      <dl className="mt-7 grid grid-cols-3 gap-3">
        {[
          { l: "Takım", v: sezon.takimSayisi },
          { l: "Oynanan maç", v: toplamMac },
          { l: "Atılan gol", v: toplamGol },
        ].map((k) => (
          <div key={k.l} className="rounded border border-line bg-white p-4">
            <dt className="font-[family-name:var(--font-data)] text-xs tracking-[0.14em] text-muted uppercase">
              {k.l}
            </dt>
            <dd className="display tabular mt-1 text-3xl">{k.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 overflow-x-auto rounded border border-line bg-white">
        <table className="w-full border-collapse font-[family-name:var(--font-data)]">
          <caption className="sr-only">{sezon.ad} sezonu final puan durumu</caption>
          <thead>
            <tr className="bg-brand-deep text-left text-white">
              <th scope="col" className="px-3 py-3 text-sm tracking-wider uppercase">
                #
              </th>
              <th scope="col" className="px-3 py-3 text-sm tracking-wider uppercase">
                Takım
              </th>
              {BASLIKLAR.map((h) => (
                <th
                  key={h.k}
                  scope="col"
                  className={`px-3 py-3 text-right text-sm tracking-wider uppercase ${
                    h.hep ? "" : "hidden md:table-cell"
                  }`}
                >
                  {h.l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {satirlar.map((r) => (
              <tr
                key={r.slug}
                className={`border-t border-line ${r.sira === 1 ? "bg-gold/8" : ""}`}
              >
                <td
                  className={`tabular px-3 py-2.5 font-bold ${
                    r.sira === 1 ? "text-gold" : "text-muted"
                  }`}
                >
                  {r.sira}
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/takim/${r.slug}`} className="font-semibold hover:text-brand">
                    {r.takim_ad}
                  </Link>
                </td>
                {BASLIKLAR.map((h) => (
                  <td
                    key={h.k}
                    className={`tabular px-3 py-2.5 text-right ${
                      h.hep ? "" : "hidden md:table-cell"
                    } ${h.k === "p" ? "font-bold" : ""}`}
                  >
                    {h.k === "av" && r.av > 0 ? `+${r.av}` : r[h.k]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-muted">
        Bu tablo sezon kapanırken alınmış bir kopyadır; sonradan değişmez.
      </p>
    </div>
  );
}
