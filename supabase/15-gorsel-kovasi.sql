-- =====================================================================
-- SahaBizim — 15: `gorseller` kovasına boyut ve tür sınırı (14.09.2026)
--
-- Ziyaretçi fotoğraf kovalarında (07 ve 09) boyut/tür sınırı vardı, ama
-- yöneticinin kullandığı `gorseller` kovası sınırsız açılmıştı: 01-semasi.sql
-- yalnız `(id, name, public)` veriyor. Panel tarafında da kontrol yoktu.
--
-- Sonuç: telefondan seçilen 40 MB'lık bir HEIC ya da bir .svg/.html dosyası
-- herkese açık kovaya yüklenebiliyordu. Site görselini kırıyor, depoyu
-- şişiriyor ve herkese açık bir kovada istenmeyen dosya bırakıyordu.
--
-- Sınırlar diğer kovalarla uyumlu tutuldu:
--   boyut : 8 MB (site görselleri hero gibi büyük olabiliyor; ziyaretçi
--           fotoğrafları 4 MB'ta kalıyor)
--   tür   : JPEG, PNG, WebP + takım armaları için SVG
--
-- Bu dosya veriye dokunmaz, yalnız kova ayarını günceller.
-- Supabase → SQL Editor → New query → yapıştır → Run.
-- Tekrar çalıştırmak zarar vermez.
--
-- NOT — SVG hakkında: SVG içine betik gömülebilir. Site görselleri `<img>`
-- ile gösterildiği için betik çalışmaz, ama dosyanın herkese açık adresi
-- doğrudan tarayıcıda açılırsa çalışabilir. Takım armalarının çoğu SVG geldiği
-- için listede bırakıldı; armaları yalnız sen yüklediğin için risk kabul
-- edilebilir. Dışarıdan yükleme açılırsa SVG bu listeden çıkarılmalı.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gorseller', 'gorseller', true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
  set file_size_limit    = 8388608,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      public             = true;

-- Kontrol: üç kovanın da sınırı görünmeli.
--   select id, file_size_limit, allowed_mime_types
--   from storage.buckets order by id;
