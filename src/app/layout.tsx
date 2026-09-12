import type { Metadata } from "next";
import { Anton, Manrope, Barlow_Semi_Condensed } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const anton = Anton({
  weight: "400",
  subsets: ["latin-ext"],
  variable: "--font-anton",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

const barlow = Barlow_Semi_Condensed({
  weight: ["500", "600", "700"],
  subsets: ["latin-ext"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.ad} Ligi — Puan Durumu ve Fikstür`,
    template: `%s · ${SITE.ad}`,
  },
  description: SITE.aciklama,
  keywords: [
    "sahabizim",
    "halı saha ligi",
    "puan durumu",
    "fikstür",
    "İstanbul halı saha",
    "amatör lig",
  ],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE.url,
    siteName: SITE.ad,
    title: `${SITE.ad} Ligi — Puan Durumu ve Fikstür`,
    description: SITE.aciklama,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${anton.variable} ${manrope.variable} ${barlow.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
