"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bildirim, BosDurum, Dugme, Iskelet, Panel, Uyari } from "@/components/admin/ui";
import { GaleriYonetimi } from "@/components/admin/galeri-yonetimi";
import {
  fotograflariGetir,
  fotografDurumu,
  fotografOnayla,
  fotografOnizlemeUrl,
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

/** Önizleme adresi durumu: adres, "yok" (dosya bulunamadı) ya da yükleniyor. */
type Onizleme = string | "yok";

/** Üst seviye ayrım: ziyaretçilerden gelenler / sitenin kendi galerisi. */
const BOLUMLER = [
  { k: "takim", l: "Takım fotoğrafları" },
  { k: "galeri", l: "Site galerisi" },
] as const;

export default function AdminFotograflar() {
  const [bolum, setBolum] = useState<(typeof BOLUMLER)[number]["k"]>("takim");
  const [sekme, setSekme] = useState<(typeof SEKMELER)[number]["k"]>("bekliyor");
  const [kayitlar, setKayitlar] = useState<TakimFotografi[]>([]);
  const [takimlar, setTakimlar] = useState<Takim[]>([]);
  const [onizleme, setOnizleme] = useState<Record<string, Onizleme>>({});
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemde, setIslemde] = useState<string | null>(null);

  const adlar = useMemo(
    () => Object.fromEntries(takimlar.map((t) => [t.id, t.ad])),
    [takimlar],
  );

  const yenile = useCallback(async () => {
    try {
      const [f, t] = await Promise.all([fotograflariGetir(), takimlariGetir()]);
      setKayitlar(f);
      setTakimlar(t);
    } catch (e) {
      setMesaj({
        tur: "hata",
        metin:
          e instanceof Error
            ? `${e.message} — 07 ve 09 numaralı SQL dosyalarını Supabase'de çalıştırdın mı?`
            : "Okunamadı.",
      });
    }
    setYukleniyor(false);
  }, []);

  useEffect(() => {
    yenile();
  }, [yenile]);

  const gorunen = useMemo(
    () => kayitlar.filter((k) => k.durum === sekme),
    [kayitlar, sekme],
  );

  /**
   * Onay bekleyen fotoğraflar gizli kovada durduğu için `<img src>` ile
   * doğrudan açılamaz; her biri için kısa ömürlü imzalı adres üretiliyor.
   * Yayındakiler kalıcı adreslerini kullanır, imza gerekmez.
   */
  useEffect(() => {
    let iptal = false;
    const bekleyenler = gorunen.filter(
      (f) => f.durum !== "onayli" && f.dosya_yolu && onizleme[f.id] === undefined,
    );
    if (bekleyenler.length === 0) return;

    (async () => {
      for (const f of bekleyenler) {
        let sonuc: Onizleme = "yok";
        try {
          sonuc = await fotografOnizlemeUrl(f.dosya_yolu as string);
        } catch {
          sonuc = "yok";
        }
        if (iptal) return;
        setOnizleme((o) => ({ ...o, [f.id]: sonuc }));
      }
    })();

    return () => {
      iptal = true;
    };
  }, [gorunen, onizleme]);

  async function onayla(f: TakimFotografi) {
    setIslemde(f.id);
    try {
      await fotografOnayla(f);
      setMesaj({
        tur: "basari",
        metin:
          "Fotoğraf yayına alındı. Dosya herkese açık kovaya taşındı; sitede görünmesi bir dakikayı bulabilir.",
      });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Onaylanamadı." });
    }
    setIslemde(null);
  }

  async function durumDegistir(f: TakimFotografi, durum: "bekliyor" | "red") {
    setIslemde(f.id);
    try {
      await fotografDurumu(f.id, durum);
      setMesaj({
        tur: "basari",
        metin:
          durum === "red"
            ? "Fotoğraf reddedildi. Dosya gizli kovada duruyor, sitede görünmüyor."
            : "Onay kuyruğuna geri alındı.",
      });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Güncellenemedi." });
    }
    setIslemde(null);
  }

  async function sil(f: TakimFotografi) {
    if (!window.confirm("Bu kayıt ve dosyası tamamen silinsin mi?")) return;
    setIslemde(f.id);
    try {
      await fotografSil(f);
      setMesaj({ tur: "basari", metin: "Kayıt ve dosyası silindi." });
      setOnizleme((o) => {
        const y = { ...o };
        delete y[f.id];
        return y;
      });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Silinemedi." });
    }
    setIslemde(null);
  }

  const sayilar = Object.fromEntries(
    SEKMELER.map((s) => [s.k, kayitlar.filter((k) => k.durum === s.k).length]),
  ) as Record<string, number>;

  const bekleyenSayisi = sayilar.bekliyor ?? 0;

  if (yukleniyor) return <Iskelet satir={3} />;

  return (
    <div className="grid gap-6">
      <Bildirim mesaj={mesaj} kapat={() => setMesaj(null)} />

      <div className="flex flex-wrap gap-1.5 border-b border-white/12 pb-3">
        {BOLUMLER.map((b) => (
          <button
            key={b.k}
            type="button"
            onClick={() => setBolum(b.k)}
            className={`rounded-sm px-4 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold tracking-wider uppercase transition ${
              bolum === b.k
                ? "bg-brand text-white"
                : "text-muted-dark hover:text-white"
            }`}
          >
            {b.l}
            {b.k === "takim" && bekleyenSayisi > 0 && (
              <span className="ml-1.5 inline-grid min-w-[19px] place-items-center rounded-full bg-gold px-1.5 py-px text-[11px] font-bold text-ink tabular-nums">
                {bekleyenSayisi}
              </span>
            )}
          </button>
        ))}
      </div>

      {bolum === "galeri" && <GaleriYonetimi bildir={setMesaj} />}

      {bolum === "takim" && (
      <>
      {bekleyenSayisi >= 100 && (
        <Uyari tur="hata">
          Onay kuyruğunda {bekleyenSayisi} fotoğraf var. 120'ye ulaşıldığında yeni
          yüklemeler geçici olarak durur — kuyruğu boşaltmakta fayda var.
        </Uyari>
      )}

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
          <BosDurum
            simge={sekme === "bekliyor" ? "✓" : "—"}
            baslik={
              sekme === "bekliyor" ? "Onay kuyruğu boş" : "Bu listede kayıt yok"
            }
            metin={
              sekme === "bekliyor"
                ? "Takım sayfalarından yeni fotoğraf geldiğinde burada birikir."
                : undefined
            }
          />
        ) : (
          <ul className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {gorunen.map((f) => {
              const kaynak =
                f.durum === "onayli" ? f.url : f.dosya_yolu ? onizleme[f.id] : f.url;
              const dosyaYok = kaynak === "yok";
              const hazir = typeof kaynak === "string" && kaynak !== "yok" && kaynak !== "";

              return (
                <li
                  key={f.id}
                  className="overflow-hidden rounded border border-white/12 bg-ink-2"
                >
                  {hazir ? (
                    <a href={kaynak} target="_blank" rel="noopener noreferrer" className="block">
                      {/* Yönetim ekranı — optimizasyona gerek yok */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={kaynak}
                        alt={f.aciklama ?? "Yüklenen fotoğraf"}
                        className="aspect-4/3 w-full bg-black/30 object-cover"
                      />
                    </a>
                  ) : (
                    <div className="grid aspect-4/3 w-full place-items-center bg-black/30 px-4 text-center text-sm text-muted-dark">
                      {dosyaYok
                        ? "Dosya bulunamadı — yükleme yarıda kalmış. Sil ile temizle."
                        : "Önizleme hazırlanıyor…"}
                    </div>
                  )}

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
                        <Dugme
                          type="button"
                          onClick={() => onayla(f)}
                          disabled={islemde === f.id || dosyaYok}
                        >
                          {islemde === f.id ? "Bekle…" : "Onayla"}
                        </Dugme>
                      )}
                      {f.durum !== "red" && (
                        <Dugme
                          type="button"
                          tur="ikincil"
                          onClick={() => durumDegistir(f, "red")}
                          disabled={islemde === f.id}
                        >
                          Reddet
                        </Dugme>
                      )}
                      <Dugme
                        type="button"
                        tur="tehlike"
                        onClick={() => sil(f)}
                        disabled={islemde === f.id}
                      >
                        Sil
                      </Dugme>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Uyari>
        Fotoğraflar takım sayfasından ziyaretçiler tarafından yükleniyor ve{" "}
        <strong>onaylanana kadar gizli kovada duruyor</strong> — adresini bilen biri bile
        açamaz. Onayladığın anda dosya herkese açık kovaya taşınır ve sitede görünür.
        Reddettiğin kayıt listede kalır; dosyayla birlikte tamamen kurtulmak için{" "}
        <strong>Sil</strong> kullan.
      </Uyari>
      </>
      )}
    </div>
  );
}
