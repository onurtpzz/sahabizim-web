/**
 * Maç tarihi ve saati ile ilgili ortak yardımcılar.
 *
 * Hem yönetim paneli (tarayıcı) hem site (sunucu) kullanıyor, o yüzden bu
 * dosyada Supabase çağrısı ya da `"use client"` yok — saf fonksiyonlar.
 *
 * SAAT DİLİMİ — dikkat edilmesi gereken nokta:
 * Site sayfaları Vercel'de **sunucuda** üretiliyor ve o sunucu UTC'de çalışır.
 * `new Date(iso).getHours()` demek, sunucunun saatini kullanmak demektir; 21:00
 * oynanacak bir maç sitede 18:00 diye görünürdü. Bu yüzden ziyaretçiye gösterilen
 * her tarih ve saat aşağıdaki sabitle açıkça İstanbul'a çevriliyor.
 *
 * Panelde girilen saat ise tarayıcının yerel saatine göre yorumlanıyor — yönetici
 * Türkiye'de olduğu sürece ikisi aynı sonucu verir.
 */

export const LIG_SAAT_DILIMI = "Europe/Istanbul";

/**
 * Saat girilmemiş maçlar için yer tutucu.
 *
 * Sistem başından beri tarihi öğlene sabitliyordu; bu gerçek bir maç saati
 * değil, saat dilimi kaymasını önlemek için seçilmiş nötr bir değerdi.
 * Saat alanı eklendikten sonra da aynı anlamı taşıyor: "saat belirlenmedi".
 * Böyle maçlarda ne sitede ne duyuru görselinde saat yazılır.
 */
export const SAAT_YER_TUTUCU = "12:00";

const iki = (n: number) => String(n).padStart(2, "0");

/** Tarayıcının bugünü: "2026-09-14". */
export function bugun() {
  const d = new Date();
  return `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
}

/** "2026-09-13" + "21:00" → ISO damgası. Saat verilmezse yer tutucu kullanılır. */
export function tarihiIsoYap(tarih: string, saat?: string) {
  if (!tarih) return null;
  const s = /^\d{2}:\d{2}$/.test(saat ?? "") ? (saat as string) : SAAT_YER_TUTUCU;
  return new Date(`${tarih}T${s}:00`).toISOString();
}

/** ISO damgasından tarayıcının yerel saatine göre "2026-09-13". Panel içindir. */
export function isoTarihi(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
}

/** ISO damgasından tarayıcının yerel saatine göre "21:00". Panel içindir. */
export function isoSaati(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${iki(d.getHours())}:${iki(d.getMinutes())}`;
}

// ---------------------------------------------------------------------
// Aşağıdakiler ziyaretçiye gösterilen değerler — saat dilimi sabitli,
// sunucuda da tarayıcıda da aynı sonucu verirler.
// ---------------------------------------------------------------------

/** Lig saatine göre "21:00". */
export function ligSaati(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    timeZone: LIG_SAAT_DILIMI,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Lig saatine göre "2026-09-20" — maçları güne göre gruplamak için. */
export function ligGunu(iso: string): string {
  // en-CA biçimi YYYY-MM-DD verir; sıralanabilir ve ayrıştırması kolay.
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: LIG_SAAT_DILIMI });
}

/** Saat gerçekten belirlenmiş mi, yoksa yer tutucu mu? */
export function saatBelirsizMi(iso: string | null): boolean {
  if (!iso) return true;
  return ligSaati(iso) === SAAT_YER_TUTUCU;
}

/** Gösterilecek maç saati; belirlenmemişse null. */
export function macSaati(iso: string | null): string | null {
  if (!iso || saatBelirsizMi(iso)) return null;
  return ligSaati(iso);
}

/** "20 Eylül Pazar" gibi başlık; `yil` true ise yıl da eklenir. */
export function gunBasligi(gun: string, yil = false): string {
  // `gun` "2026-09-20" — öğlene sabitleyip çeviriyoruz ki gün kaymasın.
  return new Date(`${gun}T12:00:00Z`).toLocaleDateString("tr-TR", {
    timeZone: LIG_SAAT_DILIMI,
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(yil ? { year: "numeric" as const } : {}),
  });
}

/** Tarih rozeti parçaları: "20" · "Eyl" · "Pazar". `gun` "2026-09-20" biçiminde. */
export function tarihRozeti(gun: string) {
  const d = new Date(`${gun}T12:00:00Z`);
  const bicim = (o: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("tr-TR", { timeZone: LIG_SAAT_DILIMI, ...o });
  return {
    gun: bicim({ day: "2-digit" }),
    ay: bicim({ month: "short" }).replace(".", ""),
    haftaGunu: bicim({ weekday: "long" }),
  };
}
