-- =====================================================================
-- SahaBizim — veritabanı şeması
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını
-- yapıştır → Run. Bir kez çalıştırılır.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Yetki: sadece bu tablodaki e-postalar yönetici sayılır.
-- ---------------------------------------------------------------------
create table if not exists yoneticiler (
  eposta text primary key,
  ad text,
  eklendi timestamptz not null default now()
);

create or replace function yonetici_mi()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from yoneticiler
    where lower(eposta) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------
-- Sezonlar
-- ---------------------------------------------------------------------
create table if not exists sezonlar (
  id uuid primary key default gen_random_uuid(),
  ad text not null,                       -- "2026–2027"
  aktif boolean not null default false,
  basladi date,
  bitti date,
  sampiyon_id uuid,
  olusturuldu timestamptz not null default now()
);

-- Aynı anda yalnızca tek aktif sezon olabilir
create unique index if not exists tek_aktif_sezon
  on sezonlar (aktif) where aktif;

-- ---------------------------------------------------------------------
-- Takımlar
--
-- devir_* sütunları: siteye geçmeden önce Excel'de tutulan birikmiş
-- istatistikler. Puan durumu = devir + bu sezondaki maçlar. Böylece
-- geçmiş veriyi maç maç girmek zorunda kalmıyoruz.
-- ---------------------------------------------------------------------
create table if not exists takimlar (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  slug text not null unique,
  logo_url text,
  renk text,
  yetkili text,
  telefon text,
  aktif boolean not null default true,
  sira integer,                            -- listede elle sıralama için
  devir_o smallint not null default 0,
  devir_g smallint not null default 0,
  devir_b smallint not null default 0,
  devir_m smallint not null default 0,
  devir_a smallint not null default 0,
  devir_y smallint not null default 0,
  devir_son3 text[] not null default '{}', -- ['','G','M'] gibi
  olusturuldu timestamptz not null default now()
);

alter table sezonlar
  drop constraint if exists sezonlar_sampiyon_fk,
  add constraint sezonlar_sampiyon_fk
    foreign key (sampiyon_id) references takimlar (id) on delete set null;

-- ---------------------------------------------------------------------
-- Maçlar — skorun girildiği tek yer. Puan durumu buradan hesaplanır.
-- ---------------------------------------------------------------------
create table if not exists maclar (
  id uuid primary key default gen_random_uuid(),
  sezon_id uuid not null references sezonlar (id) on delete cascade,
  hafta smallint,
  oynanma timestamptz,
  saha text,
  ev_id uuid not null references takimlar (id) on delete restrict,
  dep_id uuid not null references takimlar (id) on delete restrict,
  ev_skor smallint,
  dep_skor smallint,
  durum text not null default 'oynanacak'
    check (durum in ('oynanacak', 'oynandi', 'ertelendi', 'hukmen')),
  not_ text,
  olusturuldu timestamptz not null default now(),
  constraint farkli_takimlar check (ev_id <> dep_id),
  constraint oynandiysa_skor_var check (
    durum <> 'oynandi' or (ev_skor is not null and dep_skor is not null)
  )
);

create index if not exists maclar_sezon_idx on maclar (sezon_id, hafta);
create index if not exists maclar_ev_idx on maclar (ev_id);
create index if not exists maclar_dep_idx on maclar (dep_id);

-- ---------------------------------------------------------------------
-- Puan düzeltmeleri (ceza / bonus)
-- ---------------------------------------------------------------------
create table if not exists puan_duzeltmeleri (
  id uuid primary key default gen_random_uuid(),
  sezon_id uuid not null references sezonlar (id) on delete cascade,
  takim_id uuid not null references takimlar (id) on delete cascade,
  puan_farki smallint not null,
  sebep text not null,
  olusturuldu timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Görseller
--
-- slot: sitede sabit bir yere yerleşen görseller ('hero', 'kampanya').
--       Aynı slot'ta birden fazla kayıt varsa en yenisi kullanılır.
-- albom: galeri kayıtları için ('2026-eylul' gibi). slot boş kalır.
-- ---------------------------------------------------------------------
create table if not exists gorseller (
  id uuid primary key default gen_random_uuid(),
  slot text,
  albom text,
  tur text not null default 'foto' check (tur in ('foto', 'video')),
  url text not null,
  alt_metin text not null default '',
  baslik text,
  sira smallint not null default 0,
  yayinda boolean not null default true,
  olusturuldu timestamptz not null default now()
);

create index if not exists gorseller_slot_idx on gorseller (slot, olusturuldu desc);
create index if not exists gorseller_album_idx on gorseller (albom, sira);

-- ---------------------------------------------------------------------
-- Site ayarları (telefon, WhatsApp, sosyal linkler, hero metni…)
-- ---------------------------------------------------------------------
create table if not exists ayarlar (
  anahtar text primary key,
  deger text,
  aciklama text,
  guncellendi timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- İletişim / katılım talepleri
-- ---------------------------------------------------------------------
create table if not exists talepler (
  id uuid primary key default gen_random_uuid(),
  tur text not null check (tur in ('iletisim', 'katilim')),
  ad text,
  telefon text,
  takim text,
  mesaj text,
  okundu boolean not null default false,
  olusturuldu timestamptz not null default now()
);

-- =====================================================================
-- PUAN DURUMU — tek doğruluk kaynağı
-- devir_* + aktif sezonun oynanmış maçları + puan düzeltmeleri
-- =====================================================================
create or replace view puan_durumu as
with aktif as (
  select id from sezonlar where aktif limit 1
),
mac_satirlari as (
  select ev_id as takim_id, ev_skor as attigi, dep_skor as yedigi, oynanma
  from maclar, aktif
  where maclar.sezon_id = aktif.id and durum in ('oynandi', 'hukmen')
  union all
  select dep_id, dep_skor, ev_skor, oynanma
  from maclar, aktif
  where maclar.sezon_id = aktif.id and durum in ('oynandi', 'hukmen')
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
  from puan_duzeltmeleri, aktif
  where puan_duzeltmeleri.sezon_id = aktif.id
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
  where t.aktif
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
  id, ad, slug, logo_url, renk,
  o, g, b, m, a, y,
  (a - y) as av,
  (g * 3 + b + puan_farki) as p,
  son3,
  (o > 0) as oynadi
from birlesik;

-- =====================================================================
-- RLS — herkes okur, sadece yöneticiler yazar
-- =====================================================================
alter table takimlar enable row level security;
alter table sezonlar enable row level security;
alter table maclar enable row level security;
alter table puan_duzeltmeleri enable row level security;
alter table gorseller enable row level security;
alter table ayarlar enable row level security;
alter table talepler enable row level security;
alter table yoneticiler enable row level security;

do $$
declare t text;
begin
  foreach t in array array['takimlar','sezonlar','maclar','puan_duzeltmeleri','gorseller','ayarlar']
  loop
    execute format('drop policy if exists "herkes okur" on %I', t);
    execute format('create policy "herkes okur" on %I for select using (true)', t);
    execute format('drop policy if exists "yonetici yazar" on %I', t);
    execute format('create policy "yonetici yazar" on %I for all using (yonetici_mi()) with check (yonetici_mi())', t);
  end loop;
end $$;

-- Talepler: herkes gönderebilir, sadece yönetici okur.
drop policy if exists "herkes gonderir" on talepler;
create policy "herkes gonderir" on talepler for insert with check (true);
drop policy if exists "yonetici okur" on talepler;
create policy "yonetici okur" on talepler for select using (yonetici_mi());
drop policy if exists "yonetici yonetir" on talepler;
create policy "yonetici yonetir" on talepler for update using (yonetici_mi()) with check (yonetici_mi());

-- Yöneticiler tablosunu sadece yöneticiler görür/düzenler.
drop policy if exists "yonetici gorur" on yoneticiler;
create policy "yonetici gorur" on yoneticiler for all using (yonetici_mi()) with check (yonetici_mi());

-- =====================================================================
-- Dosya deposu: takım logoları ve site görselleri
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('gorseller', 'gorseller', true)
on conflict (id) do nothing;

drop policy if exists "gorseller herkes okur" on storage.objects;
create policy "gorseller herkes okur" on storage.objects
  for select using (bucket_id = 'gorseller');

drop policy if exists "gorseller yonetici yazar" on storage.objects;
create policy "gorseller yonetici yazar" on storage.objects
  for all using (bucket_id = 'gorseller' and yonetici_mi())
  with check (bucket_id = 'gorseller' and yonetici_mi());
