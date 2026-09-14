"use client";

import { useEffect, useState } from "react";
import { Alan, BosDurum, Dugme, Girdi, Panel, Uyari } from "@/components/admin/ui";
import {
  ayarKaydet,
  ayarlariGetir,
  dosyaYukle,
  gorselEkle,
  gorselGuncelle,
  gorselSil,
  gorselleriGetir,
  siradaTasi,
  type GorselKaydi,
} from "@/lib/admin-veri";

type Bildir = (m: { tur: "basari" | "hata"; metin: string }) => void;

/**
 * Site galerisi — yükleme formu, "hazır gelen fotoğraflar" anahtarı ve galeri
 * ızgarası.
 *
 * Eskiden ayrı bir "Görseller" sekmesindeydi; menü kalabalıklaştığı için
 * Fotoğraflar sekmesine taşındı. Sabit yerleşimli site görselleri ise
 * `SabitGorseller` bileşeninde, Ayarlar'ın en altında duruyor.
 */
export function GaleriYonetimi({ bildir }: { bildir: Bildir }) {
  const [kayitlar, setKayitlar] = useState<GorselKaydi[]>([]);
  const [varsayilanlar, setVarsayilanlar] = useState(true);

  async function yenile() {
    try {
      setKayitlar(await gorselleriGetir());
      const ayarlar = await ayarlariGetir();
      const a = ayarlar.find((x) => x.anahtar === "varsayilan_gorseller");
      if (a) setVarsayilanlar(a.deger !== "hayir");
    } catch (e) {
      bildir({ tur: "hata", metin: e instanceof Error ? e.message : "Galeri okunamadı." });
    }
  }

  useEffect(() => {
    yenile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function yukle(dosya: File, alt: string) {
    try {
      const url = await dosyaYukle(dosya, "galeri");
      await gorselEkle({ url, slot: null, albom: null, alt_metin: alt, baslik: null });
      bildir({ tur: "basari", metin: "Görsel galeriye eklendi." });
      await yenile();
    } catch (e) {
      bildir({ tur: "hata", metin: e instanceof Error ? e.message : "Yüklenemedi." });
    }
  }

  async function siraDegistir(g: GorselKaydi, yon: -1 | 1) {
    try {
      await siradaTasi(galeri, g.id, yon, (id, d) => gorselGuncelle(id, d));
      await yenile();
    } catch (e) {
      bildir({ tur: "hata", metin: e instanceof Error ? e.message : "Sıra değiştirilemedi." });
    }
  }

  async function gizleGoster(g: GorselKaydi) {
    try {
      await gorselGuncelle(g.id, { yayinda: !g.yayinda });
      await yenile();
    } catch (e) {
      bildir({ tur: "hata", metin: e instanceof Error ? e.message : "Değiştirilemedi." });
    }
  }

  async function varsayilanDegistir(yeni: boolean) {
    const eski = varsayilanlar;
    setVarsayilanlar(yeni);
    try {
      await ayarKaydet("varsayilan_gorseller", yeni ? "evet" : "hayir");
      bildir({
        tur: "basari",
        metin: yeni
          ? "Hazır fotoğraflar, galeri boşken gösterilecek."
          : "Hazır fotoğraflar tamamen kapatıldı.",
      });
    } catch (e) {
      // Kaydedilemediyse kutuyu eski hâline döndür, yoksa kaydedilmiş sanılıyor.
      setVarsayilanlar(eski);
      bildir({ tur: "hata", metin: e instanceof Error ? e.message : "Kaydedilemedi." });
    }
  }

  async function sil(g: GorselKaydi) {
    if (!window.confirm("Bu görsel galeriden kaldırılsın mı?")) return;
    try {
      await gorselSil(g.id);
      await yenile();
    } catch (e) {
      bildir({ tur: "hata", metin: e instanceof Error ? e.message : "Silinemedi." });
    }
  }

  /**
   * Panelde de sitedeki sırayla göster. `gorselleriGetir` yüklenme tarihine
   * göre getiriyor; ok düğmeleri `sira` alanını değiştirdiği için ikisi
   * uyuşmuyor ve düğmeler hiçbir şey yapmıyormuş gibi görünüyordu.
   */
  const galeri = kayitlar
    .filter((g) => !g.slot)
    .sort((a, b) => a.sira - b.sira || a.olusturuldu.localeCompare(b.olusturuldu));

  return (
    <div className="grid gap-6">
      <GaleriYukle yukle={yukle} />

      <Panel baslik="Galeri" sag={`${galeri.length} görsel`}>
        {galeri.length === 0 ? (
          <BosDurum
            simge="🖼"
            baslik="Galeri boş"
            metin="Site şimdilik hazır gelen örnek fotoğrafları gösteriyor. Yukarıdan kendi karelerini yükleyince onlar kendiliğinden kaybolur."
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
            {galeri.map((g, sira) => (
              <li key={g.id} className="overflow-hidden rounded border border-white/12">
                <div className="relative aspect-4/3 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.url}
                    alt={g.alt_metin}
                    className={`h-full w-full object-cover ${g.yayinda ? "" : "opacity-35"}`}
                  />
                  {!g.yayinda && (
                    <span className="absolute top-2 left-2 rounded-sm bg-black/70 px-2 py-0.5 text-[11px] uppercase tracking-wider text-white/70">
                      Gizli
                    </span>
                  )}
                </div>
                <div className="grid gap-2 p-2.5">
                  <p className="truncate text-xs text-muted-dark">
                    {g.alt_metin || "Açıklama yok"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => siraDegistir(g, -1)}
                      aria-label="Öne al"
                      disabled={sira === 0}
                      className="rounded-sm border border-white/20 px-2 py-1.5 text-xs text-[#cfe0d5] hover:border-brand-lite hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => siraDegistir(g, 1)}
                      aria-label="Geri al"
                      disabled={sira === galeri.length - 1}
                      className="rounded-sm border border-white/20 px-2 py-1.5 text-xs text-[#cfe0d5] hover:border-brand-lite hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      onClick={() => gizleGoster(g)}
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

      <Panel baslik="Hazır gelen fotoğraflar">
        <div className="grid gap-3 p-4">
          <label className="flex items-start gap-3 text-sm text-[#cfe0d5]">
            <input
              id="varsayilanlar"
              type="checkbox"
              checked={varsayilanlar}
              onChange={(e) => varsayilanDegistir(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              Galeri boşken hazır gelen örnek fotoğraflar gösterilsin.
              <span className="mt-1 block text-muted-dark">
                Kendi fotoğraflarını yüklediğin anda hazır olanlar zaten kaybolur. Bu kutunun
                işaretini kaldırırsan galeri, hiç fotoğraf yokken de tamamen boş kalır.
              </span>
            </span>
          </label>
        </div>
      </Panel>

      <Uyari>
        Görseller JPG, PNG veya WebP olmalı; dosya başına 2 MB&apos;ı geçmemeye çalış.
        Açıklama (alt metin) yazmak hem görme engelliler hem Google için önemli.
      </Uyari>
    </div>
  );
}

function GaleriYukle({ yukle }: { yukle: (d: File, alt: string) => Promise<void> }) {
  const [alt, setAlt] = useState("");
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
          await yukle(dosya, alt);
          setDosya(null);
          setAlt("");
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
      </form>
    </Panel>
  );
}
