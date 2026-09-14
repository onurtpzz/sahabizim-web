-- =====================================================================
-- SahaBizim — 12: Sezon arşivinin bütünlüğü (14.09.2026)
--
-- İki açık kapatılıyor. İkisi de ancak sezon kapandıktan SONRA fark edilir,
-- o noktada da geri dönüşü yoktur.
--
-- 1) PASİFE ALINAN TAKIM ARŞİVE HİÇ GİRMİYOR
--    `puan_durumu` görünümü `where t.aktif` filtresi kullanıyor, ama maçları
--    toplayan `mac_satirlari` aktifliğe bakmıyor. Bir takım sezon ortasında
--    ligden ayrılıp pasife alınırsa: oynadığı maçlar rakiplerinin O/G/B/M/A/Y
--    değerlerinde SAYILMAYA DEVAM EDER, fakat takımın kendisi tablodan düşer.
--    Sezon kapanırken `sezonuArsivle()` bu görünümden beslendiği için o takım
--    arşive de yazılmaz — kaç maç oynadığı, kaç gol attığı, kaçıncı bitirdiği
--    kalıcı olarak kaybolur. Arşiv sayfasındaki "Oynanan maç" sayısı da
--    (toplam O / 2) tutmaz, çünkü maçların yarısının sahibi listede yoktur.
--
--    Çözüm: hesabı yapan görünüm ikiye ayrılıyor.
--      puan_durumu_tam → aktif takımlar + bu sezon maç oynamış herkes
--      puan_durumu     → onun `aktif` olanlarla sınırlanmış hâli (site bunu
--                        kullanır, davranışı hiç değişmez)
--    Arşivleme artık `puan_durumu_tam` okuyor.
--
-- 2) TAKIM ADI DEĞİŞİNCE ARŞİV KAYDI ÇİFTLENİYOR
--    `sezon_arsivi` benzersizlik kuralı (sezon_id, slug) idi. Slug takım
--    adından üretiliyor: "KELEŞ FK" → keles-fk. Sezon içinde "Şimdi arşivle"
--    denip sonra addaki yazım hatası düzeltilirse slug değişir; sezon
--    kapanışındaki ikinci arşivleme eski satırı tanımaz ve aynı takımı ikinci
--    kez yazar. Kural artık takımın kimliğine bağlı: (sezon_id, takim_id).
--
-- Supabase panelinde: SQL Editor → New query → tamamını yapıştır → Run.
-- Tekrar çalıştırmak zarar vermez.
--
-- NOT: `puan_durumu` bir an için düşüp yeniden kuruluyor. O saniyede siteye
-- gelen bir istek tabloyu göremez ve "şu an güncellenemiyor" uyarısını görür.
-- Sakin bir saatte çalıştır.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) Hesabı yapan tam görünüm — aktiflik filtresi YOK
-- ---------------------------------------------------------------------
create or replace view puan_durumu_tam as
with aktif_sezon as (
  select id from sezonlar where aktif limit 1
),
mac_satirlari as (
  select ev_id as takim_id, ev_skor as attigi, dep_skor as yedigi, oynanma
  from maclar, aktif_sezon
  where maclar.sezon_id = aktif_sezon.id and durum in ('oynandi', 'hukmen')
  union all
  select dep_id, dep_skor, ev_skor, oynanma
  from maclar, aktif_sezon
  where maclar.sezon_id = aktif_sezon.id and durum in ('oynandi', 'hukmen')
),
mac_ozet as (
  select
    takim_id,
    count(*)::int as o,
    count(*) filter (where attigi > yedigi)::int as g,
    count(*) filter (where attigi = yedigi)::int as b,
    count(*) filter (where attigi < yedigi)::int as m,
    coalesce(sum(attigi), 0)::int as a,
    coalesce(sum(yedigi), 0)::int as y
  from mac_satirlari
  group by takim_id
),
son_uc as (
  select takim_id,
         array_agg(sonuc order by sira) as son3
  from (
    select takim_id,
           case when attigi > yedigi then 'G'
                when attigi = yedigi then 'B'
                else 'M' end as sonuc,
           row_number() over (partition by takim_id order by oynanma desc) as sira
    from mac_satirlari
  ) s
  where sira <= 3
  group by takim_id
),
duzeltme as (
  select takim_id, sum(puan_farki)::int as fark
  from puan_duzeltmeleri, aktif_sezon
  where puan_duzeltmeleri.sezon_id = aktif_sezon.id
  group by takim_id
),
birlesik as (
  select
    t.id, t.ad, t.slug, t.logo_url, t.renk, t.aktif,
    t.devir_o + coalesce(mo.o, 0) as o,
    t.devir_g + coalesce(mo.g, 0) as g,
    t.devir_b + coalesce(mo.b, 0) as b,
    t.devir_m + coalesce(mo.m, 0) as m,
    t.devir_a + coalesce(mo.a, 0) as a,
    t.devir_y + coalesce(mo.y, 0) as y,
    coalesce(su.son3, t.devir_son3) as son3,
    coalesce(d.fark, 0) as puan_farki
  from takimlar t
  left join mac_ozet mo on mo.takim_id = t.id
  left join son_uc su on su.takim_id = t.id
  left join duzeltme d on d.takim_id = t.id
  -- Aktif takımlar + pasife alınmış olsa bile bu sezon sahaya çıkmış herkes.
  -- Hiç oynamamış pasif takımlar (sezon sıfırlamada kapatılanlar) girmez.
  where t.aktif or mo.takim_id is not null
)
select
  row_number() over (
    order by
      (o > 0) desc,
      case when o > 0 then g * 3 + b + puan_farki end desc nulls last,
      case when o > 0 then a - y end desc nulls last,
      case when o > 0 then a end desc nulls last,
      ad
  )::int as sira,
  id, ad, slug, logo_url, renk, aktif,
  o, g, b, m, a, y,
  (a - y) as av,
  (g * 3 + b + puan_farki) as p,
  son3,
  (o > 0) as oynadi
from birlesik;


-- ---------------------------------------------------------------------
-- 2) Sitenin kullandığı görünüm — yalnız aktif takımlar
--    Sütun adları ve sırası eskisiyle birebir aynı; site kodu değişmiyor.
--    `sira` yeniden numaralanıyor, yoksa pasif takım çıkınca 1, 2, 4 diye
--    atlamalı sıra görünürdü.
-- ---------------------------------------------------------------------
drop view if exists puan_durumu;

create view puan_durumu as
select
  row_number() over (order by sira)::int as sira,
  id, ad, slug, logo_url, renk,
  o, g, b, m, a, y, av, p, son3, oynadi
from puan_durumu_tam
where aktif;

grant select on puan_durumu to anon, authenticated;
grant select on puan_durumu_tam to anon, authenticated;


-- ---------------------------------------------------------------------
-- 3) Arşiv benzersizlik kuralı: slug yerine takım kimliği
-- ---------------------------------------------------------------------

-- Önce varsa mükerrer kayıtları temizle: aynı sezon + aynı takım için
-- en son yazılanı tut, eskilerini sil. (Kural değişmeden index kurulamaz.)
delete from sezon_arsivi a
using sezon_arsivi b
where a.sezon_id = b.sezon_id
  and a.takim_id = b.takim_id
  and a.takim_id is not null
  and a.olusturuldu < b.olusturuldu;

drop index if exists sezon_arsivi_tek_kayit;

create unique index if not exists sezon_arsivi_tek_kayit
  on sezon_arsivi (sezon_id, takim_id);


-- ---------------------------------------------------------------------
-- Kontrol sorguları (istersen tek tek çalıştır)
-- ---------------------------------------------------------------------
-- Pasife alınmış ama bu sezon oynamış takım var mı? (arşive artık girer)
--   select ad, aktif, o, p from puan_durumu_tam where not aktif;
--
-- Sitedeki tablo ile tam tablo arasındaki fark:
--   select (select count(*) from puan_durumu_tam) as tam,
--          (select count(*) from puan_durumu)     as sitede;
--
-- Arşivde mükerrer kalmış mı? (0 satır dönmeli)
--   select sezon_id, takim_id, count(*) from sezon_arsivi
--   group by 1, 2 having count(*) > 1;
