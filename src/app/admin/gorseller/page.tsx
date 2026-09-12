"use client";

import { useEffect, useState } from "react";
import { Alan, Dugme, Girdi, Panel, Secim, Uyari } from "@/components/admin/ui";
import {
  dosyaYukle,
  gorselEkle,
  gorselGuncelle,
  gorselSil,
  gorselleriGetir,
  type GorselKaydi,
} from "@/lib/admin-veri";

/** Sitede sabit yeri olan görseller. Buraya yükleneni site o noktada kullanır. */
const SLOTLAR = [
  { deger: "hero", ad: "Anasayfa büyük görsel", tavsiye: "1920 × 1080 px, koyu bir saha/stadyum fotoğrafı" },
  { deger: "kampanya", ad: "Kampanya bandı arka planı", tavsiye: "1600 × 900 px" },
  { deger: "kampanya-yan", ad: "Kampanya bandı yan görseli", tavsiye: "1400 × 950 px" },
];

export default function AdminGorseller() {
  const [kayitlar, setKayitlar] = useState<GorselKaydi[]>([]);
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  async function yenile() {
    try {
      setKayitlar(await gorselleriGetir());
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Görseller okunamadı." });
    }
    setYukleniyor(false);
  }

  useEffect(() => {
    yenile();
  }, []);

  async function yukle(dosya: File, slot: string | null, alt: string, baslik: string) {
    setMesaj(null);
    try {
      const url = await dosyaYukle(dosya, slot ? `slot/${slot}` : "galeri");
      await gorselEkle({ url, slot, albom: null, alt_metin: alt, baslik: baslik || null });
      setMesaj({ tur: "basari", metin: "Görsel yüklendi." });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Yüklenemedi." });
    }
  }

  async function sil(g: GorselKaydi) {
    if (!window.confirm("Bu görsel kaldırılsın mı?")) return;
    try {
      await gorselSil(g.id);
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Silinemedi." });
    }
  }

  if (yukleniyor) return <p className="text-muted-dark">Yükleniyor…</p>;

  const galeri = kayitlar.filter((g) => !g.slot);

  return (
    <div className="grid gap-6">
      {mesaj && <Uyari tur={mesaj.tur}>{mesaj.metin}</Uyari>}

      <Panel baslik="Sitedeki sabit görseller">
        <ul className="divide-y divide-white/8">
          {SLOTLAR.map((s) => {
            const guncel = kayitlar.find((g) => g.slot === s.deger && g.yayinda);
            return (
              <li key={s.deger} className="grid gap-4 p-4 md:grid-cols-[180px_1fr_auto] md:items-center">
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
                  {guncel && (
                    <p className="mt-1 text-xs text-white/35">
                      Yüklenme: {new Date(guncel.id ? Date.now() : Date.now()).toLocaleDateString("tr-TR")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-sm bg-brand px-4 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider text-white hover:bg-[#15c244]">
                    {guncel ? "Değiştir" : "Yükle"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const d = e.target.files?.[0];
                        if (d) yukle(d, s.deger, "", "");
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {guncel && (
                    <Dugme type="button" tur="tehlike" onClick={() => sil(guncel)}>
                      Kaldır
                    </Dugme>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <GaleriYukle yukle={yukle} />

      <Panel baslik="Galeri" sag={`${galeri.length} görsel`}>
        {galeri.length === 0 ? (
          <p className="p-5 text-sm text-muted-dark">
            Galeri boş — site şimdilik varsayılan fotoğrafları gösteriyor.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
            {galeri.map((g) => (
              <li key={g.id} className="overflow-hidden rounded border border-white/12">
                <div className="relative aspect-4/3 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt={g.alt_metin} className="h-full w-full object-cover" />
                </div>
                <div className="grid gap-2 p-2.5">
                  <p className="truncate text-xs text-muted-dark">{g.alt_metin || "Açıklama yok"}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await gorselGuncelle(g.id, { yayinda: !g.yayinda });
                        await yenile();
                      }}
                      className="flex-1 rounded-sm border border-white/20 px-2 py-1.5 text-xs uppercase tracking-wider text-[#cfe0d5] hover:border-brand-lite hover:text-white"
                    >
                      {g.yayinda ? "Gizle" : "Göster"}
                    </button>
                    <button
                      type="button"
                      onClick={() => sil(g)}
                      className="rounded-sm border border-lose/50 px-2 py-1.5 text-xs uppercase tracking-wider text-[#ff9a8f] hover:bg-lose/15"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Uyari>
        Görseller JPG, PNG veya WebP olmalı; dosya başına 2 MB&apos;ı geçmemeye çalış.
        Açıklama (alt metin) yazmak hem görme engelliler hem Google için önemli.
      </Uyari>
    </div>
  );
}

function GaleriYukle({
  yukle,
}: {
  yukle: (d: File, slot: string | null, alt: string, baslik: string) => Promise<void>;
}) {
  const [alt, setAlt] = useState("");
  const [baslik, setBaslik] = useState("");
  const [dosya, setDosya] = useState<File | null>(null);
  const [bekle, setBekle] = useState(false);

  return (
    <Panel baslik="Galeriye görsel ekle">
      <form
        className="grid gap-4 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!dosya) return;
          setBekle(true);
          await yukle(dosya, null, alt, baslik);
          setDosya(null);
          setAlt("");
          setBaslik("");
          setBekle(false);
        }}
      >
        <Alan etiket="Açıklama (alt metin)">
          <Girdi
            id="g-alt"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Curcuna FC – Hane FC maçından bir kare"
          />
        </Alan>
        <Alan etiket="Dosya">
          <input
            id="g-dosya"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setDosya(e.target.files?.[0] ?? null)}
            className="w-full rounded-sm border border-white/15 bg-[#07200f] px-3 py-2 text-sm text-[#cfe0d5] file:mr-3 file:rounded-sm file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-white"
          />
        </Alan>
        <Dugme type="submit" disabled={!dosya || bekle}>
          {bekle ? "Yükleniyor…" : "Yükle"}
        </Dugme>
        <input type="hidden" value={baslik} onChange={() => setBaslik("")} />
      </form>
    </Panel>
  );
}
