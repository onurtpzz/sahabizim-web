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

  // Open Graph görselleri fontlarını `src/og-fontlari/` içinden dosya olarak
  // okuyor. Vercel'de sunucusuz pakete dahil edilmeleri için açıkça bildiriliyor;
  // aksi halde sayfa yeniden üretilirken font bulunamaz.
  outputFileTracingIncludes: {
    "/**": ["./src/og-fontlari/**"],
  },

  // Service worker ve manifestler önbelleğe takılmasın: güncelleme telefonlara
  // ancak tarayıcı yeni sw.js'i görünce ulaşır.
  async headers() {
    const tazeKal = [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }];
    return [
      { source: "/sw.js", headers: [...tazeKal, { key: "Service-Worker-Allowed", value: "/" }] },
      { source: "/manifest.webmanifest", headers: tazeKal },
      { source: "/admin.webmanifest", headers: tazeKal },
    ];
  },
};

export default nextConfig;
