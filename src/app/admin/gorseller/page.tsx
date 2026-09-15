import { redirect } from "next/navigation";

/**
 * Eski "Görseller" sekmesi kaldırıldı — menü kalabalıklaşmıştı.
 *
 * İçeriği ikiye ayrıldı:
 *   • Galeri (yükleme, sıralama, hazır fotoğraf anahtarı) → Fotoğraflar sekmesi,
 *     "Site galerisi" bölümü
 *   • Sitedeki sabit görseller (hero, Biz Kimiz) → Ayarlar sayfasının
 *     en altı
 *
 * Sayfa tamamen silinmedi: panelin eski adresi yer imlerinde veya tarayıcı
 * geçmişinde kalmış olabilir, boş sayfa yerine doğru yere götürüyor.
 */
export default function EskiGorsellerSayfasi() {
  redirect("/admin/fotograflar");
}
