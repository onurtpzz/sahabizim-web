import Link from "next/link";
import type { FiksturMaci } from "@/lib/veri";
import { LIG_SAAT_DILIMI, macSaati } from "@/lib/zaman";

/**
 * Takım sayfasındaki maç listesi — veriler fikstürden gelir.
 * Aynı satır hem oynanmış hem oynanacak maç için kullanılıyor.
 */

// Saat dilimi açıkça veriliyor: bu bileşen sunucuda render ediliyor ve
// Vercel sunucusu UTC'de çalışıyor — akşam maçlarında tarih bir gün kayardı.
function tarihYaz(tarih: string | null) {
  if (!tarih) return { kisa: "—", tam: "" };
  const d = new Date(tarih);
  return {
    kisa: d.toLocaleDateString("tr-TR", {
      timeZone: LIG_SAAT_DILIMI,
      day: "2-digit",
      month: "short",
    }),
    tam: d.toLocaleDateString("tr-TR", {
      timeZone: LIG_SAAT_DILIMI,
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

type Sonuc = "G" | "B" | "M";

function sonucBul(mac: FiksturMaci, slug: string): Sonuc | null {
  if (mac.evSkor === null || mac.depSkor === null) return null;
  const evde = mac.ev.slug === slug;
  const bizim = evde ? mac.evSkor : mac.depSkor;
  const rakip = evde ? mac.depSkor : mac.evSkor;
  if (bizim > rakip) return "G";
  if (bizim === rakip) return "B";
  return "M";
}

const SONUC_STIL: Record<Sonuc, { sinif: string; ad: string }> = {
  G: { sinif: "bg-brand text-white", ad: "Galibiyet" },
  B: { sinif: "bg-gold/25 text-[#7a5f10]", ad: "Beraberlik" },
  M: { sinif: "bg-lose text-white", ad: "Mağlubiyet" },
};

function MacSatiri({ mac, slug }: { mac: FiksturMaci; slug: string }) {
  const evde = mac.ev.slug === slug;
  const rakip = evde ? mac.dep : mac.ev;
  const bizimSkor = evde ? mac.evSkor : mac.depSkor;
  const rakipSkor = evde ? mac.depSkor : mac.evSkor;
  const sonuc = sonucBul(mac, slug);
  const t = tarihYaz(mac.tarih);

  return (
    <li className="satir-neon grid grid-cols-[56px_1fr_auto] items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
      <span
        title={t.tam}
        className="font-[family-name:var(--font-data)] text-[13px] tracking-wide text-muted uppercase"
      >
        {t.kisa}
      </span>

      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span
            aria-hidden
            title={evde ? "İç saha" : "Deplasman"}
            className={`grid h-5 w-5 flex-none place-items-center rounded-sm font-[family-name:var(--font-data)] text-[11px] font-bold ${
              evde ? "bg-ink text-white" : "border border-line text-muted"
            }`}
          >
            {evde ? "İ" : "D"}
          </span>
          <Link
            href={`/takim/${rakip.slug}`}
            className="truncate font-[family-name:var(--font-data)] font-semibold hover:text-brand"
          >
            {rakip.ad}
          </Link>
          {mac.durum === "ertelendi" && (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 font-[family-name:var(--font-data)] text-[11px] tracking-wider text-[#8a6a12] uppercase">
              Ertelendi
            </span>
          )}
          {mac.durum === "hukmen" && (
            <span className="rounded-full bg-lose/12 px-2 py-0.5 font-[family-name:var(--font-data)] text-[11px] tracking-wider text-lose uppercase">
              Hükmen
            </span>
          )}
        </span>
      </span>

      <span className="flex items-center gap-2.5">
        {bizimSkor === null || rakipSkor === null ? (
          /* Saat girilmişse "Oynanacak" yerine saati göster. */
          <span className="font-[family-name:var(--font-data)] text-sm text-muted">
            {macSaati(mac.tarih) ?? "Oynanacak"}
          </span>
        ) : (
          <span className="display tabular text-xl">
            {bizimSkor}–{rakipSkor}
          </span>
        )}
        {sonuc && (
          <span
            title={SONUC_STIL[sonuc].ad}
            className={`grid h-6 w-6 flex-none place-items-center rounded-full font-[family-name:var(--font-data)] text-xs font-bold ${SONUC_STIL[sonuc].sinif}`}
          >
            {sonuc}
          </span>
        )}
      </span>
    </li>
  );
}

export function TakimMaclari({
  takimAd,
  slug,
  oynanan,
  sirada,
}: {
  takimAd: string;
  slug: string;
  oynanan: FiksturMaci[];
  sirada: FiksturMaci[];
}) {
  const galibiyet = oynanan.filter((m) => sonucBul(m, slug) === "G").length;
  const beraberlik = oynanan.filter((m) => sonucBul(m, slug) === "B").length;
  const maglubiyet = oynanan.filter((m) => sonucBul(m, slug) === "M").length;

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-brand">Fikstürden</p>
          <h2 className="display text-[clamp(1.5rem,4vw,2.1rem)]">Maçlar</h2>
        </div>
        <Link
          href="/fikstur"
          className="border-b-2 border-brand pb-0.5 font-[family-name:var(--font-data)] text-sm font-bold tracking-wider text-brand uppercase"
        >
          Tüm fikstür <span aria-hidden className="ok">→</span>
        </Link>
      </div>

      {sirada.length > 0 && (
        <div className="mb-4 overflow-hidden rounded border border-line bg-white">
          <h3 className="border-b border-line bg-paper px-4 py-2.5 font-[family-name:var(--font-data)] text-xs tracking-[0.14em] text-muted uppercase">
            Sıradaki maçlar
          </h3>
          <ul>
            {sirada.map((m) => (
              <MacSatiri key={m.id} mac={m} slug={slug} />
            ))}
          </ul>
        </div>
      )}

      {oynanan.length === 0 ? (
        <p className="rounded border border-line bg-white p-5 text-muted">
          {sirada.length > 0
            ? `${takimAd} bu sezon henüz maç oynamadı.`
            : `${takimAd} için fikstüre henüz maç girilmedi.`}
        </p>
      ) : (
        <div className="overflow-hidden rounded border border-line bg-white">
          <h3 className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-paper px-4 py-2.5">
            <span className="font-[family-name:var(--font-data)] text-xs tracking-[0.14em] text-muted uppercase">
              Son {oynanan.length} maç
            </span>
            <span className="ml-auto font-[family-name:var(--font-data)] text-[13px] text-muted">
              <span className="font-bold text-brand">{galibiyet}G</span>
              {" · "}
              <span className="font-bold text-[#8a6a12]">{beraberlik}B</span>
              {" · "}
              <span className="font-bold text-lose">{maglubiyet}M</span>
            </span>
          </h3>
          <ul>
            {oynanan.map((m) => (
              <MacSatiri key={m.id} mac={m} slug={slug} />
            ))}
          </ul>
        </div>
      )}

      <p className="mt-2 text-[13px] text-muted">
        <span aria-hidden className="mr-1 font-bold">
          İ
        </span>
        iç saha ·
        <span aria-hidden className="mx-1 font-bold">
          D
        </span>
        deplasman
      </p>
    </section>
  );
}
