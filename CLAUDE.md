# SahaBizim projesi — çalışma notları

Bu dosya, projede çalışan yapay zekâ oturumları içindir. Genel yol haritası bir üst klasördeki
`sahabizim-yol-haritasi.md` dosyasındadır; kapsam, fazlar ve kararlar oradadır.

## Dil

Arayüz metinleri, değişken/fonksiyon adları ve yorumlar **Türkçe**. Teknik terimlerde
(component, build, slug) İngilizce kalabilir. Kullanıcıya Türkçe yanıt ver.

## Teknoloji

- Next.js 16, App Router, TypeScript, Tailwind CSS v4 (PostCSS eklentisi, `@theme` bloğu)
- Animasyon için ek kütüphane **yok**: `src/components/reveal.tsx` ve `sayac.tsx`
  IntersectionObserver + CSS ile çalışıyor. Yeni kütüphane eklemeden önce gerekçelendir.
- Veriler şu an `src/data/takimlar.ts` içinde statik. Faz 4'te Supabase'e taşınacak.

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

1. **Mobil öncelikli.** Puan tablosu mobilde sadece # · Takım · O · AV · P gösterir
   (diğer sütunlar `hidden md:table-cell`). Yeni sütun eklerken aynı kalıbı uygula.
2. **SEO.** Her sayfada `metadata` (title, description, canonical) olacak. Takım sayfaları
   `generateStaticParams` ile statik üretiliyor; `sitemap.ts` otomatik kapsar.
3. **Puan elle girilmez.** Hesap `src/lib/puan.ts` içindedir. Sıralama: Puan → Averaj →
   Atılan gol → Ad. Bunu başka yerde tekrar yazma, fonksiyonu çağır.
4. **Erişilebilirlik.** `prefers-reduced-motion` desteklenir, animasyonlar görünür
   durumdan başlar. Görsellerde `alt`, sayfada tek `<h1>`.
5. İletişim bilgileri ve WhatsApp numarası sadece `src/lib/site.ts` içinde. Koda gömme.

## Doğrulama

Değişiklikten sonra `npm run build` çalıştır; TypeScript hatası veya statik üretim hatası
varsa orada görünür.
