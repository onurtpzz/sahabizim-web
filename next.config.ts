import type { NextConfig } from "next";

/**
 * .env.local yanlış yazılmışsa site çökmesin: adresi ayrıştıramazsak
 * uzak görsel izni verilmez, site yerel görsellerle çalışmaya devam eder.
 */
function supabaseHostu(): string | undefined {
  const ham = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!ham) return undefined;
  try {
    return new URL(ham.startsWith("http") ? ham : `https://${ham}`).hostname;
  } catch {
    console.warn(
      `NEXT_PUBLIC_SUPABASE_URL okunamadı: "${ham}". Beklenen biçim: https://xxxx.supabase.co`,
    );
    return undefined;
  }
}

const host = supabaseHostu();

const nextConfig: NextConfig = {
  images: {
    // Panelden yüklenen görseller Supabase Storage'dan geliyor.
    remotePatterns: host
      ? [{ protocol: "https", hostname: host, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
