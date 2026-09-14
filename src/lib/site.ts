/**
 * Sitenin yayında olduğu adres.
 *
 * Metadata'daki bütün MUTLAK adresler buradan türüyor: `og:image`, `og:url`,
 * kanonik adres, `sitemap.xml`, `robots.txt` ve takım sayfasındaki JSON-LD.
 * Yanlış olursa WhatsApp ve Google var olmayan bir adrese gider — paylaşımda
 * önizleme görseli çıkmaz, arama motoru yanlış adresi indekslemeye çalışır.
 *
 * Sıralama:
 *   1. `NEXT_PUBLIC_SITE_URL` — elle verilmişse her zaman o kullanılır.
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel'in kendi sağladığı üretim
 *      adresi. Özel domain bağlıysa onu, değilse `*.vercel.app` adresini
 *      verir. Yani domain bağlandığı anda burası kendiliğinden doğrulanır.
 *   3. Domain bağlandıktan sonraki hedef adres (yerel geliştirmede de bu).
 */
function siteAdresi(): string {
  const elle = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (elle) return elle.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  return "https://www.sahabizim.com.tr";
}

/**
 * Tek yerden yönetilen site bilgileri.
 * İletişim bilgileri panelden de düzenlenebiliyor (`ayarlar` tablosu);
 * buradakiler veritabanı okunamadığında devreye giren değerler.
 */
export const SITE = {
  ad: "SahaBizim",
  slogan: "Spor Hayattır",
  url: siteAdresi(),
  aciklama:
    "SahaBizim Ligi'nin güncel puan durumu, fikstürü ve haftanın maçları. Tek lig, tek sayfa.",
  sezon: "2026–2027",
  whatsapp: "905363771767",
  telefonGorunen: "0536 377 17 67",
  yetkili: "Hayrullah Can",
  sosyal: {
    instagram: "https://www.instagram.com/",
    youtube: "https://www.youtube.com/",
    tiktok: "https://www.tiktok.com/",
  },
} as const;

export function whatsappLink(mesaj: string) {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(mesaj)}`;
}
