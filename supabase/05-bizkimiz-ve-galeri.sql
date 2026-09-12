-- =====================================================================
-- SahaBizim — "Biz Kimiz" sayfası ve galeri ayarları
-- 01–04 çalıştırıldıktan sonra SQL Editor'da çalıştır.
-- =====================================================================

insert into ayarlar (anahtar, deger, aciklama) values
  ('bizkimiz_baslik', 'Ruhum sahada', 'Biz Kimiz · sayfa başlığı'),
  ('bizkimiz_ozet',   'Sporu bir oyun değil, bir yaşam biçimi olarak görenlerin sahası.', 'Biz Kimiz · başlık altı kısa cümle'),
  ('bizkimiz_metin',
   'SahaBizim, İstanbul''da halı saha futbolunu düzenli bir lig düzenine kavuşturmak için kuruldu. Amacımız basit: maç ayarlamak için grup grup mesaj dolaşmasın, kim kaç puanda belli olsun, oynamak isteyen herkes bir takım bulabilsin.' || chr(10) || chr(10) ||
   'Bugün tek çatı altında altmışın üzerinde takım var. Her hafta sahaya çıkıyor, sonuçları giriyor, puan durumunu güncelliyoruz. Takımların çoğu mahalle arkadaşlıklarından, iş yeri ekiplerinden, okul gruplarından doğdu — kimisi yıllardır aynı kadroyla oynuyor.' || chr(10) || chr(10) ||
   'Bizim için asıl mesele skor değil, sahada geçen o iki saat. Gençleri madde ve alkol bağımlılığına karşı sahaya çağırmamızın sebebi de bu: oyunun kendisi en iyi korumadır. Bu yüzden sloganımız "Spor Hayattır".',
   'Biz Kimiz · ana metin (boş satır bırakarak paragraf ayır)'),
  ('bizkimiz_deger1', 'Herkese açık|Kadro, tecrübe veya bütçe fark etmez. Takımını kur, gel.', 'Biz Kimiz · birinci değer (başlık|açıklama)'),
  ('bizkimiz_deger2', 'Düzenli lig|Fikstür, skor, puan durumu — hepsi kayıt altında ve herkese açık.', 'Biz Kimiz · ikinci değer (başlık|açıklama)'),
  ('bizkimiz_deger3', 'Saha içi saygı|Rekabet sahada kalır. Küfür, kavga ve ayrımcılık hoş görülmez.', 'Biz Kimiz · üçüncü değer (başlık|açıklama)'),

  ('varsayilan_gorseller', 'evet', 'Galeride hazır gelen örnek fotoğraflar gösterilsin mi? (evet / hayir)')
on conflict (anahtar) do nothing;
