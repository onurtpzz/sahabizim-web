"use client";

import { useEffect, useMemo, useState } from "react";
import { Dugme, Panel, Uyari } from "@/components/admin/ui";
import {
  fotograflariGetir,
  fotografDurumu,
  fotografSil,
  takimlariGetir,
  type TakimFotografi,
  type Takim,
} from "@/lib/admin-veri";

const SEKMELER = [
  { k: "bekliyor", l: "Onay bekleyen" },
  { k: "onayli", l: "Yayında" },
  { k: "red", l: "Reddedilen" },
] as const;

export default function AdminFotograflar() {
  const [sekme, setSekme] = useState<(typeof SEKMELER)[number]["k"]>("bekliyor");
  const [kayitlar, setKayitlar] = useState<TakimFotografi[]>([]);
  const [takimlar, setTakimlar] = useState<Takim[]>([]);
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const adlar = useMemo(
    () => Object.fromEntries(takimlar.map((t) => [t.id, t.ad])),
    [takimlar],
  );

  async function yenile() {
    try {
      const [f, t] = await Promise.all([fotograflariGetir(), takimlariGetir()]);
      setKayitlar(f);
      setTakimlar(t);
    } catch (e) {
      setMesaj({
        tur: "hata",
        metin:
          e instanceof Error
            ? `${e.message} — 07 numaralı SQL dosyasını Supabase'de çalıştırdın mı?`
            : "Okunamadı.",
      });
    }
    setYukleniyor(false);
  }

  useEffect(() => {
    yenile();
  }, []);

  async function durumDegistir(id: string, durum: "bekliyor" | "onayli" | "red") {
    try {
      await fotografDurumu(id, durum);
      setMesaj({
        tur: "basari",
        metin:
          durum === "onayli"
            ? "Fotoğraf yayına alındı. Sitede görünmesi bir dakikayı bulabilir."
            : durum === "red"
              ? "Fotoğraf reddedildi, sitede görünmeyecek."
              : "Onay kuyruğuna geri alındı.",
      });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Güncellenemedi." });
    }
  }

  async function sil(id: string) {
    if (!window.confirm("Bu kayıt tamamen silinsin mi?")) return;
    try {
      await fotografSil(id);
      setMesaj({ tur: "basari", metin: "Kayıt silindi." });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Silinemedi." });
    }
  }

  const sayilar = Object.fromEntries(
    SEKMELER.map((s) => [s.k, kayitlar.filter((k) => k.durum === s.k).length]),
  ) as Record<string, number>;
  const gorunen = kayitlar.filter((k) => k.durum === sekme);

  if (yukleniyor) return <p className="text-muted-dark">Yükleniyor…</p>;

  return (
    <div className="grid gap-6">
      {mesaj && <Uyari tur={mesaj.tur}>{mesaj.metin}</Uyari>}

      <div className="flex flex-wrap gap-2">
        {SEKMELER.map((s) => (
          <button
            key={s.k}
            type="button"
            onClick={() => setSekme(s.k)}
            className={`rounded-sm border px-4 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold tracking-wider uppercase transition ${
              sekme === s.k
                ? "border-brand bg-ink-3 text-white"
                : "border-white/12 text-muted-dark hover:text-white"
            }`}
          >
            {s.l} ({sayilar[s.k] ?? 0})
          </button>
        ))}
      </div>

      <Panel baslik={SEKMELER.find((s) => s.k === sekme)!.l} sag={`${gorunen.length} fotoğraf`}>
        {gorunen.length === 0 ? (
          <p className="p-5 text-sm text-muted-dark">
            {sekme === "bekliyor"
              ? "Onay bekleyen fotoğraf yok."
              : "Bu listede kayıt yok."}
          </p>
        ) : (
          <ul className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {gorunen.map((f) => (
              <li key={f.id} className="overflow-hidden rounded border border-white/12 bg-ink-2">
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="block">
                  {/* Yönetim ekranı — optimizasyona gerek yok */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.url}
                    alt={f.aciklama ?? "Yüklenen fotoğraf"}
                    className="aspect-4/3 w-full bg-black/30 object-cover"
                  />
                </a>
                <div className="grid gap-2 p-3">
                  <p className="font-[family-name:var(--font-data)] font-semibold">
                    {adlar[f.takim_id] ?? "Silinmiş takım"}
                  </p>
                  {f.aciklama && <p className="text-sm text-[#cfe0d5]">{f.aciklama}</p>}
                  <p className="text-xs text-muted-dark">
                    {f.yukleyen_ad ? `${f.yukleyen_ad} · ` : ""}
                    {new Date(f.olusturuldu).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  <div className="mt-1 flex flex-wrap gap-2">
                    {f.durum !== "onayli" && (
                      <Dugme type="button" onClick={() => durumDegistir(f.id, "onayli")}>
                        Onayla
                      </Dugme>
                    )}
                    {f.durum !== "red" && (
                      <Dugme
                        type="button"
                        tur="ikincil"
                        onClick={() => durumDegistir(f.id, "red")}
                      >
                        Reddet
                      </Dugme>
                    )}
                    <Dugme type="button" tur="tehlike" onClick={() => sil(f.id)}>
                      Sil
                    </Dugme>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Uyari>
        Fotoğraflar takım sayfasından ziyaretçiler tarafından yükleniyor ve{" "}
        <strong>onaylanana kadar sitede görünmüyor</strong>. Reddettiğin kayıt listede
        kalır; tamamen kurtulmak için <strong>Sil</strong> kullan.
      </Uyari>
    </div>
  );
}
