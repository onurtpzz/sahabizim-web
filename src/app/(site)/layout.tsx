import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/site";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: SITE.ad,
    url: SITE.url,
    slogan: SITE.slogan,
    sport: ["Futbol", "Basketbol", "Voleybol"],
    logo: `${SITE.url}/images/logo.png`,
    telephone: SITE.telefonGorunen,
  };

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
