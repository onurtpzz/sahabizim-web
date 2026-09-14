-- =====================================================================
-- SahaBizim — 09: Ziyaretçi fotoğraf yüklemesinin güvenliği (14.09.2026)
--
-- SORUN (07 numaralı dosyadaki hâliyle):
--   1) `takim-fotograflari` kovasındaki yükleme kuralı hiçbir kısıt
--      içermiyordu: internetteki herhangi biri siteyi hiç açmadan,
--      doğrudan Supabase'e sınırsız sayıda dosya yükleyebiliyordu.
--   2) Kova herkese açık olduğu için, kayıt "bekliyor" durumunda kalsa
--      ve sitede görünmese bile, yüklenen dosyanın kendi adresi
--      dışarıdan açılabiliyordu. Yani onaydan geçmemiş bir fotoğraf
--      fiilen yayındaydı.
--
-- ÇÖZÜM:
--   Ziyaretçi yüklemesi artık GİZLİ bir kovaya gidiyor
--   (`takim-fotograflari-bekleyen`). Orayı yalnız yönetici okuyabiliyor.
--   Panelden onaylandığı anda dosya herkese açık kovaya taşınıyor.
--   Böylece "onaylanmadan yayında olma" durumu tamamen ortadan kalkıyor.
--
--   Ayrıca yükleme, önce veritabanında bir kayıt açılmasına bağlandı.
--   Kayıt açmayı sınırlayan tetikleyici, dolaylı olarak yüklenebilecek
--   dosya sayısını da sınırlıyor — depolama kotasını tüketme saldırısı
--   bu sayede kapanıyor.
--
-- Supabase panelinde: SQL Editor → New query → tamamını yapıştır → Run.
-- Tekrar çalıştırmak zarar vermez. 07'den sonra çalıştırılmalı.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) Onay bekleyen dosyalar için GİZLİ kova
--    public = false  → dosyanın doğrudan adresi çalışmaz.
--    4 MB            → 8 MB gereğinden fazlaydı; telefon fotoğrafı sığar.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('takim-fotograflari-bekleyen', 'takim-fotograflari-bekleyen', false, 4194304,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = 4194304,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];


-- ---------------------------------------------------------------------
-- 2) Yayın kovası: herkese açık kalır ama artık ziyaretçi YAZAMAZ.
--    Buraya yalnızca onay anında, yönetici eliyle dosya taşınır.
-- ---------------------------------------------------------------------
update storage.buckets
   set file_size_limit    = 4194304,
       allowed_mime_types = array['image/jpeg','image/png','image/webp']
 where id = 'takim-fotograflari';

-- ASIL AÇIĞI KAPATAN SATIR: sınırsız anonim yükleme kuralı kaldırılıyor.
drop policy if exists "takim foto herkes yukler" on storage.objects;


-- ---------------------------------------------------------------------
-- 3) Dosyanın kovadaki yolu artık kayıtta tutuluyor.
--    Onayda taşımak ve silmede dosyayı da silmek için gerekli.
-- ---------------------------------------------------------------------
alter table takim_fotograflari add column if not exists dosya_yolu text;


-- ---------------------------------------------------------------------
-- 4) Yükleme sınırı — hem kuyruğu hem depolamayı koruyor.
--
--    Dosya yüklemek için önce kayıt açmak şart (bkz. 5. bölümdeki
--    storage kuralı). Kayıt açmayı burada sınırladığımız için,
--    yüklenebilecek dosya sayısı da sınırlanmış oluyor.
--
--    Takım başına 5, toplamda 120 bekleyen kayıt.
--
--    Fotoğraf ayrıca tarayıcıda küçültülüp yükleniyor (uzun kenar 1600 px,
--    WebP) — telefondan gelen 5-8 MB'lık kare genelde 200-500 KB'a iniyor.
--    Bu iki önlem birlikte, bekleyen kuyruğun kaplayabileceği yeri en kötü
--    durumda ~60 MB ile sınırlıyor. 4 MB'lık kova sınırı ise küçültme
--    çalışmazsa devreye giren emniyet kemeri.
-- ---------------------------------------------------------------------
--    DİKKAT — `security definer` şart:
--    Tetikleyici varsayılan olarak çağıran kullanıcının yetkisiyle çalışır.
--    Ziyaretçi 'bekliyor' kayıtlarını okuyamadığı için (RLS) içerideki sayım
--    hep 0 döner ve sınır hiç devreye girmez. `security definer` sayımın
--    tabloyu bütünüyle görmesini sağlar.
create or replace function bekleyen_foto_siniri()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  takim_adet int;
  toplam_adet int;
begin
  if new.durum is distinct from 'bekliyor' then
    return new;
  end if;

  select count(*) into takim_adet
    from takim_fotograflari
   where takim_id = new.takim_id and durum = 'bekliyor';

  if takim_adet >= 5 then
    raise exception 'Bu takım için onay bekleyen fotoğraf sınırına ulaşıldı. Mevcut fotoğraflar onaylandıktan sonra yenisini gönderebilirsin.';
  end if;

  select count(*) into toplam_adet
    from takim_fotograflari
   where durum = 'bekliyor';

  if toplam_adet >= 120 then
    raise exception 'Onay kuyruğu şu an dolu. Lütfen daha sonra tekrar dene.';
  end if;

  return new;
end
$$;

drop trigger if exists bekleyen_foto_siniri_tg on takim_fotograflari;
create trigger bekleyen_foto_siniri_tg
  before insert on takim_fotograflari
  for each row execute function bekleyen_foto_siniri();


-- Açıklama ve ad alanları için üst sınır (tarayıcıdaki kısıtın
-- veritabanı tarafındaki karşılığı — panel dışından da geçerli).
alter table takim_fotograflari drop constraint if exists foto_metin_sinir;
alter table takim_fotograflari add constraint foto_metin_sinir check (
  coalesce(length(aciklama), 0) <= 200
  and coalesce(length(yukleyen_ad), 0) <= 60
);


-- ---------------------------------------------------------------------
-- 5) GİZLİ kovanın kuralları
--
--    Yükleme iki şarta bağlı:
--      a) dosya yolu  <takim_id>/<dosya adı>  biçiminde olacak
--      b) o yolu işaret eden, durumu 'bekliyor' olan bir kayıt
--         veritabanında ZATEN bulunacak
--
--    (b) şartı olmadan biri doğrudan Supabase'e dosya yağdırabilirdi.
--    Kayıt açmak tetikleyiciyle sınırlı olduğu için bu kapı da kapanıyor.
-- ---------------------------------------------------------------------
--    Kontrol neden ayrı bir fonksiyonda?
--    Politikanın içine doğrudan yazılan sorgu da ziyaretçinin yetkisiyle
--    çalışır; ziyaretçi 'bekliyor' kayıtlarını göremediği için (RLS) sorgu
--    hep boş döner ve kural her yüklemeyi reddeder — meşru olanları da.
--    `security definer` fonksiyon kaydı görebildiği için doğru yanıtı verir.
create or replace function bekleyen_foto_yuklenebilir(p_yol text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select exists (
    select 1
      from takim_fotograflari f
      join takimlar t on t.id = f.takim_id
     where f.durum = 'bekliyor'
       and f.dosya_yolu = p_yol
       and t.aktif
       and t.id::text = (storage.foldername(p_yol))[1]
  );
$$;

drop policy if exists "bekleyen foto yukleme" on storage.objects;
create policy "bekleyen foto yukleme" on storage.objects
  for insert with check (
    bucket_id = 'takim-fotograflari-bekleyen'
    and array_length(storage.foldername(name), 1) = 1
    and bekleyen_foto_yuklenebilir(name)
  );

-- Okuma, taşıma ve silme yalnız yöneticide. Ziyaretçi kendi yüklediği
-- dosyayı bile geri okuyamaz — panel imzalı adresle görüntüler.
drop policy if exists "bekleyen foto yonetici" on storage.objects;
create policy "bekleyen foto yonetici" on storage.objects
  for all
  using (bucket_id = 'takim-fotograflari-bekleyen' and yonetici_mi())
  with check (bucket_id = 'takim-fotograflari-bekleyen' and yonetici_mi());


-- ---------------------------------------------------------------------
-- 6) Yayın kovasının kuralları — okuma herkese, yazma yalnız yöneticiye
-- ---------------------------------------------------------------------
drop policy if exists "takim foto herkes okur" on storage.objects;
create policy "takim foto herkes okur" on storage.objects
  for select using (bucket_id = 'takim-fotograflari');

drop policy if exists "takim foto yonetici yonetir" on storage.objects;
drop policy if exists "takim foto yonetici siler" on storage.objects;
drop policy if exists "takim foto yonetici" on storage.objects;
create policy "takim foto yonetici" on storage.objects
  for all
  using (bucket_id = 'takim-fotograflari' and yonetici_mi())
  with check (bucket_id = 'takim-fotograflari' and yonetici_mi());


-- ---------------------------------------------------------------------
-- 7) Durum raporu
--
--    Bu değişiklikten ÖNCE yüklenmiş, hâlâ onay bekleyen kayıtlar eski
--    (herkese açık) kovada duruyor; dosyaları adresini bilen için
--    erişilebilir olmaya devam eder. Aşağıdaki sayı 0 değilse panelden
--    o kayıtları gözden geçirip onayla ya da Sil ile temizle.
-- ---------------------------------------------------------------------
select
  count(*) filter (where durum = 'bekliyor' and dosya_yolu is null) as eski_bekleyen_kayit,
  count(*) filter (where durum = 'onayli')                          as yayindaki,
  count(*)                                                          as toplam
from takim_fotograflari;
