# SahaBizim — çalışma notları (yapay zekâ oturumları için)

Genel durum ve açık işler: `../sahabizim-yol-haritasi.md`. Kullanıcıya **Türkçe** yanıt ver;
arayüz metinleri, değişken/fonksiyon adları ve yorumlar Türkçe.

## ⛔ 1. Canlı veriye onaysız dokunma

Veritabanının yedeği yok (kurulmayacak, kullanıcı kararı); canlı veride yapılan hata
**kalıcıdır**. Aşağıdakilerden birini yapmadan önce dur, **hangi tablo, kaç satır, geri
alınabilir mi** yaz ve onay bekle:

- `delete` / `truncate` / `update`, `drop …`, veri kaybettiren `alter table`
- Sezon sıfırlama, arşivleme, `devir_*` değiştirme, toplu güncelleme betikleri
- Depodaki (storage) dosyaları silmek veya taşımak

Onay gerektirmez: kod yazmak, yeni SQL dosyası *yazmak*, `create … if not exists`, yeni
sütun/index/politika, `create or replace view`. SQL'i kullanıcı çalıştırır — sırasını söyle:
kod bir şeyi kullanmayı **bırakıyorsa önce kod**, yeni bir şeye **ihtiyaç duyuyorsa önce SQL**.

`supabase/01…16` çalıştırıldı. **`08-excel-senkron.sql` çalıştırılmaz** (puanları Excel'e
eşitler; hangi verinin doğru olduğu belirsiz). RLS uyarısında "Run and enable RLS" denir.

## 2. Teknoloji ve tasarım

- Next.js 16 (App Router), TypeScript, Tailwind v4 (`@theme`), Supabase, Vercel.
  **shadcn/ui ve Framer Motion yok**; animasyon IntersectionObserver + CSS (`reveal.tsx`, `sayac.tsx`).
- Renk ve font token'ları `globals.css` içinde; hex yazma, token kullan (`bg-ink`, `text-brand`,
  `text-gold`…). Fontlar: Anton (`.display`) · Manrope · Barlow Semi Condensed (`--font-data`).
  next/font değişkenleri `<html>` üzerinde kalmalı.
- `src/data/takimlar.ts` yalnız Supabase ayarlı değilken kullanılan örnek veridir.
- **Etkileşim sınıfları** (`globals.css`) — tıklanabilir öğeye elle hover/animasyon yazma:
  `btn-parla` (dolu düğme) · `btn-cizgi` (çerçeveli) · `kart-hover` (açık zeminde kart) ·
  `kart-koyu` · `kart-golge` · `satir-neon` (+`-koyu`) · `foto-hover` · `girdi-neon` ·
  `alt-link` · `logo-hover` · menüde `neon-link` / `neon-satir` / `neon-sekme`.
  Bağlantı sonundaki ok: `<span aria-hidden className="ok">→</span>`.
  Hover kuralları `@media (hover: hover)` içinde; dokunmatik için `:active` karşılığı var.
- **Transform animasyonlarında `both`/`forwards` kullanma:** tutulu dönüşüm, içindeki
  `position: fixed` öğeyi kutuya hapseder (mobilde pencere ekranın altında açılıyordu).
- Logo: `public/images/logo.png` (512 px) ve `logo-kucuk.png` (256 px, `unoptimized`);
  kaynak `sahabizimiçerikler/içerikler/Sahabizim_Logo.pdf`.

## 3. Değişmez kurallar

1. **Mobil öncelikli.** Puan tablosu mobilde bütün sütunları gösterir, yatay kayar; sıra ve
   takım adı `sticky` (takım sütunu 156 px). Sütun gizleme denendi, vazgeçildi.
2. **SEO.** Her sayfada `metadata` (title, description, canonical); tek `<h1>`, görsellerde `alt`.
3. **Puan JS'te hesaplanmaz.** `puan_durumu` SQL view'i hesaplar (`getPuanDurumu()`).
   `lib/puan.ts` yalnız örnek veri içindir. Sıralama: Puan → Averaj → Atılan gol → Ad.
4. **Erişilebilirlik.** `prefers-reduced-motion` desteklenir; animasyonlar görünür durumdan başlar.
5. **İletişim bilgileri** yalnız `lib/site.ts` ve panel ayarlarında; koda gömme.
6. **Tarih/saat `@/lib/zaman` üzerinden** (`ligSaati`, `ligGunu`, `gunBasligi`, `macSaati`).
   Sunucu UTC'de; saat dilimsiz `toLocale…` 21:00 maçı 18:00 gösterir. Öğlen 12:00 =
   "saat belirlenmedi". **Maç süresi 1 saat** — skor gecikmesinin tek tanımı `skorBekleniyorMu()`.

## 4. Tuzaklar

- **Supabase tek sorguda en fazla 1000 satır döndürür**, fazlasını sessizce keser → çok satırlı
  sorguda `.range()` ile sayfa sayfa oku (`getMaclar()` gibi).
- **Hata ≠ boş ≠ örnek veri.** Veri fonksiyonları `VeriSonucu<T>` döner (`hazir` / `yedek` / `hata`);
  hata anında eski veri gösterme, `veri-uyarisi.tsx` şeridini bas.
- **Reddedilen yazma hata dönmez.** RLS engellerse `error` null, 0 satır etkilenir → yazmalarda
  `.select()` ekle, boş dönerse hata say. Yeni tabloda politikanın varlığını doğrula.
- **Önbellek:** site veri fonksiyonları `cache(hafizala(...))` ile sarılı; yenisinde de uygula.
- **Site adresi** `lib/site.ts` → `siteAdresi()` (`NEXT_PUBLIC_SITE_URL` →
  `VERCEL_PROJECT_PRODUCTION_URL` → sabit); adresi elle yazma.
- **RLS içinden tablo sayılacaksa** fonksiyon `security definer` olmalı, yoksa sayım hep 0.
- **Arama her yerde `lib/arama.ts` ile** (`aramaMetni` / `aramaEslesir`): Türkçe harf duyarsız,
  "gunes" → "GÜNEŞ". `toLocaleLowerCase().includes()` ile yeni arama yazma.
- **Logo ve alt çubuktaki Anasayfa** `useAnasayfayaDon()` kullanır: anasayfadayken başa kaydırır
  ve veriyi tazeler (`router.refresh()`).

## 5. Site metinleri

Varsayılanlar `lib/icerik-varsayilan.ts`. Anasayfadaki her başlık/etiket/bağlantı yazısı bir
ayar anahtarı. Yeni metin: varsayılana anahtar ekle → bileşende `icerik.<anahtar>` →
`admin/ayarlar/page.tsx` GRUPLAR'a etiketiyle ekle. SQL gerekmez, `ayarKaydet` upsert yapar.

## 6. Yönetim paneli

Ortak bileşenler `components/admin/ui.tsx` — yeni ekranda bunları kullan, yenisini icat etme.
Panel görünümü `.admin-kok` altındaki CSS'ten gelir (odak halesi, satır şeridi, panel animasyonu).

- `Bildirim` (sağ altta, kendiliğinden kapanır) · `Pencere` (modal; `document.body`'ye portal,
  Esc, odak yönetimi — elle `fixed inset-0` yazma) · `DosyaSec` (`hidden` file input kullanma,
  odaklanamaz) · `BosDurum` / `Iskelet` · `TehlikeliBolge` · `Rakam` (rozet).
- **Rozetin saydığı ile sayfanın listesi aynı tanımda olmalı.**
- **Maç & Skor'da skoru girilmemiş maçlar en üstte** durur; bu sırayı bozma.
- Kutu doldurulan ekran `useKirli(id, degisti)` çağırır (kaydedilmemiş değişiklik uyarısı).
- Sıralama düğmeleri `siradaTasi()` kullanır; `sira`'yı doğrudan ±1 yapma.
- Silme işlemi depodaki dosyayı da siler: **önce veritabanı satırı, sonra dosya.**
- Yükleme doğrulaması iki katmanlı (panel + kova ayarı); uzantı MIME türünden üretilir.
- Sabit site görsellerinde slot başına tek kayıt (`slotGorseliDegistir`).
- Panel layout'u: `admin/layout.tsx` (sunucu, metadata) + `admin/admin-kabuk.tsx` (istemci).
- Sezon sıfırlama/arşivleme Postgres fonksiyonlarında (`13-sezon-sifirlama.sql`), tek işlem;
  geri alma reçetesi dosyanın sonunda.

## 7. Görseller ve paylaşım

- Paylaşım kartları `opengraph-image.tsx` dosyalarında; fontlar `src/og-fontlari/` içinde,
  `next.config.ts` → `outputFileTracingIncludes` silinmez.
- **Maç görseli** (`admin/mac-gorseli.tsx`): tarayıcıda canvas, 1080×1080. Armalar
  `crossOrigin="anonymous"` ile çekilir (yoksa canvas kirlenir). Paylaşım: `navigator.share`
  → panoya kopyala → indir. PNG önceden üretilir (iPhone Safari dokunuş iznini hemen ister).
- **Ziyaretçi fotoğrafı:** gizli `takim-fotograflari-bekleyen` kovasına gider, onaylanınca açık
  kovaya taşınır. Takım başına 5 / toplam 120 bekleyen sınırı (`09-fotograf-guvenlik.sql`).

## 8. Uygulama olarak yükleme ve analitik

- Site ve panel ayrı uygulama: `public/manifest.webmanifest` (kapsam `/`) ve
  `public/admin.webmanifest` (kapsam `/admin`); bağlantılar iki layout'un `metadata`sında.
  `app/manifest.ts` **açma** — her sayfaya siteninkini basar. Simgeler `public/icons/`.
- `public/sw.js` yalnız canlı derlemede kaydolur. Sayfalar ağ-önce; çevrimdışıyken kopya
  "skorlar eski olabilir" şeridiyle açılır. **/admin ve /api saklanmaz.** Davranış değişirse `SURUM`u artır.
- Yükleme düğmeleri `components/pwa/yukleme.tsx`, durum `lib/pwa.ts` (iPhone'da tarif gösterilir).
- Vercel Analytics: kök layout'ta `<Analytics />`.

## 9. Doğrulama

Değişiklikten sonra `npm run build`. SQL değişikliklerini build doğrulamaz, ayrıca düşün.
