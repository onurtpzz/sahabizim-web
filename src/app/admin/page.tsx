"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Iskelet, Panel, Uyari } from "@/components/admin/ui";
import { Sayac } from "@/components/sayac";
import {
  aktifSezon,
  bekleyenIsler,
  sezonSayilari,
  takimlariGetir,
  type BekleyenIsler,
} from "@/lib/admin-veri";

type SunucuDurumu =
  | { hazir: true; takim: number; mac: number; sezon: string | null }
  | { hazir: false; sebep: string; mesaj: string };

/**
 * Sunucunun veritabanını görüp görmediğini gösteren şerit.
 * Görmüyorsa site yedek veriyle çalışıyor demektir — sayfalar normal
 * görünür ama rakamlar güncellenmez. Sessiz kalmasın diye buraya kondu.
 */
function BaglantiSeridi({ durum }: { durum: SunucuDurumu | null }) {
  if (!durum) return null;

  if (durum.hazir) {
    return (
      <p className="rounded border border-brand/40 bg-brand/8 px-4 py-3 text-sm text-[#cfe0d5]">
        <strong className="text-brand-lite">Bağlantı iyi.</strong> Sitenin gördüğü
        veritabanı: {durum.takim} takım · {durum.mac} maç
        {durum.sezon ? ` · aktif sezon ${durum.sezon}` : " · aktif sezon yok"}.
      </p>
    );
  }

  return (
    <div className="rounded border-l-[3px] border border-lose/60 border-l-lose bg-lose/10 px-4 py-4 text-[#ffd7d2]">
      <p className="font-[family-name:var(--font-data)] text-base font-bold tracking-wide uppercase">
        Dikkat · Site yedek veriyle çalışıyor
      </p>
      <p className="mt-2 text-sm">
        Ziyaretçiye açık sayfalar (puan durumu, fikstür, takım sayfaları) şu anda
        veritabanını okuyamıyor; eski, sabit listeyi gösteriyorlar. Sayfalar normal
        görünür ama <strong>girdiğin skorlar sitede görünmez</strong>.
      </p>
      <p className="mt-2 text-sm opacity-80">{durum.mesaj}</p>
      {durum.sebep === "ortam-degiskeni-yok" && (
        <ol className="mt-3 grid list-decimal gap-1 pl-5 text-sm">
          <li>
            Vercel → proje → <strong>Settings → Environment Variables</strong>
          </li>
          <li>
            <code>NEXT_PUBLIC_SUPABASE_URL</code> ve{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> değerlerini{" "}
            <code>web/.env.local</code> dosyasındakiyle birebir aynı gir
          </li>
          <li>
            <strong>Deployments → ⋯ → Redeploy</strong> — bu değerler derleme
            sırasında gömüldüğü için yeniden dağıtım şart
          </li>
        </ol>
      )}
    </div>
  );
}

export default function AdminOzet() {
  const [sayilar, setSayilar] = useState<{
    sezon: string;
    takim: number;
    aktifTakim: number;
    oynanan: number;
    bekleyen: number;
  } | null>(null);
  const [isler, setIsler] = useState<BekleyenIsler | null>(null);
  const [hata, setHata] = useState("");
  const [sunucu, setSunucu] = useState<SunucuDurumu | null>(null);

  useEffect(() => {
    fetch("/api/durum", { cache: "no-store" })
      .then((r) => r.json())
      .then(setSunucu)
      .catch(() =>
        setSunucu({
          hazir: false,
          sebep: "ulasilamadi",
          mesaj: "Sunucu durum adresine ulaşılamadı.",
        }),
      );
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const sezon = await aktifSezon();
        const [takimlar, mac, bekleyenler] = await Promise.all([
          takimlariGetir(),
          sezon ? sezonSayilari(sezon.id) : Promise.resolve({ oynanan: 0, sirada: 0 }),
          bekleyenIsler(),
        ]);
        setIsler(bekleyenler);
        setSayilar({
          sezon: sezon?.ad ?? "Aktif sezon yok",
          takim: takimlar.length,
          aktifTakim: takimlar.filter((t) => t.aktif).length,
          oynanan: mac.oynanan,
          bekleyen: mac.sirada,
        });
      } catch (e) {
        setHata(e instanceof Error ? e.message : "Veriler okunamadı.");
      }
    })();
  }, []);

  if (hata) {
    return (
      <div className="grid gap-4">
        <BaglantiSeridi durum={sunucu} />
        <Uyari tur="hata">
          {hata} — SQL dosyalarını Supabase&apos;de çalıştırdığından emin ol.
        </Uyari>
      </div>
    );
  }

  if (!sayilar) return <Iskelet satir={3} />;

  const kutular = [
    {
      l: "Takım",
      v: (
        <>
          <Sayac hedef={sayilar.aktifTakim} />
          <span className="text-muted-dark">/{sayilar.takim}</span>
        </>
      ),
      alt: "aktif / toplam",
    },
    { l: "Oynanan maç", v: <Sayac hedef={sayilar.oynanan} />, alt: "bu sezon" },
    { l: "Sıradaki maç", v: <Sayac hedef={sayilar.bekleyen} />, alt: "henüz oynanmadı" },
  ];

  // Sıra bilerek böyle: skor girmek günlük iş, diğerleri ara sıra.
  const isListesi = [
    {
      sayi: isler?.skorsuzMac ?? 0,
      href: "/admin/maclar",
      metin: (n: number) => `${n} maçın skoru girilmemiş`,
      alt: "Maç bitti, sonuç hâlâ boş",
    },
    {
      sayi: isler?.fotograf ?? 0,
      href: "/admin/fotograflar",
      metin: (n: number) => `${n} fotoğraf onay bekliyor`,
      alt: "Takım sayfalarından yüklendi",
    },
    {
      sayi: isler?.talep ?? 0,
      href: "/admin/talepler",
      metin: (n: number) => `${n} talep okunmadı`,
      alt: "İletişim ve katılım formu",
    },
  ].filter((i) => i.sayi > 0);

  return (
    <div className="grid gap-6">
      <BaglantiSeridi durum={sunucu} />

      <Panel baslik="Bugün ne var" sag={sayilar.sezon}>
        {isListesi.length === 0 ? (
          <p className="flex items-center gap-3 p-5 text-sm text-[#cfe0d5]">
            <span aria-hidden className="bos-simge grid h-9 w-9 place-items-center rounded-full bg-brand/15 text-lg text-brand-lite ring-1 ring-brand-lite/40">
              ✓
            </span>
            Bekleyen iş yok — skorlar girilmiş, onay kuyruğu boş.
          </p>
        ) : (
          <ul className="divide-y divide-white/8">
            {isListesi.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className="group flex items-center gap-4 px-4 py-4"
                >
                  <span className="display tabular grid h-12 w-12 flex-none place-items-center rounded-full bg-gold/15 text-2xl text-gold ring-1 ring-gold/40 transition-shadow group-hover:shadow-[0_0_18px_rgb(212_167_44/0.45)]">
                    {i.sayi}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-[family-name:var(--font-data)] text-lg font-bold">
                      {i.metin(i.sayi)}
                    </span>
                    <span className="block text-sm text-muted-dark">{i.alt}</span>
                  </span>
                  <span aria-hidden className="ok ml-auto text-xl text-muted-dark group-hover:text-brand-lite">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel baslik="Sezon özeti" sag={sayilar.sezon}>
        <dl className="grid grid-cols-3 gap-px bg-white/10">
          {kutular.map((k) => (
            <div key={k.l} className="ozet-kutu bg-ink-3 p-5">
              <dd className="display tabular text-4xl">{k.v}</dd>
              <dt className="mt-1 font-[family-name:var(--font-data)] text-xs uppercase tracking-[0.14em] text-muted-dark">
                {k.l}
              </dt>
              <p className="mt-0.5 text-xs text-muted-dark">{k.alt}</p>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel baslik="Kısayollar">
        <div className="flex flex-wrap gap-3 p-4">
          {[
            { href: "/admin/maclar", l: "Skor gir" },
            { href: "/admin/takimlar", l: "Takım ekle" },
            { href: "/admin/fotograflar?bolum=galeri", l: "Galeriye görsel ekle" },
            { href: "/admin/duyurular", l: "Duyuru ekle" },
            { href: "/admin/puan", l: "Puan düzelt" },
            { href: "/admin/fotograflar", l: "Fotoğraf onayla" },
            { href: "/admin/ayarlar", l: "İletişim bilgileri" },
          ].map((k) => (
            <Link
              key={k.l}
              href={k.href}
              className="btn-cizgi rounded-sm border border-white/15 px-4 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider text-[#cfe0d5] hover:border-brand-lite hover:text-brand-lite"
            >
              {k.l} <span aria-hidden className="ok">→</span>
            </Link>
          ))}
        </div>
      </Panel>

      <Uyari>
        Skoru girdiğin anda puan durumu, fikstür ve takım sayfaları kendiliğinden güncellenir.
        Sitede değişikliğin görünmesi en fazla bir dakika sürebilir.
      </Uyari>
    </div>
  );
}
