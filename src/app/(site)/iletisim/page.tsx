import type { Metadata } from "next";
import { WhatsappForm } from "@/components/whatsapp-form";
import { SITE } from "@/lib/site";
import { getIcerik } from "@/lib/veri";

export const metadata: Metadata = {
  title: "İletişim",
  description: `SahaBizim ile iletişime geç — ${SITE.telefonGorunen}. WhatsApp formunu doldur, aynı gün dönüş yapalım.`,
  alternates: { canonical: "/iletisim" },
};

export const revalidate = 60;

export default async function IletisimSayfasi() {
  const icerik = await getIcerik();
  return (
    <div className="mx-auto grid w-full max-w-[1180px] items-start gap-9 px-5 py-12 md:grid-cols-2 md:py-16">
      <div>
        <p className="eyebrow text-brand">İletişim</p>
        <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.4rem)]">Bize ulaş</h1>
        <p className="mt-4 max-w-[52ch] text-muted">{icerik.iletisim_metin}</p>

        <dl className="mt-7 grid gap-5">
          <div>
            <dt className="font-[family-name:var(--font-data)] text-sm uppercase tracking-[0.14em] text-muted">
              Telefon / WhatsApp
            </dt>
            <dd className="font-[family-name:var(--font-data)] text-xl">
              {icerik.yetkili} · {icerik.telefon}
            </dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-data)] text-sm uppercase tracking-[0.14em] text-muted">
              Sosyal medya
            </dt>
            <dd className="font-[family-name:var(--font-data)] text-xl">
              <a className="hover:text-brand" href={icerik.instagram}>Instagram</a>
              {" · "}
              <a className="hover:text-brand" href={icerik.youtube}>YouTube</a>
              {" · "}
              <a className="hover:text-brand" href={icerik.tiktok}>TikTok</a>
            </dd>
          </div>
        </dl>
      </div>
      <WhatsappForm tip="iletisim" />
    </div>
  );
}
