-- =====================================================================
-- SahaBizim — yeni ayar satırları (13.09.2026)
--
-- Ne işe yarıyor?
--   · Canlı maç yayını şeridi (üst bant + fikstür sayfasındaki kart)
--   · Biz Kimiz sayfasındaki "Saha dışında" etkinlik bölümü
--     (piknik, kamp, mangal, gönüllü AFAD arama-kurtarma ekibi)
--   · Alt bilgideki katkı ibaresi
--
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını
-- yapıştır → Run. Bir kez çalıştırılır; tekrar çalıştırmak zarar vermez
-- (mevcut değerlerin üzerine yazmaz).
--
-- Bu dosyayı çalıştırmadan da site çalışır: değerler `src/lib/veri.ts`
-- içindeki varsayılanlardan gelir. Çalıştırınca yönetim panelindeki
-- "Ayarlar" sekmesinden düzenlenebilir hale gelir.
-- =====================================================================

insert into ayarlar (anahtar, deger, aciklama) values
  ('canli_yayin_aktif',    'evet',
   'Canlı yayın · şerit görünsün mü? (evet / hayir)'),
  ('canli_yayin_metin',    'Haftanın maçlarını canlı yayınlıyoruz',
   'Canlı yayın · üst şeritteki kısa yazı'),
  ('canli_yayin_buton',    'Yayına git',
   'Canlı yayın · buton yazısı'),
  ('canli_yayin_link',     '',
   'Canlı yayın · yayın adresi (YouTube kanalı veya canlı yayın linki). Boşsa buton çıkmaz.'),
  ('canli_yayin_aciklama', 'Seçtiğimiz maçları YouTube ve Instagram üzerinden canlı yayınlıyoruz. Yayın günü ve saati sosyal medya hesaplarımızdan duyurulur.',
   'Canlı yayın · fikstür sayfasındaki açıklama'),

  ('bizkimiz_etkinlik_baslik', 'Sadece maç değil',
   'Biz Kimiz · etkinlikler bölümü başlığı'),
  ('bizkimiz_etkinlik_metin',  'SahaBizim yalnızca bir lig değil; sahanın dışında da bir arada olan bir topluluk. Yıl boyunca düzenlediğimiz etkinliklere bütün takımlar davetli.',
   'Biz Kimiz · etkinlikler bölümü açıklaması'),
  ('bizkimiz_etkinlikler',
   'Piknik|Sezon arası, ailelerin de geldiği gün boyu süren buluşmalar.' || chr(10) ||
   'Kamp|Doğada iki gün: yürüyüş, maç ve gece sohbeti.' || chr(10) ||
   'Mangal|Maç sonrası klasikleşen mangal akşamları.' || chr(10) ||
   'Gönüllü AFAD arama-kurtarma ekibi|Afet durumunda görev almak üzere eğitim alan gönüllü ekibimiz.',
   'Biz Kimiz · etkinlik listesi. Her satır bir kart, biçim: Başlık|Açıklama'),

  ('katki_metin', 'Onur Topuz''un katkılarıyla',
   'Alt bilgi · en alttaki katkı ibaresi. Boş bırakırsan hiç görünmez.')
on conflict (anahtar) do nothing;
