# SahaBizim — Web Sitesi

SahaBizim Ligi'nin yeni web sitesi. Next.js 16 (App Router) + TypeScript + Tailwind CSS v4.

## Çalıştırma

Bilgisayarında **Node.js 20 veya üstü** kurulu olmalı ([nodejs.org](https://nodejs.org) → LTS sürümü).

```bash
npm install     # ilk seferde, bağımlılıkları indirir (birkaç dakika)
npm run dev     # geliştirme sunucusu → http://localhost:3000
```

Diğer komutlar:

```bash
npm run build   # yayın için derler; hata varsa burada görünür
npm run start   # derlenmiş sürümü çalıştırır
npm run lint    # kod kontrolü
```

## Klasör yapısı

```
src/app/            Sayfalar (her klasör bir URL)
  page.tsx            /                anasayfa
  puan-durumu/        /puan-durumu
  fikstur/            /fikstur         (Faz 4'te dolacak)
  takim/[slug]/       /takim/curcuna-fc gibi 61 takım sayfası
  takimlar/           /takimlar
  kampanya/ galeri/ katil/ iletisim/
  sitemap.ts          otomatik sitemap.xml
  robots.ts           otomatik robots.txt
  globals.css         renk paleti ve tipografi tanımları

src/components/     Tekrar kullanılan parçalar (tablo, header, footer, form)
src/lib/            site.ts (iletişim bilgileri), puan.ts (hesaplama), types.ts
src/data/takimlar.ts  Geçici takım verisi — Faz 4'te veritabanına taşınacak
public/images/      Görseller ve logo
```

## Sık yapılacak düzenlemeler

| Ne | Nerede |
|---|---|
| Telefon, WhatsApp numarası, sosyal medya linkleri | `src/lib/site.ts` |
| Renkler ve fontlar | `src/app/globals.css` |
| Menü başlıkları | `src/components/site-header.tsx` |
| Takım verisi (geçici) | `src/data/takimlar.ts` |

## Puan hesabı

Puan tablosu elle tutulmaz. `src/lib/puan.ts` içinde:

- **P** = galibiyet × 3 + beraberlik
- **AV** = attığı − yediği
- Sıralama: Puan → Averaj → Atılan gol → Takım adı
- Hiç maç oynamamış takımlar tablonun sonunda, alfabetik

Faz 4'te bu hesap maç kayıtlarından yapılacak; formül aynı kalacak.

## Sıradaki adımlar

Bkz. `sahabizim-yol-haritasi.md` — Faz 4 (veritabanı + fikstür) ve Faz 5 (admin panel).
