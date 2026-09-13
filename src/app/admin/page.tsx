"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Panel, Uyari } from "@/components/admin/ui";
import {
  aktifSezon,
  fotograflariGetir,
  maclariGetir,
  takimlariGetir,
  talepleriGetir,
} from "@/lib/admin-veri";

export default function AdminOzet() {
  const [sayilar, setSayilar] = useState<{
    sezon: string;
    takim: number;
    aktifTakim: number;
    oynanan: number;
    bekleyen: number;
    talep: number;
    foto: number;
  } | null>(null);
  const [hata, setHata] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const sezon = await aktifSezon();
        const takimlar = await takimlariGetir();
        const maclar = sezon ? await maclariGetir(sezon.id) : [];
        let talep = 0;
        try {
          talep = (await talepleriGetir()).filter((t) => !t.okundu).length;
        } catch {
          /* talepler henüz yoksa sorun değil */
        }
        let foto = 0;
        try {
          foto = (await fotograflariGetir("bekliyor")).length;
        } catch {
          /* fotoğraf tablosu henüz yoksa sorun değil */
        }
        setSayilar({
          sezon: sezon?.ad ?? "Aktif sezon yok",
          takim: takimlar.length,
          aktifTakim: takimlar.filter((t) => t.aktif).length,
          oynanan: maclar.filter((m) => m.durum === "oynandi" || m.durum === "hukmen").length,
          bekleyen: maclar.filter((m) => m.durum === "oynanacak").length,
          talep,
          foto,
        });
      } catch (e) {
        setHata(e instanceof Error ? e.message : "Veriler okunamadı.");
      }
    })();
  }, []);

  if (hata) {
    return (
      <Uyari tur="hata">
        {hata} — SQL dosyalarını Supabase&apos;de çalıştırdığından emin ol.
      </Uyari>
    );
  }

  if (!sayilar) return <p className="text-muted-dark">Yükleniyor…</p>;

  const kutular = [
    { l: "Takım", v: `${sayilar.aktifTakim}/${sayilar.takim}`, alt: "aktif / toplam" },
    { l: "Oynanan maç", v: sayilar.oynanan, alt: "bu sezon" },
    { l: "Bekleyen maç", v: sayilar.bekleyen, alt: "skor girilmemiş" },
    { l: "Okunmamış talep", v: sayilar.talep, alt: "iletişim + katılım" },
    { l: "Onay bekleyen foto", v: sayilar.foto, alt: "takım sayfalarından" },
  ];

  return (
    <div className="grid gap-6">
      <Panel baslik="Aktif sezon" sag={sayilar.sezon}>
        <dl className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-5">
          {kutular.map((k) => (
            <div key={k.l} className="bg-ink-3 p-5">
              <dd className="display tabular text-4xl">{k.v}</dd>
              <dt className="mt-1 font-[family-name:var(--font-data)] text-xs uppercase tracking-[0.14em] text-muted-dark">
                {k.l}
              </dt>
              <p className="mt-0.5 text-xs text-white/35">{k.alt}</p>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel baslik="Kısayollar">
        <div className="flex flex-wrap gap-3 p-4">
          {[
            { href: "/admin/maclar", l: "Skor gir" },
            { href: "/admin/takimlar", l: "Takım ekle" },
            { href: "/admin/gorseller", l: "Görsel yükle" },
            { href: "/admin/duyurular", l: "Duyuru ekle" },
            { href: "/admin/puan", l: "Puan düzelt" },
            { href: "/admin/fotograflar", l: "Fotoğraf onayla" },
            { href: "/admin/ayarlar", l: "İletişim bilgileri" },
          ].map((k) => (
            <Link
              key={k.href}
              href={k.href}
              className="rounded-sm border border-white/15 px-4 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider text-[#cfe0d5] transition hover:border-brand-lite hover:text-white"
            >
              {k.l}
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
