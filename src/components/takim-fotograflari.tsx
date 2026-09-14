"use client";

import Image from "next/image";
import { useState } from "react";
import { FotoBuyutec } from "@/components/foto-buyutec";
import { takimFotografiYukle } from "@/lib/fotograf-yukle";
import type { TakimFotografi } from "@/lib/veri";

/**
 * Takım sayfasındaki fotoğraf bölümü: onaylanmış kareler + ziyaretçi
 * yükleme formu. Yüklenen fotoğraf önce onay kuyruğuna girer.
 */

export function TakimFotograflari({
  takimAd,
  takimSlug,
  takimId,
  fotograflar,
}: {
  takimAd: string;
  takimSlug: string;
  takimId?: string;
  fotograflar: TakimFotografi[];
}) {
  const [formAcik, setFormAcik] = useState(false);
  const [buyutec, setBuyutec] = useState<number | null>(null);

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-brand">Kareler</p>
          <h2 className="display text-[clamp(1.5rem,4vw,2.1rem)]">{takimAd} fotoğrafları</h2>
        </div>
        {takimId && (
          <button
            type="button"
            onClick={() => setFormAcik((v) => !v)}
            className="rounded-sm border-2 border-ink px-5 py-3 font-[family-name:var(--font-data)] text-sm font-bold tracking-wider uppercase transition hover:border-brand hover:text-brand"
          >
            {formAcik ? "Vazgeç" : "+ Fotoğraf ekle"}
          </button>
        )}
      </div>

      {formAcik && takimId && (
        <YuklemeFormu
          takimId={takimId}
          takimSlug={takimSlug}
          kapat={() => setFormAcik(false)}
        />
      )}

      {fotograflar.length === 0 ? (
        <p className="rounded border border-line bg-white p-5 text-muted">
          Bu takımın henüz fotoğrafı yok.{" "}
          {takimId
            ? "İlk kareyi sen ekle — yukarıdaki butona bas."
            : "Yakında eklenecek."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {fotograflar.map((f, i) => (
            <li key={f.id}>
              <figure className="m-0 overflow-hidden rounded border border-line bg-white">
                <button
                  type="button"
                  onClick={() => setBuyutec(i)}
                  aria-label={`${i + 1}. fotoğrafı büyüt`}
                  className="relative block aspect-4/3 w-full cursor-zoom-in"
                >
                  <Image
                    src={f.url}
                    alt={f.aciklama ?? `${takimAd} fotoğrafı`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                </button>
                {(f.aciklama || f.yukleyen_ad) && (
                  <figcaption className="px-3 py-2 text-[13px] text-muted">
                    {f.aciklama}
                    {f.yukleyen_ad && (
                      <span className="block text-[12px] text-muted/70">
                        Ekleyen: {f.yukleyen_ad}
                      </span>
                    )}
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      )}

      <FotoBuyutec
        sira={buyutec}
        setSira={setBuyutec}
        fotograflar={fotograflar.map((f) => ({
          id: f.id,
          url: f.url,
          baslik: f.aciklama,
          altBilgi: f.yukleyen_ad ? `Ekleyen: ${f.yukleyen_ad}` : `${takimAd}`,
        }))}
      />
    </section>
  );
}

/** Yükleme sonucunu gösteren küçük pencere. */
function SonucPenceresi({
  tur,
  baslik,
  metin,
  kapat,
}: {
  tur: "basari" | "hata";
  baslik: string;
  metin: string;
  kapat: () => void;
}) {
  const basarili = tur === "basari";
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={baslik}
      className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) kapat();
      }}
    >
      <div className="w-full max-w-[420px] rounded border border-line bg-white p-6 text-center shadow-[0_20px_60px_rgba(4,21,11,0.25)]">
        <span
          aria-hidden
          className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl ${
            basarili ? "bg-brand/12 text-brand" : "bg-lose/12 text-lose"
          }`}
        >
          {basarili ? "✓" : "!"}
        </span>

        <h3 className="display mt-4 text-[clamp(1.3rem,4vw,1.7rem)]">{baslik}</h3>
        <p className="mt-2 leading-relaxed text-muted">{metin}</p>

        <button
          type="button"
          onClick={kapat}
          autoFocus
          className={`mt-6 w-full rounded-sm px-6 py-3.5 font-[family-name:var(--font-data)] font-bold tracking-wider uppercase transition ${
            basarili
              ? "bg-brand text-white hover:-translate-y-0.5"
              : "border-2 border-ink hover:border-lose hover:text-lose"
          }`}
        >
          {basarili ? "Tamam" : "Kapat"}
        </button>
      </div>
    </div>
  );
}

function YuklemeFormu({
  takimId,
  takimSlug,
  kapat,
}: {
  takimId: string;
  takimSlug: string;
  kapat: () => void;
}) {
  const [dosya, setDosya] = useState<File | null>(null);
  const [onizleme, setOnizleme] = useState<string | null>(null);
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [bekle, setBekle] = useState(false);
  const [sonuc, setSonuc] = useState<{
    tur: "basari" | "hata";
    baslik: string;
    metin: string;
  } | null>(null);

  function dosyaSecildi(f: File | null) {
    setDosya(f);
    if (onizleme) URL.revokeObjectURL(onizleme);
    setOnizleme(f ? URL.createObjectURL(f) : null);
  }

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (!dosya) {
      setSonuc({
        tur: "hata",
        baslik: "Fotoğraf seçilmedi",
        metin: "Göndermeden önce bir fotoğraf seçmen gerekiyor.",
      });
      return;
    }
    setBekle(true);
    try {
      await takimFotografiYukle({ takimId, takimSlug, dosya, yukleyenAd: ad, aciklama });
      setSonuc({
        tur: "basari",
        baslik: "Fotoğrafın bize ulaştı",
        metin:
          "Teşekkürler! Yönetim onayladıktan sonra takım sayfasında ve galeride yayınlanacak.",
      });
      dosyaSecildi(null);
      setAciklama("");
    } catch (err) {
      setSonuc({
        tur: "hata",
        baslik: "Yüklenemedi",
        metin:
          err instanceof Error
            ? err.message
            : "Bir sorun çıktı, biraz sonra tekrar dener misin?",
      });
    }
    setBekle(false);
  }

  function sonucuKapat() {
    const basariliydi = sonuc?.tur === "basari";
    setSonuc(null);
    if (basariliydi) kapat();
  }

  return (
    <>
      <form
        onSubmit={gonder}
        className="mb-5 grid gap-4 rounded border border-brand/40 bg-white p-5"
      >
        <p className="text-sm text-muted">
          JPG, PNG veya WEBP · en fazla 12 MB. Fotoğrafı gönderirken boyutunu kendimiz
          küçültüyoruz, telefondan çektiğin kareyi olduğu gibi seçebilirsin. Gönderdiğin
          fotoğraf önce yönetim onayından geçer, sonra yayınlanır.
        </p>

        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <label className="block">
            <span className="mb-1.5 block font-[family-name:var(--font-data)] text-xs tracking-[0.12em] text-muted uppercase">
              Fotoğraf
            </span>
            {onizleme ? (
              <span className="relative block aspect-4/3 overflow-hidden rounded border border-line">
                {/* Yerel önizleme — next/image gerekmez */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={onizleme}
                  alt="Seçtiğin fotoğrafın önizlemesi"
                  className="h-full w-full object-cover"
                />
              </span>
            ) : (
              <span className="grid aspect-4/3 place-items-center rounded border border-dashed border-line bg-paper text-sm text-muted">
                Seçilmedi
              </span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => dosyaSecildi(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm text-muted file:mr-3 file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-2 file:font-[family-name:var(--font-data)] file:text-xs file:font-bold file:tracking-wider file:text-white file:uppercase"
            />
          </label>

          <div className="grid content-start gap-4">
            <label className="block">
              <span className="mb-1.5 block font-[family-name:var(--font-data)] text-xs tracking-[0.12em] text-muted uppercase">
                Adın (isteğe bağlı)
              </span>
              <input
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                maxLength={60}
                className="w-full rounded-sm border border-line bg-paper px-3 py-2.5 focus:border-brand"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block font-[family-name:var(--font-data)] text-xs tracking-[0.12em] text-muted uppercase">
                Açıklama (isteğe bağlı)
              </span>
              <input
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                maxLength={200}
                placeholder="Şampiyonluk maçı, ikinci yarı"
                className="w-full rounded-sm border border-line bg-paper px-3 py-2.5 focus:border-brand"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={bekle}
            className="rounded-sm bg-brand px-6 py-3 font-[family-name:var(--font-data)] font-bold tracking-wider text-white uppercase transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bekle ? "Yükleniyor…" : "Gönder"}
          </button>
          <button
            type="button"
            onClick={kapat}
            className="rounded-sm border-2 border-line px-6 py-3 font-[family-name:var(--font-data)] font-bold tracking-wider text-muted uppercase transition hover:border-ink hover:text-ink"
          >
            Kapat
          </button>
        </div>
      </form>

      {sonuc && (
        <SonucPenceresi
          tur={sonuc.tur}
          baslik={sonuc.baslik}
          metin={sonuc.metin}
          kapat={sonucuKapat}
        />
      )}
    </>
  );
}
