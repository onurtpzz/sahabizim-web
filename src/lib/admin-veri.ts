"use client";

import { supabase } from "@/lib/supabase";

export type Takim = {
  id: string;
  ad: string;
  slug: string;
  logo_url: string | null;
  yetkili: string | null;
  telefon: string | null;
  aktif: boolean;
  devir_o: number;
  devir_g: number;
  devir_b: number;
  devir_m: number;
  devir_a: number;
  devir_y: number;
};

export type Mac = {
  id: string;
  sezon_id: string;
  hafta: number | null;
  oynanma: string | null;
  saha: string | null;
  ev_id: string;
  dep_id: string;
  ev_skor: number | null;
  dep_skor: number | null;
  durum: "oynanacak" | "oynandi" | "ertelendi" | "hukmen";
};

export type Sezon = {
  id: string;
  ad: string;
  aktif: boolean;
  basladi: string | null;
  bitti: string | null;
};

export type GorselKaydi = {
  id: string;
  slot: string | null;
  albom: string | null;
  url: string;
  alt_metin: string;
  baslik: string | null;
  sira: number;
  yayinda: boolean;
};

function db() {
  if (!supabase) throw new Error("Supabase bağlantısı yok. .env.local dosyasını kontrol et.");
  return supabase;
}

/**
 * Tarayıcının yerel saatine göre bugünün tarihi: "2026-09-13".
 * `toISOString()` UTC'ye çevirdiği için Türkiye'de gece yarısı–03:00 arasında
 * bir önceki günü verirdi; bu yüzden kullanılmıyor.
 */
export function bugun() {
  const d = new Date();
  const iki = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
}

/** "2026-09-13" → o günün yerel öğlen saatinin ISO karşılığı. Saat dilimi kayması olmaz. */
export function tarihiIsoYap(tarih: string) {
  return tarih ? new Date(`${tarih}T12:00:00`).toISOString() : null;
}

/** Türkçe karakterleri sadeleştirip URL'de kullanılabilir hale getirir. */
export function slugla(ad: string) {
  const harita: Record<string, string> = {
    ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g",
    ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c",
  };
  return ad
    .split("")
    .map((c) => harita[c] ?? c)
    .join("")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// --------------------------------------------------------------- takımlar
export async function takimlariGetir(): Promise<Takim[]> {
  const { data, error } = await db()
    .from("takimlar")
    .select("*")
    .order("ad");
  if (error) throw error;
  return (data ?? []) as Takim[];
}

export async function takimEkle(ad: string, yetkili: string, telefon: string) {
  const { error } = await db()
    .from("takimlar")
    .insert({ ad: ad.trim(), slug: slugla(ad), yetkili: yetkili || null, telefon: telefon || null });
  if (error) throw error;
}

export async function takimGuncelle(id: string, degisiklik: Partial<Takim>) {
  const { error } = await db().from("takimlar").update(degisiklik).eq("id", id);
  if (error) throw error;
}

export async function takimSil(id: string) {
  const { count } = await db()
    .from("maclar")
    .select("id", { count: "exact", head: true })
    .or(`ev_id.eq.${id},dep_id.eq.${id}`);
  if (count && count > 0) {
    throw new Error(
      `Bu takımın ${count} maç kaydı var. Önce maçları sil, ya da takımı silmek yerine pasife al.`,
    );
  }
  const { error } = await db().from("takimlar").delete().eq("id", id);
  if (error) throw error;
}

// ----------------------------------------------------------------- maçlar
export async function aktifSezon(): Promise<Sezon | null> {
  const { data } = await db().from("sezonlar").select("*").eq("aktif", true).limit(1);
  return (data?.[0] as Sezon) ?? null;
}

export async function sezonlariGetir(): Promise<Sezon[]> {
  const { data, error } = await db().from("sezonlar").select("*").order("basladi", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Sezon[];
}

export async function maclariGetir(sezonId: string): Promise<Mac[]> {
  const { data, error } = await db()
    .from("maclar")
    .select("*")
    .eq("sezon_id", sezonId)
    .order("hafta", { ascending: false })
    .order("oynanma", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Mac[];
}

export async function macEkle(m: {
  sezon_id: string;
  hafta: number | null;
  oynanma: string | null;
  ev_id: string;
  dep_id: string;
  ev_skor: number | null;
  dep_skor: number | null;
  saha: string | null;
}) {
  const oynandi = m.ev_skor !== null && m.dep_skor !== null;
  const { error } = await db()
    .from("maclar")
    .insert({ ...m, durum: oynandi ? "oynandi" : "oynanacak" });
  if (error) throw error;
}

export async function skorKaydet(id: string, ev: number | null, dep: number | null) {
  const oynandi = ev !== null && dep !== null;
  const { error } = await db()
    .from("maclar")
    .update({ ev_skor: ev, dep_skor: dep, durum: oynandi ? "oynandi" : "oynanacak" })
    .eq("id", id);
  if (error) throw error;
}

export async function macSil(id: string) {
  const { error } = await db().from("maclar").delete().eq("id", id);
  if (error) throw error;
}

// --------------------------------------------------------------- görseller
const KOVA = "gorseller";

export async function dosyaYukle(dosya: File, klasor: string): Promise<string> {
  const uzanti = dosya.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const yol = `${klasor}/${crypto.randomUUID()}.${uzanti}`;
  const { error } = await db().storage.from(KOVA).upload(yol, dosya, { upsert: false });
  if (error) throw error;
  return db().storage.from(KOVA).getPublicUrl(yol).data.publicUrl;
}

export async function gorselleriGetir(): Promise<GorselKaydi[]> {
  const { data, error } = await db()
    .from("gorseller")
    .select("*")
    .order("olusturuldu", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GorselKaydi[];
}

export async function gorselEkle(kayit: {
  url: string;
  slot: string | null;
  albom: string | null;
  alt_metin: string;
  baslik: string | null;
}) {
  const { error } = await db().from("gorseller").insert(kayit);
  if (error) throw error;
}

export async function gorselGuncelle(id: string, degisiklik: Partial<GorselKaydi>) {
  const { error } = await db().from("gorseller").update(degisiklik).eq("id", id);
  if (error) throw error;
}

export async function gorselSil(id: string) {
  const { error } = await db().from("gorseller").delete().eq("id", id);
  if (error) throw error;
}

// ----------------------------------------------------------------- ayarlar
export async function ayarlariGetir() {
  const { data, error } = await db().from("ayarlar").select("*").order("anahtar");
  if (error) throw error;
  return (data ?? []) as { anahtar: string; deger: string | null; aciklama: string | null }[];
}

export async function ayarKaydet(anahtar: string, deger: string) {
  const { error } = await db()
    .from("ayarlar")
    .update({ deger, guncellendi: new Date().toISOString() })
    .eq("anahtar", anahtar);
  if (error) throw error;
}

// ---------------------------------------------------------------- talepler
export async function talepleriGetir() {
  const { data, error } = await db()
    .from("talepler")
    .select("*")
    .order("olusturuldu", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as {
    id: string;
    tur: string;
    ad: string | null;
    telefon: string | null;
    takim: string | null;
    mesaj: string | null;
    okundu: boolean;
    olusturuldu: string;
  }[];
}

export async function talepOkundu(id: string, okundu: boolean) {
  const { error } = await db().from("talepler").update({ okundu }).eq("id", id);
  if (error) throw error;
}

// ------------------------------------------------------------------ sezon
export async function yeniSezon(ad: string, takimlariTasi: boolean) {
  const eski = await aktifSezon();
  if (eski) {
    // ÖNCE arşivle: `puan_durumu` görünümü yalnız aktif sezonu hesaplar,
    // sezon kapandıktan sonra o tabloyu bir daha üretemeyiz.
    await sezonuArsivle(eski.id);

    const { error } = await db()
      .from("sezonlar")
      .update({ aktif: false, bitti: new Date().toISOString().slice(0, 10) })
      .eq("id", eski.id);
    if (error) throw error;
  }

  const { error: hata } = await db().from("sezonlar").insert({
    ad,
    slug: sezonSlug(ad),
    aktif: true,
    basladi: new Date().toISOString().slice(0, 10),
  });
  if (hata) throw hata;

  // Yeni sezon sıfırdan başlar: devir istatistikleri temizlenir.
  const { error: sifirla } = await db()
    .from("takimlar")
    .update({
      devir_o: 0, devir_g: 0, devir_b: 0, devir_m: 0,
      devir_a: 0, devir_y: 0, devir_son3: [],
      ...(takimlariTasi ? {} : { aktif: false }),
    })
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (sifirla) throw sifirla;
}

// ------------------------------------------------------- sosyal içerikler
export type SosyalKayit = {
  id: string;
  tur: "instagram" | "youtube";
  url: string;
  baslik: string | null;
  sira: number;
  yayinda: boolean;
  olusturuldu: string;
};

export async function sosyalGetir(): Promise<SosyalKayit[]> {
  const { data, error } = await db()
    .from("sosyal_icerikler")
    .select("*")
    .order("sira")
    .order("olusturuldu", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SosyalKayit[];
}

export async function sosyalEkle(kayit: {
  tur: "instagram" | "youtube";
  url: string;
  baslik: string | null;
}) {
  const { error } = await db().from("sosyal_icerikler").insert(kayit);
  if (error) throw error;
}

export async function sosyalGuncelle(id: string, degisiklik: Partial<SosyalKayit>) {
  const { error } = await db().from("sosyal_icerikler").update(degisiklik).eq("id", id);
  if (error) throw error;
}

export async function sosyalSil(id: string) {
  const { error } = await db().from("sosyal_icerikler").delete().eq("id", id);
  if (error) throw error;
}

// ------------------------------------------------- kurallar ve duyurular
export type Duyuru = {
  id: string;
  tur: "duyuru" | "kural";
  tarih: string | null;
  baslik: string;
  metin: string;
  sabit: boolean;
  sira: number;
  yayinda: boolean;
  olusturuldu: string;
};

export async function duyurulariGetir(): Promise<Duyuru[]> {
  const { data, error } = await db()
    .from("duyurular")
    .select("*")
    .order("sabit", { ascending: false })
    .order("tarih", { ascending: false, nullsFirst: false })
    .order("sira");
  if (error) throw error;
  return (data ?? []) as Duyuru[];
}

export async function duyuruEkle(kayit: {
  tur: "duyuru" | "kural";
  tarih: string | null;
  baslik: string;
  metin: string;
  sabit: boolean;
  sira: number;
}) {
  const { error } = await db().from("duyurular").insert(kayit);
  if (error) throw error;
}

export async function duyuruGuncelle(id: string, degisiklik: Partial<Duyuru>) {
  const { error } = await db().from("duyurular").update(degisiklik).eq("id", id);
  if (error) throw error;
}

export async function duyuruSil(id: string) {
  const { error } = await db().from("duyurular").delete().eq("id", id);
  if (error) throw error;
}

// --------------------------------------------------------- puan düzeltme
export type PuanDuzeltmesi = {
  id: string;
  sezon_id: string;
  takim_id: string;
  puan_farki: number;
  sebep: string;
  olusturuldu: string;
};

export async function duzeltmeleriGetir(sezonId: string): Promise<PuanDuzeltmesi[]> {
  const { data, error } = await db()
    .from("puan_duzeltmeleri")
    .select("*")
    .eq("sezon_id", sezonId)
    .order("olusturuldu", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PuanDuzeltmesi[];
}

export async function duzeltmeEkle(kayit: {
  sezon_id: string;
  takim_id: string;
  puan_farki: number;
  sebep: string;
}) {
  if (!kayit.sebep.trim()) throw new Error("Sebep yazmadan puan düzeltmesi eklenemez.");
  if (!kayit.puan_farki) throw new Error("Puan farkı 0 olamaz.");
  const { error } = await db().from("puan_duzeltmeleri").insert(kayit);
  if (error) throw error;
}

export async function duzeltmeSil(id: string) {
  const { error } = await db().from("puan_duzeltmeleri").delete().eq("id", id);
  if (error) throw error;
}

/** Excel'den gelen devir istatistikleri — puan durumuna bu sayılar eklenir. */
export async function devirKaydet(
  takimId: string,
  devir: { devir_o: number; devir_g: number; devir_b: number; devir_m: number; devir_a: number; devir_y: number },
) {
  const { devir_o, devir_g, devir_b, devir_m } = devir;
  if (devir_g + devir_b + devir_m > devir_o) {
    throw new Error(
      `G+B+M (${devir_g + devir_b + devir_m}) oynanan maçtan (${devir_o}) fazla olamaz.`,
    );
  }
  const { error } = await db().from("takimlar").update(devir).eq("id", takimId);
  if (error) throw error;
}

/** Puan durumu görünümü — düzeltme ekranında güncel tabloyu göstermek için. */
export async function puanDurumuGetir() {
  const { data, error } = await db().from("puan_durumu").select("*").order("sira");
  if (error) throw error;
  return (data ?? []) as {
    sira: number;
    id: string;
    ad: string;
    slug: string;
    o: number;
    g: number;
    b: number;
    m: number;
    a: number;
    y: number;
    av: number;
    p: number;
  }[];
}

// --------------------------------------------------------- sezon arşivi
/**
 * O anki puan durumunun fotoğrafını `sezon_arsivi` tablosuna kopyalar ve
 * şampiyonu sezona işler. Sezon kapanmadan ÖNCE çağrılmalı — `puan_durumu`
 * görünümü yalnız aktif sezonu hesaplar.
 */
export async function sezonuArsivle(sezonId: string) {
  const tablo = await puanDurumuGetir();
  if (!tablo.length) throw new Error("Puan durumu boş, arşivlenecek bir şey yok.");

  const { data: takimlar } = await db().from("takimlar").select("id, logo_url");
  const logolar = Object.fromEntries((takimlar ?? []).map((t) => [t.id, t.logo_url]));

  const satirlar = tablo.map((r) => ({
    sezon_id: sezonId,
    takim_id: r.id,
    sira: r.sira,
    takim_ad: r.ad,
    slug: r.slug,
    logo_url: (logolar[r.id] as string | null) ?? null,
    o: r.o, g: r.g, b: r.b, m: r.m, a: r.a, y: r.y, av: r.av, p: r.p,
  }));

  const { error } = await db()
    .from("sezon_arsivi")
    .upsert(satirlar, { onConflict: "sezon_id,slug" });
  if (error) throw error;

  const sampiyon = tablo.find((r) => r.sira === 1);
  if (sampiyon) {
    await db().from("sezonlar").update({ sampiyon_id: sampiyon.id }).eq("id", sezonId);
  }
  return satirlar.length;
}

/** "2026–2027" → "2026-2027" */
function sezonSlug(ad: string) {
  return ad
    .replace(/[–—/\s]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ----------------------------------------------------- takım fotoğrafları
export type TakimFotografi = {
  id: string;
  takim_id: string;
  url: string;
  aciklama: string | null;
  yukleyen_ad: string | null;
  durum: "bekliyor" | "onayli" | "red";
  sira: number;
  olusturuldu: string;
};

export async function fotograflariGetir(durum?: "bekliyor" | "onayli" | "red") {
  let sorgu = db().from("takim_fotograflari").select("*");
  if (durum) sorgu = sorgu.eq("durum", durum);
  const { data, error } = await sorgu.order("olusturuldu", { ascending: false }).limit(300);
  if (error) throw error;
  return (data ?? []) as TakimFotografi[];
}

export async function fotografDurumu(id: string, durum: "bekliyor" | "onayli" | "red") {
  const { error } = await db().from("takim_fotograflari").update({ durum }).eq("id", id);
  if (error) throw error;
}

export async function fotografSil(id: string) {
  const { error } = await db().from("takim_fotograflari").delete().eq("id", id);
  if (error) throw error;
}
