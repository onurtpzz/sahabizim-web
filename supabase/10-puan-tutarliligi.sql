-- =====================================================================
-- SahaBizim — 10: Puan tablosunun tutarlılığı (14.09.2026)
--
-- İki açık kapatılıyor. İkisi de hata vermeden yanlış tablo üretiyordu,
-- yani fark edilmesi zor cinsten.
--
-- A2) HÜKMEN MAÇ SKORSUZ KAYDEDİLEBİLİYORDU
--     Mevcut kısıt yalnız 'oynandi' durumunu kontrol ediyordu:
--         durum <> 'oynandi' or (ev_skor is not null and dep_skor is not null)
--     Oysa `puan_durumu` görünümü 'hukmen' maçları da sayıyor. Skoru boş
--     bir hükmen maçı girilseydi: count(*) O'yu artırır, ama galibiyet/
--     beraberlik/mağlubiyet filtreleri NULL yüzünden hiçbirini saymazdı.
--     Sonuç: O = 1, G+B+M = 0. Tablo sessizce tutarsızlaşırdı.
--
-- A3) DEVİR İSTATİSTİKLERİ EKSİK GİRİLEBİLİYORDU
--     Panel yalnızca "G+B+M oynanandan fazla olamaz" diye bakıyordu.
--     Yani 8 maç oynadı, 3 sonuç girildi geçerli sayılıyordu; tabloda O
--     ile G/B/M birbirini tutmuyordu. Artık eşitlik şart.
--
-- Supabase panelinde: SQL Editor → New query → tamamını yapıştır → Run.
-- Tekrar çalıştırmak zarar vermez.
--
-- ÖNEMLİ: Bu dosya önce mevcut veriyi denetler. Kurallara uymayan kayıt
-- varsa HİÇBİR ŞEY değiştirmez, hangi kaydın sorunlu olduğunu söyler.
-- Postgres'in anlaşılmaz kısıt hatası yerine düzeltilebilir bir mesaj
-- alırsın.
-- =====================================================================

do $tutarlilik$
declare
  skorsuz_hukmen text;
  bozuk_devir text;
  negatif_skor text;
begin
  ------------------------------------------------------------------
  -- DENETİM 1 — skoru girilmemiş 'oynandi' / 'hukmen' maçlar
  ------------------------------------------------------------------
  select string_agg(
           coalesce(to_char(oynanma, 'DD.MM.YYYY'), 'tarihsiz') || ' (' || durum || ')',
           ', '
         )
    into skorsuz_hukmen
  from maclar
  where durum in ('oynandi', 'hukmen')
    and (ev_skor is null or dep_skor is null);

  if skorsuz_hukmen is not null then
    raise exception
      E'Skoru girilmemiş oynanmış/hükmen maç var, kısıt eklenemedi.\nSorunlu maçlar: %\nÇözüm: Maç & Skor ekranından bu maçların skorunu gir ya da durumlarını "oynanacak" yap, sonra bu dosyayı tekrar çalıştır.',
      skorsuz_hukmen;
  end if;

  ------------------------------------------------------------------
  -- DENETİM 2 — G+B+M ile O'su tutmayan takımlar
  ------------------------------------------------------------------
  select string_agg(
           ad || ' (O=' || devir_o || ', G+B+M=' || (devir_g + devir_b + devir_m) || ')',
           ', '
         )
    into bozuk_devir
  from takimlar
  where devir_g + devir_b + devir_m <> devir_o;

  if bozuk_devir is not null then
    raise exception
      E'Devir istatistikleri tutarsız olan takım var, kısıt eklenemedi.\nSorunlu takımlar: %\nÇözüm: Puan Düzeltme ekranından bu takımların O/G/B/M değerlerini düzelt, sonra bu dosyayı tekrar çalıştır.',
      bozuk_devir;
  end if;

  ------------------------------------------------------------------
  -- DENETİM 3 — negatif değerler
  ------------------------------------------------------------------
  select string_agg(ad, ', ') into negatif_skor
  from takimlar
  where devir_o < 0 or devir_g < 0 or devir_b < 0
     or devir_m < 0 or devir_a < 0 or devir_y < 0;

  if negatif_skor is not null then
    raise exception
      E'Negatif devir değeri olan takım var, kısıt eklenemedi.\nSorunlu takımlar: %',
      negatif_skor;
  end if;

  ------------------------------------------------------------------
  -- Veri temiz — kısıtlar eklenebilir.
  ------------------------------------------------------------------

  -- A2: hükmen maçlar da skor zorunlu
  execute 'alter table maclar drop constraint if exists oynandiysa_skor_var';
  execute $k$
    alter table maclar add constraint oynandiysa_skor_var check (
      durum not in ('oynandi', 'hukmen')
      or (ev_skor is not null and dep_skor is not null)
    )
  $k$;

  -- Skorlar negatif olamaz. Panel zaten rakam dışını eliyor ama kural
  -- veritabanında dursun: averajı bozacak bir kayıt SQL'den de giremesin.
  execute 'alter table maclar drop constraint if exists skor_negatif_olamaz';
  execute $k$
    alter table maclar add constraint skor_negatif_olamaz check (
      (ev_skor is null or ev_skor >= 0) and (dep_skor is null or dep_skor >= 0)
    )
  $k$;

  -- A3: devirde O = G + B + M
  execute 'alter table takimlar drop constraint if exists devir_tutarli';
  execute $k$
    alter table takimlar add constraint devir_tutarli check (
      devir_g + devir_b + devir_m = devir_o
    )
  $k$;

  -- Devir değerleri negatif olamaz
  execute 'alter table takimlar drop constraint if exists devir_negatif_olamaz';
  execute $k$
    alter table takimlar add constraint devir_negatif_olamaz check (
      devir_o >= 0 and devir_g >= 0 and devir_b >= 0
      and devir_m >= 0 and devir_a >= 0 and devir_y >= 0
    )
  $k$;

  raise notice 'Kısıtlar eklendi: oynandiysa_skor_var, skor_negatif_olamaz, devir_tutarli, devir_negatif_olamaz';
end
$tutarlilik$;


-- =====================================================================
-- Sonuç — puan tablosunda O ile G+B+M tutuyor mu?
-- Bu sorgunun HİÇ satır döndürmemesi gerekir.
-- =====================================================================
select ad, o, g, b, m, (g + b + m) as g_b_m_toplami
from puan_durumu
where g + b + m <> o;
