import type { FiksturMaci } from "@/lib/veri";

/**
 * "Haftanın özeti" hesabı — ayrı veri girişi yok, her şey fikstürden çıkar.
 *
 * Hafta penceresi: en son oynanan maçın gününden geriye 7 gün. Böylece
 * araya tatil girse bile bölüm boş kalmaz, en son oynanan hafta gösterilir.
 * Sıralamalar `puan_durumu`'ndan gelen **güncel** sıralardır (maç anındaki
 * sıra saklanmıyor); metinlerde de öyle anlatılıyor.
 */

export type MacOzeti = {
  id: string;
  tarih: string | null;
  ev: { ad: string; slug: string; sira?: number };
  dep: { ad: string; slug: string; sira?: number };
  evSkor: number;
  depSkor: number;
  toplamGol: number;
};

export type HaftaOzeti = {
  baslangic: string;
  bitis: string;
  macSayisi: number;
  toplamGol: number;
  macinMaci?: MacOzeti;
  enGollu?: MacOzeti;
  surpriz?: { mac: MacOzeti; kazanan: string; kazananSlug: string; fark: number };
  yukselen?: { ad: string; slug: string; puan: number; mac: number; av: number };
};

type Siralar = Map<string, number>;

function gunBasi(t: string) {
  return new Date(t).toISOString().slice(0, 10);
}

function ozetle(m: FiksturMaci, sira: Siralar): MacOzeti {
  return {
    id: m.id,
    tarih: m.tarih,
    ev: { ad: m.ev.ad, slug: m.ev.slug, sira: sira.get(m.ev.slug) },
    dep: { ad: m.dep.ad, slug: m.dep.slug, sira: sira.get(m.dep.slug) },
    evSkor: m.evSkor ?? 0,
    depSkor: m.depSkor ?? 0,
    toplamGol: (m.evSkor ?? 0) + (m.depSkor ?? 0),
  };
}

export function haftaninOzeti(
  maclar: FiksturMaci[],
  tablo: { slug: string; sira: number }[],
  takimSayisi: number,
): HaftaOzeti | null {
  const sira: Siralar = new Map(tablo.map((t) => [t.slug, t.sira]));

  const oynanan = maclar.filter(
    (m) =>
      (m.durum === "oynandi" || m.durum === "hukmen") &&
      m.tarih &&
      m.evSkor !== null &&
      m.depSkor !== null,
  );
  if (oynanan.length === 0) return null;

  // En son oynanan maçın günü pencerenin sonu.
  const sonGun = oynanan
    .map((m) => gunBasi(m.tarih!))
    .sort()
    .at(-1)!;
  const bitis = new Date(`${sonGun}T12:00:00`);
  const baslangic = new Date(bitis);
  baslangic.setDate(baslangic.getDate() - 6);
  const altSinir = baslangic.toISOString().slice(0, 10);

  const hafta = oynanan.filter((m) => gunBasi(m.tarih!) >= altSinir);
  if (hafta.length === 0) return null;

  const ozetler = hafta.map((m) => ozetle(m, sira));

  // Haftanın maçı: iki takımın sıra toplamı en küçük olan karşılaşma
  // (yani en üst sıradaki iki takımın maçı). Eşitlikte gol sayısı belirler.
  const sonSira = takimSayisi + 1;
  const macinMaci = [...ozetler].sort((a, b) => {
    const at = (a.ev.sira ?? sonSira) + (a.dep.sira ?? sonSira);
    const bt = (b.ev.sira ?? sonSira) + (b.dep.sira ?? sonSira);
    return at - bt || b.toplamGol - a.toplamGol;
  })[0];

  const enGollu = [...ozetler].sort((a, b) => b.toplamGol - a.toplamGol)[0];

  // Haftanın sürprizi: alt sıradaki takımın üst sıradaki takımı yendiği,
  // sıra farkı en büyük maç. En az 5 sıra fark aranıyor ki her galibiyet
  // "sürpriz" sayılmasın.
  let surpriz: HaftaOzeti["surpriz"];
  for (const o of ozetler) {
    if (o.evSkor === o.depSkor) continue;
    const evKazandi = o.evSkor > o.depSkor;
    const kazanan = evKazandi ? o.ev : o.dep;
    const kaybeden = evKazandi ? o.dep : o.ev;
    if (kazanan.sira === undefined || kaybeden.sira === undefined) continue;
    const fark = kazanan.sira - kaybeden.sira;
    if (fark < 5) continue;
    if (!surpriz || fark > surpriz.fark) {
      surpriz = { mac: o, kazanan: kazanan.ad, kazananSlug: kazanan.slug, fark };
    }
  }

  // Haftanın yükseleni: bu hafta en çok puan toplayan takım.
  const puanlar = new Map<string, { ad: string; puan: number; mac: number; av: number }>();
  for (const o of ozetler) {
    for (const [taraf, skor, rakipSkor] of [
      [o.ev, o.evSkor, o.depSkor],
      [o.dep, o.depSkor, o.evSkor],
    ] as const) {
      const k = puanlar.get(taraf.slug) ?? { ad: taraf.ad, puan: 0, mac: 0, av: 0 };
      k.puan += skor > rakipSkor ? 3 : skor === rakipSkor ? 1 : 0;
      k.mac += 1;
      k.av += skor - rakipSkor;
      puanlar.set(taraf.slug, k);
    }
  }
  const [yukselenSlug, yukselenVeri] =
    [...puanlar.entries()].sort(
      (a, b) => b[1].puan - a[1].puan || b[1].av - a[1].av || b[1].mac - a[1].mac,
    )[0] ?? [];

  return {
    baslangic: altSinir,
    bitis: sonGun,
    macSayisi: hafta.length,
    toplamGol: ozetler.reduce((s, o) => s + o.toplamGol, 0),
    macinMaci,
    enGollu,
    surpriz,
    yukselen:
      yukselenVeri && yukselenVeri.puan > 0
        ? { slug: yukselenSlug, ...yukselenVeri }
        : undefined,
  };
}
