"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FotoBuyutec, type BuyutecFoto } from "@/components/foto-buyutec";

export type GaleriKaresi = BuyutecFoto & {
  alt: string;
  takimAd?: string | null;
  takimSlug?: string | null;
};

/** Galeri ızgarası — kareye tıklayınca büyüteç açılır. */
export function GaleriIzgara({ kareler }: { kareler: GaleriKaresi[] }) {
  const [sira, setSira] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {kareler.map((k, i) => (
          <li key={k.id}>
            <figure className="foto-hover relative m-0 overflow-hidden rounded">
              <button
                type="button"
                onClick={() => setSira(i)}
                aria-label={`${i + 1}. fotoğrafı büyüt`}
                className="relative block aspect-4/3 w-full cursor-zoom-in"
              >
                <Image
                  src={k.url}
                  alt={k.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </button>

              {k.takimAd && k.takimSlug && (
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/85 to-transparent px-3 pt-8 pb-2.5">
                  <Link
                    href={`/takim/${k.takimSlug}`}
                    className="pointer-events-auto font-[family-name:var(--font-data)] text-[13px] font-bold tracking-wide text-white uppercase hover:text-brand-lite"
                  >
                    {k.takimAd}
                  </Link>
                </figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>

      <FotoBuyutec fotograflar={kareler} sira={sira} setSira={setSira} />
    </>
  );
}
