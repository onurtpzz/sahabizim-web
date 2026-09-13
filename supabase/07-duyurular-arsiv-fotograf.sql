-- =====================================================================
-- SahaBizim — 2. paket veritabanı değişiklikleri (13.09.2026)
--
-- Ne geliyor?
--   1) duyurular            → Kurallar ve Duyurular sayfası
--   2) sezon_arsivi         → geçmiş sezonların final tablosu (/arsiv)
--   3) sezonlar.slug        → arşiv sayfasının adresi (/arsiv/2026-2027)
--   4) takim_fotograflari   → ziyaretçi fotoğrafları (onaydan geçer)
--   5) takim-fotograflari   → yükleme için ayrı dosya kovası
--
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını
-- yapıştır → Run. Tekrar çalıştırmak zarar vermez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) KURALLAR VE DUYURULAR
--
-- tur = 'duyuru' → tarihli duyuru akışı
-- tur = 'kural'  → lig kuralları listesi (tarih gerekmez)
-- ---------------------------------------------------------------------
create table if not exists duyurular (
  id uuid primary key default gen_random_uuid(),
  tur text not null default 'duyuru' check (tur in ('duyuru', 'kural')),
  tarih date,
  baslik text not null,
  metin text not null default '',
  sabit boolean not null default false,   -- öne çıkar (en üstte, altın çerçeveli)
  sira smallint not null default 0,       -- kurallarda elle sıralama
  yayinda boolean not null default true,
  olusturuldu timestamptz not null default now()
);

create index if not exists duyurular_tur_idx on duyurular (tur, sabit desc, tarih desc, sira);


-- ---------------------------------------------------------------------
-- 2) SEZON ARŞİVİ
--
-- Sezon kapanırken o anki puan durumunun fotoğrafı buraya kopyalanır.
-- Takım silinse bile tablo bozulmasın diye takım adı da saklanıyor.
-- ---------------------------------------------------------------------
create table if not exists sezon_arsivi (
  id uuid primary key default gen_random_uuid(),
  sezon_id uuid not null references sezonlar (id) on delete cascade,
  takim_id uuid references takimlar (id) on delete set null,
  sira smallint not null,
  takim_ad text not null,
  slug text not null,
  logo_url text,
  o smallint not null default 0,
  g smallint not null default 0,
  b smallint not null default 0,
  m smallint not null default 0,
  a smallint not null default 0,
  y smallint not null default 0,
  av smallint not null default 0,
  p smallint not null default 0,
  olusturuldu timestamptz not null default now()
);

create unique index if not exists sezon_arsivi_tek_kayit
  on sezon_arsivi (sezon_id, slug);
create index if not exists sezon_arsivi_sezon_idx on sezon_arsivi (sezon_id, sira);


-- ---------------------------------------------------------------------
-- 3) SEZON ADRESİ (slug)
-- "2026–2027" → "2026-2027"
-- ---------------------------------------------------------------------
alter table sezonlar add column if not exists slug text;

update sezonlar
set slug = regexp_replace(lower(translate(ad, '–—/ ', '----')), '-+', '-', 'g')
where slug is null or slug = '';

create unique index if not exists sezonlar_slug_tekil on sezonlar (slug);


-- ---------------------------------------------------------------------
-- 4) TAKIM FOTOĞRAFLARI
--
-- Ziyaretçi yükler → durum 'bekliyor'. Panelden onaylanınca 'onayli'
-- olur ve takım sayfasında görünür. Site sadece 'onayli' olanları okur.
-- ---------------------------------------------------------------------
create table if not exists takim_fotograflari (
  id uuid primary key default gen_random_uuid(),
  takim_id uuid not null references takimlar (id) on delete cascade,
  url text not null,
  aciklama text,
  yukleyen_ad text,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'onayli', 'red')),
  sira smallint not null default 0,
  olusturuldu timestamptz not null default now()
);

create index if not exists takim_foto_idx
  on takim_fotograflari (takim_id, durum, sira, olusturuldu desc);
create index if not exists takim_foto_bekleyen_idx
  on takim_fotograflari (durum, olusturuldu desc);


-- =====================================================================
-- RLS
-- =====================================================================
alter table duyurular enable row level security;
alter table sezon_arsivi enable row level security;
alter table takim_fotograflari enable row level security;

-- Duyurular ve arşiv: herkes okur, yönetici yazar.
do $$
declare t text;
begin
  foreach t in array array['duyurular','sezon_arsivi']
  loop
    execute format('drop policy if exists "herkes okur" on %I', t);
    execute format('create policy "herkes okur" on %I for select using (true)', t);
    execute format('drop policy if exists "yonetici yazar" on %I', t);
    execute format('create policy "yonetici yazar" on %I for all using (yonetici_mi()) with check (yonetici_mi())', t);
  end loop;
end $$;

-- Fotoğraflar: herkes SADECE onaylıları görür; herkes 'bekliyor' kaydı
-- gönderebilir; değiştirme ve silme yalnız yöneticide.
drop policy if exists "onayli olanlari herkes gorur" on takim_fotograflari;
create policy "onayli olanlari herkes gorur" on takim_fotograflari
  for select using (durum = 'onayli' or yonetici_mi());

drop policy if exists "herkes gonderir" on takim_fotograflari;
create policy "herkes gonderir" on takim_fotograflari
  for insert with check (durum = 'bekliyor');

drop policy if exists "yonetici yonetir" on takim_fotograflari;
create policy "yonetici yonetir" on takim_fotograflari
  for update using (yonetici_mi()) with check (yonetici_mi());

drop policy if exists "yonetici siler" on takim_fotograflari;
create policy "yonetici siler" on takim_fotograflari
  for delete using (yonetici_mi());


-- =====================================================================
-- 5) FOTOĞRAF KOVASI
--
-- Site görselleri ('gorseller') sadece yöneticiye açık. Ziyaretçi
-- yüklemesi ayrı kovada tutuluyor: yükleyebilir, ama üzerine yazamaz
-- ve silemez. Onaylanmayan dosyaları panelden silersin.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('takim-fotograflari', 'takim-fotograflari', true, 8388608,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 8388608,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "takim foto herkes okur" on storage.objects;
create policy "takim foto herkes okur" on storage.objects
  for select using (bucket_id = 'takim-fotograflari');

drop policy if exists "takim foto herkes yukler" on storage.objects;
create policy "takim foto herkes yukler" on storage.objects
  for insert with check (bucket_id = 'takim-fotograflari');

drop policy if exists "takim foto yonetici yonetir" on storage.objects;
create policy "takim foto yonetici yonetir" on storage.objects
  for update using (bucket_id = 'takim-fotograflari' and yonetici_mi())
  with check (bucket_id = 'takim-fotograflari' and yonetici_mi());

drop policy if exists "takim foto yonetici siler" on storage.objects;
create policy "takim foto yonetici siler" on storage.objects
  for delete using (bucket_id = 'takim-fotograflari' and yonetici_mi());


-- =====================================================================
-- Başlangıç içeriği — lig kuralları ve ilk duyuru.
-- Panelden değiştirilebilir; beğenmezsen sil.
-- =====================================================================
insert into duyurular (tur, tarih, baslik, metin, sira, sabit)
select * from (values
  ('kural'::text, null::date, 'Kayıt ve kadro',
   'Her takım sezon başında tek kayıt yaptırır. Kadroya sezon ortasında oyuncu eklenebilir; aynı oyuncu aynı sezonda iki takımda oynayamaz.', 1::smallint, false),
  ('kural', null, 'Maç saati ve geç kalma',
   'Maç saatinde sahada en az beş oyuncusu bulunmayan takım 15 dakika beklenir. Süre dolduğunda maç hükmen 3-0 sayılır.', 2, false),
  ('kural', null, 'Skorun bildirilmesi',
   'Maç biter bitmez skor yönetime iletilir. Puan durumu skor girildiği anda kendiliğinden güncellenir.', 3, false),
  ('kural', null, 'Puanlama ve sıralama',
   'Galibiyet 3, beraberlik 1, mağlubiyet 0 puandır. Sıralama: puan → averaj → atılan gol → takım adı.', 4, false),
  ('kural', null, 'Saha içi davranış',
   'Küfür, kavga ve her türlü ayrımcılık disiplin sebebidir. Yönetim ceza puanı verebilir; tekrarı hâlinde takım ligden çıkarılır.', 5, false),
  ('kural', null, 'Ekipman',
   'Her takım kendi formasıyla çıkar. Renk çakışmasında deplasman takımı forma değiştirir. Krampon ve tekmelik zorunludur.', 6, false),
  ('duyuru', current_date, 'Site yayında',
   'SahaBizim artık kendi sitesinde. Puan durumu, fikstür ve takım sayfaları her maç sonrası kendiliğinden güncelleniyor. Kurallar ve duyurular bu sayfadan takip edilir.', 0, true)
) as v(tur, tarih, baslik, metin, sira, sabit)
where not exists (select 1 from duyurular);
