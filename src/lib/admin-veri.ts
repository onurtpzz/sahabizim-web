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
export {
  SAAT_YER_TUTUCU,
  bugun,
  isoSaati,
  isoTarihi,
  saatBelirsizMi,
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

export async function bekleyenIsler(): Promise<BekleyenIsler> {
  const sezon = await aktifSezon().catch(() => null);
  const simdi = new Date().toISOString();

  const sayim = async (calis: () => PromiseLike<{ count: number | null }>) => {
    try {
      return (await calis()).count ?? 0;
    } catch {
      return 0;
    }
  };

  const [skorsuzMac, fotograf, talep] = await Promise.all([
    sezon
      ? sayim(() =>
          db()
            .from("maclar")
            .select("id", { count: "exact", head: true })
            .eq("sezon_id", sezon.id)
            .eq("durum", "oynanacak")
            .lt("oynanma", simdi),
        )
      : Promise.resolve(0),
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
    // Dosya zaten yoksa sorun değil; asıl iş kaydın silinmesi.
    await db().storage.from(kova).remove([f.dosya_yolu]);
  }
  const { error } = await db().from("takim_fotograflari").delete().eq("id", f.id);
  if (error) throw error;
}
