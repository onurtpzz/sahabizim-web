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
    const { error } = await db()
      .from("sezonlar")
      .update({ aktif: false, bitti: new Date().toISOString().slice(0, 10) })
      .eq("id", eski.id);
    if (error) throw error;
  }

  const { error: hata } = await db()
    .from("sezonlar")
    .insert({ ad, aktif: true, basladi: new Date().toISOString().slice(0, 10) });
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
