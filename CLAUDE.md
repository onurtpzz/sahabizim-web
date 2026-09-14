# SahaBizim projesi — çalışma notları

Bu dosya, projede çalışan yapay zekâ oturumları içindir. Genel yol haritası yedek klasöründeki
`sahabizim-yol-haritasi.md` dosyasındadır; kapsam, fazlar ve kararlar oradadır.
Kod incelemesi ve açık maddeler için `sahabizim-inceleme-raporu.md`.

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
- **Sessiz yedeğe düşme.** `getPuanDurumu()` sorgu hata verirse `src/data/takimlar.ts`
  yedeğine düşüyor; sayfa normal görünür ama rakamlar donuktur. 13.09.2026'da tam bu yaşandı.
  Yönetim panelindeki bağlantı şeridi (`/api/durum`) bunu fark etmek için var.
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

## Veritabanı

SQL dosyaları `supabase/` altında, numara sırasıyla çalıştırılır. Yeni bir dosya eklersen
Supabase → SQL Editor'da çalıştırılması gerektiğini söyle. RLS uyarısı çıkarsa
**Run and enable RLS** denir; dosyalar RLS'i zaten kendisi açıyor.

Puan tablosunun tutarlılığı `10-puan-tutarliligi.sql` içindeki kısıtlarla korunuyor:
oynanmış/hükmen maçta skor zorunlu, devirde `O = G + B + M`, negatif değer yok.

## Doğrulama

Değişiklikten sonra `npm run build` çalıştır; TypeScript hatası veya statik üretim hatası
varsa orada görünür. SQL değişikliklerini build doğrulamaz — onları ayrıca düşün.
