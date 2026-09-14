"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Rakam } from "@/components/admin/ui";
import { kirliDinle, kirliSayisi } from "@/lib/kirli";
import { bekleyenIsler, type BekleyenIsler } from "@/lib/admin-veri";
import { supabase, supabaseHazir } from "@/lib/supabase";

/** `rozet`: menü etiketinin yanında sayı gösterilecekse hangi kalem. */
const MENU: { href: string; label: string; rozet?: keyof BekleyenIsler }[] = [
  { href: "/admin", label: "Özet" },
  { href: "/admin/maclar", label: "Maç & Skor", rozet: "skorsuzMac" },
  { href: "/admin/takimlar", label: "Takımlar" },
  { href: "/admin/puan", label: "Puan Düzeltme" },
  { href: "/admin/duyurular", label: "Duyurular" },
  { href: "/admin/fotograflar", label: "Fotoğraflar", rozet: "fotograf" },
  { href: "/admin/sosyal", label: "Sosyal" },
  { href: "/admin/sezon", label: "Sezon" },
  { href: "/admin/talepler", label: "Talepler", rozet: "talep" },
  { href: "/admin/ayarlar", label: "Ayarlar" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const yol = usePathname();
  const router = useRouter();
  const girisSayfasi = yol === "/admin/giris";
  const [durum, setDurum] = useState<"bekliyor" | "girisli" | "girissiz">("bekliyor");
  const [eposta, setEposta] = useState<string>("");
  const [isler, setIsler] = useState<BekleyenIsler | null>(null);
  const [kirli, setKirli] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const sonOkuma = useRef(0);

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

  /**
   * Kaydedilmemiş değişiklik koruması — üç katman.
   *
   * 1) Menü bağlantıları (aşağıda): tıklamayı kesip soruyor. App Router'da
   *    gezinmeyi iptal edecek bir olay yok, o yüzden tıklamayı kendimiz
   *    yakalıyoruz. HER PLATFORMDA çalışır, mobil dahil.
   * 2) Yapışkan şerit (aşağıda): sayfanın üstünde asılı kalıyor.
   *    Telefonda uzun maç listesinin ortasındayken tek görünen uyarı bu.
   * 3) `beforeunload`: sekmeyi kapatma / yenileme. MASAÜSTÜNE ÖZGÜ —
   *    iOS Safari bu olayı hiç desteklemiyor, Android'de de kullanıcı
   *    uygulama değiştirip tarayıcıyı görev yöneticisinden kapatınca
   *    tetiklenmiyor. Tarayıcıların bilinçli kararı, aşılamıyor; mobilde
   *    işi 1 ve 2 görüyor.
   */
  useEffect(() => kirliDinle(() => setKirli(kirliSayisi())), []);

  useEffect(() => {
    if (!kirli) return;
    function sorgula(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Eski tarayıcılar `returnValue` bekliyor; yenileri preventDefault'a bakıyor.
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", sorgula);
    return () => window.removeEventListener("beforeunload", sorgula);
  }, [kirli]);

  /**
   * Menü telefonda tek satırda yatay kayıyor; aktif sekme ekranın dışında
   * kalmasın diye ortaya alınıyor. `scrollIntoView` yerine elle `scrollLeft`:
   * o yöntem sayfanın kendisini de kaydırıp başlığı kaçırıyordu.
   */
  useEffect(() => {
    const nav = navRef.current;
    const aktif = nav?.querySelector<HTMLElement>('[data-aktif="evet"]');
    if (!nav || !aktif) return;
    nav.scrollLeft = aktif.offsetLeft - nav.clientWidth / 2 + aktif.clientWidth / 2;
  }, [yol, durum]);

  /**
   * Bekleyen iş sayıları. `yol` bağımlılıkta: sayfa değiştikçe tazeleniyor,
   * böylece fotoğrafı onayladıktan sonra rozet kendiliğinden düşüyor.
   * Sekmeye geri dönüldüğünde de yeniden okunuyor.
   */
  useEffect(() => {
    if (durum !== "girisli") return;
    let iptal = false;

    async function oku(zorla = false) {
      // Sekme geçişi panelde en sık yapılan şey; her geçişte 4 istek atmak
      // yerine 30 saniye içinde okunmuşsa tekrar sorulmuyor. Sekmeye geri
      // dönüldüğünde zorla tazeleniyor.
      const simdi = Date.now();
      if (!zorla && simdi - sonOkuma.current < 30_000) return;
      sonOkuma.current = simdi;
      try {
        const i = await bekleyenIsler();
        if (!iptal) setIsler(i);
      } catch {
        /* rozet ikincil bilgi — okunamazsa panel yine de çalışsın */
      }
    }

    oku();
    const odaklan = () => oku(true);
    window.addEventListener("focus", odaklan);
    return () => {
      iptal = true;
      window.removeEventListener("focus", odaklan);
    };
  }, [durum, yol]);

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

  const cikisDugmesi = (
    <>
      <span className="hidden text-sm text-muted-dark lg:inline">{eposta}</span>
      <button
        type="button"
        onClick={async () => {
          await supabase?.auth.signOut();
          router.replace("/admin/giris");
        }}
        className="rounded-sm border border-white/20 px-3 py-1.5 font-[family-name:var(--font-data)] text-xs tracking-wider text-muted-dark uppercase hover:border-lose hover:text-[#ff9a8f]"
      >
        Çıkış
      </button>
    </>
  );

  return (
    <Kabuk sag={cikisDugmesi}>
      {/*
        Telefonda menü tek satırda yatay kayıyor. Sarmalı (flex-wrap) bırakmıştık
        ama 10 sekme dört düzensiz satıra yayılıp ekranın üçte birini yiyordu.
        Masaüstünde (sm ve üstü) eski sarmalı düzen sürüyor.
      */}
      <div className="relative -mx-5 mb-6 sm:mx-0">
        <nav
          ref={navRef}
          aria-label="Yönetim menüsü"
          className="flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-x-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {MENU.map((m) => {
            const aktif = m.href === "/admin" ? yol === "/admin" : yol.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                data-aktif={aktif ? "evet" : "hayir"}
                aria-current={aktif ? "page" : undefined}
                onClick={(e) => {
                  if (m.href === yol || !kirli) return;
                  const devam = window.confirm(
                    `Kaydedilmemiş ${kirli} değişiklik var. Sayfadan çıkarsan kaybolur.\n\nYine de çıkılsın mı?`,
                  );
                  if (!devam) e.preventDefault();
                }}
                className={`flex-none rounded-sm border px-3.5 py-2 font-[family-name:var(--font-data)] text-sm font-semibold tracking-wider whitespace-nowrap uppercase transition ${
                  aktif
                    ? "border-brand bg-ink-3 text-white"
                    : "border-white/12 text-muted-dark hover:text-white"
                }`}
              >
                {m.label}
                {m.rozet && <Rakam sayi={isler?.[m.rozet] ?? 0} />}
              </Link>
            );
          })}
        </nav>
        {/* Sağ kenarda solma: daha fazla sekme olduğunu belli ediyor. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink-2 to-transparent sm:hidden"
        />
      </div>

      {/* Yapışkan: telefonda uzun listenin ortasındayken de görünür kalsın.
          Sayfanın en üstünde duran bir uyarı, kaydırınca kayboluyordu. */}
      {kirli > 0 && (
        <p className="sticky top-0 z-30 -mx-5 mb-5 flex items-center gap-2 border-y border-gold/50 bg-[#2a2109] px-5 py-3 text-sm text-[#f2e7c4] shadow-[0_6px_16px_rgba(0,0,0,0.35)] sm:mx-0 sm:rounded sm:border-x">
          <span aria-hidden className="text-gold">
            ●
          </span>
          <span>
            <strong>Kaydedilmemiş {kirli} değişiklik var.</strong>{" "}
            <span className="hidden sm:inline">
              İlgili satırdaki <strong>Kaydet</strong> düğmesine basmadan sayfadan ayrılma.
            </span>
            <span className="sm:hidden">Sarı çizgili satırdaki Kaydet&apos;e bas.</span>
          </span>
        </p>
      )}

      {children}
    </Kabuk>
  );
}

/**
 * `sag`: başlık çubuğunun sağına giren içerik (e-posta + Çıkış).
 * Çıkış eskiden menü satırındaydı ve telefonda tek başına bir satır kaplıyordu;
 * hesapla ilgili bir düğme olduğu için yeri zaten burası.
 */
function Kabuk({ children, sag }: { children: React.ReactNode; sag?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-2 text-white">
      <header className="border-b border-white/12 bg-ink">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-5 py-3.5 sm:py-4">
          <Link href="/admin" className="display text-lg text-white sm:text-xl">
            SahaBizim <span className="text-gold">Yönetim</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="font-[family-name:var(--font-data)] text-sm tracking-wider text-muted-dark uppercase hover:text-white"
            >
              <span className="hidden sm:inline">Siteyi gör →</span>
              <span className="sm:hidden">Site →</span>
            </Link>
            {sag}
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1180px] px-5 py-8">{children}</div>
    </div>
  );
}
