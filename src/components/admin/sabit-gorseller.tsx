"use client";

import { useEffect, useState } from "react";
import { Dugme, Panel } from "@/components/admin/ui";
import {
  dosyaYukle,
  gorselEkle,
  gorselSil,
  gorselleriGetir,
  type GorselKaydi,
} from "@/lib/admin-veri";

type Bildir = (m: { tur: "basari" | "hata"; metin: string }) => void;

/** Sitede sabit yeri olan görseller. Buraya yükleneni site o noktada kullanır. */
const SLOTLAR = [
  {
    deger: "hero",
    ad: "Anasayfa büyük görsel",
    tavsiye: "1920 × 1080 px, koyu bir saha/stadyum fotoğrafı",
  },
  { deger: "kampanya", ad: "Kampanya bandı arka planı", tavsiye: "1600 × 900 px" },
  { deger: "kampanya-yan", ad: "Kampanya bandı yan görseli", tavsiye: "1400 × 950 px" },
  { deger: "bizkimiz", ad: "Biz Kimiz sayfası üst görseli", tavsiye: "1600 × 900 px" },
];

/**
 * Sitenin sabit yerleşimli görselleri (hero, kampanya bandı, Biz Kimiz).
 *
 * Ayarlar sayfasının en altında duruyor: yılda birkaç kez dokunulan bir iş,
 * kendi menü sekmesini hak etmiyordu.
 */
export function SabitGorseller({ bildir }: { bildir: Bildir }) {
  const [kayitlar, setKayitlar] = useState<GorselKaydi[]>([]);
  const [islemde, setIslemde] = useState<string | null>(null);

  async function yenile() {
    try {
      setKayitlar(await gorselleriGetir());
    } catch (e) {
      bildir({ tur: "hata", metin: e instanceof Error ? e.message : "Görseller okunamadı." });
    }
  }

  useEffect(() => {
    yenile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function yukle(dosya: File, slot: string) {
    setIslemde(slot);
    try {
      const url = await dosyaYukle(dosya, `slot/${slot}`);
      await gorselEkle({ url, slot, albom: null, alt_metin: "", baslik: null });
      bildir({ tur: "basari", metin: "Görsel yüklendi. Sitede görünmesi bir dakikayı bulabilir." });
      await yenile();
    } catch (e) {
      bildir({ tur: "hata", metin: e instanceof Error ? e.message : "Yüklenemedi." });
    }
    setIslemde(null);
  }

  async function kaldir(g: GorselKaydi, ad: string) {
    if (!window.confirm(`"${ad}" kaldırılsın mı? Site varsayılan görsele döner.`)) return;
    setIslemde(g.slot ?? g.id);
    try {
      await gorselSil(g.id);
      bildir({ tur: "basari", metin: "Görsel kaldırıldı, varsayılana dönüldü." });
      await yenile();
    } catch (e) {
      bildir({ tur: "hata", metin: e instanceof Error ? e.message : "Kaldırılamadı." });
    }
    setIslemde(null);
  }

  return (
    <Panel baslik="Sitedeki sabit görseller" sag="Yüklenmezse varsayılan kullanılır">
      <ul className="divide-y divide-white/8">
        {SLOTLAR.map((s) => {
          const guncel = kayitlar.find((g) => g.slot === s.deger && g.yayinda);
          const mesgul = islemde === s.deger;

          return (
            <li
              key={s.deger}
              className="grid gap-4 p-4 md:grid-cols-[180px_1fr_auto] md:items-center"
            >
              <div className="relative aspect-video overflow-hidden rounded border border-white/12 bg-black/30">
                {guncel ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={guncel.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-xs text-white/35">
                    Varsayılan görsel
                  </span>
                )}
              </div>

              <div>
                <p className="font-[family-name:var(--font-data)] text-lg font-bold">{s.ad}</p>
                <p className="text-sm text-muted-dark">{s.tavsiye}</p>
                {guncel?.olusturuldu && (
                  <p className="mt-1 text-xs text-white/35">
                    Yüklenme: {new Date(guncel.olusturuldu).toLocaleDateString("tr-TR")}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <label
                  className={`rounded-sm bg-brand px-4 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold tracking-wider text-white uppercase ${
                    mesgul ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-[#15c244]"
                  }`}
                >
                  {mesgul ? "Yükleniyor…" : guncel ? "Değiştir" : "Yükle"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={mesgul}
                    onChange={(e) => {
                      const d = e.target.files?.[0];
                      if (d) yukle(d, s.deger);
                      e.target.value = "";
                    }}
                  />
                </label>
                {guncel && (
                  <Dugme
                    type="button"
                    tur="tehlike"
                    disabled={mesgul}
                    onClick={() => kaldir(guncel, s.ad)}
                  >
                    Kaldır
                  </Dugme>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
