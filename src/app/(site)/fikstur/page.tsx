import type { Metadata } from "next";
import Link from "next/link";
import { VeriUyarisi } from "@/components/veri-uyarisi";
import { rozet } from "@/lib/puan";
import { SITE } from "@/lib/site";
import { getMaclarSonucu, type FiksturMaci } from "@/lib/veri";
import { gunBasligi, ligGunu, macSaati } from "@/lib/zaman";

export const revalidate = 60;

/** Bir sayfada gösterilen sonuç sayısı. Oynanacak maçlar bölünmez. */
const SONUC_SAYFA_BOYU = 40;

type Arama = { sayfa?: string };

function sayfaNo(ham: string | undefined, enFazla: number) {
  const n = Number.parseInt(ham ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, Math.max(enFazla, 1));
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Arama>;
}): Promise<Metadata> {
  const { sayfa } = await searchParams;
  const n = Number.parseInt(sayfa ?? "1", 10);
  const ilk = !Number.isFinite(n) || n <= 1;

  return {
    title: ilk ? "Fikstür" : `Fikstür — sayfa ${n}`,
    description: ilk
      ? `SahaBizim Ligi ${SITE.sezon} sezonu fikstürü, maç sonuçları ve oynanacak maçlar.`
      : `SahaBizim Ligi ${SITE.sezon} sezonu geçmiş maç sonuçları — sayfa ${n}.`,
    // Her sayfa kendini işaret ediyor; aksi hâlde Google alt sayfaları
    // birinci sayfanın kopyası sayıp yok sayardı.
    alternates: { canonical: ilk ? "/fikstur" : `/fikstur?sayfa=${n}` },
  };
}

export default async function FiksturSayfasi({
  searchParams,
}: {
  searchParams: Promise<Arama>;
}) {
  const [sonuc, { sayfa }] = await Promise.all([getMaclarSonucu(), searchParams]);
  const maclar = sonuc.veri;

  const oynanacak = maclar.filter((m) => m.durum === "oynanacak" || m.durum === "ertelendi");
  const oynanan = maclar.filter((m) => m.durum === "oynandi" || m.durum === "hukmen");

  const toplamSayfa = Math.max(1, Math.ceil(oynanan.length / SONUC_SAYFA_BOYU));
  const su = sayfaNo(sayfa, toplamSayfa);
  const ilkSayfa = su === 1;
  const dilim = oynanan.slice((su - 1) * SONUC_SAYFA_BOYU, su * SONUC_SAYFA_BOYU);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-12 md:py-16">
      <p className="eyebrow text-brand">{SITE.sezon} Sezonu</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.6rem)]">Fikstür</h1>
      <Link
        href="/puan-durumu"
        className="btn-parla mt-5 inline-flex items-center gap-2 rounded-sm bg-brand px-6 py-3 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-brand-deep"
      >
        Güncel puan durumunu görmek için tıklayın <span aria-hidden className="ok">→</span>
      </Link>

      {sonuc.durum === "hata" ? (
        <div className="mt-8">
          <VeriUyarisi metin="Sunucu veritabanına ulaşamadı, bu yüzden fikstür şu an gösterilemiyor. Eksik bir liste göstermektense hiç göstermemeyi tercih ediyoruz; birkaç dakika içinde kendiliğinden düzelir." />
        </div>
      ) : maclar.length === 0 ? (
        <div className="mt-8 rounded border border-line bg-white p-8">
          <h2 className="font-[family-name:var(--font-data)] text-xl font-bold uppercase tracking-wide">
            Henüz maç kaydı yok
          </h2>
          <p className="mt-3 max-w-[60ch] text-muted">
            Maçlar girildikçe burada tarih sırasıyla listelenecek.
          </p>
          <p className="mt-5">
            <Link
              href="/puan-durumu"
              className="font-[family-name:var(--font-data)] font-bold text-brand hover:underline"
            >
              Güncel puan durumuna git <span aria-hidden className="ok">→</span>
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-9 grid gap-10">
          {/* Oynanacak maçlar yalnız ilk sayfada; ziyaretçi çoğunlukla
              "bu hafta kim oynuyor" diye geliyor, o bilgi bölünmemeli. */}
          {ilkSayfa && oynanacak.length > 0 && (
            <Bolum baslik="Oynanacak maçlar" maclar={oynanacak} />
          )}

          {dilim.length > 0 && (
            <Bolum
              baslik={ilkSayfa ? "Sonuçlar" : `Sonuçlar — sayfa ${su}`}
              maclar={dilim}
            />
          )}

          {toplamSayfa > 1 && (
            <Sayfalama su={su} toplam={toplamSayfa} adet={oynanan.length} />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Sonuç sayfaları arası gezinme.
 *
 * Düğmeler yerine `<Link>` kullanılıyor: sunucuda üretildikleri için Google
 * geçmiş sonuçları da tarayabiliyor, JavaScript kapalıyken de çalışıyorlar.
 */
function Sayfalama({ su, toplam, adet }: { su: number; toplam: number; adet: number }) {
  const adres = (n: number) => (n === 1 ? "/fikstur" : `/fikstur?sayfa=${n}`);
  const stil =
    "btn-cizgi rounded-sm border border-line bg-white px-4 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider transition hover:border-brand hover:text-brand";

  return (
    <nav aria-label="Sonuç sayfaları" className="flex flex-wrap items-center gap-3">
      {su > 1 ? (
        <Link href={adres(su - 1)} rel="prev" className={stil}>
          ← Daha yeni
        </Link>
      ) : (
        <span className={`${stil} cursor-default opacity-40`}>← Daha yeni</span>
      )}

      <p className="font-[family-name:var(--font-data)] text-sm tracking-wide text-muted">
        Sayfa {su} / {toplam} · {adet} sonuç
      </p>

      {su < toplam ? (
        <Link href={adres(su + 1)} rel="next" className={stil}>
          Daha eski <span aria-hidden className="ok">→</span>
        </Link>
      ) : (
        <span className={`${stil} cursor-default opacity-40`}>Daha eski →</span>
      )}
    </nav>
  );
}

function Bolum({ baslik, maclar }: { baslik: string; maclar: FiksturMaci[] }) {
  // Gruplama lig saatine göre: ISO damgasının ilk 10 hanesi UTC tarihidir,
  // akşam maçlarında gün kaymasına yol açabilir.
  const gunler = new Map<string, FiksturMaci[]>();
  for (const m of maclar) {
    const anahtar = m.tarih ? ligGunu(m.tarih) : "tarihsiz";
    const liste = gunler.get(anahtar) ?? [];
    liste.push(m);
    gunler.set(anahtar, liste);
  }

  return (
    <section>
      <h2 className="display text-[clamp(1.5rem,4vw,2.1rem)]">{baslik}</h2>
      <div className="mt-4 grid gap-6">
        {[...gunler.entries()].map(([gun, liste]) => (
          <div key={gun}>
            <h3 className="mb-2 font-[family-name:var(--font-data)] text-sm uppercase tracking-[0.14em] text-muted">
              {gun === "tarihsiz" ? "Tarihi belirlenmedi" : gunBasligi(gun, true)}
            </h3>
            <ul className="overflow-hidden rounded border border-line bg-white">
              {liste.map((m) => (
                <MacSatiri key={m.id} mac={m} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function MacSatiri({ mac }: { mac: FiksturMaci }) {
  const oynandi = mac.durum === "oynandi" || mac.durum === "hukmen";
  const evKazandi = oynandi && (mac.evSkor ?? 0) > (mac.depSkor ?? 0);
  const depKazandi = oynandi && (mac.depSkor ?? 0) > (mac.evSkor ?? 0);
  const saat = macSaati(mac.tarih);

  return (
    <li className="satir-neon grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line px-3 py-3 last:border-b-0 md:gap-4 md:px-5">
      <Taraf takim={mac.ev} kazandi={evKazandi} yon="sag" />

      <div className="flex min-w-[76px] flex-col items-center">
        {oynandi ? (
          <span className="tabular font-[family-name:var(--font-display)] text-2xl">
            {mac.evSkor} – {mac.depSkor}
          </span>
        ) : mac.durum === "ertelendi" ? (
          <span className="font-[family-name:var(--font-data)] text-sm uppercase tracking-wider text-muted">
            Ertelendi
          </span>
        ) : saat ? (
          /* Saat girilmişse "vs" yerine saat — fikstürde en çok aranan bilgi bu. */
          <span className="tabular font-[family-name:var(--font-data)] text-xl font-bold text-ink">
            {saat}
          </span>
        ) : (
          <span className="font-[family-name:var(--font-data)] text-sm uppercase tracking-wider text-muted">
            vs
          </span>
        )}
        {mac.durum === "hukmen" && (
          <span className="font-[family-name:var(--font-data)] text-[11px] uppercase tracking-wider text-gold">
            Hükmen
          </span>
        )}
      </div>

      <Taraf takim={mac.dep} kazandi={depKazandi} yon="sol" />
    </li>
  );
}

function Taraf({
  takim,
  kazandi,
  yon,
}: {
  takim: FiksturMaci["ev"];
  kazandi: boolean;
  yon: "sag" | "sol";
}) {
  const r = rozet(takim.ad);
  return (
    <Link
      href={`/takim/${takim.slug}`}
      className={`group flex min-w-0 items-center gap-2.5 font-[family-name:var(--font-data)] text-[15px] font-semibold hover:text-brand md:text-[17px] ${
        yon === "sag" ? "flex-row-reverse text-right" : ""
      } ${kazandi ? "text-ink" : "text-muted"}`}
    >
      {takim.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={takim.logoUrl}
          alt=""
          className="h-7 w-7 flex-none rounded-full object-contain transition-transform duration-300 group-hover:scale-115 md:h-8 md:w-8"
        />
      ) : (
        <span
          aria-hidden
          style={{ background: r.renk }}
          className="grid h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-bold text-white transition-transform duration-300 group-hover:scale-115 md:h-8 md:w-8"
        >
          {r.harf}
        </span>
      )}
      <span className="truncate">{takim.ad}</span>
    </Link>
  );
}
