"use client";

import { useEffect, useState } from "react";
import { Alan, Bildirim, Dugme, Girdi, Panel, Rozet, Uyari } from "@/components/admin/ui";
import { rozet } from "@/lib/puan";
import {
  dosyaYukle,
  takimEkle,
  takimGuncelle,
  takimSil,
  takimlariGetir,
  slugla,
  type Takim,
} from "@/lib/admin-veri";

export default function AdminTakimlar() {
  const [takimlar, setTakimlar] = useState<Takim[]>([]);
  const [ara, setAra] = useState("");
  const [ad, setAd] = useState("");
  const [yetkili, setYetkili] = useState("");
  const [telefon, setTelefon] = useState("");
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);
  const [bekle, setBekle] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<Takim | null>(null);

  async function yenile() {
    try {
      setTakimlar(await takimlariGetir());
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Takımlar okunamadı." });
    }
  }

  useEffect(() => {
    yenile();
  }, []);

  async function ekle(e: React.FormEvent) {
    e.preventDefault();
    if (!ad.trim()) return;
    setBekle(true);
    try {
      await takimEkle(ad, yetkili, telefon);
      setAd("");
      setYetkili("");
      setTelefon("");
      setMesaj({ tur: "basari", metin: "Takım eklendi." });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Eklenemedi." });
    }
    setBekle(false);
  }

  async function logoYukle(takim: Takim, dosya: File) {
    setMesaj(null);
    try {
      const url = await dosyaYukle(dosya, `logolar/${takim.slug}`);
      await takimGuncelle(takim.id, { logo_url: url });
      setMesaj({ tur: "basari", metin: `${takim.ad} logosu yüklendi.` });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Logo yüklenemedi." });
    }
  }

  async function durumDegistir(t: Takim) {
    await takimGuncelle(t.id, { aktif: !t.aktif });
    await yenile();
  }

  async function sil(t: Takim) {
    if (!window.confirm(`${t.ad} silinsin mi? Bu işlem geri alınamaz.`)) return;
    try {
      await takimSil(t.id);
      setMesaj({ tur: "basari", metin: `${t.ad} silindi.` });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Silinemedi." });
    }
  }

  const listelenen = ara
    ? takimlar.filter((t) => t.ad.toLocaleLowerCase("tr").includes(ara.toLocaleLowerCase("tr")))
    : takimlar;

  return (
    <div className="grid gap-6">
      <Bildirim mesaj={mesaj} kapat={() => setMesaj(null)} />

      <Panel
        baslik="Takımlar"
        sag={`${takimlar.filter((t) => t.aktif).length} aktif / ${takimlar.length} toplam`}
      >
        <div className="border-b border-white/12 p-4">
          <Girdi
            id="takim-ara"
            type="search"
            placeholder="Takım ara"
            value={ara}
            onChange={(e) => setAra(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse font-[family-name:var(--font-data)]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-muted-dark">
                <th className="px-4 py-3 font-semibold">Takım</th>
                <th className="px-4 py-3 font-semibold">Yetkili</th>
                <th className="px-4 py-3 font-semibold">Telefon</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {listelenen.map((t) => (
                <tr key={t.id} className="border-t border-white/8 align-middle">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2.5">
                      {t.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.logo_url} alt="" className="h-9 w-9 rounded-full object-contain" />
                      ) : (
                        <Rozet ad={t.ad} renk={rozet(t.ad).renk} />
                      )}
                      <span className="font-bold">{t.ad}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#cfe0d5]">{t.yetkili ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[#cfe0d5]">{t.telefon ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-wider ${
                        t.aktif
                          ? "border-brand/50 bg-brand/15 text-brand-lite"
                          : "border-white/15 text-muted-dark"
                      }`}
                    >
                      {t.aktif ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap justify-end gap-2">
                      <label className="cursor-pointer rounded-sm border border-white/20 px-3 py-1.5 text-xs uppercase tracking-wider text-[#cfe0d5] hover:border-brand-lite hover:text-white">
                        Logo
                        <input
                          type="file"
                          accept="image/png,image/svg+xml,image/webp,image/jpeg"
                          className="hidden"
                          onChange={(e) => {
                            const d = e.target.files?.[0];
                            if (d) logoYukle(t, d);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setDuzenlenen(t)}
                        className="rounded-sm border border-white/20 px-3 py-1.5 text-xs uppercase tracking-wider text-[#cfe0d5] hover:border-brand-lite hover:text-white"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => durumDegistir(t)}
                        className="rounded-sm border border-white/20 px-3 py-1.5 text-xs uppercase tracking-wider text-[#cfe0d5] hover:border-brand-lite hover:text-white"
                      >
                        {t.aktif ? "Pasife al" : "Aktif et"}
                      </button>
                      <button
                        type="button"
                        onClick={() => sil(t)}
                        className="rounded-sm border border-lose/50 px-3 py-1.5 text-xs uppercase tracking-wider text-[#ff9a8f] hover:bg-lose/15"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={ekle} className="flex flex-wrap items-end gap-3 border-t border-white/12 bg-black/20 p-4">
          <div className="min-w-[180px] flex-1">
            <Alan etiket="Takım adı">
              <Girdi id="yeni-ad" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="ÖRNEK FC" />
            </Alan>
          </div>
          <div className="min-w-[150px] flex-1">
            <Alan etiket="Yetkili">
              <Girdi id="yeni-yetkili" value={yetkili} onChange={(e) => setYetkili(e.target.value)} />
            </Alan>
          </div>
          <div className="min-w-[150px] flex-1">
            <Alan etiket="Telefon">
              <Girdi id="yeni-telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
            </Alan>
          </div>
          <Dugme type="submit" disabled={bekle}>+ Takım Ekle</Dugme>
        </form>
      </Panel>

      <Uyari>
        <strong>Pasife al:</strong> takım lige ara verdi — geçmiş maçları durur, tabloda görünmez.
        <strong> Sil:</strong> yanlış eklenmiş takım için; maç kaydı olan takım silinemez.
        Logo için 512×512 px, şeffaf zeminli PNG veya SVG kullan.
      </Uyari>

      {duzenlenen && (
        <DuzenlePenceresi
          takim={duzenlenen}
          kapat={() => setDuzenlenen(null)}
          kaydedildi={async () => {
            setDuzenlenen(null);
            await yenile();
          }}
        />
      )}
    </div>
  );
}

function DuzenlePenceresi({
  takim,
  kapat,
  kaydedildi,
}: {
  takim: Takim;
  kapat: () => void;
  kaydedildi: () => void;
}) {
  const [ad, setAd] = useState(takim.ad);
  const [yetkili, setYetkili] = useState(takim.yetkili ?? "");
  const [telefon, setTelefon] = useState(takim.telefon ?? "");
  const [hata, setHata] = useState("");

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    try {
      await takimGuncelle(takim.id, {
        ad: ad.trim(),
        slug: slugla(ad),
        yetkili: yetkili || null,
        telefon: telefon || null,
      });
      kaydedildi();
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Kaydedilemedi.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5">
      <form
        onSubmit={kaydet}
        className="w-full max-w-md rounded border border-white/15 bg-ink-3 p-6"
      >
        <h2 className="display text-2xl">Takımı düzenle</h2>
        <div className="mt-5 grid gap-4">
          <Alan etiket="Takım adı">
            <Girdi id="d-ad" value={ad} onChange={(e) => setAd(e.target.value)} />
          </Alan>
          <Alan etiket="Yetkili">
            <Girdi id="d-yetkili" value={yetkili} onChange={(e) => setYetkili(e.target.value)} />
          </Alan>
          <Alan etiket="Telefon">
            <Girdi id="d-telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
          </Alan>
          {hata && <Uyari tur="hata">{hata}</Uyari>}
          <p className="text-xs text-white/40">
            Adres: /takim/{slugla(ad)} — takım adını değiştirirsen eski adres çalışmaz.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Dugme type="button" tur="ikincil" onClick={kapat}>
            Vazgeç
          </Dugme>
          <Dugme type="submit">Kaydet</Dugme>
        </div>
      </form>
    </div>
  );
}
