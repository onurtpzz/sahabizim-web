import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { getIcerik, getLigOzeti, getSlotGorseli } from "@/lib/veri";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Biz Kimiz",
  description:
    "SahaBizim Ligi nasıl kuruldu, neyi amaçlıyor ve nasıl işliyor — takımlar, fikstür ve saha içi kurallar.",
  alternates: { canonical: "/biz-kimiz" },
};

export default async function BizKimizSayfasi() {
  const [icerik, ozet, gorsel] = await Promise.all([
    getIcerik(),
    getLigOzeti(),
    getSlotGorseli("bizkimiz", "/images/tribun.jpg"),
  ]);

  const paragraflar = icerik.bizkimiz_metin.split(/\n{2,}/).filter(Boolean);
  // "Başlık|Açıklama" biçiminde, her satır bir etkinlik.
  const etkinlikler = icerik.bizkimiz_etkinlikler
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [b, ...kalan] = s.split("|");
      return { baslik: b.trim(), metin: kalan.join("|").trim() };
    });
  const degerler = [icerik.bizkimiz_deger1, icerik.bizkimiz_deger2, icerik.bizkimiz_deger3]
    .filter(Boolean)
    .map((d) => {
      const [b, ...kalan] = d.split("|");
      return { baslik: b.trim(), metin: kalan.join("|").trim() };
    });

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <Image src={gorsel} alt="" fill sizes="100vw" className="object-cover opacity-35" />
          <div className="absolute inset-0 bg-linear-to-b from-ink/60 via-ink/75 to-ink" />
        </div>
        <div className="relative mx-auto w-full max-w-[1180px] px-5 py-14 md:py-20">
          <p className="eyebrow text-brand-lite">Biz Kimiz</p>
          <h1 className="display mt-3 text-[clamp(2.4rem,7vw,4.5rem)]">
            {icerik.bizkimiz_baslik}
          </h1>
          <p className="mt-4 max-w-[54ch] text-[#cfe0d5] md:text-lg">{icerik.bizkimiz_ozet}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-5 text-lg leading-relaxed">
            {paragraflar.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>

          <aside className="grid h-fit gap-3 rounded border border-line bg-white p-6">
            <h2 className="font-[family-name:var(--font-data)] text-sm uppercase tracking-[0.14em] text-muted">
              Rakamlarla lig
            </h2>
            <dl className="grid gap-4">
              {[
                { l: "Takım", v: ozet.takimSayisi },
                { l: "Oynanan maç", v: ozet.toplamMac },
                { l: "Atılan gol", v: ozet.toplamGol },
              ].map((k) => (
                <div key={k.l} className="flex items-baseline justify-between gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0">
                  <dt className="font-[family-name:var(--font-data)] text-muted">{k.l}</dt>
                  <dd className="display tabular text-3xl">{k.v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted">{SITE.sezon} sezonu</p>
          </aside>
        </div>

        {degerler.length > 0 && (
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {degerler.map((d) => (
              <li key={d.baslik} className="rounded border-l-[3px] border-brand bg-white p-5">
                <strong className="font-[family-name:var(--font-data)] text-lg uppercase tracking-wide">
                  {d.baslik}
                </strong>
                <p className="mt-1 text-muted">{d.metin}</p>
              </li>
            ))}
          </ul>
        )}

      </section>

      {/* ORGANİZASYONLAR VE SOSYAL ETKİNLİKLER */}
      {etkinlikler.length > 0 && (
        <section className="border-y border-line bg-ink text-white">
          <div className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-20">
            <p className="eyebrow text-gold">Saha dışında</p>
            <h2 className="display mt-3 text-[clamp(1.9rem,5vw,3rem)]">
              {icerik.bizkimiz_etkinlik_baslik}
            </h2>
            <p className="mt-4 max-w-[62ch] text-[#cfe0d5]">{icerik.bizkimiz_etkinlik_metin}</p>

            <ul className="mt-9 grid gap-px overflow-hidden rounded border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-4">
              {etkinlikler.map((e, i) => (
                <li
                  key={e.baslik}
                  className="group relative bg-ink p-6 transition-colors hover:bg-ink-2"
                >
                  <span
                    aria-hidden
                    className="display block text-3xl text-white/12 transition-colors group-hover:text-gold/45"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-[family-name:var(--font-data)] text-xl font-bold uppercase tracking-wide text-brand-lite">
                    {e.baslik}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#cfe0d5]">{e.metin}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-16">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/katil"
            className="rounded-sm bg-brand px-6 py-3.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-white transition hover:-translate-y-0.5"
          >
            Takımını Kaydet
          </Link>
          <Link
            href="/puan-durumu"
            className="rounded-sm border-2 border-ink px-6 py-3.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider transition hover:border-brand hover:text-brand"
          >
            Puan Durumu
          </Link>
        </div>
      </section>
    </>
  );
}
