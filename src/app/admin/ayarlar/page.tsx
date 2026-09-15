"use client";

import { useEffect, useMemo, useState } from "react";
import { Alan, Bildirim, Dugme, Girdi, Iskelet, Panel } from "@/components/admin/ui";
import { SabitGorseller } from "@/components/admin/sabit-gorseller";
import { useKirli } from "@/lib/kirli";
import { ayarKaydet, ayarlariGetir } from "@/lib/admin-veri";
import { VARSAYILAN_ICERIK } from "@/lib/icerik-varsayilan";

type Ayar = { anahtar: string; deger: string | null; aciklama: string | null };

/**
 * Bir alan: yalnız anahtar yazılırsa etiket veritabanındaki `aciklama`dan gelir.
 * Etiket verilmişse o kullanılır — anasayfanın yeni bölüm metinlerinin
 * veritabanında satırı yok; ilk kayıtta satır açılır (`ayarKaydet` upsert).
 */
type AlanTanimi = string | { anahtar: string; etiket: string };

type Grup = { id: string; ad: string; not?: string; alanlar: AlanTanimi[] };

/** Ayarlar panelde bu gruplar halinde, anasayfada göründükleri sırayla gösterilir. */
const GRUPLAR: Grup[] = [
  {
    id: "iletisim",
    ad: "İletişim",
    not: "WhatsApp numarası ülke koduyla ve sadece rakam: 905363771767",
    alanlar: ["yetkili", "telefon", "whatsapp", "instagram", "youtube", "tiktok"],
  },
  {
    id: "ana-ust",
    ad: "Anasayfa · 1 — Üst bölüm",
    alanlar: [
      "hero_baslik",
      "hero_vurgu",
      "hero_metin",
      "hero_buton1",
      "hero_buton2",
      { anahtar: "sayac_takim", etiket: "Sayaç · takım yazısı" },
      { anahtar: "sayac_mac", etiket: "Sayaç · maç yazısı" },
      { anahtar: "sayac_gol", etiket: "Sayaç · gol yazısı" },
    ],
  },
  {
    id: "ana-hafta",
    ad: "Anasayfa · 2 — Haftanın özeti",
    not: "Kartlardaki cümleler maç verisinden otomatik yazılır.",
    alanlar: [
      { anahtar: "hafta_baslik", etiket: "Bölüm başlığı" },
      { anahtar: "hafta_kart_mac", etiket: "1. kart etiketi" },
      { anahtar: "hafta_kart_yukselen", etiket: "2. kart etiketi" },
      { anahtar: "hafta_kart_surpriz", etiket: "3. kart etiketi" },
      { anahtar: "hafta_kart_gol", etiket: "4. kart etiketi" },
      { anahtar: "hafta_link", etiket: "Alttaki bağlantı yazısı" },
    ],
  },
  {
    id: "ana-puan",
    ad: "Anasayfa · 3 — Puan durumu",
    alanlar: [
      { anahtar: "puan_etiket", etiket: "Üst etiket" },
      { anahtar: "puan_baslik", etiket: "Bölüm başlığı" },
      { anahtar: "puan_link", etiket: "Bağlantı yazısı" },
    ],
  },
  {
    id: "ana-yaklasan",
    ad: "Anasayfa · 4 — Yaklaşan maçlar",
    alanlar: [
      { anahtar: "yaklasan_etiket", etiket: "Üst etiket" },
      { anahtar: "yaklasan_baslik", etiket: "Başlık (beyaz kısım)" },
      { anahtar: "yaklasan_vurgu", etiket: "Başlık (altın kısım)" },
      { anahtar: "yaklasan_link", etiket: "Bağlantı yazısı" },
      { anahtar: "yaklasan_bos", etiket: "Maç yokken görünen metin" },
    ],
  },
  {
    id: "ana-duyuru",
    ad: "Anasayfa · 5 — Duyurular ve kurallar",
    not: "Duyuru ve kuralların kendisi Duyurular sekmesinden girilir.",
    alanlar: [
      { anahtar: "duyuru_etiket", etiket: "Duyurular · üst etiket" },
      { anahtar: "duyuru_baslik", etiket: "Duyurular · başlık" },
      { anahtar: "duyuru_link", etiket: "Duyurular · bağlantı yazısı" },
      { anahtar: "duyuru_bos", etiket: "Duyuru yokken görünen metin" },
      { anahtar: "kural_etiket", etiket: "Kurallar · üst etiket" },
      { anahtar: "kural_baslik", etiket: "Kurallar · başlık" },
      { anahtar: "kural_link", etiket: "Kurallar · bağlantı yazısı" },
    ],
  },
  {
    id: "ana-galeri",
    ad: "Anasayfa · 6 — Galeri",
    alanlar: [
      { anahtar: "galeri_etiket", etiket: "Üst etiket" },
      { anahtar: "galeri_baslik", etiket: "Bölüm başlığı" },
      { anahtar: "galeri_link", etiket: "Bağlantı yazısı" },
    ],
  },
  {
    id: "ana-sosyal",
    ad: "Anasayfa · 7 — Sosyal medya",
    alanlar: [
      { anahtar: "sosyal_etiket", etiket: "Üst etiket" },
      "sosyal_baslik",
      "sosyal_metin",
    ],
  },
  {
    id: "ana-katil",
    ad: "Anasayfa · 8 — Aramıza katıl",
    not: "Başlık, metin ve maddeler Katıl sayfasında da kullanılır. Madde listesinde her satır ayrı madde olur.",
    alanlar: [
      { anahtar: "katil_etiket", etiket: "Üst etiket" },
      "katil_baslik",
      "katil_metin",
      "katil_maddeler",
      { anahtar: "katil_buton", etiket: "Buton yazısı" },
    ],
  },
  {
    id: "bizkimiz",
    ad: "Biz Kimiz sayfası",
    not: "Ana metinde paragrafları boş satır bırakarak ayır. Değerlerde biçim: Başlık|Açıklama",
    alanlar: [
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
    id: "canli",
    ad: "Canlı yayın",
    not: "Kapatmak için \"aktif\" alanına hayir yaz. Link boşsa sadece bilgi yazısı görünür.",
    alanlar: [
      "canli_yayin_aktif",
      "canli_yayin_metin",
      "canli_yayin_buton",
      "canli_yayin_link",
      "canli_yayin_aciklama",
    ],
  },
  {
    id: "diger",
    ad: "Diğer sayfalar",
    alanlar: ["iletisim_metin", "galeri_metin", "footer_metin", "katki_metin", "site_aciklama"],
  },
];

/**
 * Sitede artık kullanılmayan ayarlar. Veritabanında satırları dursa bile
 * panelde "Tanımsız ayarlar" altında görünmesinler diye gizleniyor.
 * (Anasayfadaki kampanya bandı yerini "Yaklaşan maçlar + duyurular"a bıraktı.
 * Satırları silmek için: supabase/16-kampanya-temizligi.sql — onaylı çalıştır.)
 */
const KALDIRILAN = new Set(["kampanya_baslik", "kampanya_vurgu", "kampanya_metin", "kampanya_buton"]);

/** Bu alanlar kısa olduğu için tek satırlık girdi kullanır. */
const TEK_SATIR = new Set(["canli_yayin_metin", "katki_metin"]);

const COK_SATIRLI = (anahtar: string) =>
  !TEK_SATIR.has(anahtar) &&
  (anahtar.endsWith("_metin") ||
    anahtar.endsWith("_maddeler") ||
    anahtar.endsWith("_etkinlikler") ||
    anahtar.endsWith("_aciklama") ||
    anahtar.endsWith("_bos"));

const anahtarOf = (a: AlanTanimi) => (typeof a === "string" ? a : a.anahtar);

/** Veritabanında satırı olmayan alanın başlangıç değeri: sitede görünen varsayılan. */
const varsayilan = (anahtar: string) =>
  (VARSAYILAN_ICERIK as Record<string, string>)[anahtar] ?? "";

export default function AdminAyarlar() {
  const [kayitlar, setKayitlar] = useState<Ayar[] | null>(null);
  /** Son kaydedilmiş hâl — "değişti mi" buna göre. */
  const [asil, setAsil] = useState<Record<string, string>>({});
  const [degerler, setDegerler] = useState<Record<string, string>>({});
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);
  const [bekle, setBekle] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const a = await ayarlariGetir();
        const baslangic: Record<string, string> = {};
        // Önce koddaki tüm alanlar varsayılanla, sonra veritabanındaki değerler üstüne.
        for (const g of GRUPLAR) for (const al of g.alanlar) baslangic[anahtarOf(al)] = varsayilan(anahtarOf(al));
        for (const x of a) baslangic[x.anahtar] = x.deger ?? "";
        setKayitlar(a);
        setAsil(baslangic);
        setDegerler(baslangic);
      } catch (e) {
        setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Ayarlar okunamadı." });
      }
    })();
  }, []);

  const degisenler = Object.keys(degerler).filter((k) => (asil[k] ?? "") !== (degerler[k] ?? ""));

  // Kaydedilmemiş ayarlar da deftere yazılıyor; menüden çıkarken uyarı çıkar.
  useKirli("ayarlar", degisenler.length > 0);

  /** Grup listesi + veritabanında olup hiçbir gruba girmeyen ayarlar. */
  const tumGruplar = useMemo(() => {
    if (!kayitlar) return GRUPLAR;
    const bilinen = new Set(GRUPLAR.flatMap((g) => g.alanlar.map(anahtarOf)));
    const digerleri = kayitlar
      .filter((a) => !bilinen.has(a.anahtar) && !KALDIRILAN.has(a.anahtar))
      .map((a) => a.anahtar);
    return digerleri.length
      ? [...GRUPLAR, { id: "tanimsiz", ad: "Tanımsız ayarlar", alanlar: digerleri }]
      : GRUPLAR;
  }, [kayitlar]);

  const etiketBul = (al: AlanTanimi) => {
    if (typeof al !== "string") return al.etiket;
    const kayit = kayitlar?.find((x) => x.anahtar === al);
    return (kayit?.aciklama ?? al).replace(/^.*· /, "");
  };

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setBekle(true);
    try {
      for (const k of degisenler) {
        // Yeni açılan satıra açıklama da yazılsın ki veritabanında ne olduğu belli olsun.
        const grup = tumGruplar.find((g) => g.alanlar.some((al) => anahtarOf(al) === k));
        const tanim = grup?.alanlar.find((al) => anahtarOf(al) === k);
        const aciklama =
          grup && tanim && typeof tanim !== "string" ? `${grup.ad} · ${tanim.etiket}` : undefined;
        await ayarKaydet(k, degerler[k] ?? "", aciklama);
      }
      setMesaj({
        tur: "basari",
        metin: degisenler.length
          ? `${degisenler.length} ayar kaydedildi. Sitede görünmesi bir dakikayı bulabilir.`
          : "Değişiklik yok.",
      });
      setAsil({ ...degerler });
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Kaydedilemedi." });
    }
    setBekle(false);
  }

  if (!kayitlar && !mesaj) {
    return <Iskelet satir={2} />;
  }

  return (
    <div className="grid gap-6 pb-24">
      <Bildirim mesaj={mesaj} kapat={() => setMesaj(null)} />

      {/* Bölümlere hızlı geçiş: sayfa uzun, telefonda kaydırmak zahmetli. */}
      <nav
        aria-label="Ayar grupları"
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {tumGruplar.map((g) => (
          <a
            key={g.id}
            href={`#grup-${g.id}`}
            className="btn-cizgi flex-none rounded-full border border-white/15 bg-ink/40 px-3 py-1.5 font-[family-name:var(--font-data)] text-xs font-semibold tracking-wider whitespace-nowrap text-[#cfe0d5] uppercase hover:border-brand-lite hover:text-brand-lite"
          >
            {g.ad.replace("Anasayfa · ", "")}
          </a>
        ))}
      </nav>

      <form onSubmit={kaydet} className="grid gap-6">
        {tumGruplar.map((grup) => (
          <div key={grup.id} id={`grup-${grup.id}`} className="scroll-mt-4">
            <Panel baslik={grup.ad} sag={grup.not}>
              <div className="grid gap-4 p-4 md:grid-cols-2">
                {grup.alanlar.map((al) => {
                  const k = anahtarOf(al);
                  const degisti = (asil[k] ?? "") !== (degerler[k] ?? "");
                  return (
                    <div
                      key={k}
                      className={`${COK_SATIRLI(k) ? "md:col-span-2" : ""} ${
                        degisti ? "rounded-sm border-l-2 border-gold pl-3" : ""
                      }`}
                    >
                      <Alan etiket={etiketBul(al)}>
                        {COK_SATIRLI(k) ? (
                          <textarea
                            id={`ayar-${k}`}
                            rows={k.endsWith("_maddeler") || k.endsWith("_etkinlikler") ? 5 : 3}
                            value={degerler[k] ?? ""}
                            onChange={(e) => setDegerler((d) => ({ ...d, [k]: e.target.value }))}
                            className="w-full rounded-sm border border-white/15 bg-[#07200f] px-3 py-2.5 text-white"
                          />
                        ) : (
                          <Girdi
                            id={`ayar-${k}`}
                            value={degerler[k] ?? ""}
                            onChange={(e) => setDegerler((d) => ({ ...d, [k]: e.target.value }))}
                          />
                        )}
                      </Alan>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
        ))}

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/12 bg-ink/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1180px] items-center gap-4 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <p className="text-sm text-muted-dark">
              {degisenler.length > 0 ? (
                <span className="text-gold">{degisenler.length} alan değişti</span>
              ) : (
                "Değişiklik yok"
              )}
            </p>
            <div className="ml-auto">
              <Dugme type="submit" disabled={bekle || degisenler.length === 0}>
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
