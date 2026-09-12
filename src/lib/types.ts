export type MacSonucu = "G" | "B" | "M" | "";

/** Faz 4'e kadar kullanılan geçici kayıt tipi. Sonra `Mac` kayıtlarından türetilecek. */
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

export type Mac = {
  id: string;
  hafta: number;
  tarih: string;
  evSlug: string;
  depSlug: string;
  evSkor: number | null;
  depSkor: number | null;
  durum: "oynanacak" | "oynandi" | "ertelendi";
};
