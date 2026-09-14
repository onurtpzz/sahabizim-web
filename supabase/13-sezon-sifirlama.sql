-- =====================================================================
-- SahaBizim — 13: Sezon sıfırlamayı tek işleme çevir (rapor A1)
--
-- SORUN
-- `yeniSezon()` tarayıcıdan DÖRT ayrı yazma yapıyordu:
--   1) arşivle → 2) eski sezonu kapat → 3) yeni sezonu aç → 4) devir_* sıfırla
-- Aralarında bağlantı koparsa veritabanı yarım kalıyordu. En kötü senaryo:
-- 2 çalışıp 3 çalışmazsa HİÇ AKTİF SEZON KALMAZ; `puan_durumu` boş döner ve
-- site komple boş bir lig gösterir. Yedek de olmadığı için geri dönüş yok.
--
-- ÇÖZÜM
-- Dört adım tek bir Postgres fonksiyonuna taşındı. Fonksiyon gövdesi tek
-- transaction olduğu için ya hepsi olur ya hiçbiri. Arada kopan bağlantı
-- veritabanını bozamaz.
--
-- BONUS — GERİ ALMA ŞANSI
-- Sıfırlama `devir_*` alanlarını (Excel'den gelen site öncesi istatistikler)
-- siliyordu ve bunlar hiçbir yerde saklanmıyordu. Yanlışlıkla sıfırlarsan
-- maçlar geri gelir (eski `sezon_id` ile duruyorlar) ama Excel devri gelmezdi.
-- Artık arşiv satırı `devir_*` değerlerini de saklıyor: eski sezonu tekrar
-- aktife alırsan devir değerleri arşivden birebir geri yazılabilir.
--
-- SIRA: önce bu dosyayı çalıştır, SONRA kodu deploy et.
-- Tekrar çalıştırmak zarar vermez. Bu dosya mevcut veriyi DEĞİŞTİRMEZ —
-- yalnız sütun, fonksiyon ve yetki ekler.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) Arşive devir sütunları — sıfırlamayı geri alabilmek için
-- ---------------------------------------------------------------------
alter table sezon_arsivi
  add column if not exists devir_o smallint not null default 0,
  add column if not exists devir_g smallint not null default 0,
  add column if not exists devir_b smallint not null default 0,
  add column if not exists devir_m smallint not null default 0,
  add column if not exists devir_a smallint not null default 0,
  add column if not exists devir_y smallint not null default 0,
  add column if not exists devir_son3 text[];

comment on column sezon_arsivi.devir_o is
  'Sezon kapanırken takımın devir_* değerleri. Sıfırlama geri alınmak istenirse buradan yazılır.';


-- ---------------------------------------------------------------------
-- 2) Arşivleme — tek yerde
--    Hem "Şimdi arşivle" butonu hem sezon sıfırlama bunu çağırır, böylece
--    iki ayrı arşivleme mantığı olmaz.
-- ---------------------------------------------------------------------
create or replace function sezonu_arsivle(p_sezon_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_adet integer;
begin
  -- security definer olduğu için RLS'i atlar; yetkiyi kendimiz kontrol ediyoruz.
  if not yonetici_mi() then
    raise exception 'Bu işlem için yönetici yetkisi gerekiyor.';
  end if;

  if p_sezon_id is null then
    raise exception 'Sezon belirtilmedi.';
  end if;

  -- Kaynak `puan_durumu_tam`: pasife alınmış ama bu sezon oynamış takımlar da
  -- tarihe geçsin (bkz. 12-arsiv-butunlugu.sql).
  insert into sezon_arsivi (
    sezon_id, takim_id, sira, takim_ad, slug, logo_url,
    o, g, b, m, a, y, av, p,
    devir_o, devir_g, devir_b, devir_m, devir_a, devir_y, devir_son3
  )
  select
    p_sezon_id, pd.id, pd.sira, pd.ad, pd.slug, t.logo_url,
    pd.o, pd.g, pd.b, pd.m, pd.a, pd.y, pd.av, pd.p,
    t.devir_o, t.devir_g, t.devir_b, t.devir_m, t.devir_a, t.devir_y, t.devir_son3
  from puan_durumu_tam pd
  join takimlar t on t.id = pd.id
  on conflict (sezon_id, takim_id) do update set
    sira       = excluded.sira,
    takim_ad   = excluded.takim_ad,
    slug       = excluded.slug,
    logo_url   = excluded.logo_url,
    o = excluded.o, g = excluded.g, b = excluded.b, m = excluded.m,
    a = excluded.a, y = excluded.y, av = excluded.av, p = excluded.p,
    devir_o = excluded.devir_o, devir_g = excluded.devir_g,
    devir_b = excluded.devir_b, devir_m = excluded.devir_m,
    devir_a = excluded.devir_a, devir_y = excluded.devir_y,
    devir_son3 = excluded.devir_son3;

  get diagnostics v_adet = row_count;

  if v_adet = 0 then
    raise exception 'Puan durumu boş, arşivlenecek bir şey yok.';
  end if;

  -- Şampiyonu sezona işle (yalnız aktif sezonun tablosu hesaplanabildiği için
  -- bu da kapanmadan önce yapılmak zorunda).
  update sezonlar
  set sampiyon_id = (select id from puan_durumu_tam where sira = 1)
  where id = p_sezon_id;

  return v_adet;
end;
$$;


-- ---------------------------------------------------------------------
-- 3) Sezon sıfırlama — dört adım, tek transaction
-- ---------------------------------------------------------------------
create or replace function yeni_sezon(
  p_ad text,
  p_slug text,
  p_takimlari_tasi boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eski_id   uuid;
  v_yeni_id   uuid;
  v_arsivlenen integer := 0;
  -- Sunucu UTC'de çalışıyor; tarihleri lig saatiyle yazıyoruz, yoksa gece
  -- yarısına yakın yapılan sıfırlama bir önceki güne düşer.
  v_bugun date := (now() at time zone 'Europe/Istanbul')::date;
begin
  if not yonetici_mi() then
    raise exception 'Bu işlem için yönetici yetkisi gerekiyor.';
  end if;

  if coalesce(btrim(p_ad), '') = '' then
    raise exception 'Yeni sezon adı boş olamaz.';
  end if;

  if coalesce(btrim(p_slug), '') = '' then
    raise exception 'Yeni sezon adresi (slug) boş olamaz.';
  end if;

  select id into v_eski_id from sezonlar where aktif limit 1;

  if v_eski_id is not null then
    -- ÖNCE arşivle: görünümler yalnız aktif sezonu hesaplıyor, sezon
    -- kapandıktan sonra o tablo bir daha üretilemez.
    v_arsivlenen := sezonu_arsivle(v_eski_id);

    update sezonlar
    set aktif = false, bitti = v_bugun
    where id = v_eski_id;
  end if;

  -- `tek_aktif_sezon` benzersizlik kuralı yüzünden yeni sezon, eskisi
  -- kapatıldıktan SONRA açılmak zorunda.
  insert into sezonlar (ad, slug, aktif, basladi)
  values (btrim(p_ad), btrim(p_slug), true, v_bugun)
  returning id into v_yeni_id;

  -- Yeni sezon sıfırdan başlar. Devir değerleri yukarıda arşive yazıldı.
  update takimlar
  set devir_o = 0, devir_g = 0, devir_b = 0, devir_m = 0,
      devir_a = 0, devir_y = 0, devir_son3 = '{}',
      aktif = case when p_takimlari_tasi then aktif else false end;

  return jsonb_build_object(
    'sezon_id', v_yeni_id,
    'arsivlenen', v_arsivlenen,
    'eski_sezon_id', v_eski_id
  );
end;
$$;


-- ---------------------------------------------------------------------
-- 4) Yetkiler — yalnız giriş yapmış kullanıcı çağırabilir; fonksiyon
--    içindeki yonetici_mi() kontrolü asıl kapıyı tutuyor.
-- ---------------------------------------------------------------------
revoke all on function sezonu_arsivle(uuid) from public, anon;
revoke all on function yeni_sezon(text, text, boolean) from public, anon;
grant execute on function sezonu_arsivle(uuid) to authenticated;
grant execute on function yeni_sezon(text, text, boolean) to authenticated;


-- =====================================================================
-- SIFIRLAMAYI GERİ ALMA (acil durum reçetesi)
--
-- Yanlışlıkla sezon sıfırladıysan, AŞAĞIDAKİLERİ ELLE ÇALIŞTIRMADAN ÖNCE
-- ne yaptığını iyi anla — bunlar canlı veriyi değiştirir.
--
-- 1) Yeni sezonu kapat, eskisini aç (sırası önemli, tek aktif sezon kuralı):
--      update sezonlar set aktif = false where id = '<YENİ_SEZON_ID>';
--      update sezonlar set aktif = true, bitti = null where id = '<ESKİ_SEZON_ID>';
--
-- 2) Devir değerlerini arşivden geri yaz:
--      update takimlar t
--      set devir_o = a.devir_o, devir_g = a.devir_g, devir_b = a.devir_b,
--          devir_m = a.devir_m, devir_a = a.devir_a, devir_y = a.devir_y,
--          devir_son3 = a.devir_son3
--      from sezon_arsivi a
--      where a.takim_id = t.id and a.sezon_id = '<ESKİ_SEZON_ID>';
--
-- 3) Takımlar pasife alındıysa (takımları taşıma seçilmemişse) geri aç:
--      update takimlar set aktif = true where id in (
--        select takim_id from sezon_arsivi where sezon_id = '<ESKİ_SEZON_ID>'
--      );
--
-- Yeni sezonu SİLME — `maclar` tablosu ona `on delete cascade` bağlı, o
-- sezona girilmiş maçlar da silinir.
-- =====================================================================
