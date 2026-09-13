"use client";

import { supabase } from "@/lib/supabase";

/**
 * Ziyaretçinin takım sayfasından fotoğraf yüklemesi.
 *
 * Dosya `takim-fotograflari` kovasına gider, kayıt `bekliyor` durumuyla
 * açılır. Yönetim panelinden onaylanana kadar sitede görünmez.
 */

export const EN_BUYUK_BOYUT = 8 * 1024 * 1024; // 8 MB
const TURLER = ["image/jpeg", "image/png", "image/webp"];

export async function takimFotografiYukle(girdi: {
  takimSlug: string;
  takimId: string;
  dosya: File;
  yukleyenAd: string;
  aciklama: string;
}) {
  if (!supabase) throw new Error("Bağlantı kurulamadı, biraz sonra tekrar dene.");

  const { dosya } = girdi;
  if (!TURLER.includes(dosya.type)) {
    throw new Error("Sadece JPG, PNG veya WEBP yükleyebilirsin.");
  }
  if (dosya.size > EN_BUYUK_BOYUT) {
    throw new Error("Dosya 8 MB'tan büyük. Daha küçük bir fotoğraf seç.");
  }

  const uzanti = dosya.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const yol = `${girdi.takimSlug}/${crypto.randomUUID()}.${uzanti}`;

  const { error: yuklemeHatasi } = await supabase.storage
    .from("takim-fotograflari")
    .upload(yol, dosya, { upsert: false, contentType: dosya.type });
  if (yuklemeHatasi) throw new Error("Fotoğraf yüklenemedi: " + yuklemeHatasi.message);

  const url = supabase.storage.from("takim-fotograflari").getPublicUrl(yol).data.publicUrl;

  const { error } = await supabase.from("takim_fotograflari").insert({
    takim_id: girdi.takimId,
    url,
    aciklama: girdi.aciklama.trim().slice(0, 200) || null,
    yukleyen_ad: girdi.yukleyenAd.trim().slice(0, 60) || null,
    durum: "bekliyor",
  });
  if (error) throw new Error("Kayıt oluşturulamadı: " + error.message);
}
