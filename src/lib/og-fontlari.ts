import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Open Graph görsellerinde kullanılan fontlar.
 *
 * Dosyalar depoda duruyor (`src/og-fontlari/`), derleme sırasında ağdan
 * indirilmiyor — Google Fonts'a giden bir istek build'i kırabilir.
 * Her ikisi de tam Türkçe karakter desteklidir (İ, ı, ş, ğ, ü, ö, ç).
 *
 * Anton  → başlıklar (sitedeki `.display` sınıfının karşılığı)
 * Barlow → etiket ve rakamlar (`--font-data` karşılığı)
 */
export async function ogFontlari() {
  const kok = process.cwd();
  const [anton, barlow] = await Promise.all([
    readFile(join(kok, "src", "og-fontlari", "Anton-Regular.ttf")),
    readFile(join(kok, "src", "og-fontlari", "BarlowSemiCondensed-SemiBold.ttf")),
  ]);

  return [
    { name: "Anton", data: anton, weight: 400 as const, style: "normal" as const },
    { name: "Barlow", data: barlow, weight: 600 as const, style: "normal" as const },
  ];
}

/** Marka renkleri — `globals.css` içindeki @theme bloğuyla aynı. */
export const OG_RENK = {
  ink: "#04150b",
  ink2: "#0b2a16",
  brand: "#17a33a",
  brandLite: "#4ade80",
  gold: "#d4a72c",
  lose: "#d93a2b",
  mutedDark: "#9cb5a4",
  beyaz: "#ffffff",
} as const;

export const OG_OLCU = { width: 1200, height: 630 } as const;
