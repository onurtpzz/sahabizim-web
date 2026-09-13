import type { Metadata } from "next";
import { GaleriIzgara, type GaleriKaresi } from "@/components/galeri-izgara";
import { getGaleri, getIcerik, getOnayliTakimFotograflari } from "@/lib/veri";

export const metadata: Metadata = {
  title: "Galeri",
  description:
    "SahaBizim Ligi'nden maç ve tribün kareleri; takımların kendi sayfalarından gönderdiği fotoğraflar.",
  alternates: { canonical: "/galeri" },
};

export const revalidate = 60;

const YEDEK = [
  { id: "1", url: "/images/saha-dumani.jpg", alt: "Işıklar altında saha", baslik: null, album: null },
  { id: "2", url: "/images/tribun.jpg", alt: "Tribünde atkılar", baslik: null, album: null },
  { id: "3", url: "/images/gece-maci.jpg", alt: "Gece maçı", baslik: null, album: null },
  { id: "4", url: "/images/taraftar.jpg", alt: "Taraftarlar", baslik: null, album: null },
  { id: "5", url: "/images/atki.jpg", alt: "Atkısını kaldıran taraftar", baslik: null, album: null },
  { id: "6", url: "/images/atkilar.jpg", alt: "Havada atkılar", baslik: null, album: null },
];

export default async function GaleriSayfasi() {
  const [kareler, icerik, takimKareleri] = await Promise.all([
    getGaleri(YEDEK),
    getIcerik(),
    getOnayliTakimFotograflari(60),
  ]);

  const genel: GaleriKaresi[] = kareler.map((k) => ({
    id: k.id,
    url: k.url,
    alt: k.alt,
    baslik: k.baslik ?? k.alt,
  }));

  const takimlardan: GaleriKaresi[] = takimKareleri.map((f) => ({
    id: f.id,
    url: f.url,
    alt: f.aciklama ?? `${f.takimAd} fotoğrafı`,
    baslik: f.aciklama ?? f.takimAd,
    altBilgi: f.yukleyen_ad ? `${f.takimAd} · Ekleyen: ${f.yukleyen_ad}` : f.takimAd,
    takimAd: f.takimAd,
    takimSlug: f.takimSlug,
  }));

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-12 md:py-16">
      <p className="eyebrow text-brand">Saha içi</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.4rem)]">Galeri</h1>
      <p className="mt-3 max-w-[60ch] text-muted">{icerik.galeri_metin}</p>

      {genel.length > 0 && (
        <div className="mt-8">
          <GaleriIzgara kareler={genel} />
        </div>
      )}

      {takimlardan.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-gold">Takımlardan</p>
              <h2 className="display text-[clamp(1.6rem,4.5vw,2.4rem)]">Sahadan gelenler</h2>
            </div>
            <p className="max-w-[42ch] text-sm text-muted">
              Takım sayfalarından gönderilen ve yayına alınan kareler.
            </p>
          </div>
          <GaleriIzgara kareler={takimlardan} />
        </section>
      )}
    </div>
  );
}
