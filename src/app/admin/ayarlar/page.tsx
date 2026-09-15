"use client";

import { useEffect, useState } from "react";
import { Alan, Bildirim, Dugme, Girdi, Iskelet, Panel } from "@/components/admin/ui";
import { SabitGorseller } from "@/components/admin/sabit-gorseller";
import { useKirli } from "@/lib/kirli";
import { ayarKaydet, ayarlariGetir } from "@/lib/admin-veri";

type Ayar = { anahtar: string; deger: string | null; aciklama: string | null };

/** Ayarlar panelde bu gruplar halinde gösterilir. */
const GRUPLAR: { ad: string; not?: string; anahtarlar: string[] }[] = [
  {
    ad: "İletişim",
    not: "WhatsApp numarası ülke koduyla ve sadece rakam: 905363771767",
    anahtarlar: ["yetkili", "telefon", "whatsapp", "instagram", "youtube", "tiktok"],
  },
  {
    ad: "Anasayfa — üst bölüm",
    anahtarlar: ["hero_baslik", "hero_vurgu", "hero_metin", "hero_buton1", "hero_buton2"],
  },
  {
    ad: "Katıl sayfası",
    not: "Madde listesinde her satır ayrı bir madde olur.",
    anahtarlar: ["katil_baslik", "katil_metin", "katil_maddeler"],
  },
  {
    ad: "Biz Kimiz sayfası",
    not: "Ana metinde paragrafları boş satır bırakarak ayır. Değerlerde biçim: Başlık|Açıklama",
    anahtarlar: [
      "bizkimiz_baslik",
      "bizkimiz_ozet",
      "bizkimiz_metin",
      "bizkimiz_deger1",
      "bizkimiz_deger2",
      "bizkimiz_deger3",
      "bizkimiz_etkinlik_baslik",
      "bizkimiz_etkinlik_metin",
      "bizkimiz_etkinlikler",
    ],
  },
  {
    ad: "Canlı yayın",
    not: "Kapatmak için \"aktif\" alanına hayir yaz. Link boşsa sadece bilgi yazısı görünür.",
    anahtarlar: [
      "canli_yayin_aktif",
      "canli_yayin_metin",
      "canli_yayin_buton",
      "canli_yayin_link",
      "canli_yayin_aciklama",
    ],
  },
  {
    ad: "Diğer sayfalar",
    anahtarlar: [
      "sosyal_baslik",
      "sosyal_metin",
      "iletisim_metin",
      "galeri_metin",
      "footer_metin",
      "katki_metin",
      "site_aciklama",
    ],
  },
];

/**
 * Sitede artık kullanılmayan ayarlar. Veritabanında satırları dursa bile
 * panelde "Tanımsız ayarlar" altında görünmesinler diye gizleniyor.
 * (Anasayfadaki kampanya bandı yerini "Yaklaşan maçlar + duyurular"a bıraktı.)
 */
const KALDIRILAN = new Set(["kampanya_baslik", "kampanya_vurgu", "kampanya_metin", "kampanya_buton"]);

/** Bu alanlar kısa olduğu için tek satırlık girdi kullanır. */
const TEK_SATIR = new Set(["canli_yayin_metin", "katki_metin"]);

const COK_SATIRLI = (anahtar: string) =>
  !TEK_SATIR.has(anahtar) &&
  (anahtar.endsWith("_metin") ||
    anahtar.endsWith("_maddeler") ||
    anahtar.endsWith("_etkinlikler") ||
    anahtar.endsWith("_aciklama"));

export default function AdminAyarlar() {
  const [ayarlar, setAyarlar] = useState<Ayar[]>([]);
  const [degerler, setDegerler] = useState<Record<string, string>>({});
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);
  const [bekle, setBekle] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const a = await ayarlariGetir();
        setAyarlar(a);
        setDegerler(Object.fromEntries(a.map((x) => [x.anahtar, x.deger ?? ""])));
      } catch (e) {
        setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Ayarlar okunamadı." });
      }
    })();
  }, []);

  const degisenSayisi = ayarlar.filter(
    (a) => (a.deger ?? "") !== (degerler[a.anahtar] ?? ""),
  ).length;

  // Kaydedilmemiş ayarlar da deftere yazılıyor; menüden çıkarken uyarı çıkar.
  useKirli("ayarlar", degisenSayisi > 0);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setBekle(true);
    try {
      const degisenler = ayarlar.filter((a) => (a.deger ?? "") !== degerler[a.anahtar]);
      for (const a of degisenler) await ayarKaydet(a.anahtar, degerler[a.anahtar]);
      setMesaj({
        tur: "basari",
        metin: degisenler.length
          ? `${degisenler.length} ayar kaydedildi. Sitede görünmesi bir dakikayı bulabilir.`
          : "Değişiklik yok.",
      });
      setAyarlar((onceki) => onceki.map((a) => ({ ...a, deger: degerler[a.anahtar] })));
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Kaydedilemedi." });
    }
    setBekle(false);
  }

  const bilinen = new Set(GRUPLAR.flatMap((g) => g.anahtarlar));
  const digerleri = ayarlar
    .filter((a) => !bilinen.has(a.anahtar) && !KALDIRILAN.has(a.anahtar))
    .map((a) => a.anahtar);
  const tumGruplar = digerleri.length
    ? [...GRUPLAR, { ad: "Tanımsız ayarlar", anahtarlar: digerleri }]
    : GRUPLAR;

  if (ayarlar.length === 0 && !mesaj) {
    return <Iskelet satir={2} />;
  }

  return (
    <div className="grid gap-6 pb-24">
      <Bildirim mesaj={mesaj} kapat={() => setMesaj(null)} />

      <form onSubmit={kaydet} className="grid gap-6">
      {tumGruplar.map((grup) => {
        const satirlar = grup.anahtarlar
          .map((k) => ayarlar.find((a) => a.anahtar === k))
          .filter(Boolean) as Ayar[];
        if (satirlar.length === 0) return null;

        return (
          <Panel key={grup.ad} baslik={grup.ad} sag={grup.not}>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              {satirlar.map((a) => (
                <div
                  key={a.anahtar}
                  className={COK_SATIRLI(a.anahtar) ? "md:col-span-2" : undefined}
                >
                  <Alan etiket={(a.aciklama ?? a.anahtar).replace(/^.*· /, "")}>
                    {COK_SATIRLI(a.anahtar) ? (
                      <textarea
                        id={`ayar-${a.anahtar}`}
                        rows={a.anahtar.endsWith("_maddeler") || a.anahtar.endsWith("_etkinlikler") ? 5 : 3}
                        value={degerler[a.anahtar] ?? ""}
                        onChange={(e) =>
                          setDegerler((d) => ({ ...d, [a.anahtar]: e.target.value }))
                        }
                        className="w-full rounded-sm border border-white/15 bg-[#07200f] px-3 py-2.5 text-white focus:border-brand-lite"
                      />
                    ) : (
                      <Girdi
                        id={`ayar-${a.anahtar}`}
                        value={degerler[a.anahtar] ?? ""}
                        onChange={(e) =>
                          setDegerler((d) => ({ ...d, [a.anahtar]: e.target.value }))
                        }
                      />
                    )}
                  </Alan>
                </div>
              ))}
            </div>
          </Panel>
        );
      })}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/12 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-4 px-5 py-3">
          <p className="text-sm text-muted-dark">
            {degisenSayisi > 0 ? `${degisenSayisi} alan değişti` : "Değişiklik yok"}
          </p>
          <div className="ml-auto">
            <Dugme type="submit" disabled={bekle || degisenSayisi === 0}>
              {bekle ? "Kaydediliyor…" : "Kaydet"}
            </Dugme>
          </div>
        </div>
      </div>
      </form>

      {/*
        Sabit site görselleri metin ayarlarının en altında. Formun DIŞINDA:
        içinde olsaydı dosya seçme düğmeleri formu göndermeye karışabilirdi,
        ayrıca yüklemeler anında kaydediliyor — "Kaydet" düğmesini beklemiyor.
      */}
      <SabitGorseller bildir={setMesaj} />
    </div>
  );
}
