"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase, supabaseHazir } from "@/lib/supabase";

const MENU = [
  { href: "/admin", label: "Özet" },
  { href: "/admin/maclar", label: "Maç & Skor" },
  { href: "/admin/takimlar", label: "Takımlar" },
  { href: "/admin/puan", label: "Puan Düzeltme" },
  { href: "/admin/duyurular", label: "Duyurular" },
  { href: "/admin/fotograflar", label: "Fotoğraflar" },
  { href: "/admin/gorseller", label: "Görseller" },
  { href: "/admin/sosyal", label: "Sosyal" },
  { href: "/admin/sezon", label: "Sezon" },
  { href: "/admin/talepler", label: "Talepler" },
  { href: "/admin/ayarlar", label: "Ayarlar" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const yol = usePathname();
  const router = useRouter();
  const girisSayfasi = yol === "/admin/giris";
  const [durum, setDurum] = useState<"bekliyor" | "girisli" | "girissiz">("bekliyor");
  const [eposta, setEposta] = useState<string>("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setEposta(data.session?.user.email ?? "");
      setDurum(data.session ? "girisli" : "girissiz");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_olay, oturum) => {
      setEposta(oturum?.user.email ?? "");
      setDurum(oturum ? "girisli" : "girissiz");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (durum === "girissiz" && !girisSayfasi) router.replace("/admin/giris");
  }, [durum, girisSayfasi, router]);

  if (!supabaseHazir) {
    return (
      <Kabuk>
        <p className="rounded border border-lose/50 bg-lose/10 px-4 py-3 text-sm text-[#ffd7d2]">
          Supabase bağlantısı yapılandırılmamış. <code>.env.local</code> dosyasını kontrol et.
        </p>
      </Kabuk>
    );
  }

  if (girisSayfasi) return <Kabuk>{children}</Kabuk>;

  if (durum !== "girisli") {
    return (
      <Kabuk>
        <p className="text-[#cfe0d5]">Yükleniyor…</p>
      </Kabuk>
    );
  }

  return (
    <Kabuk>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <nav className="flex flex-wrap gap-1.5">
          {MENU.map((m) => {
            const aktif = m.href === "/admin" ? yol === "/admin" : yol.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`rounded-sm border px-3.5 py-2 font-[family-name:var(--font-data)] text-sm font-semibold uppercase tracking-wider transition ${
                  aktif
                    ? "border-brand bg-ink-3 text-white"
                    : "border-white/12 text-muted-dark hover:text-white"
                }`}
              >
                {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-muted-dark">
          <span className="hidden sm:inline">{eposta}</span>
          <button
            type="button"
            onClick={async () => {
              await supabase?.auth.signOut();
              router.replace("/admin/giris");
            }}
            className="rounded-sm border border-white/20 px-3 py-1.5 font-[family-name:var(--font-data)] text-xs uppercase tracking-wider hover:border-lose hover:text-[#ff9a8f]"
          >
            Çıkış
          </button>
        </div>
      </div>
      {children}
    </Kabuk>
  );
}

function Kabuk({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-2 text-white">
      <header className="border-b border-white/12 bg-ink">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-5 py-4">
          <Link href="/admin" className="display text-xl text-white">
            SahaBizim <span className="text-gold">Yönetim</span>
          </Link>
          <Link
            href="/"
            className="ml-auto font-[family-name:var(--font-data)] text-sm uppercase tracking-wider text-muted-dark hover:text-white"
          >
            Siteyi gör →
          </Link>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1180px] px-5 py-8">{children}</div>
    </div>
  );
}
