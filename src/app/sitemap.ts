import type { MetadataRoute } from "next";
import { getPuanDurumu } from "@/lib/veri";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const simdi = new Date();

  const sabit = [
    { url: "/", priority: 1 },
    { url: "/puan-durumu", priority: 0.9 },
    { url: "/fikstur", priority: 0.8 },
    { url: "/takimlar", priority: 0.7 },
    { url: "/galeri", priority: 0.5 },
    { url: "/katil", priority: 0.6 },
    { url: "/iletisim", priority: 0.5 },
  ].map((s) => ({
    url: `${SITE.url}${s.url}`,
    lastModified: simdi,
    priority: s.priority,
  }));

  const tablo = await getPuanDurumu();
  const takimlar = tablo.map((t) => ({
    url: `${SITE.url}/takim/${t.slug}`,
    lastModified: simdi,
    priority: 0.6,
  }));

  return [...sabit, ...takimlar];
}
