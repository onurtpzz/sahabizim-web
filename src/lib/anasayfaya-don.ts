"use client";

import { usePathname, useRouter } from "next/navigation";

/**
 * Logo ve alt çubuktaki "Anasayfa" için tıklama davranışı.
 *
 *   Başka sayfadayken → normal gezinme (Next sayfanın başından açar).
 *   Zaten anasayfadayken → sayfa başına yumuşak kaydır + veriyi tazele
 *     (`router.refresh()`: sunucudan güncel skor/duyuru gelir, sayfa beyaz
 *     ekranla baştan yüklenmez, kaydırma ve menü durumu bozulmaz).
 */
export function useAnasayfayaDon(ekIs?: () => void) {
  const yol = usePathname();
  const router = useRouter();

  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    ekIs?.();
    // Yeni sekmede açma (Ctrl/Cmd/orta tık) tarayıcıya kalsın.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (yol !== "/") return;
    e.preventDefault();
    const hareketsiz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: hareketsiz ? "auto" : "smooth" });
    router.refresh();
  };
}
