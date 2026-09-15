"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const yol = usePathname();
  const aktifMi = (href: string) => yol === href || yol.startsWith(`${href}/`);

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
              aria-current={aktifMi(m.href) ? "page" : undefined}
              className="neon-link py-1.5 font-[family-name:var(--font-data)] text-base font-semibold uppercase tracking-wider text-[#d8e6dc]"
            >
              {m.label}
            </Link>
          ))}
          <Link
            href="/katil"
            className="neon-dugme rounded-sm bg-brand px-4 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider text-white transition hover:bg-brand-lite hover:text-ink"
          >
            Aramıza Katıl
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setAcik((v) => !v)}
          aria-expanded={acik}
          aria-controls="mobil-menu"
          className={`ml-auto grid h-11 w-11 place-items-center rounded-sm border transition-[border-color,box-shadow] duration-300 lg:hidden ${
            acik
              ? "border-brand-lite shadow-[0_0_12px_rgb(74_222_128/0.45)]"
              : "border-white/20"
          }`}
        >
          <span className="sr-only">Menü</span>
          {/* Üç çizgi → çarpı; açıkken çizgiler neon yeşile döner */}
          <span aria-hidden className="relative block h-3.5 w-5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`absolute left-0 block h-[2px] w-5 rounded-full transition-all duration-300 ${
                  acik ? "bg-brand-lite shadow-[0_0_6px_rgb(74_222_128/0.8)]" : "bg-white"
                } ${
                  i === 0
                    ? acik
                      ? "top-1.5 rotate-45"
                      : "top-0"
                    : i === 1
                      ? acik
                        ? "top-1.5 scale-x-0 opacity-0"
                        : "top-1.5"
                      : acik
                        ? "top-1.5 -rotate-45"
                        : "top-3"
                }`}
              />
            ))}
          </span>
        </button>
      </div>

      {/*
        Menü her zaman DOM'da; açılıp kapanma `grid-rows 0fr → 1fr` ile yumuşak.
        Kapalıyken `inert`: klavye ve ekran okuyucu görünmeyen bağlantılara girmesin.
      */}
      <div
        id="mobil-menu"
        inert={!acik}
        className={`grid transition-[grid-template-rows] duration-300 ease-out lg:hidden ${
          acik ? "menu-acik grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <nav aria-label="Ana menü" className="overflow-hidden">
          <div className="border-t border-brand-lite/25 bg-ink px-5 pb-5 shadow-[inset_0_1px_0_rgb(74_222_128/0.15)]">
            <ul className="grid gap-1 py-2">
              {MENU.map((m, i) => (
                <li key={m.href} className="menu-madde" style={{ "--sira": i } as React.CSSProperties}>
                  <Link
                    href={m.href}
                    onClick={() => setAcik(false)}
                    aria-current={aktifMi(m.href) ? "page" : undefined}
                    className="neon-satir block rounded-sm px-2 py-3 font-[family-name:var(--font-data)] text-lg font-semibold uppercase tracking-wide text-[#d8e6dc]"
                  >
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/katil"
              onClick={() => setAcik(false)}
              className="menu-madde neon-dugme block rounded-sm bg-brand px-4 py-3 text-center font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-white active:shadow-[0_0_0_1px_var(--color-brand-lite),0_0_18px_rgb(74_222_128/0.6)]"
              style={{ "--sira": MENU.length } as React.CSSProperties}
            >
              Aramıza Katıl
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
