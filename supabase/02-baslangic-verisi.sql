-- =====================================================================
-- SahaBizim — başlangıç verisi (61 takım + aktif sezon + site ayarları)
-- 01-semasi.sql çalıştırıldıktan SONRA, aynı şekilde SQL Editor'da çalıştır.
-- Kaynak: 07.09.2026 tarihli puan durumu tablosu.
-- =====================================================================

insert into sezonlar (ad, aktif, basladi)
values ('2026–2027', true, '2026-08-01')
on conflict do nothing;

insert into takimlar (ad, slug, sira, devir_o, devir_g, devir_b, devir_m, devir_a, devir_y, devir_son3) values
  ('CURCUNA FC', 'curcuna-fc', 1, 4, 4, 0, 0, 28, 10, array['G','G','G']::text[]),
  ('KOORDİNAT FK', 'koordinat-fk', 2, 3, 3, 0, 0, 26, 12, array['G','G','G']::text[]),
  ('TEK YÜREK FC', 'tek-yurek-fc', 3, 2, 2, 0, 0, 20, 5, array['','G','G']::text[]),
  ('BAYRAMPAŞA SK', 'bayrampasa-sk', 4, 2, 2, 0, 0, 20, 10, array['','G','G']::text[]),
  ('ZİRVE UNİTED', 'zirve-united', 5, 3, 2, 0, 1, 27, 22, array['M','G','G']::text[]),
  ('PİRAZİZ LA CORUNA', 'piraziz-la-coruna', 6, 2, 1, 1, 0, 10, 8, array['','B','G']::text[]),
  ('TEMAX GKT', 'temax-gkt', 7, 1, 1, 0, 0, 25, 2, array['','','G']::text[]),
  ('TDK FC', 'tdk-fc', 8, 2, 1, 0, 1, 17, 10, array['','G','M']::text[]),
  ('KELEŞ FK', 'keles-fk', 9, 2, 1, 0, 1, 21, 14, array['','G','M']::text[]),
  ('HANE FC', 'hane-fc', 10, 4, 1, 0, 3, 24, 18, array['M','M','M']::text[]),
  ('DOSTU MÜDAFAA', 'dostu-mudafaa', 11, 2, 1, 0, 1, 12, 6, array['','G','M']::text[]),
  ('MATADOR FC', 'matador-fc', 12, 1, 1, 0, 0, 9, 3, array['','','G']::text[]),
  ('ANADOLU SPOR', 'anadolu-spor', 13, 1, 1, 0, 0, 9, 4, array['','','G']::text[]),
  ('ÇINAR FC', 'cinar-fc', 14, 1, 1, 0, 0, 7, 3, array['','','G']::text[]),
  ('DOĞUBAYAZIT SPOR', 'dogubayazit-spor', 15, 1, 1, 0, 0, 5, 1, array['','','G']::text[]),
  ('BORUSSİA MEVLANA', 'borussia-mevlana', 16, 1, 1, 0, 0, 6, 5, array['','','G']::text[]),
  ('TEPEGENÇLİK', 'tepegenclik', 17, 2, 1, 0, 1, 5, 3, array['','M','G']::text[]),
  ('KARAM FC', 'karam-fc', 18, 2, 1, 0, 1, 6, 9, array['','M','G']::text[]),
  ('STARS UNİTED', 'stars-united', 19, 2, 1, 0, 1, 7, 11, array['','M','G']::text[]),
  ('HAYRONUN YILDIZLARI', 'hayronun-yildizlari', 20, 2, 1, 0, 1, 15, 19, array['','M','G']::text[]),
  ('GÖKBÖRÜ', 'gokboru', 21, 2, 1, 0, 1, 11, 18, array['','M','G']::text[]),
  ('DIE HARD FC', 'die-hard-fc', 22, 2, 1, 0, 1, 9, 17, array['','M','G']::text[]),
  ('BALABAN FC', 'balaban-fc', 23, 1, 0, 1, 0, 7, 7, array['','','B']::text[]),
  ('KÜÇÜKKÖYLÜLER', 'kucukkoyluler', 24, 2, 0, 1, 1, 6, 8, array['','B','M']::text[]),
  ('CERRAHPAŞALILAR', 'cerrahpasalilar', 25, 2, 0, 0, 2, 6, 10, array['','M','M']::text[]),
  ('AKŞEMSETTİN', 'aksemsettin', 26, 1, 0, 0, 1, 4, 9, array['','','M']::text[]),
  ('HARDSENAL FC', 'hardsenal-fc', 27, 1, 0, 0, 1, 3, 9, array['','','M']::text[]),
  ('BARÇA PARÇA', 'barca-parca', 28, 2, 0, 0, 2, 7, 18, array['','M','M']::text[]),
  ('ZİRVE FK', 'zirve-fk', 29, 1, 0, 0, 1, 4, 12, array['','','M']::text[]),
  ('TURAN FK', 'turan-fk', 30, 1, 0, 0, 1, 4, 12, array['','','M']::text[]),
  ('YİĞİDOLAR TAKIMI', 'yigidolar-takimi', 31, 1, 0, 0, 1, 4, 13, array['','','M']::text[]),
  ('K.KARABEKİR MEVLANA', 'k-karabekir-mevlana', 32, 1, 0, 0, 1, 4, 5, array['','','M']::text[]),
  ('ZEYTİNBURNUSPOR', 'zeytinburnuspor', 33, 2, 0, 0, 2, 11, 16, array['','M','M']::text[]),
  ('BLENDER FC', 'blender-fc', 34, 1, 0, 1, 0, 7, 7, array['','','B']::text[]),
  ('ÇAPA GALACTICOS', 'capa-galacticos', 35, 1, 0, 0, 1, 3, 15, array['','','M']::text[]),
  ('EMNİYETEVLER FK', 'emniyetevler-fk', 36, 1, 0, 0, 1, 5, 7, array['','','M']::text[]),
  ('ZYÇC', 'zycc', 37, 1, 0, 0, 1, 3, 13, array['','','M']::text[]),
  ('LEGION FC', 'legion-fc', 38, 1, 0, 0, 1, 2, 25, array['','','M']::text[]),
  ('SÜTLÜCE CITY', 'sutluce-city', 39, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('SARIGÖL BİRLİK', 'sarigol-birlik', 40, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('Z.B GALACTİCOS', 'z-b-galacticos', 41, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('AKINCILAR FK', 'akincilar-fk', 42, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('CASABLANCA FC', 'casablanca-fc', 43, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('KURTLAR KONSEYİ FC', 'kurtlar-konseyi-fc', 44, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('LAZVEGAS FC', 'lazvegas-fc', 45, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('SÜPRİZ YUMURTA FC', 'supriz-yumurta-fc', 46, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('ESENLER SK', 'esenler-sk', 47, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('AS KADRO', 'as-kadro', 48, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('ŞİMŞEK SPOR', 'simsek-spor', 49, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('BEYOĞLU SPOR', 'beyoglu-spor', 50, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('OSMANLI SK', 'osmanli-sk', 51, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('GOLD BOYS', 'gold-boys', 52, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('YAPI MAĞDURLARI FC', 'yapi-magdurlari-fc', 53, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('RABONA AGENCY', 'rabona-agency', 54, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('SALTANAT FC', 'saltanat-fc', 55, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('OSMANLI FC', 'osmanli-fc', 56, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('HADDİNİ BİLBAO', 'haddini-bilbao', 57, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('KASIMPAŞA SK', 'kasimpasa-sk', 58, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('GUNNER FC', 'gunner-fc', 59, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('YAVUZ SULTAN SELİM', 'yavuz-sultan-selim', 60, 0, 0, 0, 0, 0, 0, array['','','']::text[]),
  ('ALTIPAS FC', 'altipas-fc', 61, 0, 0, 0, 0, 0, 0, array['','','']::text[])
on conflict (slug) do nothing;

-- Site ayarları
insert into ayarlar (anahtar, deger, aciklama) values
  ('whatsapp', '905363771767', 'WhatsApp numarası (ülke kodu ile, + ve boşluk olmadan)'),
  ('telefon', '0536 377 17 67', 'Sitede görünen telefon'),
  ('yetkili', 'Hayrullah Can', 'İletişim sorumlusu'),
  ('instagram', 'https://www.instagram.com/', 'Instagram adresi'),
  ('youtube', 'https://www.youtube.com/', 'YouTube adresi'),
  ('tiktok', 'https://www.tiktok.com/', 'TikTok adresi'),
  ('hero_baslik', 'Sahada birlik, sporda özgürlük', 'Anasayfa ana başlığı'),
  ('hero_metin', 'SahaBizim Ligi''nin puan durumu, fikstürü ve haftanın maçları tek yerde.', 'Anasayfa alt metni')
on conflict (anahtar) do update set deger = excluded.deger;

-- Yönetici e-postan (Supabase Authentication'da bu e-posta ile kullanıcı oluştur)
insert into yoneticiler (eposta, ad) values ('umut@tektip.health', 'Umut')
on conflict (eposta) do nothing;
