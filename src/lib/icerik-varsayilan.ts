/**
 * Site metinlerinin varsayılanları — veritabanında karşılığı yoksa bunlar kullanılır.
 *
 * Neden ayrı dosya: yönetim paneli (tarayıcıda çalışır) boş alanı bu değerle
 * doldurmak için okuyor; `veri.ts` ise sunucuya özgü önbellek katmanı taşıyor ve
 * panele girmemeli. Tek kaynak burası, `veri.ts` buradan dışa veriyor.
 */
export const VARSAYILAN_ICERIK = {
  hero_baslik: "Sahada birlik,",
  hero_vurgu: "sporda özgürlük",
  hero_metin:
    "SahaBizim Ligi'nin puan durumu, fikstürü ve haftanın maçları tek yerde. Takımını kur, maçını ayarla, gerisini sahaya bırak.",
  hero_buton1: "Puan Durumu",
  hero_buton2: "Takımını Kaydet",
  // Anasayfa bölüm başlıkları, bağlantı yazıları ve boş durum metinleri.
  // Hepsi panelde Ayarlar → "Anasayfa" gruplarından değiştirilebilir.
  sayac_takim: "Takım",
  sayac_mac: "Oynanan Maç",
  sayac_gol: "Gol",
  hafta_baslik: "Haftanın Özeti",
  hafta_kart_mac: "Haftanın maçı",
  hafta_kart_yukselen: "Haftanın yükseleni",
  hafta_kart_surpriz: "Haftanın sürprizi",
  hafta_kart_gol: "En gollü maç",
  hafta_link: "Tüm maçlar",
  puan_etiket: "Lig",
  puan_baslik: "Puan Durumu",
  puan_link: "Tüm tabloyu gör",
  yaklasan_etiket: "Fikstür",
  yaklasan_baslik: "Yaklaşan",
  yaklasan_vurgu: "Maçlar",
  yaklasan_link: "Tüm fikstür",
  yaklasan_bos: "Önümüzdeki günler için henüz maç girilmedi. Geçmiş sonuçlar fikstür sayfasında.",
  duyuru_etiket: "Ligden haberler",
  duyuru_baslik: "Duyurular",
  duyuru_link: "Tüm duyurular",
  duyuru_bos: "Henüz duyuru yok. Lig ile ilgili her yenilik önce burada görünecek.",
  kural_etiket: "Saha içi",
  kural_baslik: "Kurallar",
  kural_link: "Tüm kurallar",
  galeri_etiket: "Saha içi",
  galeri_baslik: "Galeri",
  galeri_link: "Tüm albümler",
  sosyal_etiket: "Sosyal medya",
  katil_etiket: "Aramıza Katıl",
  katil_buton: "Başvuru Formu",
  katil_baslik: "Takımını lige yaz",
  katil_metin:
    "Formu doldur, WhatsApp'tan bize ulaşsın. Aynı gün içinde dönüş yapıyoruz: fikstür, saha ve ödeme detaylarını orada konuşuyoruz.",
  katil_maddeler:
    "Takım başına sezonluk tek kayıt\nMaçlar hafta içi akşam ve hafta sonu\nSkorlar girildiği anda puan durumuna işler\nTakımının kendi sayfası ve istatistikleri olur",
  iletisim_metin: "Lig, maç programı veya saha ile ilgili her konuda yazabilirsin.",
  galeri_metin: "Maç kareleri panelden yüklendikçe bu sayfa albümlere ayrılacak.",
  footer_metin: "Sporu sadece bir oyun değil, bir yaşam biçimi olarak görenlerin sahası.",
  site_aciklama: "SahaBizim Ligi'nin güncel puan durumu, fikstürü ve haftanın maçları.",
  bizkimiz_baslik: "Ruhum sahada",
  bizkimiz_ozet: "Sporu bir oyun değil, bir yaşam biçimi olarak görenlerin sahası.",
  bizkimiz_metin:
    "SahaBizim, İstanbul'da halı saha futbolunu düzenli bir lig düzenine kavuşturmak için kuruldu. Amacımız basit: maç ayarlamak için grup grup mesaj dolaşmasın, kim kaç puanda belli olsun, oynamak isteyen herkes bir takım bulabilsin.\n\nBugün tek çatı altında altmışın üzerinde takım var. Her hafta sahaya çıkıyor, sonuçları giriyor, puan durumunu güncelliyoruz.\n\nBizim için asıl mesele skor değil, sahada geçen o iki saat. Gençleri madde ve alkol bağımlılığına karşı sahaya çağırmamızın sebebi de bu: oyunun kendisi en iyi korumadır.",
  bizkimiz_deger1: "Herkese açık|Kadro, tecrübe veya bütçe fark etmez. Takımını kur, gel.",
  bizkimiz_deger2: "Düzenli lig|Fikstür, skor, puan durumu — hepsi kayıt altında ve herkese açık.",
  bizkimiz_deger3: "Saha içi saygı|Rekabet sahada kalır. Küfür, kavga ve ayrımcılık hoş görülmez.",
  bizkimiz_etkinlik_baslik: "Sadece maç değil",
  bizkimiz_etkinlik_metin:
    "SahaBizim yalnızca bir lig değil; sahanın dışında da bir arada olan bir topluluk. Yıl boyunca düzenlediğimiz etkinliklere bütün takımlar davetli.",
  bizkimiz_etkinlikler:
    "Piknik|Sezon arası, ailelerin de geldiği gün boyu süren buluşmalar.\nKamp|Doğada iki gün: yürüyüş, maç ve gece sohbeti.\nMangal|Maç sonrası klasikleşen mangal akşamları.\nGönüllü AFAD arama-kurtarma ekibi|Afet durumunda görev almak üzere eğitim alan gönüllü ekibimiz.",
  canli_yayin_aktif: "evet",
  canli_yayin_metin: "Haftanın maçlarını canlı yayınlıyoruz",
  canli_yayin_buton: "Yayına git",
  canli_yayin_link: "",
  canli_yayin_aciklama:
    "Seçtiğimiz maçları YouTube ve Instagram üzerinden canlı yayınlıyoruz. Yayın günü ve saati sosyal medya hesaplarımızdan duyurulur.",
  katki_metin: "Onur Topuz'un katkılarıyla",
  varsayilan_gorseller: "evet",
  sosyal_baslik: "Sahadan kareler",
  sosyal_metin: "Instagram ve YouTube'da paylaştığımız son içerikler.",
  whatsapp: "905363771767",
  telefon: "0536 377 17 67",
  yetkili: "Hayrullah Can",
  instagram: "https://www.instagram.com/",
  youtube: "https://www.youtube.com/",
  tiktok: "https://www.tiktok.com/",
} as const;

export type IcerikAnahtari = keyof typeof VARSAYILAN_ICERIK;
