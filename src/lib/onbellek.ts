/**
 * Süreç içi (modül seviyesi) kısa ömürlü önbellek.
 *
 * React'in `cache()` fonksiyonu aynı isteğin içindeki tekrar çağrıları birleştirir;
 * fakat statik üretimde her sayfa ayrı bir render olduğu için 64 takım sayfası
 * üretilirken `getPuanDurumu()` 64 kez veritabanına gider. Bu katman onun altına
 * girer: sonuç `saniye` kadar süreyle modül belleğinde tutulur, böylece build
 * boyunca (ve çalışma anında kısa süreli tepe yüklerde) sorgu bir kez atılır.
 *
 * Süre bilerek sayfaların `revalidate` değerinden kısa tutuluyor: sayfa yeniden
 * üretilirken bayat veri görme ihtimali en fazla bu kadar uzar.
 */

const VARSAYILAN_SANIYE = 30;
const AZAMI_KAYIT = 500;

type Kayit = { deger: Promise<unknown>; zaman: number; omur: number };

const kutu = new Map<string, Kayit>();

function temizle(simdi: number) {
  for (const [k, v] of kutu) {
    if (simdi - v.zaman >= v.omur) kutu.delete(k);
  }
}

/**
 * `fn`'i anahtar + argümanlara göre `saniye` boyunca hatırlar.
 * Hata veren çağrı önbelleğe yazılmaz; bir sonraki istek yeniden dener.
 */
export function hafizala<A extends unknown[], T>(
  anahtar: string,
  fn: (...arg: A) => Promise<T>,
  saniye: number = VARSAYILAN_SANIYE,
): (...arg: A) => Promise<T> {
  const omur = saniye * 1000;

  return (...arg: A): Promise<T> => {
    const k = arg.length ? `${anahtar}(${JSON.stringify(arg)})` : anahtar;
    const simdi = Date.now();

    const eski = kutu.get(k);
    if (eski && simdi - eski.zaman < eski.omur) return eski.deger as Promise<T>;

    if (kutu.size > AZAMI_KAYIT) temizle(simdi);

    const deger = fn(...arg).catch((hata) => {
      kutu.delete(k);
      throw hata;
    });

    kutu.set(k, { deger, zaman: simdi, omur });
    return deger;
  };
}

/** Test/panel tarafı için: belleği tamamen boşaltır. */
export function onbellegiBosalt() {
  kutu.clear();
}
