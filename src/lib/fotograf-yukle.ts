"use client";

import { supabase } from "@/lib/supabase";

/**
 * Ziyaretçinin takım sayfasından fotoğraf yüklemesi.
 *
 * Akış:
 *   1. Fotoğraf tarayıcıda küçültülür (uzun kenar 1600 px, WebP).
 *      Telefondan gelen 5–8 MB'lık kare genelde 200–500 KB'a iner.
 *   2. Veritabanında `bekliyor` durumunda bir kayıt açılır.
 *      Kayıt açmayı bir tetikleyici sınırlar (takım başına 5, toplam 120).
 *   3. Dosya GİZLİ `takim-fotograflari-bekleyen` kovasına yüklenir.
 *
 * 2. adım 3'ten önce gelir, bilerek: storage kuralı, yolu işaret eden bir
 * kayıt yoksa yüklemeyi reddediyor. Böylece kayıt sınırı dosya sayısını da
 * sınırlamış oluyor ve doğrudan Supabase'e dosya yağdırmak mümkün olmuyor.
 *
 * Dosya onaylanana kadar hiçbir yerden görünmez — gizli kovada durur.
 * Onay anında panelden herkese açık kovaya taşınır.
 */

const BEKLEYEN_KOVA = "takim-fotograflari-bekleyen";

/** Ziyaretçiden kabul edilen en büyük dosya. Küçültme bundan sonra yapılır. */
export const EN_BUYUK_BOYUT = 12 * 1024 * 1024; // 12 MB

/** Küçültme sonrası hedef: uzun kenar bu pikseli aşmaz. */
const EN_BUYUK_KENAR = 1600;
const WEBP_KALITE = 0.82;

const TURLER = ["image/jpeg", "image/png", "image/webp"];

type Kucultulmus = { veri: Blob; tur: string; uzanti: string };

/**
 * Fotoğrafı tarayıcıda küçültür. Başarısız olursa (eski tarayıcı, bozuk
 * dosya) özgün dosyayla devam edilir — yükleme yine de çalışsın.
 *
 * `imageOrientation: "from-image"` EXIF'teki çevirme bilgisini uygular;
 * yoksa telefonla dikey çekilen kareler yan yatmış görünür.
 */
async function kucult(dosya: File): Promise<Kucultulmus> {
  const ozgun: Kucultulmus = {
    veri: dosya,
    tur: dosya.type,
    uzanti: dosya.type === "image/png" ? "png" : dosya.type === "image/webp" ? "webp" : "jpg",
  };

  try {
    if (typeof createImageBitmap !== "function") return ozgun;

    const kare = await createImageBitmap(dosya, { imageOrientation: "from-image" });
    const olcek = Math.min(1, EN_BUYUK_KENAR / Math.max(kare.width, kare.height));
    const en = Math.round(kare.width * olcek);
    const boy = Math.round(kare.height * olcek);

    const tuval = document.createElement("canvas");
    tuval.width = en;
    tuval.height = boy;
    const ctx = tuval.getContext("2d");
    if (!ctx) {
      kare.close();
      return ozgun;
    }
    ctx.drawImage(kare, 0, 0, en, boy);
    kare.close();

    const blob = await new Promise<Blob | null>((coz) =>
      tuval.toBlob(coz, "image/webp", WEBP_KALITE),
    );

    // Tarayıcı WebP üretemediyse ya da küçültme işe yaramadıysa özgün dosya.
    if (!blob || blob.size >= dosya.size) return ozgun;

    return { veri: blob, tur: "image/webp", uzanti: "webp" };
  } catch {
    return ozgun;
  }
}

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
    throw new Error("Dosya 12 MB'tan büyük. Daha küçük bir fotoğraf seç.");
  }

  const kucuk = await kucult(dosya);

  // Küçültme çalışmadıysa ve dosya hâlâ büyükse, kova zaten reddedecek —
  // hatayı burada anlaşılır biçimde verelim.
  if (kucuk.veri.size > 4 * 1024 * 1024) {
    throw new Error("Fotoğraf küçültülemedi ve 4 MB'tan büyük. Daha küçük bir kare dene.");
  }

  const fotoId = crypto.randomUUID();
  const yol = `${girdi.takimId}/${fotoId}.${kucuk.uzanti}`;

  // 1) Önce kayıt — sınır burada uygulanıyor, dosya boşuna yüklenmesin.
  const { error: kayitHatasi } = await supabase.from("takim_fotograflari").insert({
    id: fotoId,
    takim_id: girdi.takimId,
    url: "",
    dosya_yolu: yol,
    aciklama: girdi.aciklama.trim().slice(0, 200) || null,
    yukleyen_ad: girdi.yukleyenAd.trim().slice(0, 60) || null,
    durum: "bekliyor",
  });
  if (kayitHatasi) throw new Error(kayitHatasi.message);

  // 2) Sonra dosya. Kova kuralı yukarıdaki kaydı arar.
  const { error: yuklemeHatasi } = await supabase.storage
    .from(BEKLEYEN_KOVA)
    .upload(yol, kucuk.veri, { upsert: false, contentType: kucuk.tur });

  if (yuklemeHatasi) {
    // Ziyaretçinin silme yetkisi yok (RLS), kayıt geride kalıyor. Panelde
    // "dosyası yok" rozetiyle görünür ve Sil ile temizlenir; kuyruk
    // sınırında bir slot tuttuğu için orada bırakmamak gerekir.
    throw new Error("Fotoğraf yüklenemedi: " + yuklemeHatasi.message);
  }
}
