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
  /** Yüklenme zamanı — sabit görsel listesinde gösteriliyor. */
  olusturuldu: string;
};

function db() {
  if (!supabase) throw new Error("Supabase bağlantısı yok. .env.local dosyasını kontrol et.");
  return supabase;
}

/**
 * Tarih/saat yardımcıları `@/lib/zaman` içinde — site tarafı da aynılarını
 * kullanıyor, o yüzden Supabase'e bağlı bu dosyada duramazlar. Panelin mevcut
 * çağrıları bozulmasın diye buradan tekrar dışa veriliyorlar.
 */
import { MAC_SURESI_DK, skorBekleniyorMu } from "@/lib/zaman";

export {
  SAAT_YER_TUTUCU,
  bugun,
  isoSaati,
  isoTarihi,
  saatBelirsizMi,
  skorBekleniyorMu,
  tarihiIsoYap,
} from "@/lib/zaman";

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

/**
 * Takım armasını değiştirir ve ESKİ arma dosyasını depodan siler.
 *
 * `takimGuncelle` ile doğrudan `logo_url` yazıldığında eski dosya kovada
 * kalıyordu; her logo değişikliği bir yetim dosya bırakıyordu.
 */
export async function takimLogosuKaydet(id: string, yeniUrl: string) {
  const { data: eski } = await db().from("takimlar").select("logo_url").eq("id", id).single();

  const { error } = await db().from("takimlar").update({ logo_url: yeniUrl }).eq("id", id);
  if (error) throw error;

  const eskiUrl = eski?.logo_url as string | null | undefined;
  if (eskiUrl && eskiUrl !== yeniUrl) await dosyalariSil([eskiUrl]);
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
  // Takımın fotoğraf kayıtları veritabanında cascade ile siliniyor ama
  // dosyaları kovada kalıyordu; yolları silmeden önce topluyoruz.
  const { data: fotograflar } = await db()
    .from("takim_fotograflari")
    .select("dosya_yolu, durum")
    .eq("takim_id", id);

  const { data: takim } = await db().from("takimlar").select("logo_url").eq("id", id).single();

  const { error } = await db().from("takimlar").delete().eq("id", id);
  if (error) throw error;

  await dosyalariSil([takim?.logo_url as string | null]);

  const yollar = (fotograflar ?? []) as { dosya_yolu: string | null; durum: string }[];
  for (const kova of [FOTO_KOVA, FOTO_BEKLEYEN_KOVA]) {
    const liste = yollar
      .filter((f) => f.dosya_yolu && (kova === FOTO_KOVA) === (f.durum === "onayli"))
      .map((f) => f.dosya_yolu as string);
    if (liste.length) {
      const { error: e } = await db().storage.from(kova).remove(liste);
      if (e) console.warn("Takım fotoğraf dosyaları silinemedi:", e.message);
    }
  }
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
    // Lig sabit haftalık tur üzerinden yürümüyor; maçlar takımların anlaştığı
    // tarihe göre oynanıyor. Bu yüzden tek sıralama ölçütü oynanma tarihi.
    .order("oynanma", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Mac[];
}

export async function macEkle(m: {
  sezon_id: string;
  oynanma: string | null;
  ev_id: string;
  dep_id: string;
  ev_skor: number | null;
  dep_skor: number | null;
  saha: string | null;
}) {
  // Tek skor girilmesi burada da engelleniyor (bkz. macKaydet): yarım skorlu
  // kayıt "oynanacak" olarak açılıyor, puana girmiyor ve fark edilmiyordu.
  if ((m.ev_skor === null) !== (m.dep_skor === null)) {
    throw new Error("İki takımın da skorunu gir — biri boş bırakılamaz.");
  }

  const oynandi = m.ev_skor !== null && m.dep_skor !== null;
  const { error } = await db()
    .from("maclar")
    .insert({ ...m, durum: oynandi ? "oynandi" : "oynanacak" });
  if (error) throw error;
}

/**
 * Skor girilince maçın yeni durumu ne olmalı?
 *
 * Eskiden düz `oynandi`/`oynanacak` hesaplanıyordu ve bu, elle işaretlenmiş
 * `hukmen` / `ertelendi` bilgisini siliyordu: hükmen bir maçın skorunu
 * düzeltince maç sıradan bir "oynandı" oluyor, hükmen kaydı geri getirilemiyordu.
 */
function yeniDurum(mevcut: Mac["durum"], oynandi: boolean): Mac["durum"] {
  if (oynandi) return mevcut === "hukmen" ? "hukmen" : "oynandi";
  return mevcut === "ertelendi" ? "ertelendi" : "oynanacak";
}

/**
 * Maçın tarihini ve skorunu TEK yazmada günceller.
 *
 * Neden tek: eskiden tarih ve skor iki ayrı istekle gidiyordu. İkincisi
 * patlarsa ekranda "Kaydedilemedi." yazıyor ama tarih çoktan yazılmış oluyordu;
 * kullanıcı hiçbir şeyin değişmediğini sanıyordu.
 *
 * `.select("id")`: RLS bir UPDATE'i engellediğinde ya da kayıt başka bir
 * sekmede silinmişse PostgREST hata döndürmez, sadece 0 satır etkiler. Dönen
 * dizi boşsa bunu hata sayıyoruz ki panel sahte "başarılı" göstermesin.
 */
export async function macKaydet(
  mac: Pick<Mac, "id" | "durum">,
  degisiklik: { oynanma?: string | null; ev_skor?: number | null; dep_skor?: number | null },
) {
  const skorVar = "ev_skor" in degisiklik || "dep_skor" in degisiklik;
  const ev = skorVar ? (degisiklik.ev_skor ?? null) : null;
  const dep = skorVar ? (degisiklik.dep_skor ?? null) : null;

  if (skorVar && (ev === null) !== (dep === null)) {
    throw new Error("İki takımın da skorunu gir — biri boş bırakılamaz.");
  }

  const yama: Record<string, unknown> = { ...degisiklik };
  if (skorVar) yama.durum = yeniDurum(mac.durum, ev !== null && dep !== null);

  const { data, error } = await db()
    .from("maclar")
    .update(yama)
    .eq("id", mac.id)
    .select("id");

  if (error) throw error;
  if (!data?.length) {
    throw new Error(
      "Kayıt güncellenemedi. Maç başka bir yerden silinmiş olabilir; sayfayı yenile.",
    );
  }
}


export async function macSil(id: string) {
  const { error } = await db().from("maclar").delete().eq("id", id);
  if (error) throw error;
}

// --------------------------------------------------------------- görseller
const KOVA = "gorseller";

/** Yükleme sınırları — `15-gorsel-kovasi.sql` içindeki kova ayarıyla aynı. */
const IZINLI_TURLER = ["image/jpeg", "image/png", "image/webp"];
const LOGO_TURLERI = [...IZINLI_TURLER, "image/svg+xml"];
const AZAMI_BOYUT = 8 * 1024 * 1024;

/** MIME türünden dosya uzantısı. Ad uzantısına güvenmiyoruz. */
const UZANTILAR: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function mb(bayt: number) {
  return (bayt / 1024 / 1024).toFixed(1).replace(".", ",");
}

/**
 * Dosyayı `gorseller` kovasına yükler ve herkese açık adresini döner.
 *
 * Doğrulama iki katmanlı: burada (anlaşılır hata mesajı için) ve kovanın
 * kendi ayarında (paneli atlayan bir istek için). Uzantı dosya adından değil
 * MIME türünden üretiliyor — `resim.exe` adlı bir PNG kovaya `.exe` olarak
 * düşüyordu.
 */
export async function dosyaYukle(
  dosya: File,
  klasor: string,
  secenek?: { turler?: string[]; azami?: number },
): Promise<string> {
  const turler = secenek?.turler ?? IZINLI_TURLER;
  const azami = secenek?.azami ?? AZAMI_BOYUT;

  if (!turler.includes(dosya.type)) {
    throw new Error(
      `Bu dosya türü yüklenemez (${dosya.type || "bilinmiyor"}). ` +
        `Kabul edilenler: ${turler.map((t) => UZANTILAR[t]?.toUpperCase() ?? t).join(", ")}.`,
    );
  }
  if (dosya.size > azami) {
    throw new Error(
      `Dosya çok büyük (${mb(dosya.size)} MB). En fazla ${mb(azami)} MB olabilir — ` +
        `telefondan çekilmiş fotoğrafları küçültmen gerekebilir.`,
    );
  }

  const uzanti = UZANTILAR[dosya.type] ?? "jpg";
  const yol = `${klasor}/${crypto.randomUUID()}.${uzanti}`;
  const { error } = await db().storage.from(KOVA).upload(yol, dosya, { upsert: false });
  if (error) throw error;
  return db().storage.from(KOVA).getPublicUrl(yol).data.publicUrl;
}

/**
 * Herkese açık depo adresinden kova içindeki dosya yolunu çıkarır.
 * Adres beklenen biçimde değilse `null` — o zaman dosyaya dokunmuyoruz.
 */
function depoYolu(url: string): string | null {
  const iz = `/storage/v1/object/public/${KOVA}/`;
  const i = url.indexOf(iz);
  if (i < 0) return null;
  try {
    return decodeURIComponent(url.slice(i + iz.length));
  } catch {
    return null;
  }
}

/**
 * Kayıt silindikten SONRA depodaki dosyaları da siler.
 *
 * Eskiden yalnız veritabanı satırı siliniyordu; dosya kovada kalıyor, hangisinin
 * kullanıldığı bir daha bilinemiyordu. Depo tek yönlü büyüyordu.
 *
 * Sıra bilerek böyle: önce satır, sonra dosya. Tersi olsaydı satır silme
 * başarısız olduğunda sitede kırık görsel kalırdı. Dosya silinemezse işlemi
 * başarısız saymıyoruz — kayıt zaten gitti, geride yalnız yetim dosya kalır.
 */
async function dosyalariSil(urller: (string | null | undefined)[]) {
  const yollar = urller
    .filter((u): u is string => Boolean(u))
    .map(depoYolu)
    .filter((y): y is string => Boolean(y));
  if (!yollar.length) return;

  const { error } = await db().storage.from(KOVA).remove(yollar);
  if (error) console.warn("Depodaki dosya silinemedi:", error.message);
}

export async function gorselleriGetir(): Promise<GorselKaydi[]> {
  const { data, error } = await db()
    .from("gorseller")
    .select("*")
    .order("olusturuldu", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GorselKaydi[];
}

/**
 * Sabit yerleşimli (slot) görseli değiştirir: yeni kaydı ekler, o slotun eski
 * kayıtlarını siler.
 *
 * Neden: her yükleme yeni satır açıyor, eskisi duruyordu. Panel ve site "o
 * slotun en yenisini" gösterdiği için sorun görünmüyordu — ta ki "Kaldır"a
 * basılana kadar: yalnız en yeni satır silindiği için BİR ÖNCEKİ FOTOĞRAF
 * yayına geri dönüyor, ama kullanıcıya "varsayılana dönüldü" deniyordu.
 *
 * Sıra önemli: önce ekle, sonra sil. Tersi olsaydı ekleme başarısız olunca
 * slot tamamen boş kalırdı.
 */
export async function slotGorseliDegistir(slot: string, url: string) {
  const { data, error } = await db()
    .from("gorseller")
    .insert({ url, slot, albom: null, alt_metin: "", baslik: null, sira: 0, yayinda: true })
    .select("id")
    .single();
  if (error) throw error;

  const { data: eskiler, error: silHatasi } = await db()
    .from("gorseller")
    .delete()
    .eq("slot", slot)
    .neq("id", data.id)
    .select("url");

  // Eski kayıtlar silinemezse yeni görsel yine de yayında (en yenisi kazanıyor).
  // Yüklemeyi başarısız saymıyoruz, sadece not düşüyoruz.
  if (silHatasi) console.warn("Eski slot kayıtları silinemedi:", silHatasi.message);
  else await dosyalariSil((eskiler ?? []).map((g) => g.url as string));
}

/** Slotun TÜM kayıtlarını siler — site varsayılan görsele döner. */
export async function slotGorseliKaldir(slot: string) {
  const { data, error } = await db()
    .from("gorseller")
    .delete()
    .eq("slot", slot)
    .select("id, url");
  if (error) throw error;

  await dosyalariSil((data ?? []).map((g) => g.url as string));
  return data?.length ?? 0;
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
  const { data, error } = await db().from("gorseller").delete().eq("id", id).select("url");
  if (error) throw error;
  await dosyalariSil((data ?? []).map((g) => g.url as string));
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

/**
 * Talep siler. Tek kayıt için de toplu silme için de aynı fonksiyon.
 *
 * `.select("id")`: RLS bir DELETE'i engellerse PostgREST hata döndürmez,
 * sessizce 0 satır siler. Dönen liste boşsa bunu hata sayıyoruz — yoksa panel
 * "silindi" der, kayıt yerinde durur. (Silme izni `14-talep-silme.sql`
 * dosyasıyla geliyor; çalıştırılmadıysa hata burada görünür.)
 */
export async function talepSil(idler: string[]) {
  if (!idler.length) return 0;

  const { data, error } = await db().from("talepler").delete().in("id", idler).select("id");
  if (error) throw error;

  if (!data?.length) {
    throw new Error(
      "Talep silinemedi. Silme izni tanımlı olmayabilir — supabase/14-talep-silme.sql dosyasını çalıştır.",
    );
  }
  return data.length;
}

// ------------------------------------------------------------------ sezon
/**
 * Sezonu kapatır ve yenisini açar — TEK Postgres işlemi olarak.
 *
 * Eskiden burada dört ayrı yazma vardı (arşivle → eskiyi kapat → yeniyi aç →
 * `devir_*` sıfırla). Arada bağlantı koparsa veritabanı yarım kalıyordu; en
 * kötüsü 2. adım çalışıp 3. çalışmazsa hiç aktif sezon kalmıyor ve puan
 * durumu boşalıyordu. Artık `yeni_sezon` fonksiyonu (13-sezon-sifirlama.sql)
 * hepsini tek transaction'da yapıyor: ya hepsi olur ya hiçbiri.
 *
 * Geri alma reçetesi o SQL dosyasının sonunda yazılı; sıfırlama sırasında
 * silinen `devir_*` değerleri artık arşiv satırında saklanıyor.
 */
export async function yeniSezon(ad: string, takimlariTasi: boolean) {
  const { data, error } = await db().rpc("yeni_sezon", {
    p_ad: ad.trim(),
    p_slug: sezonSlug(ad),
    p_takimlari_tasi: takimlariTasi,
  });
  if (error) throw error;
  return (data ?? {}) as { sezon_id: string; arsivlenen: number; eski_sezon_id: string | null };
}

// --------------------------------------------------------- bekleyen işler
/**
 * Panelin "bugün ne var" sayıları. Menüdeki rozetler ve özet ekranı bunu
 * kullanıyor, o yüzden ucuz olmak zorunda: `head: true` ile yalnız sayım
 * dönüyor, tek satır veri çekilmiyor.
 *
 * Tablolardan biri henüz kurulmamışsa (SQL dosyası çalıştırılmamışsa) o
 * kalem 0 sayılıyor — panelin tamamı bir sayaç yüzünden çökmesin.
 */
export type BekleyenIsler = {
  /** Tarihi geçmiş ama skoru hâlâ girilmemiş maç. */
  skorsuzMac: number;
  /** Onay bekleyen ziyaretçi fotoğrafı. */
  fotograf: number;
  /** Okunmamış iletişim/katılım talebi. */
  talep: number;
};

/**
 * Özet ekranındaki sezon sayıları. `maclariGetir` ile tüm sezonu indirip
 * uzunluk saymak yerine iki sayım sorgusu — sezon ilerledikçe o liste binleri
 * buluyor ve panelin açılış maliyeti oluyordu.
 */
export async function sezonSayilari(sezonId: string) {
  const sayim = async (calis: () => PromiseLike<{ count: number | null }>) => {
    try {
      return (await calis()).count ?? 0;
    } catch {
      return 0;
    }
  };

  const [oynanan, sirada] = await Promise.all([
    sayim(() =>
      db()
        .from("maclar")
        .select("id", { count: "exact", head: true })
        .eq("sezon_id", sezonId)
        .in("durum", ["oynandi", "hukmen"]),
    ),
    sayim(() =>
      db()
        .from("maclar")
        .select("id", { count: "exact", head: true })
        .eq("sezon_id", sezonId)
        .eq("durum", "oynanacak"),
    ),
  ]);

  return { oynanan, sirada };
}

/**
 * Skoru girilmesi gereken maç sayısı — tanım `skorBekleniyorMu` (zaman.ts):
 * saati belli maç bitişinden (başlangıç + 1 saat), saati belirsiz maç gün
 * bitiminden sonra sayılır.
 *
 * Saat belirsizliği veritabanında sorgulanamadığı için yalnız sayım yetmiyor:
 * adaylar (başlangıcı en az bir maç süresi önce olan skorsuz maçlar) çekilip
 * süzülüyor. Aday listesi yalnız "oynanmış olması gereken ama skoru girilmemiş"
 * maçlardan oluşur, normalde bir elin parmaklarını geçmez; yine de 1000 satır
 * sınırına takılmasın diye sayfa sayfa okunuyor.
 */
async function skorsuzMacSayisi(sezonId: string): Promise<number> {
  const simdi = Date.now();
  const sinir = new Date(simdi - MAC_SURESI_DK * 60_000).toISOString();
  const SAYFA = 1000;
  let adet = 0;
  try {
    for (let bas = 0; ; bas += SAYFA) {
      const { data, error } = await db()
        .from("maclar")
        .select("id, oynanma")
        .eq("sezon_id", sezonId)
        .eq("durum", "oynanacak")
        .lte("oynanma", sinir)
        .order("id")
        .range(bas, bas + SAYFA - 1);
      if (error || !data?.length) break;
      adet += data.filter((m) => skorBekleniyorMu(m.oynanma as string | null, simdi)).length;
      if (data.length < SAYFA) break;
    }
  } catch {
    return adet;
  }
  return adet;
}

export async function bekleyenIsler(): Promise<BekleyenIsler> {
  const sezon = await aktifSezon().catch(() => null);

  const sayim = async (calis: () => PromiseLike<{ count: number | null }>) => {
    try {
      return (await calis()).count ?? 0;
    } catch {
      return 0;
    }
  };

  const [skorsuzMac, fotograf, talep] = await Promise.all([
    sezon ? skorsuzMacSayisi(sezon.id) : Promise.resolve(0),
    sayim(() =>
      db()
        .from("takim_fotograflari")
        .select("id", { count: "exact", head: true })
        .eq("durum", "bekliyor"),
    ),
    sayim(() =>
      db().from("talepler").select("id", { count: "exact", head: true }).eq("okundu", false),
    ),
  ]);

  return { skorsuzMac, fotograf, talep };
}

/**
 * Bir kaydı listede bir sıra yukarı (-1) veya aşağı (+1) taşır.
 *
 * Eskiden `sira` değeri doğrudan ±1 yapılıyordu. Bütün kayıtlar şema
 * varsayılanıyla `sira = 0` başladığı için bu, kaydı komşusuyla takas etmek
 * yerine listenin en başına (-1) ya da en sonuna (+1) fırlatıyordu; iki kayıt
 * aynı sırada kalınca da liste her okunuşta farklı dizilebiliyordu.
 *
 * Artık liste görünen sırasına göre 0, 1, 2… diye yeniden numaralanıyor ve
 * kayıt komşusuyla yer değiştiriyor. Yalnız değeri gerçekten değişen satırlar
 * yazılıyor.
 *
 * `liste` ekranda göründüğü sırada olmalı; `guncelle` ilgili tablonun kendi
 * güncelleme fonksiyonu (`sosyalGuncelle`, `gorselGuncelle` …).
 */
export async function siradaTasi(
  liste: { id: string; sira: number }[],
  id: string,
  yon: -1 | 1,
  guncelle: (id: string, degisiklik: { sira: number }) => Promise<void>,
) {
  const su = liste.findIndex((k) => k.id === id);
  if (su < 0) return;

  const hedef = su + yon;
  if (hedef < 0 || hedef >= liste.length) return; // Zaten uçta, yapacak bir şey yok.

  const yeni = [...liste];
  [yeni[su], yeni[hedef]] = [yeni[hedef], yeni[su]];

  const yazilacak = yeni
    .map((k, i) => ({ k, i }))
    .filter(({ k, i }) => k.sira !== i);

  await Promise.all(yazilacak.map(({ k, i }) => guncelle(k.id, { sira: i })));
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
  const toplam = devir_g + devir_b + devir_m;

  /**
   * Eşitlik şart — eskiden yalnız "fazla olamaz" diye bakılıyordu, yani
   * "8 maç oynadı ama 3 sonuç girildi" kabul ediliyordu ve puan tablosunda
   * O ile G/B/M birbirini tutmuyordu. Aynı kural `10-puan-tutarliligi.sql`
   * ile veritabanına da yazıldı; buradaki kontrol sadece anlaşılır bir
   * mesaj vermek için, asıl güvence oradaki kısıt.
   */
  if (toplam !== devir_o) {
    throw new Error(
      `G+B+M toplamı (${toplam}) oynanan maç sayısına (${devir_o}) eşit olmalı. ` +
        `Fark: ${Math.abs(toplam - devir_o)} maç.`,
    );
  }

  if (Object.values(devir).some((v) => v < 0)) {
    throw new Error("Devir değerleri negatif olamaz.");
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
 * şampiyonu sezona işler. Sezon kapanmadan ÖNCE çağrılmalı — görünümler
 * yalnız aktif sezonu hesaplar, sezon kapandıktan sonra o tablo bir daha
 * üretilemez.
 *
 * Asıl iş `sezonu_arsivle` SQL fonksiyonunda (13-sezon-sifirlama.sql). Sezon
 * sıfırlama da aynı fonksiyonu çağırıyor, böylece iki ayrı arşivleme mantığı
 * olmuyor. Kaynağı `puan_durumu_tam`: sezon ortasında pasife alınan takımlar
 * da tarihe geçiyor.
 *
 * Dönen sayı arşive yazılan takım sayısıdır.
 */
export async function sezonuArsivle(sezonId: string) {
  const { data, error } = await db().rpc("sezonu_arsivle", { p_sezon_id: sezonId });
  if (error) throw error;
  return (data as number) ?? 0;
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
//
// Ziyaretçi yüklemesi GİZLİ `takim-fotograflari-bekleyen` kovasına gider;
// oradaki dosyayı yalnız yönetici görebilir. Onaylandığı anda dosya herkese
// açık `takim-fotograflari` kovasına taşınır ve kalıcı adresini alır.
// Böylece onaydan geçmemiş bir fotoğrafın adresi hiçbir zaman dışarı çıkmaz.

const FOTO_KOVA = "takim-fotograflari";
const FOTO_BEKLEYEN_KOVA = "takim-fotograflari-bekleyen";

export type TakimFotografi = {
  id: string;
  takim_id: string;
  url: string;
  /** Dosyanın kovadaki yolu. 09 öncesi yüklenen eski kayıtlarda boş. */
  dosya_yolu: string | null;
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

/**
 * Onay beklerken fotoğrafı panelde göstermek için kısa ömürlü adres.
 * Kova gizli olduğu için `<img src>` doğrudan çalışmaz; imzalı adres gerekir.
 * Bağlantı yalnız yöneticinin tarayıcısında üretilir ve bir saat geçerlidir.
 */
export async function fotografOnizlemeUrl(dosyaYolu: string, saniye = 3600) {
  const { data, error } = await db()
    .storage.from(FOTO_BEKLEYEN_KOVA)
    .createSignedUrl(dosyaYolu, saniye);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Onay: dosya gizli kovadan yayın kovasına taşınır, kayda kalıcı adresi yazılır.
 * Taşıma başarısız olursa kayıt onaylanmaz — sitede kırık görsel çıkmasın.
 */
export async function fotografOnayla(f: TakimFotografi) {
  // 09 öncesi kayıtlar zaten yayın kovasında; sadece durumu değişir.
  if (!f.dosya_yolu) {
    await fotografDurumu(f.id, "onayli");
    return;
  }

  const { error: tasimaHatasi } = await db()
    .storage.from(FOTO_BEKLEYEN_KOVA)
    .move(f.dosya_yolu, f.dosya_yolu, { destinationBucket: FOTO_KOVA });

  // Daha önce taşınmış bir kaydı yeniden onaylıyor olabiliriz; o durumda
  // kaynak dosya bulunamaz ve bu bir hata değildir.
  if (tasimaHatasi && !/not found|exists/i.test(tasimaHatasi.message)) {
    throw new Error("Dosya yayın kovasına taşınamadı: " + tasimaHatasi.message);
  }

  const url = db().storage.from(FOTO_KOVA).getPublicUrl(f.dosya_yolu).data.publicUrl;
  const { error } = await db()
    .from("takim_fotograflari")
    .update({ durum: "onayli", url })
    .eq("id", f.id);
  if (error) throw error;
}

export async function fotografDurumu(id: string, durum: "bekliyor" | "onayli" | "red") {
  const { error } = await db().from("takim_fotograflari").update({ durum }).eq("id", id);
  if (error) throw error;
}

/** Kaydı ve dosyasını birlikte siler; kovada artık kimse kullanmadığı için. */
export async function fotografSil(f: TakimFotografi) {
  if (f.dosya_yolu) {
    const kova = f.durum === "onayli" ? FOTO_KOVA : FOTO_BEKLEYEN_KOVA;
    // Dosya zaten yoksa sorun değil; asıl iş kaydın silinmesi. Yine de
    // sonucu yutmuyoruz: sürekli başarısız oluyorsa depoda dosya birikir.
    const { error: depoHatasi } = await db().storage.from(kova).remove([f.dosya_yolu]);
    if (depoHatasi) console.warn("Fotoğraf dosyası silinemedi:", depoHatasi.message);
  }
  const { error } = await db().from("takim_fotograflari").delete().eq("id", f.id);
  if (error) throw error;
}
