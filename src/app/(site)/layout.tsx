import { AltNav } from "@/components/alt-nav";
import { CanliYayinSeridi } from "@/components/canli-yayin";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsappBalonu } from "@/components/whatsapp-balonu";
import { SITE } from "@/lib/site";
import { getIcerik } from "@/lib/veri";

export const revalidate = 60;

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const icerik = await getIcerik();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: SITE.ad,
    url: SITE.url,
    slogan: SITE.slogan,
    // Ligde yalnız futbol var; arama motorlarına da öyle bildiriliyor.
    sport: "Futbol",
    logo: `${SITE.url}/images/logo.png`,
    telephone: SITE.telefonGorunen,
  };

  return (
    <>
      <SiteHeader />
      <CanliYayinSeridi
        aktif={icerik.canli_yayin_aktif !== "hayir"}
        metin={icerik.canli_yayin_metin}
        buton={icerik.canli_yayin_buton}
        link={icerik.canli_yayin_link}
      />
      {/* Alt navigasyon mobilde içeriğin üstüne bindiği için altta boşluk bırakılıyor. */}
      <div className="pb-[68px] lg:pb-0">
        <main>{children}</main>
        <SiteFooter />
      </div>
      <WhatsappBalonu numara={icerik.whatsapp} />
      <AltNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
