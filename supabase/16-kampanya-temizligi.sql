-- =====================================================================
-- SahaBizim — kampanya bandından kalan ayar satırlarının silinmesi
--
-- ⛔ BU DOSYA VERİ SİLER. Çalıştırmadan önce okuyun.
--
--   Tablo      : ayarlar
--   Satır      : en fazla 4 (kampanya_baslik, kampanya_vurgu,
--                kampanya_metin, kampanya_buton)
--   Geri alma  : Silinen satırlar geri gelmez (veritabanı yedeği yok).
--                Kaybolan şey yalnız bu 4 metnin panelde en son yazılmış
--                hâli. Site bu metinleri 15.09.2026'dan beri HİÇBİR YERDE
--                kullanmıyor; panel de onları gizliyor.
--                Metni saklamak isterseniz önce aşağıdaki SELECT'i çalıştırıp
--                sonucu kopyalayın.
--
-- SIRA: önce kod deploy edilmiş olmalı (kod bu satırları artık okumuyor).
--
-- Kampanya görselleri (gorseller tablosunda slot = 'kampanya' / 'kampanya-yan')
-- bu dosyada SİLİNMİYOR: satırla birlikte depodaki dosyanın da silinmesi
-- gerekiyor, o iş panelden yapılmadığı için ayrıca konuşulmalı. Var olup
-- olmadıklarını en alttaki sorgu gösterir.
-- =====================================================================

-- 1) Önce bakın: silinecek satırlar ve içerikleri
select anahtar, deger from ayarlar where anahtar like 'kampanya\_%';

-- 2) Silme — yalnız yukarıdaki sonucu gördükten sonra
delete from ayarlar
where anahtar in ('kampanya_baslik', 'kampanya_vurgu', 'kampanya_metin', 'kampanya_buton')
returning anahtar;

-- 3) Bilgi: yüklenmiş kampanya görseli var mı? (silmez, yalnız listeler)
select id, slot, url, olusturuldu from gorseller where slot in ('kampanya', 'kampanya-yan');
