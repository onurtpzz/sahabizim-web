-- =====================================================================
-- SahaBizim — 08: Excel puan durumu senkronu
-- Kaynak: "1SAHABİZİMLİGİ PUAN DURUMU.xlsx" (13.09.2026)
--
-- Ne yapar: her takımın site tablosundaki TOPLAM rakamını Excel'deki
-- rakama eşitler. Panelden girilmiş maçlar korunur:
--     devir_* = Excel toplamı − bu sezon panele girilen maçlar
--
-- Excel'den yalnız O/G/B/M/A/Y okunur. Puan ve averaj siteye ait
-- hesaptır (P = 3G+B, AV = A−Y), Excel'deki puan hataları taşınmaz.
--
-- Supabase → SQL Editor → New query → tamamını yapıştır → Run.
-- Tamamı tek bir blok: bir takımın Excel toplamı panele girilmiş
-- maçlarından küçükse HİÇBİR ŞEY yazılmaz, hata mesajı takımı söyler.
-- =====================================================================

do $senkron$
declare
  bozuk text;
  yazilan int;
begin
  ------------------------------------------------------------------
  -- 1) Excel'de olup sitede olmayan takımlar
  ------------------------------------------------------------------
  insert into takimlar (ad, slug, sira) values
    ('CEMAL GÜRSEL FC', 'cemal-gursel-fc', 62),
    ('YÜRÜYEREK PRES FK', 'yuruyerek-pres-fk', 63),
    ('OCAKBAŞI SK', 'ocakbasi-sk', 64)
  on conflict (slug) do nothing;

  ------------------------------------------------------------------
  -- 2) Devir sayılarını yaz
  ------------------------------------------------------------------
  with excel (ad, o, g, b, m, a, y, son3) as (
    values
      ('CURCUNA FC', 6, 5, 0, 1, 43, 28, array['G','G','M']::text[]),
      ('KOORDİNAT FK', 5, 5, 0, 0, 43, 18, array['G','G','G']::text[]),
      ('TEK YÜREK FC', 3, 2, 1, 0, 25, 10, array['G','G','B']::text[]),
      ('BAYRAMPAŞA SK', 3, 2, 0, 1, 23, 20, array['G','G','M']::text[]),
      ('ZİRVE UNİTED', 4, 2, 0, 2, 31, 27, array['G','G','M']::text[]),
      ('PİRAZİZ LA CORUNA', 2, 1, 1, 0, 10, 8, array['','B','G']::text[]),
      ('TEMAX GKT', 2, 1, 0, 1, 31, 11, array['','G','M']::text[]),
      ('TDK FC', 2, 1, 0, 1, 17, 10, array['','G','M']::text[]),
      ('KELEŞ FK', 2, 1, 0, 1, 21, 14, array['','G','M']::text[]),
      ('HANE FC', 5, 1, 0, 4, 25, 22, array['M','M','M']::text[]),
      ('DOSTU MÜDAFAA', 3, 2, 0, 1, 15, 7, array['G','M','G']::text[]),
      ('MATADOR FC', 1, 1, 0, 0, 9, 3, array['','','G']::text[]),
      ('ANADOLU SPOR', 1, 1, 0, 0, 9, 4, array['','','G']::text[]),
      ('ÇINAR FC', 1, 1, 0, 0, 7, 3, array['','','G']::text[]),
      ('DOĞUBAYAZIT SPOR', 1, 1, 0, 0, 5, 1, array['','','G']::text[]),
      ('BORUSSİA MEVLANA', 2, 2, 0, 0, 16, 8, array['','G','G']::text[]),
      ('TEPEGENÇLİK', 3, 1, 0, 2, 6, 6, array['M','G','M']::text[]),
      ('KARAM FC', 3, 2, 0, 1, 11, 13, array['M','G','G']::text[]),
      ('STARS UNİTED', 3, 1, 1, 1, 12, 16, array['M','G','B']::text[]),
      ('HAYRONUN YILDIZLARI', 3, 1, 0, 2, 17, 33, array['M','G','M']::text[]),
      ('GÖKBÖRÜ', 3, 1, 0, 2, 16, 31, array['M','G','M']::text[]),
      ('DIE HARD FC', 2, 1, 0, 1, 9, 17, array['','M','G']::text[]),
      ('BALABAN FC', 1, 0, 1, 0, 7, 7, array['','','B']::text[]),
      ('KÜÇÜKKÖYLÜLER', 3, 1, 1, 1, 18, 14, array['B','M','G']::text[]),
      ('CERRAHPAŞALILAR', 3, 0, 0, 3, 10, 23, array['M','M','M']::text[]),
      ('AKŞEMSETTİN', 1, 0, 0, 1, 4, 9, array['','','M']::text[]),
      ('HARDSENAL FC', 1, 0, 0, 1, 3, 9, array['','','M']::text[]),
      ('BARÇA PARÇA', 2, 0, 0, 2, 7, 18, array['','M','M']::text[]),
      ('ZİRVE FK', 2, 1, 0, 1, 17, 16, array['','M','G']::text[]),
      ('TURAN FK', 1, 0, 0, 1, 4, 12, array['','','M']::text[]),
      ('YİĞİDOLAR TAKIMI', 1, 0, 0, 1, 4, 13, array['','','M']::text[]),
      ('K.KARABEKİR MEVLANA', 1, 0, 0, 1, 4, 5, array['','','M']::text[]),
      ('ZEYTİNBURNUSPOR', 3, 1, 0, 2, 22, 23, array['M','M','G']::text[]),
      ('BLENDER FC', 1, 0, 1, 0, 7, 7, array['','','B']::text[]),
      ('ÇAPA GALACTICOS', 1, 0, 0, 1, 3, 15, array['','','M']::text[]),
      ('EMNİYETEVLER FK', 1, 0, 0, 1, 5, 7, array['','','M']::text[]),
      ('ZYÇC', 1, 0, 0, 1, 3, 13, array['','','M']::text[]),
      ('LEGION FC', 1, 0, 0, 1, 2, 25, array['','','M']::text[]),
      ('SÜTLÜCE CITY', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('SARIGÖL BİRLİK', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('Z.B GALACTİCOS', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('AKINCILAR FK', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('CASABLANCA FC', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('KURTLAR KONSEYİ FC', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('LAZVEGAS FC', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('SÜPRİZ YUMURTA FC', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('ESENLER SK', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('AS KADRO', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('ŞİMŞEK SPOR', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('BEYOĞLU SPOR', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('OSMANLI SK', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('GOLD BOYS', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('YAPI MAĞDURLARI FC', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('RABONA AGENCY', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('SALTANAT FC', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('OSMANLI FC', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('HADDİNİ BİLBAO', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('KASIMPAŞA SK', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('GUNNER FC', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('YAVUZ SULTAN SELİM', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('ALTIPAS FC', 0, 0, 0, 0, 0, 0, array['','','']::text[]),
      ('CEMAL GÜRSEL FC', 1, 1, 0, 0, 14, 2, array['','','G']::text[]),
      ('YÜRÜYEREK PRES FK', 1, 0, 0, 1, 7, 11, array['','','M']::text[]),
      ('OCAKBAŞI SK', 0, 0, 0, 0, 0, 0, array['','','']::text[])
  ),
  aktif as (
    select id from sezonlar where aktif limit 1
  ),
  satirlar as (
    select ev_id as takim_id, ev_skor as attigi, dep_skor as yedigi
    from maclar, aktif
    where maclar.sezon_id = aktif.id and durum in ('oynandi','hukmen')
    union all
    select dep_id, dep_skor, ev_skor
    from maclar, aktif
    where maclar.sezon_id = aktif.id and durum in ('oynandi','hukmen')
  ),
  oynanan as (
    select takim_id,
           count(*)::int as o,
           count(*) filter (where attigi > yedigi)::int as g,
           count(*) filter (where attigi = yedigi)::int as b,
           count(*) filter (where attigi < yedigi)::int as m,
           coalesce(sum(attigi), 0)::int as a,
           coalesce(sum(yedigi), 0)::int as y
    from satirlar
    group by takim_id
  ),
  hedef as (
    select t.id,
           e.o - coalesce(mo.o, 0) as d_o,
           e.g - coalesce(mo.g, 0) as d_g,
           e.b - coalesce(mo.b, 0) as d_b,
           e.m - coalesce(mo.m, 0) as d_m,
           e.a - coalesce(mo.a, 0) as d_a,
           e.y - coalesce(mo.y, 0) as d_y,
           e.son3
    from excel e
    join takimlar t on upper(btrim(t.ad)) = upper(e.ad)
    left join oynanan mo on mo.takim_id = t.id
  )
  update takimlar t set
    devir_o    = h.d_o,
    devir_g    = h.d_g,
    devir_b    = h.d_b,
    devir_m    = h.d_m,
    devir_a    = h.d_a,
    devir_y    = h.d_y,
    devir_son3 = h.son3
  from hedef h
  where h.id = t.id;

  get diagnostics yazilan = row_count;

  ------------------------------------------------------------------
  -- 3) Güvenlik kontrolü — negatif devir varsa her şey geri alınır
  ------------------------------------------------------------------
  select string_agg(ad, ', ') into bozuk
  from takimlar
  where devir_o < 0 or devir_g < 0 or devir_b < 0
     or devir_m < 0 or devir_a < 0 or devir_y < 0;

  if bozuk is not null then
    raise exception
      'Excel toplamı, panele girilmiş maçlardan küçük: %. Hiçbir şey yazılmadı — önce o maçları Maç & Skor ekranından kontrol et.',
      bozuk;
  end if;

  raise notice '% takım güncellendi (Excel listesinde 64 takım var).', yazilan;
end
$senkron$;

-- Sonuç — bu tablo Excel ile birebir aynı olmalı
select sira, ad, o, g, b, m, a, y, av, p
from puan_durumu
order by sira;
