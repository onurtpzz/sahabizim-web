import type { Metadata } from "next";
import { AltNav } from "@/components/alt-nav";
import { CanliYayinSeridi } from "@/components/canli-yayin";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UygulamaDaveti } from "@/components/pwa/yukleme";
import { WhatsappBalonu } from "@/components/whatsapp-balonu";
import { SITE } from "@/lib/site";
import { getIcerik } from "@/lib/veri";

export const revalidate = 60;

/**
 * Site "uygulama olarak yükle" bilgileri. Yönetim paneli kendi manifestini
 * kullanıyor (`app/admin/layout.tsx`) — ikisi telefonda ayrı simge olur.
 */
export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "SahaBizim", statusBarStyle: "black" },
  icons: { apple: "/icons/site-apple-180.png" },
};

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
      <UygulamaDaveti />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
