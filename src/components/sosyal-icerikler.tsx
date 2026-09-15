"use client";

import { useEffect } from "react";
import { instagramPermalink, youtubeId } from "@/lib/sosyal";
import type { SosyalIcerik } from "@/lib/veri";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

/**
 * Instagram gönderileri ve YouTube videoları tek ızgarada.
 *
 * Instagram gömmesi kendi yüksekliğini belirler (beğeni/yorum şeridi dahil);
 * ızgara `auto-rows-fr` ile bütün satırları eşitler, YouTube kartı da
 * `h-full` ile aynı yüksekliğe uzar. Böylece sabit bir piksel değeri
 * uydurmadan iki tür de aynı boyda görünür.
 */
export function SosyalIcerikler({ icerikler }: { icerikler: SosyalIcerik[] }) {
  const instagramVar = icerikler.some((i) => i.tur === "instagram");

  useEffect(() => {
    if (!instagramVar) return;

    const islet = () => window.instgrm?.Embeds.process();

    if (window.instgrm) {
      islet();
      return;
    }

    const mevcut = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.instagram.com/embed.js"]',
    );
    if (mevcut) {
      mevcut.addEventListener("load", islet);
      return () => mevcut.removeEventListener("load", islet);
    }

    const betik = document.createElement("script");
    betik.src = "https://www.instagram.com/embed.js";
    betik.async = true;
    betik.onload = islet;
    document.body.appendChild(betik);
  }, [instagramVar, icerikler.length]);

  if (icerikler.length === 0) return null;

  return (
    <ul className="grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
      {icerikler.map((i) => (
        <li key={i.id} className="min-w-0">
          {i.tur === "youtube" ? <YoutubeKart icerik={i} /> : <InstagramKart icerik={i} />}
        </li>
      ))}
    </ul>
  );
}

function YoutubeKart({ icerik }: { icerik: SosyalIcerik }) {
  const id = youtubeId(icerik.url);
  if (!id) return null;
  return (
    <figure className="kart-golge m-0 flex h-full flex-col overflow-hidden rounded border border-line bg-white">
      <div className="grid flex-1 place-items-center bg-black">
        <div className="relative aspect-video w-full">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title={icerik.baslik ?? "SahaBizim YouTube videosu"}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
      <figcaption className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-4 py-3">
        <p className="truncate font-[family-name:var(--font-data)] text-[15px] font-semibold">
          {icerik.baslik ?? "YouTube videosu"}
        </p>
        <a
          href={icerik.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider text-brand hover:underline"
        >
          YouTube&apos;da aç <span aria-hidden className="ok">→</span>
        </a>
      </figcaption>
    </figure>
  );
}

function InstagramKart({ icerik }: { icerik: SosyalIcerik }) {
  const permalink = instagramPermalink(icerik.url);
  if (!permalink) return null;

  return (
    <div className="ig-kutu h-full overflow-hidden rounded border border-line bg-white">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
        style={{
          background: "#fff",
          border: 0,
          borderRadius: 0,
          boxShadow: "none",
          margin: 0,
          maxWidth: "100%",
          minWidth: 0,
          padding: 0,
          width: "100%",
        }}
      >
        <a href={permalink} target="_blank" rel="noopener noreferrer">
          {icerik.baslik ?? "Instagram gönderisini gör"}
        </a>
      </blockquote>
    </div>
  );
}
