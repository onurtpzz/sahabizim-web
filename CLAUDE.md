# SahaBizim projesi — çalışma notları

Bu dosya, projede çalışan yapay zekâ oturumları içindir. Genel yol haritası yedek klasöründeki
`sahabizim-yol-haritasi.md` dosyasındadır; kapsam, fazlar ve kararlar oradadır.
Kod incelemesi ve açık maddeler için `sahabizim-inceleme-raporu.md`.

## ⛔ CANLI VERİYE DOKUNMA — her şeyden önce gelir

**Bu projenin veritabanı yedeği YOKTUR.** Supabase ücretsiz planında otomatik günlük yedek
yok (14.09.2026'da doğrulandı: yedek yalnız Pro ve üstünde var). Elle alınmış bir yedek de
şu an yok. Yani canlı veride yapılan her hata **kalıcıdır, geri dönüşü yoktur.**

Site operasyonu baştan sona yapay zekâ ile yürütülüyor; o yüzden bu kural diğer bütün
kuralların önünde gelir.

**Sen ASLA canlı veriyi kendiliğinden değiştirmezsin.** Aşağıdakilerden birini yapacaksan
ÖNCE dur, ne olacağını açıkça anlat ve kullanıcının onayını bekle:

- `delete`, `truncate`, `update` — yani var olan satırları değiştiren veya silen her SQL
- `drop table`, `drop column`, `drop view`, `drop index`, veri kaybettiren `alter table`
- Sezon sıfırlama (`yeniSezon`), arşivleme, devir istatistiklerini (`devir_*`) değiştirmek
- Depodaki (storage) dosyaları silmek veya taşımak
- Toplu kayıt güncelleyen herhangi bir betik

Onay isterken şunları söyle: **hangi tablo, kaç satır, geri alınabilir mi, alınamazsa ne
kaybolur.** "Tekrar çalıştırmak zarar vermez" demek yetmez — neden zarar vermediğini yaz.

**Onay gerektirmeyenler** (şema eklemeleri, veriye dokunmazlar): `create table if not
exists`, yeni sütun ekleme, `create or replace view`, yeni index, yeni RLS politikası,
yeni SQL dosyası yazmak. Yine de SQL dosyasını kullanıcının çalıştıracağını hatırlat ve
sırasını söyle (kod önce mi, SQL önce mi).

**Kod yazmak serbesttir.** Bu kural veritabanı ve depo içindir; dosya düzenlemek, bileşen
eklemek, yeni SQL dosyası *yazmak* onay gerektirmez — onu *çalıştırmak* kullanıcının işi.

## Dil

Arayüz metinleri, değişken/fonksiyon adları ve yorumlar **Türkçe**. Teknik terimlerde
(component, build, slug) İngilizce kalabilir. Kullanıcıya Türkçe yanıt ver.

## Teknoloji

- Next.js 16, App Router, TypeScript, Tailwind CSS v4 (PostCSS eklentisi, `@theme` bloğu)
- Animasyon için ek kütüphane **yok**: `src/components/reveal.tsx` ve `sayac.tsx`
  IntersectionObserver + CSS ile çalışıyor. Yeni kütüphane eklemeden önce gerekçelendir.
- **shadcn/ui ve Framer Motion kullanılmıyor.** Yol haritasının eski sürümlerinde geçiyor
  olabilir; bileşenler elle yazıldı, öyle kalsın.
- Veri **Supabase**'den geliyor. `src/data/takimlar.ts` artık yalnızca **yedek**:
  veritabanına ulaşılamazsa site onunla açılıyor. Silme, ama oradan veri okuma da.

## Tasarım sistemi

Renkler ve fontlar `src/app/globals.css` içindeki `@theme` bloğunda. Doğrudan hex yazma,
token kullan: `bg-ink`, `text-brand`, `border-line`, `text-gold`, `text-lose` vb.

- `--color-ink #04150B` koyu zemin · `--color-paper #F1F5F0` açık zemin
- `--color-brand #17A33A` · `--color-brand-lite #4ADE80` · `--color-gold #D4A72C`
- Fontlar: Anton (`.display` sınıfı, başlıklar) · Manrope (gövde) · Barlow Semi Condensed
  (`--font-data`: tablo, etiket, buton)
- **Neon menü efektleri** `globals.css` içinde (`.neon-link`, `.neon-dugme`, `.neon-satir`,
  `.neon-sekme`). Hover kuralları `@media (hover: hover)` içinde kalmalı — dışına çıkarsa
  telefonda dokunulan bağlantı "yanık" kalır. Aktif sayfa `aria-current="page"` ile yanar.
- **Etkileşim sınıfları** (`globals.css`, "SİTE GENELİ ETKİLEŞİMLER"): yeni bir tıklanabilir
  öğe eklerken elle hover/animasyon yazma, bunlardan birini kullan —
  `btn-parla` (dolu düğme) · `btn-cizgi` (çerçeveli düğme) · `kart-hover` (açık zeminde
  tıklanan kart) · `kart-koyu` (koyu zeminde kart) · `kart-golge` (tıklanmayan medya kartı) ·
  `satir-neon` (+`satir-neon-koyu`) maç satırı · `foto-hover` · `girdi-neon` (form alanı) ·
  `alt-link` (altbilgi) · `logo-hover`. Bağlantı sonundaki ok `<span aria-hidden className="ok">→</span>`
  olarak yazılır, üzerine gelince kayar.
- **Mobilde görünen dokunuşlar:** hover olmayan cihaz için her etkileşim sınıfının `:active`
  karşılığı var; `.eyebrow` önündeki parlayan çizgi ve `.neon-vurgu` kaydırınca oynuyor.
- **Panel görünümü** `.admin-kok` altında (`globals.css`, "YÖNETİM PANELİ"): form alanı odağı,
  liste satırı şeridi ve panel giriş animasyonu tek yerden geliyor — panel sayfalarında elle
  tekrar yazma. `Panel`, `Dugme`, `Bildirim`, `Pencere`, `Iskelet` bu sınıfları zaten taşıyor.
- **Logo:** `public/images/logo.png` (512 px, JSON-LD için) ve `logo-kucuk.png` (256 px,
  başlık/altbilgi/panel, `unoptimized`). İkisi de `sahabizimiçerikler/içerikler/Sahabizim_Logo.pdf`
  içindeki 1590 px görselden arka planı temizlenerek üretildi; logo değişirse aynı kaynaktan üret.
- next/font değişkenleri `<html>` üzerinde tanımlı — `<body>`'ye taşıma, `:root` içindeki
  `--font-display` zinciri bozulur.

## Değişmez kurallar

1. **Mobil öncelikli.** Puan tablosu mobilde **bütün sütunları** gösterir ve yatay kayar;
   sıra ve takım adı sütunu `sticky` ile solda sabit kalır, masaüstünde `md:static` ile
   sabitleme kalkar. Takım sütunu 156 px (en uzun ad "PİRAZİZ LA CORUNA" ölçü alındı).
   *Sütun gizleme kalıbı kullanılmıyor — 11 sütunu 5'e indirmek denendi, vazgeçildi.*
2. **SEO.** Her sayfada `metadata` (title, description, canonical) olacak. Takım sayfaları
   `generateStaticParams` ile statik üretiliyor; `sitemap.ts` otomatik kapsar.
   Paylaşım görselleri `opengraph-image.tsx` dosyalarından geliyor (aşağıya bak).
3. **Puan elle girilmez ve JS'te hesaplanmaz.** Asıl hesap `puan_durumu` adlı **SQL
   view**'indedir (`supabase/01-semasi.sql`): devir istatistikleri + aktif sezonun maçları
   + ceza/bonus puanlar. Site bunu `getPuanDurumu()` ile okur.
   `src/lib/puan.ts` yalnızca **yedek veri** için duran ikinci bir hesaptır; yeni özelliklerde
   onu kullanma, view'i kullan. Sıralama: Puan → Averaj → Atılan gol → Ad.
4. **Erişilebilirlik.** `prefers-reduced-motion` desteklenir, animasyonlar görünür
   durumdan başlar. Görsellerde `alt`, sayfada tek `<h1>`.
5. İletişim bilgileri ve WhatsApp numarası sadece `src/lib/site.ts` içinde. Koda gömme.
6. **Tarih ve saat `@/lib/zaman` üzerinden.** Sayfalar Vercel'de **sunucuda** üretiliyor ve
   o sunucu **UTC**'de çalışıyor. `new Date(x).getHours()` ya da `toLocaleDateString` çağrısını
   saat dilimi vermeden kullanırsan 21:00 maçı sitede 18:00 görünür. Ziyaretçiye gösterilen
   her tarih/saat için `ligSaati` · `ligGunu` · `gunBasligi` · `macSaati` kullan.
   Öğlen (`SAAT_YER_TUTUCU`) "saat belirlenmedi" demektir, gerçek bir maç saati değildir.

## Bilinmesi gereken tuzaklar

- **Supabase tek sorguda en fazla 1000 satır döndürür ve fazlasını hata vermeden keser.**
  `getMaclar()` bu yüzden `.range()` ile sayfa sayfa çekiyor. Çok satır dönebilecek yeni bir
  sorgu yazarsan aynı kalıbı uygula, yoksa veri sessizce eksilir.
- **Hata ≠ boş sonuç ≠ yedek.** `veri.ts` bu üçünü `VeriSonucu<T>` ile ayırıyor:
  `hazir` (okundu; boş dönmesi de geçerli bir cevap), `yedek` (Supabase hiç ayarlı değil),
  `hata` (sorgu reddedildi). **Hata anında eski veri gösterilmiyor** — sayfa
  `src/components/veri-uyarisi.tsx` şeridini basıyor. Yeni bir veri fonksiyonu yazarken aynı
  ayrımı koru; `!data?.length` durumunu hata saymak 13.09.2026'daki "donmuş rakamlar"
  sorununun kaynağıydı. Yönetim panelindeki bağlantı şeridi (`/api/durum`) hâlâ erken uyarı.
- **PostgREST reddedilen yazmayı HATA OLARAK DÖNDÜRMEZ.** RLS bir `update`/`delete`
  işlemini engellerse `error` null gelir, sadece 0 satır etkilenir. Panel "kaydedildi" der,
  hiçbir şey değişmez. Yazmalarda `.select("id")` ekleyip dönen dizinin boş olup olmadığına
  bak (`macKaydet`, `talepSil` bu kalıpta). Yeni bir tabloya yazacaksan o tabloda ilgili
  **politikanın var olduğunu** da doğrula — `talepler` tablosunda DELETE politikası hiç yoktu.
- **Önbellek iki katmanlı.** Site tarafındaki her veri fonksiyonu `cache(hafizala(...))` ile
  sarılı: React `cache()` tek istek içindeki tekrarları, `src/lib/onbellek.ts` ise ayrı
  render'lar arasını birleştirir. İkincisi olmadan statik üretimde 64 takım sayfası aynı
  sorguyu 64 kez atıyordu. Yeni fonksiyonda aynı sarmalamayı uygula.
- **Site adresi sabit değil.** `src/lib/site.ts` içindeki `siteAdresi()` sırayla
  `NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → sabit adrese bakar.
  `og:image`, kanonik adres ve sitemap buradan türüyor; sabit adres yazma.

## Görseller

- **Paylaşım kartları (Open Graph):** `src/app/opengraph-image.tsx` (site geneli) ve
  `src/app/(site)/takim/[slug]/opengraph-image.tsx` (her takım için ayrı).
  Fontlar `src/og-fontlari/` içinde **depoda** duruyor, ağdan indirilmiyor — derleme sırasında
  Google Fonts'a gitmek build'i kırabilir. `next.config.ts` içindeki `outputFileTracingIncludes`
  bu dosyaların sunucusuz pakete girmesini sağlıyor, silme.
- **Maç görseli:** `src/components/admin/mac-gorseli.tsx`. Panelde, **tarayıcıda** `canvas`
  ile 1080×1080 PNG üretilip indiriliyor; sunucuda saklanmıyor. Skor doluysa "maç sonucu",
  boşsa "yaklaşan maç" duyurusu çiziliyor.
- Takım armaları Supabase Storage'dan `crossOrigin="anonymous"` ile çekiliyor — bu olmadan
  canvas "kirlenir" ve PNG indirilemez.

## Uygulama olarak yükleme (PWA) ve analitik

- **İki ayrı uygulama.** Site: `public/manifest.webmanifest` (kapsam `/`), panel:
  `public/admin.webmanifest` (kapsam `/admin`). Manifest bağlantısı `app/(site)/layout.tsx` ve
  `app/admin/layout.tsx` içindeki `metadata`dan geliyor — `app/manifest.ts` dosyası **açma**,
  her sayfaya siteninkini basar ve panel uygulaması bozulur. Simgeler `public/icons/`.
- **Panel layout'u ikiye bölündü:** `admin/layout.tsx` sunucu bileşeni (metadata için),
  oturum/menü mantığı `admin/admin-kabuk.tsx` içinde.
- **Service worker** `public/sw.js`, yalnız canlı derlemede kaydolur (`components/pwa/pwa-kaydi.tsx`).
  Sayfalar ağ-önce; internet yoksa son saklanan kopya `sb-onbellek` işaretiyle açılır ve
  `CevrimdisiSeridi` "skorlar eski olabilir" uyarısı basar. **/admin ve /api asla saklanmaz**
  (eski kopyada skor girilmesin). Önbellek davranışını değiştirirsen `SURUM`u artır.
- **Yükleme düğmeleri** `components/pwa/yukleme.tsx` + durum `lib/pwa.ts`. iPhone'da yükleme
  olayı yok (tarayıcı kısıtı); orada tarif penceresi açılır. Kapatılan davet 2 hafta çıkmaz.
- **Vercel Analytics** kök layout'ta `<Analytics />` (`@vercel/analytics`). Veri Vercel
  panelinde Analytics sekmesinde; projede Analytics'in açık olması gerekir.

## Site metinleri

Varsayılanlar `src/lib/icerik-varsayilan.ts` içinde (panel de okuduğu için `veri.ts`ten ayrı).
Anasayfadaki **her başlık, etiket ve bağlantı yazısı** bir ayar anahtarı; panelde Ayarlar →
"Anasayfa · 1…8" grupları. Yeni metin eklerken: varsayılana anahtar ekle, bileşende
`icerik.<anahtar>` kullan, `admin/ayarlar/page.tsx` GRUPLAR'a etiketiyle ekle. Veritabanında
satır açmaya gerek yok — `ayarKaydet` upsert yapıyor, ilk kayıtta satır oluşur.

## Ziyaretçi fotoğrafları

Takım sayfasından yüklenen fotoğraflar **gizli** `takim-fotograflari-bekleyen` kovasına gider;
onaylandığı anda panelden herkese açık `takim-fotograflari` kovasına **taşınır**. Onaydan
geçmemiş bir dosya hiçbir adresten açılamaz.

Yükleme önce veritabanında kayıt açmayı gerektiriyor (storage kuralı bunu arıyor) ve kayıt
açmayı bir tetikleyici sınırlıyor — takım başına 5, toplam 120 bekleyen. Bu sıra bilinçli:
sınır böylece yüklenebilecek dosya sayısını da kapatıyor. Fotoğraf tarayıcıda küçültülüyor
(1600 px, WebP). Ayrıntı: `supabase/09-fotograf-guvenlik.sql`.

> RLS içinde çalışan sorgular çağıran kullanıcının yetkisiyle çalışır. Tetikleyici ve
> politika içinden tabloyu sayman gerekiyorsa fonksiyonu `security definer` yap — yoksa
> sayım hep 0 döner ve kural sessizce işlevsiz kalır.

## Yönetim paneli kalıpları

Panel 14.09.2026'da baştan sona elden geçirildi. Ortak bileşenler
`src/components/admin/ui.tsx` içinde — **yeni bir ekran yazarken bunları kullan**, yenisini
icat etme. Panelde en çok görülen sorun kalıp bölünmesiydi: aynı iş iki ayrı yerde iki farklı
olgunlukta yapılmıştı.

- `Bildirim` — kaydetme/hata bildirimi, **sağ altta**, kendiliğinden kapanır. Sayfa üstünde
  duran uyarı, uzun listenin ortasındayken hiç görünmüyordu. Her sayfa tek bir
  `mesaj` state'i tutar ve bunu basar.
- `Pencere` — kalıcı pencere (modal): `role="dialog"`, Esc, açılışta odak, kapanınca odağın
  geri dönmesi, kaydırma kilidi. Elle `fixed inset-0` yazma. `document.body`'ye **portal** ile
  basılır; ekrandan uzun pencere kendi içinde kayar. *Transform animasyonu taşıyan bir kutunun
  içindeki `fixed` öğe o kutuya hapsolur* — 15.09.2026'da mobilde maç görseli penceresi bu
  yüzden ekranın altında açılıyordu. Transform animasyonlarında `both`/`forwards` kullanma.
- `DosyaSec` — dosya seçtiren etiket-düğme. `<input type="file" className="hidden">`
  **kullanma**: `display:none` odaklanamaz, o alan klavyeyle erişilemez hale gelir.
- `BosDurum` / `Iskelet` — boş liste ve yükleme. Düz "Kayıt yok" / "Yükleniyor…" yazma.
- `TehlikeliBolge` — geri alınamayan işlemler (sezon sıfırlama) bu kırmızı kutuda durur.
- `Rakam` — menüdeki bekleyen iş rozeti; sayılar `bekleyenIsler()` üzerinden gelir.
  **Rozetin saydığı şey ile sayfanın gösterdiği liste aynı tanımda olmalı** — biri "tarihi
  geçmiş skorsuz", öteki "tüm oynanacak" sayınca menüde 3, sayfada 17 yazıyordu.
  Skor gecikmesinin tek tanımı `skorBekleniyorMu()` (`@/lib/zaman`): maçlar **1 saat**
  (`MAC_SURESI_DK`), 22:00 maçı 23:00'te gecikmiş sayılır; saati belirsiz maç gün bitince.
  Rozet de sayfa da bunu kullanır — ayrı bir `oynanma < şimdi` karşılaştırması yazma.
- **Maç & Skor sayfasında skoru girilmemiş maçlar EN ÜSTTE durur** — maç ekleme formunun ve
  aramanın üstünde. Bu sıralamayı bozma; panelin günlük asıl işi skor girmek.
- **Maç görseli paylaşımı:** `navigator.share` (dosyalı) destekleniyorsa telefonun paylaşım
  penceresi, yoksa panoya kopyalama, o da yoksa indirme. PNG çizim bitince önceden üretiliyor
  (`pngRef`): iPhone Safari paylaşımı yalnız dokunuşun hemen ardından kabul ediyor.
- `src/lib/kirli.ts` — kaydedilmemiş değişiklik defteri. Kutu doldurulan her ekran
  `useKirli(benzersizId, degisti)` çağırmalı; layout menüden çıkışta soruyor. *`beforeunload`
  mobilde çalışmaz (iOS Safari desteklemiyor); mobilde işi yapışkan şerit ve menü onayı
  görüyor.*
- **Sıralama düğmeleri** `siradaTasi()` kullanır: listeyi 0,1,2… diye numaralayıp komşuyla
  takas eder. `sira` değerini doğrudan ±1 yapma — bütün kayıtlar `sira = 0` başladığı için
  bu, kaydı komşusuyla değiştirmek yerine listenin ucuna fırlatıyordu.
- **Silmek dosyayı da siler.** Görsel/takım/fotoğraf silen her işlem depodaki dosyayı da
  kaldırır (`dosyalariSil`). Sıra: **önce veritabanı satırı, sonra dosya** — tersi olsaydı
  satır silme patlayınca sitede kırık görsel kalırdı. Dosya silinemezse işlem başarısız
  sayılmaz, konsola not düşülür.
- **Yükleme doğrulaması iki katmanlı:** `dosyaYukle` içinde tür/boyut (anlaşılır mesaj için)
  ve kovanın kendi ayarında (paneli atlayan istek için, `15-gorsel-kovasi.sql`). Dosya
  uzantısı **MIME türünden** üretilir, dosya adından değil.
- Sabit site görsellerinde **slot başına tek kayıt** kuralı geçerli (`slotGorseliDegistir`).
  Eskiden her yükleme yeni satır açıyordu ve "Kaldır" bir önceki fotoğrafı geri getiriyordu.

## Veritabanı

Yedek yok — yukarıdaki "CANLI VERİYE DOKUNMA" kuralı burada da geçerli.

SQL dosyaları `supabase/` altında, numara sırasıyla çalıştırılır (01–15 çalıştırıldı).
`16-kampanya-temizligi.sql` (kampanya ayar satırlarını siler) kullanıcı tarafından çalıştırıldı —
yani 01–16 çalıştırıldı. Panel ayarlarındaki `KALDIRILAN` gizleme listesi artık zararsız bir
emniyet, silinebilir.
Yeni bir dosya eklersen Supabase → SQL Editor'da çalıştırılması gerektiğini söyle. RLS
uyarısı çıkarsa **Run and enable RLS** denir; dosyalar RLS'i zaten kendisi açıyor.

**Sırayı mutlaka söyle — hangisi önce:**
- Kod bir şeyi *kullanmayı bırakıyorsa* (sütun siliniyor) → **önce kod deploy**, sonra SQL.
  Tersi olursa canlıdaki eski kod olmayan sütunu sorar ve sayfa hata verir.
- Kod *yeni bir şeye ihtiyaç duyuyorsa* (yeni fonksiyon, görünüm, politika) → **önce SQL**,
  sonra kod deploy.

Sezon sıfırlama ve arşivleme artık Postgres fonksiyonlarında (`13-sezon-sifirlama.sql`):
`yeni_sezon` ve `sezonu_arsivle`, ikisi de `security definer` + `yonetici_mi()` kontrollü.
Dört adım tek transaction — panelden `supabase.rpc()` ile çağrılıyor. Sıfırlamayı geri alma
reçetesi o dosyanın sonunda; `devir_*` değerleri arşiv satırında saklanıyor.

Puan tablosunun tutarlılığı `10-puan-tutarliligi.sql` içindeki kısıtlarla korunuyor:
oynanmış/hükmen maçta skor zorunlu, devirde `O = G + B + M`, negatif değer yok.

## Doğrulama

Değişiklikten sonra `npm run build` çalıştır; TypeScript hatası veya statik üretim hatası
varsa orada görünür. SQL değişikliklerini build doğrulamaz — onları ayrıca düşün.
