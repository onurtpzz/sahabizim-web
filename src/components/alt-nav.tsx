"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAnasayfayaDon } from "@/lib/anasayfaya-don";

/**
 * Mobilde ekranın altına sabitlenen kısayol çubuğu. Masaüstünde gizli
 * (`lg:hidden`) — orada üstteki menü zaten var.
 *
 * Dokunma hedefleri 44px'in üzerinde; `env(safe-area-inset-bottom)` ile
 * iPhone'un alt çubuğunun altında kalmaz.
 */

type Sekme = { href: string; etiket: string; ikon: React.ReactNode };

const cizgi = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const SEKMELER: Sekme[] = [
  {
    href: "/",
    etiket: "Anasayfa",
    ikon: (
      <svg viewBox="0 0 24 24" aria-hidden {...cizgi}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V20h13V9.5" />
        <path d="M9.5 20v-5.5h5V20" />
      </svg>
    ),
  },
  {
    href: "/puan-durumu",
    etiket: "Puan Durumu",
    ikon: (
      <svg viewBox="0 0 24 24" aria-hidden {...cizgi}>
        <path d="M4 20V10.5h4V20" />
        <path d="M10 20V4h4v16" />
        <path d="M16 20v-6.5h4V20" />
        <path d="M3 20h18" />
      </svg>
    ),
  },
  {
    href: "/fikstur",
    etiket: "Fikstür",
    ikon: (
      <svg viewBox="0 0 24 24" aria-hidden {...cizgi}>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17M8 3.5V6.5M16 3.5V6.5" />
        <path d="M7.5 13h3M13.5 13h3M7.5 16.5h3" />
      </svg>
    ),
  },
  {
    href: "/iletisim",
    etiket: "İletişim",
    ikon: (
      <svg viewBox="0 0 24 24" aria-hidden {...cizgi}>
        <path d="M5 4.5h3.2l1.6 4-2 1.3a11.5 11.5 0 0 0 5.4 5.4l1.3-2 4 1.6V19a1.5 1.5 0 0 1-1.6 1.5C9.6 20 4 14.4 3.5 6.1A1.5 1.5 0 0 1 5 4.5Z" />
      </svg>
    ),
  },
];

export function AltNav() {
  const yol = usePathname();
  const anasayfayaDon = useAnasayfayaDon();

  return (
    <nav
      aria-label="Hızlı gezinme"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/12 bg-ink/97 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-[520px] grid-cols-4">
        {SEKMELER.map((s) => {
          const aktif = s.href === "/" ? yol === "/" : yol.startsWith(s.href);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                onClick={s.href === "/" ? anasayfayaDon : undefined}
                aria-current={aktif ? "page" : undefined}
                className={`neon-sekme flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 pt-2 pb-1.5 transition-colors ${
                  aktif ? "text-brand-lite" : "text-[#9cb5a4]"
                }`}
              >
                <span className="neon-ikon grid h-6 w-6 place-items-center">
                  {s.ikon}
                </span>
                <span className="font-[family-name:var(--font-data)] text-[10.5px] font-semibold uppercase tracking-[0.08em]">
                  {s.etiket}
                </span>
                <span aria-hidden className="neon-cizgi h-[2px] w-7 rounded-full bg-brand-lite" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
