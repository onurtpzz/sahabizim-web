export type MacSonucu = "G" | "B" | "M" | "";

/** Puan hesabında kullanılan takım kaydı — `puan_durumu` görünümünden türetilir. */
export type TakimKaydi = {
  id: number;
  ad: string;
  slug: string;
  O: number;
  G: number;
  B: number;
  M: number;
  A: number;
  Y: number;
  son: MacSonucu[];
};

/** Puan tablosunda gösterilen, hesaplanmış satır. */
export type PuanSatiri = TakimKaydi & {
  sira: number;
  AV: number;
  P: number;
  oynadi: boolean;
};
