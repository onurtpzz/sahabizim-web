-- =====================================================================
-- SahaBizim — 14: Taleplere silme izni (14.09.2026)
--
-- `talepler` tablosunda insert / select / update politikaları vardı ama
-- DELETE politikası yoktu. RLS açık olduğu için silme isteği reddediliyor,
-- üstelik PostgREST bunu HATA OLARAK DÖNDÜRMÜYOR — sessizce 0 satır siliyor.
-- Yani panele silme düğmesi konsaydı "silindi" der, kayıt yerinde kalırdı.
--
-- Bu dosya yalnızca politika ekler; hiçbir veriye dokunmaz.
-- Supabase → SQL Editor → New query → yapıştır → Run.
-- Tekrar çalıştırmak zarar vermez.
-- =====================================================================

drop policy if exists "yonetici siler" on talepler;
create policy "yonetici siler" on talepler
  for delete using (yonetici_mi());

-- Kontrol: aşağıdaki sorgu 'yonetici siler' satırını döndürmeli.
--   select policyname, cmd from pg_policies
--   where tablename = 'talepler' order by policyname;
