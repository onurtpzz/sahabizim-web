import type { MetadataRoute } from "next";
import { getArsivSezonlari, getTakimSluglari } from "@/lib/veri";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const simdi = new Date();

  const sabit = [
    { url: "/", priority: 1 },
    { url: "/puan-durumu", priority: 0.9 },
    { url: "/fikstur", priority: 0.8 },
    { url: "/takimlar", priority: 0.7 },
    { url: "/kurallar-ve-duyurular", priority: 0.7 },
    { url: "/arsiv", priority: 0.5 },
    { url: "/biz-kimiz", priority: 0.6 },
    { url: "/galeri", priority: 0.5 },
    { url: "/katil", priority: 0.6 },
    { url: "/iletisim", priority: 0.5 },
  ].map((s) => ({
    url: `${SITE.url}${s.url}`,
    lastModified: simdi,
    priority: s.priority,
  }));

  // Hata anında yedek slug listesine düşer — site haritası hiçbir koşulda
  // takım sayfalarını kaybetmemeli (bkz. getTakimSluglari).
  const sluglar = await getTakimSluglari();
  const takimlar = sluglar.map((slug) => ({
    url: `${SITE.url}/takim/${slug}`,
    lastModified: simdi,
    priority: 0.6,
  }));

  const arsiv = (await getArsivSezonlari()).map((s) => ({
    url: `${SITE.url}/arsiv/${s.slug}`,
    lastModified: simdi,
    priority: 0.4,
  }));

  return [...sabit, ...takimlar, ...arsiv];
}
