import { puanDurumu as yedekPuanDurumu } from "@/lib/puan";
import { supabase } from "@/lib/supabase";
import type { MacSonucu, PuanSatiri } from "@/lib/types";

/** Sayfalar en fazla bu kadar saniye önbellekte kalır. */
export const revalidate = 60;

type PuanSatiriDB = {
  sira: number;
  id: string;
  ad: string;
  slug: string;
  logo_url: string | null;
  renk: string | null;
  o: number;
  g: number;
  b: number;
  m: number;
  a: number;
  y: number;
  av: number;
  p: number;
  son3: string[] | null;
  oynadi: boolean;
};

function cevir(r: PuanSatiriDB): PuanSatiri & { logoUrl: string | null } {
  // Son 3 maç en yeniden eskiye gelir; tabloda soldan sağa eskiden yeniye gösteriyoruz.
  const son = [...(r.son3 ?? [])].reverse() as MacSonucu[];
  while (son.length < 3) son.unshift("");

  return {
    id: r.sira,
    ad: r.ad,
    slug: r.slug,
    O: r.o,
    G: r.g,
    B: r.b,
    M: r.m,
    A: r.a,
    Y: r.y,
    son,
    sira: r.sira,
    AV: r.av,
    P: r.p,
    oynadi: r.oynadi,
    logoUrl: r.logo_url,
  };
}

/**
 * Puan durumunu veritabanından okur. Supabase ayarlı değilse veya sorgu
 * başarısız olursa `src/data/takimlar.ts` içindeki yedek veriye döner.
 */
export async function getPuanDurumu(): Promise<
  (PuanSatiri & { logoUrl?: string | null })[]
> {
  if (!supabase) return yedekPuanDurumu();

  const { data, error } = await supabase
    .from("puan_durumu")
    .select("*")
    .order("sira");

  if (error || !data?.length) {
    if (error) console.warn("Puan durumu okunamadı, yedek veri kullanılıyor:", error.message);
    return yedekPuanDurumu();
  }

  return (data as PuanSatiriDB[]).map(cevir);
}

export async function getTakim(slug: string) {
  const tablo = await getPuanDurumu();
  return tablo.find((t) => t.slug === slug);
}

export async function getLigOzeti() {
  const tablo = await getPuanDurumu();
  const oynayan = tablo.filter((t) => t.oynadi);
  return {
    takimSayisi: tablo.length,
    oynayanTakim: oynayan.length,
    toplamMac: Math.round(oynayan.reduce((s, t) => s + t.O, 0) / 2),
    toplamGol: oynayan.reduce((s, t) => s + t.A, 0),
  };
}

// ---------------------------------------------------------------------
// Görseller
// ---------------------------------------------------------------------

export type Gorsel = {
  id: string;
  url: string;
  alt: string;
  baslik: string | null;
  album: string | null;
};

/** Sitede sabit bir yere yerleşen görsel (hero, kampanya…). Yoksa yedek dosya. */
export async function getSlotGorseli(slot: string, yedek: string): Promise<string> {
  if (!supabase) return yedek;
  const { data } = await supabase
    .from("gorseller")
    .select("url")
    .eq("slot", slot)
    .eq("yayinda", true)
    .order("olusturuldu", { ascending: false })
    .limit(1);
  return data?.[0]?.url ?? yedek;
}

/** Galeri kayıtları. Veritabanı boşsa yedek listeyi döndürür. */
export async function getGaleri(yedek: Gorsel[]): Promise<Gorsel[]> {
  if (!supabase) return yedek;
  const { data, error } = await supabase
    .from("gorseller")
    .select("id, url, alt_metin, baslik, albom")
    .is("slot", null)
    .eq("yayinda", true)
    .order("sira");

  if (error || !data?.length) return yedek;

  return data.map((g) => ({
    id: g.id as string,
    url: g.url as string,
    alt: (g.alt_metin as string) ?? "",
    baslik: (g.baslik as string) ?? null,
    album: (g.albom as string) ?? null,
  }));
}

// ---------------------------------------------------------------------
// Site ayarları
// ---------------------------------------------------------------------

export async function getAyarlar(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.from("ayarlar").select("anahtar, deger");
  if (!data) return {};
  return Object.fromEntries(data.map((a) => [a.anahtar as string, (a.deger as string) ?? ""]));
}

/** Varsayılan metinler — veritabanında karşılığı yoksa bunlar kullanılır. */
export const VARSAYILAN_ICERIK = {
  hero_baslik: "Sahada birlik,",
  hero_vurgu: "sporda özgürlük",
  hero_metin:
    "SahaBizim Ligi'nin puan durumu, fikstürü ve haftanın maçları tek yerde. Takımını kur, maçını ayarla, gerisini sahaya bırak.",
  hero_buton1: "Puan Durumu",
  hero_buton2: "Takımını Kaydet",
  kampanya_baslik: "Spor hayattır,",
  kampanya_vurgu: "bağımlılık değil",
  kampanya_metin:
    "Sahada geçen her dakika, kaybedilmeyen bir dakikadır. Gençleri madde ve alkol bağımlılığına karşı sahaya çağırıyoruz — tribünde değil, oyunun içinde.",
  kampanya_buton: "Sahaya Katıl",
  katil_baslik: "Takımını lige yaz",
  katil_metin:
    "Formu doldur, WhatsApp'tan bize ulaşsın. Aynı gün içinde dönüş yapıyoruz: fikstür, saha ve ödeme detaylarını orada konuşuyoruz.",
  katil_maddeler:
    "Takım başına sezonluk tek kayıt\nMaçlar hafta içi akşam ve hafta sonu\nSkorlar girildiği anda puan durumuna işler\nTakımının kendi sayfası ve istatistikleri olur",
  iletisim_metin: "Lig, maç programı veya saha ile ilgili her konuda yazabilirsin.",
  galeri_metin: "Maç kareleri panelden yüklendikçe bu sayfa albümlere ayrılacak.",
  footer_metin: "Sporu sadece bir oyun değil, bir yaşam biçimi olarak görenlerin sahası.",
  site_aciklama: "SahaBizim Ligi'nin güncel puan durumu, fikstürü ve haftanın maçları.",
  sosyal_baslik: "Sahadan kareler",
  sosyal_metin: "Instagram ve YouTube'da paylaştığımız son içerikler.",
  whatsapp: "905363771767",
  telefon: "0536 377 17 67",
  yetkili: "Hayrullah Can",
  instagram: "https://www.instagram.com/",
  youtube: "https://www.youtube.com/",
  tiktok: "https://www.tiktok.com/",
} as const;

export type IcerikAnahtari = keyof typeof VARSAYILAN_ICERIK;

/**
 * Site metinleri: veritabanındaki değerler varsayılanların üzerine yazılır.
 * Böylece panelden değiştirilebilir ama veritabanı boşken de site doğru görünür.
 */
export async function getIcerik(): Promise<Record<IcerikAnahtari, string>> {
  const kayit = await getAyarlar();
  const sonuc = { ...VARSAYILAN_ICERIK } as Record<IcerikAnahtari, string>;
  for (const [anahtar, deger] of Object.entries(kayit)) {
    if (anahtar in sonuc && deger.trim()) sonuc[anahtar as IcerikAnahtari] = deger;
  }
  return sonuc;
}

// ---------------------------------------------------------------------
// Sosyal medya içerikleri
// ---------------------------------------------------------------------

export type SosyalIcerik = {
  id: string;
  tur: "instagram" | "youtube";
  url: string;
  baslik: string | null;
};

/** Panelden eklenen Instagram gönderileri ve YouTube videoları. */
export async function getSosyalIcerikler(limit = 6): Promise<SosyalIcerik[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("sosyal_icerikler")
    .select("id, tur, url, baslik")
    .eq("yayinda", true)
    .order("sira")
    .order("olusturuldu", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as SosyalIcerik[];
}
