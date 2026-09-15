/**
 * Türkçe duyarsız arama.
 *
 * Kullanıcı telefonda çoğu zaman Türkçe harf yazmıyor: "gunes" yazınca "GÜNEŞ SPOR",
 * "karsiyaka" yazınca "Karşıyaka" bulunmalı. İki taraf da aynı sade biçime
 * çevrilip karşılaştırılıyor:
 *   ç→c · ğ→g · ı/i/İ/I→i · ö→o · ş→s · ü→u · â/î/û → a/i/u · büyük/küçük harf farkı yok
 *
 * Sitedeki ve paneldeki bütün arama kutuları bunu kullanır — yeni arama yazarken de kullan.
 */

const HARITA: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

export function aramaMetni(metin: string): string {
  return (
    metin
      // "tr" küçültme: İ→i, I→ı (ı da aşağıda i olur, yani I ve İ ikisi de i)
      .toLocaleLowerCase("tr")
      .replace(/[çğıöşüâîû]/g, (h) => HARITA[h] ?? h)
      // Kalan birleşik aksanlar (é, ë…) için genel temizlik
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** `metin` içinde `aranan` geçiyor mu? Aranan boşsa her şey eşleşir. */
export function aramaEslesir(metin: string, aranan: string): boolean {
  const a = aramaMetni(aranan);
  return a === "" || aramaMetni(metin).includes(a);
}
