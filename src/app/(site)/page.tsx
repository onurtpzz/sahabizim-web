import Image from "next/image";
import Link from "next/link";
import { PuanTablosu } from "@/components/puan-tablosu";
import { Reveal } from "@/components/reveal";
import { Sayac } from "@/components/sayac";
import { SosyalIcerikler } from "@/components/sosyal-icerikler";
import {
  getGaleri,
  getIcerik,
  getLigOzeti,
  getPuanDurumu,
  getSlotGorseli,
  getSosyalIcerikler,
} from "@/lib/veri";
import { SITE } from "@/lib/site";

export const revalidate = 60;

const YEDEK_GALERI = [
  { id: "1", url: "/images/saha-dumani.jpg", alt: "Işıklar altında saha", baslik: null, album: null },
  { id: "2", url: "/images/tribun.jpg", alt: "Tribün", baslik: null, album: null },
  { id: "3", url: "/images/gece-maci.jpg", alt: "Gece maçı", baslik: null, album: null },
  { id: "4", url: "/images/taraftar.jpg", alt: "Taraftarlar", baslik: null, album: null },
];

export default async function Anasayfa() {
  const [satirlar, ozet, icerik, heroGorsel, kampanyaGorsel, kampanyaYan, galeri, sosyal] =
    await Promise.all([
    getPuanDurumu(),
    getLigOzeti(),
    getIcerik(),
    getSlotGorseli("hero", "/images/hero-saha.jpg"),
    getSlotGorseli("kampanya", "/images/atkilar.jpg"),
    getSlotGorseli("kampanya-yan", "/images/atki.jpg"),
    getGaleri(YEDEK_GALERI),
    getSosyalIcerikler(6),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <Image
            src={heroGorsel}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-linear-to-b from-ink/60 via-ink/75 to-ink" />
        </div>

        <div className="relative mx-auto w-full max-w-[1180px] px-5 py-14 md:py-24">
          <Reveal>
            <p className="eyebrow text-brand-lite">
              {SITE.sezon} Sezonu · {ozet.takimSayisi} Takım
            </p>
            <h1 className="display mt-3 text-[clamp(2.75rem,9vw,6.5rem)]">
              {icerik.hero_baslik}
              <br />
              <em className="not-italic text-brand-lite">{icerik.hero_vurgu}</em>
            </h1>
            <p className="mt-5 max-w-[56ch] text-[#cfe0d5] md:text-lg">{icerik.hero_metin}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/puan-durumu"
                className="rounded-sm bg-brand px-6 py-3.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-[#15c244]"
              >
                {icerik.hero_buton1}
              </Link>
              <Link
                href="/katil"
                className="rounded-sm border-2 border-white/45 px-6 py-3.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider transition hover:border-gold hover:text-gold"
              >
                {icerik.hero_buton2}
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="relative border-t border-white/15 bg-black/25">
          <dl className="mx-auto grid w-full max-w-[1180px] grid-cols-2 px-5 md:grid-cols-4">
            {[
              { s: ozet.takimSayisi, l: "Takım" },
              { s: ozet.toplamMac, l: "Oynanan Maç" },
              { s: ozet.toplamGol, l: "Gol" },
              { s: 3, l: "Branş" },
            ].map((x, i) => (
              <div
                key={x.l}
                className={`py-6 text-center ${i < 3 ? "md:border-r md:border-white/15" : ""} ${
                  i < 2 ? "border-b border-white/15 md:border-b-0" : ""
                } ${i % 2 === 0 ? "border-r border-white/15 md:border-r" : ""}`}
              >
                <dd className="display text-[clamp(1.9rem,5vw,2.9rem)] text-white">
                  <Sayac hedef={x.s} />
                </dd>
                <dt className="font-[family-name:var(--font-data)] text-[13px] uppercase tracking-[0.16em] text-muted-dark">
                  {x.l}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* PUAN DURUMU */}
      <section className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-20">
        <Reveal className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow text-brand">Lig</p>
            <h2 className="display text-[clamp(1.9rem,5vw,3rem)]">Puan Durumu</h2>
          </div>
          <Link
            href="/puan-durumu"
            className="border-b-2 border-brand pb-0.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-brand"
          >
            Tüm tabloyu gör →
          </Link>
        </Reveal>
        <Reveal>
          <PuanTablosu satirlar={satirlar} baslangicAdet={12} />
        </Reveal>
      </section>

      {/* KAMPANYA */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <Image src={kampanyaGorsel} alt="" fill sizes="100vw" className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/70 to-ink/40" />
        </div>
        <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-9 px-5 py-14 md:grid-cols-[1.15fr_0.85fr] md:py-20">
          <Reveal>
            <p className="eyebrow text-gold">Kampanya</p>
            <h2 className="display mt-3 text-[clamp(2rem,5.5vw,3.6rem)]">
              {icerik.kampanya_baslik}
              <br />
              <em className="not-italic text-gold">{icerik.kampanya_vurgu}</em>
            </h2>
            <p className="mt-4 max-w-[48ch] text-[#cfe0d5]">{icerik.kampanya_metin}</p>
            <Link
              href="/katil"
              className="mt-6 inline-block rounded-sm bg-brand px-6 py-3.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-white transition hover:-translate-y-0.5"
            >
              {icerik.kampanya_buton}
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <Image
              src={kampanyaYan}
              alt="Atkısını kaldıran taraftar"
              width={700}
              height={470}
              sizes="(max-width: 768px) 100vw, 40vw"
              className="rounded border-[6px] border-white/10"
            />
          </Reveal>
        </div>
      </section>

      {/* GALERİ */}
      <section className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-20">
        <Reveal className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow text-brand">Saha içi</p>
            <h2 className="display text-[clamp(1.9rem,5vw,3rem)]">Galeri</h2>
          </div>
          <Link
            href="/galeri"
            className="border-b-2 border-brand pb-0.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-brand"
          >
            Tüm albümler →
          </Link>
        </Reveal>
        <Reveal className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {galeri.slice(0, 4).map((g, i) => (
            <figure
              key={g.id}
              className={`relative m-0 aspect-4/3 overflow-hidden rounded ${
                i === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              <Image
                src={g.url}
                alt={g.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
            </figure>
          ))}
        </Reveal>
      </section>

      {/* SOSYAL İÇERİKLER */}
      {sosyal.length > 0 && (
        <section className="border-t border-line bg-white">
          <div className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-20">
            <Reveal className="mb-7">
              <p className="eyebrow text-brand">Sosyal medya</p>
              <h2 className="display text-[clamp(1.9rem,5vw,3rem)]">{icerik.sosyal_baslik}</h2>
              <p className="mt-3 max-w-[60ch] text-muted">{icerik.sosyal_metin}</p>
            </Reveal>
            <Reveal>
              <SosyalIcerikler icerikler={sosyal} />
            </Reveal>
          </div>
        </section>
      )}

      {/* KATIL */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-8 px-5 py-14 md:grid-cols-2 md:py-20">
          <Reveal>
            <p className="eyebrow text-brand">Aramıza Katıl</p>
            <h2 className="display mt-2 text-[clamp(1.9rem,5vw,3rem)]">{icerik.katil_baslik}</h2>
            <p className="mt-3 max-w-[50ch] text-muted">{icerik.katil_metin}</p>
            <Link
              href="/katil"
              className="mt-6 inline-block rounded-sm bg-brand px-6 py-3.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-white transition hover:-translate-y-0.5"
            >
              Başvuru Formu
            </Link>
          </Reveal>
          <Reveal delay={100} className="rounded border border-line bg-paper p-6">
            <ul className="grid gap-3 font-[family-name:var(--font-data)] text-lg">
              {icerik.katil_maddeler
                .split("\n")
                .filter(Boolean)
                .map((m) => (
                  <li key={m}>✅ {m}</li>
                ))}
            </ul>
            <p className="mt-5 text-sm text-muted">
              {icerik.yetkili} · {icerik.telefon}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
