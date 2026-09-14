import { cache } from "react";
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

function cevir(r: PuanSatiriDB): PuanSatiri & { logoUrl: string | null; takimId: string } {
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
    takimId: r.id,
  };
}

/**
 * Puan durumunu veritabanından okur. Supabase ayarlı değilse veya sorgu
 * başarısız olursa `src/data/takimlar.ts` içindeki yedek veriye döner.
 */
export const getPuanDurumu = cache(async (): Promise<
  (PuanSatiri & { logoUrl?: string | null; takimId?: string })[]
> => {
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
});

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

/**
 * Galeri kayıtları. Veritabanında görsel varsa sadece onlar gösterilir.
 * Hiç yoksa hazır gelen örnek fotoğraflar gösterilir — bunlar panelden
 * (`varsayilan_gorseller` ayarı) tamamen kapatılabilir.
 */
export async function getGaleri(yedek: Gorsel[]): Promise<Gorsel[]> {
  if (!supabase) return yedek;
  const { data, error } = await supabase
    .from("gorseller")
    .select("id, url, alt_metin, baslik, albom")
    .is("slot", null)
    .eq("yayinda", true)
    .order("sira");

  if (error || !data?.length) {
    const ayarlar = await getAyarlar();
    return ayarlar.varsayilan_gorseller === "hayir" ? [] : yedek;
  }

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

export const getAyarlar = cache(async (): Promise<Record<string, string>> => {
  if (!supabase) return {};
  const { data } = await supabase.from("ayarlar").select("anahtar, deger");
  if (!data) return {};
  return Object.fromEntries(data.map((a) => [a.anahtar as string, (a.deger as string) ?? ""]));
});

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
  bizkimiz_baslik: "Ruhum sahada",
  bizkimiz_ozet: "Sporu bir oyun değil, bir yaşam biçimi olarak görenlerin sahası.",
  bizkimiz_metin:
    "SahaBizim, İstanbul'da halı saha futbolunu düzenli bir lig düzenine kavuşturmak için kuruldu. Amacımız basit: maç ayarlamak için grup grup mesaj dolaşmasın, kim kaç puanda belli olsun, oynamak isteyen herkes bir takım bulabilsin.\n\nBugün tek çatı altında altmışın üzerinde takım var. Her hafta sahaya çıkıyor, sonuçları giriyor, puan durumunu güncelliyoruz.\n\nBizim için asıl mesele skor değil, sahada geçen o iki saat. Gençleri madde ve alkol bağımlılığına karşı sahaya çağırmamızın sebebi de bu: oyunun kendisi en iyi korumadır.",
  bizkimiz_deger1: "Herkese açık|Kadro, tecrübe veya bütçe fark etmez. Takımını kur, gel.",
  bizkimiz_deger2: "Düzenli lig|Fikstür, skor, puan durumu — hepsi kayıt altında ve herkese açık.",
  bizkimiz_deger3: "Saha içi saygı|Rekabet sahada kalır. Küfür, kavga ve ayrımcılık hoş görülmez.",
  bizkimiz_etkinlik_baslik: "Sadece maç değil",
  bizkimiz_etkinlik_metin:
    "SahaBizim yalnızca bir lig değil; sahanın dışında da bir arada olan bir topluluk. Yıl boyunca düzenlediğimiz etkinliklere bütün takımlar davetli.",
  bizkimiz_etkinlikler:
    "Piknik|Sezon arası, ailelerin de geldiği gün boyu süren buluşmalar.\nKamp|Doğada iki gün: yürüyüş, maç ve gece sohbeti.\nMangal|Maç sonrası klasikleşen mangal akşamları.\nGönüllü AFAD arama-kurtarma ekibi|Afet durumunda görev almak üzere eğitim alan gönüllü ekibimiz.",
  canli_yayin_aktif: "evet",
  canli_yayin_metin: "Haftanın maçlarını canlı yayınlıyoruz",
  canli_yayin_buton: "Yayına git",
  canli_yayin_link: "",
  canli_yayin_aciklama:
    "Seçtiğimiz maçları YouTube ve Instagram üzerinden canlı yayınlıyoruz. Yayın günü ve saati sosyal medya hesaplarımızdan duyurulur.",
  katki_metin: "Onur Topuz'un katkılarıyla",
  varsayilan_gorseller: "evet",
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
export const getIcerik = cache(async (): Promise<Record<IcerikAnahtari, string>> => {
  const kayit = await getAyarlar();
  const sonuc = { ...VARSAYILAN_ICERIK } as Record<IcerikAnahtari, string>;
  for (const [anahtar, deger] of Object.entries(kayit)) {
    if (anahtar in sonuc && deger.trim()) sonuc[anahtar as IcerikAnahtari] = deger;
  }
  return sonuc;
});

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

// ---------------------------------------------------------------------
// Fikstür
// ---------------------------------------------------------------------

export type FiksturMaci = {
  id: string;
  tarih: string | null;
  durum: "oynanacak" | "oynandi" | "ertelendi" | "hukmen";
  ev: { ad: string; slug: string; logoUrl: string | null };
  dep: { ad: string; slug: string; logoUrl: string | null };
  evSkor: number | null;
  depSkor: number | null;
};

type MacSatiriDB = {
  id: string;
  oynanma: string | null;
  durum: FiksturMaci["durum"];
  ev_skor: number | null;
  dep_skor: number | null;
  ev: { ad: string; slug: string; logo_url: string | null } | null;
  dep: { ad: string; slug: string; logo_url: string | null } | null;
};

/** Aktif sezonun maçları — en yeniden eskiye. */
export const getMaclar = cache(async (): Promise<FiksturMaci[]> => {
  if (!supabase) return [];

  const { data: sezon } = await supabase
    .from("sezonlar")
    .select("id")
    .eq("aktif", true)
    .limit(1);
  const sezonId = sezon?.[0]?.id;
  if (!sezonId) return [];

  const { data, error } = await supabase
    .from("maclar")
    .select(
      "id, oynanma, durum, ev_skor, dep_skor, ev:ev_id(ad, slug, logo_url), dep:dep_id(ad, slug, logo_url)",
    )
    .eq("sezon_id", sezonId)
    .order("oynanma", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as MacSatiriDB[])
    .filter((m) => m.ev && m.dep)
    .map((m) => ({
      id: m.id,
      tarih: m.oynanma,
      durum: m.durum,
      evSkor: m.ev_skor,
      depSkor: m.dep_skor,
      ev: { ad: m.ev!.ad, slug: m.ev!.slug, logoUrl: m.ev!.logo_url },
      dep: { ad: m.dep!.ad, slug: m.dep!.slug, logoUrl: m.dep!.logo_url },
    }));
});

// ---------------------------------------------------------------------
// Kurallar ve duyurular
// ---------------------------------------------------------------------

export type Duyuru = {
  id: string;
  tur: "duyuru" | "kural";
  tarih: string | null;
  baslik: string;
  metin: string;
  sabit: boolean;
  sira: number;
};

/**
 * Yayındaki duyuru ve kurallar. Sıralama: önce sabitlenenler,
 * sonra duyurularda tarihe göre yeniden eskiye, kurallarda elle verilen sıra.
 */
export async function getDuyurular(): Promise<Duyuru[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("duyurular")
    .select("id, tur, tarih, baslik, metin, sabit, sira")
    .eq("yayinda", true)
    .order("sabit", { ascending: false })
    .order("tarih", { ascending: false, nullsFirst: false })
    .order("sira");
  if (error || !data) return [];
  return data as Duyuru[];
}

// ---------------------------------------------------------------------
// Sezon arşivi
// ---------------------------------------------------------------------

export type ArsivSatiri = {
  sira: number;
  takim_ad: string;
  slug: string;
  logo_url: string | null;
  o: number;
  g: number;
  b: number;
  m: number;
  a: number;
  y: number;
  av: number;
  p: number;
};

export type ArsivSezonu = {
  id: string;
  ad: string;
  slug: string;
  basladi: string | null;
  bitti: string | null;
  takimSayisi: number;
  sampiyon: string | null;
};

/** Arşive alınmış (kapanmış) sezonlar — en yeniden eskiye. */
export async function getArsivSezonlari(): Promise<ArsivSezonu[]> {
  if (!supabase) return [];
  const { data: sezonlar, error } = await supabase
    .from("sezonlar")
    .select("id, ad, slug, basladi, bitti")
    .eq("aktif", false)
    .order("basladi", { ascending: false });
  if (error || !sezonlar?.length) return [];

  const { data: satirlar } = await supabase
    .from("sezon_arsivi")
    .select("sezon_id, sira, takim_ad");

  return sezonlar
    .map((s) => {
      const kendi = (satirlar ?? []).filter((r) => r.sezon_id === s.id);
      return {
        id: s.id as string,
        ad: s.ad as string,
        slug: (s.slug as string) ?? "",
        basladi: s.basladi as string | null,
        bitti: s.bitti as string | null,
        takimSayisi: kendi.length,
        sampiyon: (kendi.find((r) => r.sira === 1)?.takim_ad as string) ?? null,
      };
    })
    .filter((s) => s.takimSayisi > 0 && s.slug);
}

/** Bir sezonun arşivlenmiş final tablosu. */
export async function getArsivTablosu(
  slug: string,
): Promise<{ sezon: ArsivSezonu; satirlar: ArsivSatiri[] } | null> {
  if (!supabase) return null;
  const { data: sezon } = await supabase
    .from("sezonlar")
    .select("id, ad, slug, basladi, bitti")
    .eq("slug", slug)
    .limit(1);
  const s = sezon?.[0];
  if (!s) return null;

  const { data } = await supabase
    .from("sezon_arsivi")
    .select("sira, takim_ad, slug, logo_url, o, g, b, m, a, y, av, p")
    .eq("sezon_id", s.id)
    .order("sira");
  if (!data?.length) return null;

  const satirlar = data as ArsivSatiri[];
  return {
    sezon: {
      id: s.id as string,
      ad: s.ad as string,
      slug: s.slug as string,
      basladi: s.basladi as string | null,
      bitti: s.bitti as string | null,
      takimSayisi: satirlar.length,
      sampiyon: satirlar.find((r) => r.sira === 1)?.takim_ad ?? null,
    },
    satirlar,
  };
}

// ---------------------------------------------------------------------
// Takım fotoğrafları (ziyaretçi yüklemesi, onaydan geçer)
// ---------------------------------------------------------------------

export type TakimFotografi = {
  id: string;
  url: string;
  aciklama: string | null;
  yukleyen_ad: string | null;
};

export async function getTakimFotograflari(
  takimId: string | undefined,
): Promise<TakimFotografi[]> {
  if (!supabase || !takimId) return [];
  const { data, error } = await supabase
    .from("takim_fotograflari")
    .select("id, url, aciklama, yukleyen_ad")
    .eq("takim_id", takimId)
    .eq("durum", "onayli")
    .order("sira")
    .order("olusturuldu", { ascending: false })
    .limit(24);
  if (error || !data) return [];
  return data as TakimFotografi[];
}

/**
 * Bir takımın bu sezonki maçları. `oynanan` en yeniden eskiye (en fazla `adet`
 * tane), `sirada` en yakın tarihten uzağa.
 */
export async function getTakimMaclari(slug: string, adet = 10) {
  const hepsi = await getMaclar();
  const kendi = hepsi.filter((m) => m.ev.slug === slug || m.dep.slug === slug);

  const oynanan = kendi
    .filter((m) => m.durum === "oynandi" || m.durum === "hukmen")
    .slice(0, adet);

  const sirada = kendi
    .filter((m) => m.durum === "oynanacak" || m.durum === "ertelendi")
    .sort((a, b) => (a.tarih ?? "").localeCompare(b.tarih ?? ""))
    .slice(0, 5);

  return { oynanan, sirada, toplam: kendi.length };
}

/**
 * Onaylanmış takım fotoğrafları — takım adıyla birlikte. Galeri sayfası
 * bunları kendi kayıtlarının yanında gösterir; ayrıca `gorseller` tablosuna
 * kopyalanmaz, tek kayıt kalır (panelden silince her yerden gider).
 */
export async function getOnayliTakimFotograflari(limit = 60): Promise<
  (TakimFotografi & { takimAd: string; takimSlug: string })[]
> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("takim_fotograflari")
    .select("id, url, aciklama, yukleyen_ad, takimlar:takim_id(ad, slug)")
    .eq("durum", "onayli")
    .order("olusturuldu", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  type Satir = TakimFotografi & { takimlar: { ad: string; slug: string } | null };
  return (data as unknown as Satir[])
    .filter((f) => f.takimlar)
    .map((f) => ({
      id: f.id,
      url: f.url,
      aciklama: f.aciklama,
      yukleyen_ad: f.yukleyen_ad,
      takimAd: f.takimlar!.ad,
      takimSlug: f.takimlar!.slug,
    }));
}
