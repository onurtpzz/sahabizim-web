/** Sosyal medya bağlantılarını gömme (embed) için ayrıştıran yardımcılar. */

/** YouTube bağlantısından video kimliğini çıkarır. Tanımadığı adreste null döner. */
export function youtubeId(ham: string): string | null {
  try {
    const url = new URL(ham.trim());
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      const parcalar = url.pathname.split("/").filter(Boolean);
      // /shorts/ID, /embed/ID, /live/ID
      if (["shorts", "embed", "live", "v"].includes(parcalar[0])) return parcalar[1] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Instagram gönderi/reel bağlantısını sadeleştirir (izleme parametrelerini atar). */
export function instagramPermalink(ham: string): string | null {
  try {
    const url = new URL(ham.trim());
    if (!url.hostname.replace(/^www\./, "").endsWith("instagram.com")) return null;
    const parcalar = url.pathname.split("/").filter(Boolean);
    const tur = parcalar[0];
    const kod = parcalar[1];
    if (!["p", "reel", "reels", "tv"].includes(tur) || !kod) return null;
    const sadeTur = tur === "reels" ? "reel" : tur;
    return `https://www.instagram.com/${sadeTur}/${kod}/`;
  } catch {
    return null;
  }
}

/** Bağlantının hangi platforma ait olduğunu tahmin eder. */
export function turTahmini(ham: string): "instagram" | "youtube" | null {
  if (youtubeId(ham)) return "youtube";
  if (instagramPermalink(ham)) return "instagram";
  return null;
}
