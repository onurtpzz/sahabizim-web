import { TAKIMLAR } from "@/data/takimlar";
import type { PuanSatiri, TakimKaydi } from "@/lib/types";

export const PUAN_GALIBIYET = 3;
export const PUAN_BERABERLIK = 1;

export function averaj(t: TakimKaydi) {
  return t.A - t.Y;
}

export function puan(t: TakimKaydi) {
  return t.G * PUAN_GALIBIYET + t.B * PUAN_BERABERLIK;
}

/**
 * Sıralama kuralı: Puan → Averaj → Atılan gol → Takım adı.
 * Hiç maç oynamamış takımlar her zaman en altta, alfabetik.
 */
export function puanDurumu(kayitlar: TakimKaydi[] = TAKIMLAR): PuanSatiri[] {
  const siralı = [...kayitlar].sort((a, b) => {
    const aOynadi = a.O > 0;
    const bOynadi = b.O > 0;
    if (aOynadi !== bOynadi) return aOynadi ? -1 : 1;
    if (!aOynadi && !bOynadi) return a.ad.localeCompare(b.ad, "tr");
    return (
      puan(b) - puan(a) ||
      averaj(b) - averaj(a) ||
      b.A - a.A ||
      a.ad.localeCompare(b.ad, "tr")
    );
  });

  return siralı.map((t, i) => ({
    ...t,
    sira: i + 1,
    AV: averaj(t),
    P: puan(t),
    oynadi: t.O > 0,
  }));
}

export function takimBul(slug: string) {
  return puanDurumu().find((t) => t.slug === slug);
}

export function ligOzeti() {
  const oynayan = TAKIMLAR.filter((t) => t.O > 0);
  const toplamMac = Math.round(oynayan.reduce((s, t) => s + t.O, 0) / 2);
  const toplamGol = oynayan.reduce((s, t) => s + t.A, 0);
  return {
    takimSayisi: TAKIMLAR.length,
    toplamMac,
    toplamGol,
    oynayanTakim: oynayan.length,
  };
}

const ROZET_RENKLERI = [
  "#17A33A",
  "#0B5219",
  "#B8860B",
  "#1F6F8B",
  "#8B2E2E",
  "#3B4C7A",
  "#6B4423",
  "#2E7D6B",
  "#7A3E8B",
  "#B5651D",
];

/** Logosu olmayan takımlar için baş harflerden üretilen rozet. */
export function rozet(ad: string) {
  const parcalar = ad.split(" ").filter(Boolean);
  const bas = (parcalar[0] ?? "?").slice(0, 1);
  const ikinci = parcalar[1] ? parcalar[1].slice(0, 1) : (parcalar[0] ?? "?").slice(1, 2);
  let h = 0;
  for (const ch of ad) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    harf: (bas + ikinci).toLocaleUpperCase("tr"),
    renk: ROZET_RENKLERI[h % ROZET_RENKLERI.length],
  };
}
