import Image from "next/image";
import Link from "next/link";
import { HaftaninOzeti } from "@/components/haftanin-ozeti";
import { PuanTablosu } from "@/components/puan-tablosu";
import { Reveal } from "@/components/reveal";
import { Sayac } from "@/components/sayac";
import { SosyalIcerikler } from "@/components/sosyal-icerikler";
import { VeriUyarisi } from "@/components/veri-uyarisi";
import { yaklasanMaclar, YaklasanMaclar } from "@/components/yaklasan-maclar";
import { haftaninOzeti } from "@/lib/hafta";
import {
  getDuyurularSonucu,
  getGaleri,
  getMaclarSonucu,
  getIcerik,
  getLigOzeti,
  getPuanDurumuSonucu,
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
  const [sonuc, ozet, icerik, heroGorsel, galeri, sosyal, maclarSonucu, duyurularSonucu] =
    await Promise.all([
      getPuanDurumuSonucu(),
      getLigOzeti(),
      getIcerik(),
      getSlotGorseli("hero", "/images/hero-saha.jpg"),
      getGaleri(YEDEK_GALERI),
      getSosyalIcerikler(6),
      getMaclarSonucu(),
      getDuyurularSonucu(),
    ]);

  const satirlar = sonuc.veri;
  // Veri okunamadıysa rakam basmıyoruz: "0 takım, 0 gol" güncel sanılabilir.
  const hataVar = sonuc.durum === "hata";

  const maclar = maclarSonucu.veri;
  const hafta = hataVar ? null : haftaninOzeti(maclar, satirlar, ozet.takimSayisi);

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
              {SITE.sezon} Sezonu{hataVar ? "" : ` · ${ozet.takimSayisi} Takım`}
            </p>
            <h1 className="display mt-3 text-[clamp(2.75rem,9vw,6.5rem)]">
              {icerik.hero_baslik}
              <br />
              <em className="neon-vurgu not-italic text-brand-lite">{icerik.hero_vurgu}</em>
            </h1>
            <p className="mt-5 max-w-[56ch] text-[#cfe0d5] md:text-lg">{icerik.hero_metin}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/puan-durumu"
                className="btn-parla rounded-sm bg-brand px-6 py-3.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-[#15c244]"
              >
                {icerik.hero_buton1}
              </Link>
              <Link
                href="/katil"
                className="btn-cizgi rounded-sm border-2 border-white/45 px-6 py-3.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider transition hover:border-gold hover:text-gold"
              >
                {icerik.hero_buton2}
              </Link>
            </div>
          </Reveal>
        </div>

        {!hataVar && (
        <div className="relative border-t border-white/15 bg-black/25">
          {/* "3 Branş" kaldırıldı: ligde yalnız futbol var, sayı yanıltıcıydı. */}
          <dl className="mx-auto grid w-full max-w-[1180px] grid-cols-3 px-5">
            {[
              { s: ozet.takimSayisi, l: "Takım" },
              { s: ozet.toplamMac, l: "Oynanan Maç" },
              { s: ozet.toplamGol, l: "Gol" },
            ].map((x, i) => (
              <div
                key={x.l}
                className={`py-6 text-center ${i < 2 ? "border-r border-white/15" : ""}`}
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
        )}
      </section>

      {/* HAFTANIN ÖZETİ */}
      {hafta && <HaftaninOzeti ozet={hafta} />}

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
            Tüm tabloyu gör <span aria-hidden className="ok">→</span>
          </Link>
        </Reveal>
        <Reveal>
          {hataVar ? (
            <VeriUyarisi />
          ) : (
            <PuanTablosu satirlar={satirlar} baslangicAdet={12} />
          )}
        </Reveal>
      </section>

      {/* YAKLAŞAN MAÇLAR + DUYURULAR (eski kampanya bandının yeri) */}
      <YaklasanMaclar
        maclar={yaklasanMaclar(maclar)}
        duyuruKayitlari={duyurularSonucu.veri}
        fiksturHatasi={maclarSonucu.durum === "hata"}
        duyuruHatasi={duyurularSonucu.durum === "hata"}
        arkaPlan="/images/atkilar.jpg"
      />

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
            Tüm albümler <span aria-hidden className="ok">→</span>
          </Link>
        </Reveal>
        <Reveal className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {galeri.slice(0, 4).map((g, i) => (
            <figure
              key={g.id}
              className={`foto-hover relative m-0 aspect-4/3 overflow-hidden rounded ${
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
              className="btn-parla mt-6 inline-block rounded-sm bg-brand px-6 py-3.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-white transition hover:-translate-y-0.5"
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
