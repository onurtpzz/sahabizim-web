import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { rozet } from "@/lib/puan";
import type { Duyuru, FiksturMaci } from "@/lib/veri";
import { ligGunu, macSaati, tarihRozeti } from "@/lib/zaman";

/**
 * Anasayfadaki koyu bant: solda fikstürden en yakın tarihli maçlar, sağda son
 * duyurular. Eski "Kampanya" bandının yerini aldı; görsel dili (koyu zemin,
 * soluk arka plan fotoğrafı, altın vurgu) ondan devralındı.
 */

/** Anasayfada gösterilecek en fazla maç ve duyuru sayısı. */
const MAC_ADEDI = 6;
const DUYURU_ADEDI = 3;

/**
 * Tarihi bugün veya sonrası olan, oynanacak maçlar — en yakından uzağa.
 *
 * Karşılaştırma lig gününe göre: bugün oynanmış ama skoru henüz girilmemiş
 * akşam maçı da "yaklaşan" sayılır. Tarihi geçmiş skorsuz maçlar ve
 * ertelenenler burada gösterilmez; onlar fikstür sayfasında duruyor.
 */
export function yaklasanMaclar(maclar: FiksturMaci[], adet = MAC_ADEDI) {
  const bugun = ligGunu(new Date().toISOString());
  return maclar
    .filter((m) => m.durum === "oynanacak" && m.tarih && ligGunu(m.tarih) >= bugun)
    .sort((a, b) => (a.tarih ?? "").localeCompare(b.tarih ?? ""))
    .slice(0, adet);
}

/** Yalnız duyurular (kurallar hariç); sabitlenenler önce, sonra en yeni. */
export function sonDuyurular(hepsi: Duyuru[], adet = DUYURU_ADEDI) {
  return hepsi.filter((d) => d.tur === "duyuru").slice(0, adet);
}

const BAGLANTI =
  "border-b-2 pb-0.5 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider transition";

export function YaklasanMaclar({
  maclar,
  duyurular,
  fiksturHatasi,
  arkaPlan,
}: {
  maclar: FiksturMaci[];
  duyurular: Duyuru[];
  fiksturHatasi: boolean;
  arkaPlan: string;
}) {
  // Maçlar lig gününe göre gruplanıyor; ISO damgasının ilk 10 hanesi UTC'dir.
  const gunler = new Map<string, FiksturMaci[]>();
  for (const m of maclar) {
    const anahtar = ligGunu(m.tarih!);
    gunler.set(anahtar, [...(gunler.get(anahtar) ?? []), m]);
  }

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="absolute inset-0">
        <Image src={arkaPlan} alt="" fill sizes="100vw" className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/85 to-ink/60" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1180px] gap-12 px-5 py-14 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:py-20">
        {/* YAKLAŞAN MAÇLAR */}
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
              Tüm fikstür →
            </Link>
          </Reveal>

          <Reveal>
            {fiksturHatasi ? (
              <BosKutu metin="Fikstür şu an okunamıyor. Birkaç dakika içinde kendiliğinden düzelir." />
            ) : maclar.length === 0 ? (
              <BosKutu metin="Önümüzdeki günler için henüz maç girilmedi. Geçmiş sonuçlar fikstür sayfasında." />
            ) : (
              <div className="grid gap-5">
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

        {/* DUYURULAR */}
        <div>
          <Reveal delay={100} className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-brand-lite">Ligden haberler</p>
              <h2 className="display mt-2 text-[clamp(2rem,5.5vw,3.2rem)]">Duyurular</h2>
            </div>
            <Link
              href="/kurallar-ve-duyurular#duyurular"
              className={`${BAGLANTI} border-brand-lite text-brand-lite hover:border-white hover:text-white`}
            >
              Tüm duyurular →
            </Link>
          </Reveal>

          <Reveal delay={120}>
            {duyurular.length === 0 ? (
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
    <li className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/10 px-3 py-3 last:border-b-0 md:gap-3 md:px-4">
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
      className={`flex min-w-0 items-center gap-2 font-[family-name:var(--font-data)] text-[15px] font-semibold leading-tight text-white hover:text-brand-lite md:text-base ${
        yon === "sag" ? "flex-row-reverse text-right" : ""
      }`}
    >
      {takim.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={takim.logoUrl}
          alt=""
          className="hidden h-7 w-7 flex-none rounded-full bg-white/90 object-contain sm:block"
        />
      ) : (
        <span
          aria-hidden
          style={{ background: r.renk }}
          className="hidden h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-bold text-white sm:grid"
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
        className={`group block border-l-[3px] bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.08] ${
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
