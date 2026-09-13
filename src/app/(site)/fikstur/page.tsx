import type { Metadata } from "next";
import Link from "next/link";
import { rozet } from "@/lib/puan";
import { SITE } from "@/lib/site";
import { CanliYayinKarti } from "@/components/canli-yayin";
import { getIcerik, getMaclar, type FiksturMaci } from "@/lib/veri";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Fikstür",
  description: `SahaBizim Ligi ${SITE.sezon} sezonu fikstürü, maç sonuçları ve oynanacak maçlar.`,
  alternates: { canonical: "/fikstur" },
};

export default async function FiksturSayfasi() {
  const [maclar, icerik] = await Promise.all([getMaclar(), getIcerik()]);
  const oynanacak = maclar.filter((m) => m.durum === "oynanacak" || m.durum === "ertelendi");
  const oynanan = maclar.filter((m) => m.durum === "oynandi" || m.durum === "hukmen");

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-12 md:py-16">
      <p className="eyebrow text-brand">{SITE.sezon} Sezonu</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.6rem)]">Fikstür</h1>
      <p className="mt-3 max-w-[60ch] text-muted">
        {oynanan.length} maç oynandı{oynanacak.length > 0 && `, ${oynanacak.length} maç bekliyor`}.
        Sonuçlar girildiği anda{" "}
        <Link href="/puan-durumu" className="font-semibold text-brand hover:underline">
          puan durumuna
        </Link>{" "}
        işlenir.
      </p>

      <div className="mt-8">
        <CanliYayinKarti
          aktif={icerik.canli_yayin_aktif !== "hayir"}
          metin={icerik.canli_yayin_metin}
          aciklama={icerik.canli_yayin_aciklama}
          buton={icerik.canli_yayin_buton}
          link={icerik.canli_yayin_link}
        />
      </div>

      {maclar.length === 0 ? (
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
              Güncel puan durumuna git →
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-9 grid gap-10">
          {oynanacak.length > 0 && (
            <Bolum baslik="Oynanacak maçlar" maclar={oynanacak} />
          )}
          {oynanan.length > 0 && <Bolum baslik="Sonuçlar" maclar={oynanan} />}
        </div>
      )}
    </div>
  );
}

function Bolum({ baslik, maclar }: { baslik: string; maclar: FiksturMaci[] }) {
  const gunler = new Map<string, FiksturMaci[]>();
  for (const m of maclar) {
    const anahtar = m.tarih ? m.tarih.slice(0, 10) : "tarihsiz";
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
              {gun === "tarihsiz"
                ? "Tarihi belirlenmedi"
                : new Date(gun).toLocaleDateString("tr-TR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
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

  return (
    <li className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line px-3 py-3 last:border-b-0 md:gap-4 md:px-5">
      <Taraf takim={mac.ev} kazandi={evKazandi} yon="sag" />

      <div className="flex min-w-[76px] flex-col items-center">
        {oynandi ? (
          <span className="tabular font-[family-name:var(--font-display)] text-2xl">
            {mac.evSkor} – {mac.depSkor}
          </span>
        ) : (
          <span className="font-[family-name:var(--font-data)] text-sm uppercase tracking-wider text-muted">
            {mac.durum === "ertelendi" ? "Ertelendi" : "vs"}
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
      className={`flex min-w-0 items-center gap-2.5 font-[family-name:var(--font-data)] text-[15px] font-semibold hover:text-brand md:text-[17px] ${
        yon === "sag" ? "flex-row-reverse text-right" : ""
      } ${kazandi ? "text-ink" : "text-muted"}`}
    >
      {takim.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={takim.logoUrl}
          alt=""
          className="h-7 w-7 flex-none rounded-full object-contain md:h-8 md:w-8"
        />
      ) : (
        <span
          aria-hidden
          style={{ background: r.renk }}
          className="grid h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-bold text-white md:h-8 md:w-8"
        >
          {r.harf}
        </span>
      )}
      <span className="truncate">{takim.ad}</span>
    </Link>
  );
}
