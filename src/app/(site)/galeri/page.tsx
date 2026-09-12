import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Galeri",
  description: "SahaBizim Ligi'nden maç ve tribün kareleri.",
  alternates: { canonical: "/galeri" },
};

import { getGaleri, getIcerik } from "@/lib/veri";

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
  const [kareler, icerik] = await Promise.all([getGaleri(YEDEK), getIcerik()]);
  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-12 md:py-16">
      <p className="eyebrow text-brand">Saha içi</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.4rem)]">Galeri</h1>
      <p className="mt-3 max-w-[60ch] text-muted">{icerik.galeri_metin}</p>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
        {kareler.map((k) => (
          <figure key={k.id} className="relative m-0 aspect-4/3 overflow-hidden rounded">
            <Image
              src={k.url}
              alt={k.alt}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </figure>
        ))}
      </div>
    </div>
  );
}
