"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SITE } from "@/lib/site";

const MENU = [
  { href: "/puan-durumu", label: "Puan Durumu" },
  { href: "/fikstur", label: "Fikstür" },
  { href: "/kurallar-ve-duyurular", label: "Duyurular" },
  { href: "/galeri", label: "Galeri" },
  { href: "/biz-kimiz", label: "Biz Kimiz" },
  { href: "/iletisim", label: "İletişim" },
];

export function SiteHeader() {
  const [acik, setAcik] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/15 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex h-[70px] w-full max-w-[1180px] items-center gap-4 px-5">
        <Link href="/" className="flex flex-none items-center gap-3 text-white">
          <Image
            src="/images/logo.png"
            alt="SahaBizim logosu"
            width={44}
            height={44}
            priority
            className="h-11 w-11 object-contain"
          />
          <span className="leading-none">
            <span className="display block text-xl text-white">{SITE.ad}</span>
            <span className="font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.3em] text-gold">
              {SITE.slogan}
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 lg:flex">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="border-b-2 border-transparent py-1.5 font-[family-name:var(--font-data)] text-base font-semibold uppercase tracking-wider text-[#d8e6dc] transition-colors hover:border-brand-lite hover:text-white"
            >
              {m.label}
            </Link>
          ))}
          <Link
            href="/katil"
            className="rounded-sm bg-brand px-4 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider text-white transition hover:bg-brand-lite hover:text-ink"
          >
            Aramıza Katıl
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setAcik((v) => !v)}
          aria-expanded={acik}
          aria-controls="mobil-menu"
          className="ml-auto rounded-sm border border-white/20 px-3 py-2 text-white lg:hidden"
        >
          <span className="sr-only">Menü</span>
          <span aria-hidden>{acik ? "✕" : "≡"}</span>
        </button>
      </div>

      {acik && (
        <nav
          id="mobil-menu"
          className="border-t border-white/10 bg-ink px-5 pb-5 lg:hidden"
        >
          <ul className="grid gap-1 py-2">
            {MENU.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  onClick={() => setAcik(false)}
                  className="block rounded-sm px-2 py-3 font-[family-name:var(--font-data)] text-lg font-semibold uppercase tracking-wide text-[#d8e6dc] hover:bg-white/5 hover:text-white"
                >
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/katil"
            onClick={() => setAcik(false)}
            className="block rounded-sm bg-brand px-4 py-3 text-center font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-white"
          >
            Aramıza Katıl
          </Link>
        </nav>
      )}
    </header>
  );
}
