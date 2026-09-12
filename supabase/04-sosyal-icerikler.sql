-- =====================================================================
-- SahaBizim — sosyal medya içerikleri
-- 01–03 çalıştırıldıktan sonra SQL Editor'da çalıştır.
-- Panelden eklenen Instagram gönderileri ve YouTube videoları burada tutulur.
-- =====================================================================

create table if not exists sosyal_icerikler (
  id uuid primary key default gen_random_uuid(),
  tur text not null check (tur in ('instagram', 'youtube')),
  url text not null,
  baslik text,
  sira smallint not null default 0,
  yayinda boolean not null default true,
  olusturuldu timestamptz not null default now()
);

create index if not exists sosyal_sira_idx on sosyal_icerikler (yayinda, sira, olusturuldu desc);

alter table sosyal_icerikler enable row level security;

drop policy if exists "herkes okur" on sosyal_icerikler;
create policy "herkes okur" on sosyal_icerikler for select using (true);

drop policy if exists "yonetici yazar" on sosyal_icerikler;
create policy "yonetici yazar" on sosyal_icerikler
  for all using (yonetici_mi()) with check (yonetici_mi());

-- Anasayfadaki bölümün başlığı ve açıklaması da panelden değişsin
insert into ayarlar (anahtar, deger, aciklama) values
  ('sosyal_baslik', 'Sahadan kareler', 'Sosyal içerikler bölümü · başlık'),
  ('sosyal_metin',  'Instagram ve YouTube''da paylaştığımız son içerikler.', 'Sosyal içerikler bölümü · açıklama')
on conflict (anahtar) do nothing;
