/** Tek yerden yönetilen site bilgileri. Faz 5'te bunlar admin panelindeki `settings` tablosundan gelecek. */
export const SITE = {
  ad: "SahaBizim",
  slogan: "Spor Hayattır",
  url: "https://www.sahabizim.com.tr",
  aciklama:
    "SahaBizim Ligi'nin güncel puan durumu, fikstürü ve haftanın maçları. 61 takım, tek lig, tek sayfa.",
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
