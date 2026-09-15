import Image from "next/image";
import Link from "next/link";
import { KuralListesi } from "@/components/kural-listesi";
import { Reveal } from "@/components/reveal";
import { rozet } from "@/lib/puan";
import type { Duyuru, FiksturMaci } from "@/lib/veri";
import { ligGunu, macSaati, tarihRozeti } from "@/lib/zaman";

/**
 * Anasayfadaki koyu bant: solda fikstürden en yakın tarihli maçlar, sağda son
 * duyurular. Eski "Kampanya" bandının yerini aldı; görsel dili (koyu zemin,
 * soluk arka plan fotoğrafı, altın vurgu) ondan devralındı.
 */

/** Anasayfada gösterilecek maç günü, duyuru ve kural sayısı. */
const MAC_GUNU_ADEDI = 2;
const DUYURU_ADEDI = 3;
const KURAL_ADEDI = 5;

/**
 * Maç olan en yakın iki günün bütün maçları — en yakından uzağa.
 *
 * Maç sayısıyla değil gün sayısıyla kesiliyor: bir günün maçları yarıda
 * bölünmesin. Tamamı fikstür sayfasında.
 *
 * Karşılaştırma lig gününe göre: bugün oynanmış ama skoru henüz girilmemiş
 * akşam maçı da "yaklaşan" sayılır. Tarihi geçmiş skorsuz maçlar ve
 * ertelenenler burada gösterilmez; onlar fikstür sayfasında duruyor.
 */
export function yaklasanMaclar(maclar: FiksturMaci[], gunAdedi = MAC_GUNU_ADEDI) {
  const bugun = ligGunu(new Date().toISOString());
  const sirali = maclar
    .filter((m) => m.durum === "oynanacak" && m.tarih && ligGunu(m.tarih) >= bugun)
    .sort((a, b) => (a.tarih ?? "").localeCompare(b.tarih ?? ""));
  const gunler = [...new Set(sirali.map((m) => ligGunu(m.tarih!)))].slice(0, gunAdedi);
  return sirali.filter((m) => gunler.includes(ligGunu(m.tarih!)));
}

const BAGLANTI =
  "border-b-2 pb-0.5 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider transition";

export function YaklasanMaclar({
  maclar,
  duyuruKayitlari,
  fiksturHatasi,
  duyuruHatasi,
  arkaPlan,
}: {
  maclar: FiksturMaci[];
  /** Duyuru ve kuralların tamamı; burada ayrılıp kısaltılıyor. */
  duyuruKayitlari: Duyuru[];
  fiksturHatasi: boolean;
  duyuruHatasi: boolean;
  arkaPlan: string;
}) {
  // Sıralama veritabanından geliyor: sabitlenenler önce, sonra en yeni.
  const duyurular = duyuruKayitlari.filter((d) => d.tur === "duyuru").slice(0, DUYURU_ADEDI);
  const tumKurallar = duyuruKayitlari.filter((d) => d.tur === "kural");

  const bugun = ligGunu(new Date().toISOString());

  // Maçlar lig gününe göre gruplanıyor; ISO damgasının ilk 10 hanesi UTC'dir.
  const gunler = new Map<string, FiksturMaci[]>();
  for (const m of maclar) {
    const anahtar = ligGunu(m.tarih!);
    gunler.set(anahtar, [...(gunler.get(anahtar) ?? []), m]);
  }

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      {/*
        Arka plan fotoğrafı bölümün boyuna bağlı DEĞİL: sabit yükseklikte, üstte
        duruyor ve altı zemine eriyor. `inset-0` + `object-cover` olsaydı bir kural
        açılıp bölüm uzadığında fotoğraf yeniden ölçeklenip "büyüyordu".
      */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[640px]">
        <Image
          src={arkaPlan}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top opacity-20"
        />
        <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/85 to-ink/60" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-b from-transparent to-ink" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1180px] gap-14 px-5 py-14 md:gap-16 md:py-20">
        {/* 1. SATIR — YAKLAŞAN MAÇLAR (tam genişlik) */}
        <div>
          <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-gold">Fikstür</p>
              <h2 className="display mt-2 text-[clamp(2rem,5.5vw,3.2rem)]">
                Yaklaşan <em className="not-italic text-gold">Maçlar</em>
              </h2>
            </div>
            <Link
              href="/fikstur"
              className={`${BAGLANTI} border-gold text-gold hover:border-white hover:text-white`}
            >
              Tüm fikstür <span aria-hidden className="ok">→</span>
            </Link>
          </Reveal>

          <Reveal>
            {fiksturHatasi ? (
              <BosKutu metin="Fikstür şu an okunamıyor. Birkaç dakika içinde kendiliğinden düzelir." />
            ) : maclar.length === 0 ? (
              <BosKutu metin="Önümüzdeki günler için henüz maç girilmedi. Geçmiş sonuçlar fikstür sayfasında." />
            ) : (
              // Geniş ekranda iki gün yan yana; tek gün varsa tam genişlik.
              <div className={`grid items-start gap-5 ${gunler.size > 1 ? "lg:grid-cols-2 lg:gap-8" : ""}`}>
                {[...gunler.entries()].map(([gun, liste]) => {
                  const t = tarihRozeti(gun);
                  return (
                    <div key={gun} className="grid gap-2 md:grid-cols-[58px_1fr] md:gap-4">
                      {/* Masaüstünde solda tarih rozeti; mobilde yer dar, tek satır başlık. */}
                      <time
                        dateTime={gun}
                        className="hidden h-fit flex-col items-center rounded-sm border border-white/15 bg-white/[0.06] py-2 font-[family-name:var(--font-data)] md:flex"
                      >
                        <span className="display text-2xl leading-none text-white">{t.gun}</span>
                        <span className="mt-1 text-xs uppercase tracking-wider text-gold">
                          {t.ay}
                        </span>
                      </time>
                      <div className="min-w-0">
                        <p className="mb-1.5 font-[family-name:var(--font-data)] text-xs uppercase tracking-[0.14em] text-muted-dark">
                          <span className="font-bold text-gold md:hidden">
                            {t.gun} {t.ay} ·{" "}
                          </span>
                          {t.haftaGunu}
                          {gun === bugun && (
                            <span className="bugun-rozet ml-2 inline-flex items-center gap-1 rounded-full bg-brand/20 px-2 py-0.5 align-middle text-[10px] font-bold tracking-[0.14em] text-brand-lite">
                              <span aria-hidden className="canli-nokta h-1.5 w-1.5 rounded-full bg-brand-lite" />
                              Bugün
                            </span>
                          )}
                        </p>
                        <ul className="overflow-hidden rounded-sm border border-white/12 bg-white/[0.04]">
                          {liste.map((m) => (
                            <MacSatiri key={m.id} mac={m} />
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Reveal>
        </div>

        {/* 2. SATIR — DUYURULAR | KURALLAR (mobilde alt alta) */}
        <div className="grid items-start gap-14 md:grid-cols-2 md:gap-10">
          <div>
            <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-brand-lite">Ligden haberler</p>
                <h2 className="display mt-2 text-[clamp(2rem,5.5vw,3.2rem)]">Duyurular</h2>
              </div>
              <Link
                href="/kurallar-ve-duyurular#duyurular"
                className={`${BAGLANTI} border-brand-lite text-brand-lite hover:border-white hover:text-white`}
              >
                Tüm duyurular <span aria-hidden className="ok">→</span>
              </Link>
            </Reveal>

            <Reveal delay={80}>
              {duyuruHatasi ? (
                <BosKutu metin="Duyurular şu an okunamıyor. Birkaç dakika içinde kendiliğinden düzelir." />
              ) : duyurular.length === 0 ? (
                <BosKutu metin="Henüz duyuru yok. Lig ile ilgili her yenilik önce burada görünecek." />
              ) : (
                <ul className="grid gap-3">
                  {duyurular.map((d) => (
                    <DuyuruKarti key={d.id} duyuru={d} />
                  ))}
                </ul>
              )}
            </Reveal>
          </div>

          {/* Hata anında soldaki kutu yeterli; ikinci uyarı basılmıyor. */}
          {!duyuruHatasi && tumKurallar.length > 0 && (
            <Reveal delay={120}>
              <Kurallar kurallar={tumKurallar} />
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function BosKutu({ metin }: { metin: string }) {
  return (
    <p className="rounded-sm border border-white/12 bg-white/[0.04] p-5 text-[#cfe0d5]">{metin}</p>
  );
}

function MacSatiri({ mac }: { mac: FiksturMaci }) {
  const saat = macSaati(mac.tarih);
  return (
    <li className="satir-neon satir-neon-koyu grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/10 px-3 py-3 last:border-b-0 md:gap-3 md:px-4">
      <Taraf takim={mac.ev} yon="sag" />
      <span
        className={`min-w-[52px] rounded-sm px-1.5 py-1 md:min-w-[58px] md:px-2 text-center font-[family-name:var(--font-data)] ${
          saat
            ? "tabular bg-gold/15 text-lg font-bold text-gold"
            : "text-xs uppercase tracking-wider text-muted-dark"
        }`}
      >
        {saat ?? "vs"}
      </span>
      <Taraf takim={mac.dep} yon="sol" />
    </li>
  );
}

function Taraf({ takim, yon }: { takim: FiksturMaci["ev"]; yon: "sag" | "sol" }) {
  const r = rozet(takim.ad);
  return (
    <Link
      href={`/takim/${takim.slug}`}
      className={`group flex min-w-0 items-center gap-2 font-[family-name:var(--font-data)] text-[15px] font-semibold leading-tight text-white hover:text-brand-lite md:text-base ${
        yon === "sag" ? "flex-row-reverse text-right" : ""
      }`}
    >
      {takim.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={takim.logoUrl}
          alt=""
          className="hidden h-7 w-7 flex-none rounded-full bg-white/90 object-contain transition-transform duration-300 group-hover:scale-115 sm:block"
        />
      ) : (
        <span
          aria-hidden
          style={{ background: r.renk }}
          className="hidden h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-bold text-white transition-transform duration-300 group-hover:scale-115 sm:grid"
        >
          {r.harf}
        </span>
      )}
      <span className="line-clamp-2 break-words sm:truncate">{takim.ad}</span>
    </Link>
  );
}

function DuyuruKarti({ duyuru: d }: { duyuru: Duyuru }) {
  const t = d.tarih ? tarihRozeti(d.tarih) : null;
  // Anasayfada yalnız ilk paragraf; devamı duyurular sayfasında.
  const ozet = d.metin.split(/\n{2,}/).find((p) => p.trim()) ?? "";

  return (
    <li>
      <Link
        href="/kurallar-ve-duyurular#duyurular"
        className={`kart-koyu group block border-l-[3px] bg-white/[0.04] p-5 ${
          d.sabit ? "border-l-gold" : "border-l-brand"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2.5 font-[family-name:var(--font-data)] text-xs uppercase tracking-[0.14em]">
          {t && d.tarih && (
            <time dateTime={d.tarih} className="text-muted-dark">
              {t.gun} {t.ay}
            </time>
          )}
          {d.sabit && (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 font-bold text-gold">
              Öne çıkan
            </span>
          )}
        </div>
        <h3 className="mt-2 font-[family-name:var(--font-data)] text-lg font-bold leading-snug tracking-wide text-white uppercase group-hover:text-brand-lite">
          {d.baslik}
        </h3>
        {ozet && <p className="mt-1.5 line-clamp-2 text-[15px] text-[#cfe0d5]">{ozet}</p>}
      </Link>
    </li>
  );
}

/** Kısa kural listesi: yalnız başlıklar, dokununca açıklama açılıyor. */
function Kurallar({ kurallar }: { kurallar: Duyuru[] }) {
  const gosterilen = kurallar.slice(0, KURAL_ADEDI);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold">Saha içi</p>
          <h2 className="display mt-2 text-[clamp(2rem,5.5vw,3.2rem)]">Kurallar</h2>
        </div>
        <Link
          href="/kurallar-ve-duyurular#kurallar"
          className={`${BAGLANTI} border-gold text-gold hover:border-white hover:text-white`}
        >
          Tüm kurallar ({kurallar.length}) <span aria-hidden className="ok">→</span>
        </Link>
      </div>
      <KuralListesi kurallar={gosterilen} />
    </div>
  );
}
