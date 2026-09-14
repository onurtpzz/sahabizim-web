-- ---------------------------------------------------------------------
-- 11 — `maclar.hafta` sütunu kaldırılıyor (14.09.2026)
--
-- NEDEN: Lig sabit haftalık tur üzerinden yürümüyor; takımlar maç tarihini
-- kendi aralarında ayarlıyor. Sütun şemada baştan beri vardı ama panelde onu
-- dolduran bir alan hiç olmadı — her kayıt `null` gidiyordu.
--
-- Sessiz tuzak buydu: `maclariGetir()` önce `hafta desc` ile sıralıyordu ve
-- Postgres'te `desc` varsayılanı `nulls first`. Bütün satırlar null olduğu için
-- sıralama kazara doğru çalışıyordu; tek bir maça elle hafta numarası yazılsa
-- o maç listenin en altına düşecekti.
--
-- SIRA ÖNEMLİ: önce yeni kodu yayına al (artık `hafta`'ya hiç dokunmuyor),
-- sonra bu dosyayı çalıştır. Tersi olursa panel eski koddan `order("hafta")`
-- göndermeye devam eder ve maç listesi hata verir.
-- ---------------------------------------------------------------------

-- Eski indeks `hafta` içerdiği için sütunla birlikte düşerdi; yerine fikstürün
-- gerçekten kullandığı sıralamayı karşılayan indeksi kuruyoruz.
drop index if exists maclar_sezon_idx;

alter table maclar drop column if exists hafta;

create index if not exists maclar_sezon_idx
  on maclar (sezon_id, oynanma desc, id desc);

-- Kontrol: aşağıdaki sorgu 0 satır döndürmeli.
-- select column_name from information_schema.columns
--   where table_name = 'maclar' and column_name = 'hafta';
