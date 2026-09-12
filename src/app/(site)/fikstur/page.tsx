import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fikstür",
  description: `SahaBizim Ligi ${SITE.sezon} sezonu fikstürü ve maç sonuçları.`,
  alternates: { canonical: "/fikstur" },
};

export default function FiksturSayfasi() {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-12 md:py-16">
      <p className="eyebrow text-brand">{SITE.sezon} Sezonu</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.4rem)]">Fikstür</h1>

      <div className="mt-8 rounded border border-line bg-white p-8">
        <h2 className="font-[family-name:var(--font-data)] text-xl font-bold uppercase tracking-wide">
          Fikstür sistemi hazırlanıyor
        </h2>
        <p className="mt-3 max-w-[60ch] text-muted">
          Maç kayıtları veritabanına taşındığında (Faz 4) bu sayfada hafta hafta fikstür ve
          skorlar görünecek. Skor panelden girildiği anda hem burası hem puan durumu
          otomatik güncellenecek.
        </p>
        <p className="mt-5">
          <Link href="/puan-durumu" className="font-[family-name:var(--font-data)] font-bold text-brand">
            Güncel puan durumuna git →
          </Link>
        </p>
      </div>
    </div>
  );
}
