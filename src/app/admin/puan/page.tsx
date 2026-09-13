"use client";

import { useEffect, useMemo, useState } from "react";
import { Alan, Dugme, Girdi, Panel, TakimSecici, Uyari } from "@/components/admin/ui";
import {
  aktifSezon,
  devirKaydet,
  duzeltmeEkle,
  duzeltmeSil,
  duzeltmeleriGetir,
  puanDurumuGetir,
  takimlariGetir,
  type PuanDuzeltmesi,
  type Sezon,
  type Takim,
} from "@/lib/admin-veri";

type Satir = Awaited<ReturnType<typeof puanDurumuGetir>>[number];

export default function AdminPuan() {
  const [sezon, setSezon] = useState<Sezon | null>(null);
  const [tablo, setTablo] = useState<Satir[]>([]);
  const [takimlar, setTakimlar] = useState<Takim[]>([]);
  const [duzeltmeler, setDuzeltmeler] = useState<PuanDuzeltmesi[]>([]);
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState("");

  const adlar = useMemo(
    () => Object.fromEntries(takimlar.map((t) => [t.id, t.ad])),
    [takimlar],
  );

  async function yenile() {
    try {
      const s = await aktifSezon();
      setSezon(s);
      const [t, tk, d] = await Promise.all([
        puanDurumuGetir(),
        takimlariGetir(),
        s ? duzeltmeleriGetir(s.id) : Promise.resolve([]),
      ]);
      setTablo(t);
      setTakimlar(tk);
      setDuzeltmeler(d);
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Veriler okunamadı." });
    }
    setYukleniyor(false);
  }

  useEffect(() => {
    yenile();
  }, []);

  if (yukleniyor) return <p className="text-muted-dark">Yükleniyor…</p>;
  if (!sezon) return <Uyari tur="hata">Aktif sezon yok. Önce Sezon sekmesinden başlat.</Uyari>;

  const q = arama.trim().toLocaleLowerCase("tr");
  const gorunen = q
    ? takimlar.filter((t) => t.ad.toLocaleLowerCase("tr").includes(q))
    : takimlar.slice(0, 0);

  return (
    <div className="grid gap-6">
      {mesaj && <Uyari tur={mesaj.tur}>{mesaj.metin}</Uyari>}

      <Uyari>
        Burada iki ayrı şey var. <strong>Puan düzeltmesi</strong> ceza ve bonus içindir —
        sadece puanı değiştirir, maç istatistiğine dokunmaz.{" "}
        <strong>Devir istatistikleri</strong> ise Excel&apos;den gelen birikimdir; puan
        durumu = devir + bu sezon girilen maçlar. Excel ile karşılaştırırken uyuşmayan
        takımın devir sayılarını düzelt.
      </Uyari>

      <Panel baslik="Puan düzeltmesi ekle" sag="Ceza için eksi, bonus için artı">
        <DuzeltmeFormu
          sezonId={sezon.id}
          takimlar={takimlar.filter((t) => t.aktif)}
          kaydedildi={async (m) => {
            setMesaj({ tur: "basari", metin: m });
            await yenile();
          }}
          hataVer={(m) => setMesaj({ tur: "hata", metin: m })}
        />
      </Panel>

      <Panel baslik="Uygulanan düzeltmeler" sag={`${duzeltmeler.length} kayıt`}>
        {duzeltmeler.length === 0 ? (
          <p className="p-5 text-sm text-muted-dark">Bu sezonda puan düzeltmesi yok.</p>
        ) : (
          <ul className="divide-y divide-white/8">
            {duzeltmeler.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 p-4">
                <span
                  className={`display tabular w-14 text-2xl ${
                    d.puan_farki < 0 ? "text-[#ff9a8f]" : "text-brand-lite"
                  }`}
                >
                  {d.puan_farki > 0 ? `+${d.puan_farki}` : d.puan_farki}
                </span>
                <span className="font-[family-name:var(--font-data)] font-semibold">
                  {adlar[d.takim_id] ?? "?"}
                </span>
                <span className="text-sm text-muted-dark">{d.sebep}</span>
                <div className="ml-auto">
                  <Dugme
                    type="button"
                    tur="tehlike"
                    onClick={async () => {
                      if (!window.confirm("Bu düzeltme kaldırılsın mı?")) return;
                      try {
                        await duzeltmeSil(d.id);
                        setMesaj({ tur: "basari", metin: "Düzeltme kaldırıldı." });
                        await yenile();
                      } catch (e) {
                        setMesaj({
                          tur: "hata",
                          metin: e instanceof Error ? e.message : "Kaldırılamadı.",
                        });
                      }
                    }}
                  >
                    Kaldır
                  </Dugme>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel baslik="Devir istatistikleri (Excel senkronu)" sag="Takım ara, sayıları düzelt">
        <div className="grid gap-4 p-4">
          <Alan etiket="Takım ara">
            <Girdi
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Birkaç harf yaz — örn. cur"
            />
          </Alan>

          {q === "" ? (
            <p className="text-sm text-muted-dark">
              Düzenlemek istediğin takımın adını yazmaya başla.
            </p>
          ) : gorunen.length === 0 ? (
            <p className="text-sm text-muted-dark">Eşleşen takım yok.</p>
          ) : (
            <ul className="grid gap-3">
              {gorunen.slice(0, 8).map((t) => (
                <DevirSatiri
                  key={t.id}
                  takim={t}
                  guncel={tablo.find((r) => r.id === t.id)}
                  kaydedildi={async (m) => {
                    setMesaj({ tur: "basari", metin: m });
                    await yenile();
                  }}
                  hataVer={(m) => setMesaj({ tur: "hata", metin: m })}
                />
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel baslik="Güncel puan durumu" sag={`${tablo.length} takım`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-[family-name:var(--font-data)] text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-xs tracking-[0.12em] text-muted-dark uppercase">
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Takım</th>
                {["O", "G", "B", "M", "A", "Y", "AV", "P"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tablo.map((r) => (
                <tr key={r.id} className="border-t border-white/8">
                  <td className="tabular px-3 py-2 text-muted-dark">{r.sira}</td>
                  <td className="px-3 py-2 font-semibold">{r.ad}</td>
                  {[r.o, r.g, r.b, r.m, r.a, r.y, r.av, r.p].map((v, i) => (
                    <td
                      key={i}
                      className={`tabular px-3 py-2 text-right ${i === 7 ? "font-bold text-brand-lite" : ""}`}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function DuzeltmeFormu({
  sezonId,
  takimlar,
  kaydedildi,
  hataVer,
}: {
  sezonId: string;
  takimlar: Takim[];
  kaydedildi: (m: string) => Promise<void>;
  hataVer: (m: string) => void;
}) {
  const [takimId, setTakimId] = useState("");
  const [fark, setFark] = useState("");
  const [sebep, setSebep] = useState("");
  const [bekle, setBekle] = useState(false);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (!takimId) return hataVer("Takım seç.");
    const sayi = Number(fark);
    if (!Number.isFinite(sayi) || sayi === 0) return hataVer("Puan farkı 0 olamaz.");
    setBekle(true);
    try {
      await duzeltmeEkle({
        sezon_id: sezonId,
        takim_id: takimId,
        puan_farki: sayi,
        sebep: sebep.trim(),
      });
      setFark("");
      setSebep("");
      setTakimId("");
      await kaydedildi("Puan düzeltmesi eklendi.");
    } catch (err) {
      hataVer(err instanceof Error ? err.message : "Eklenemedi.");
    }
    setBekle(false);
  }

  return (
    <form onSubmit={gonder} className="grid gap-4 p-4">
      <div className="grid gap-4 md:grid-cols-[1fr_120px_1.4fr_auto] md:items-end">
        <Alan etiket="Takım">
          <TakimSecici takimlar={takimlar} deger={takimId} degistir={setTakimId} />
        </Alan>
        <Alan etiket="Puan farkı">
          <Girdi
            inputMode="numeric"
            value={fark}
            onChange={(e) => setFark(e.target.value.replace(/[^0-9-]/g, ""))}
            placeholder="-3"
            className="text-center font-[family-name:var(--font-display)] text-xl"
          />
        </Alan>
        <Alan etiket="Sebep (zorunlu)">
          <Girdi
            value={sebep}
            onChange={(e) => setSebep(e.target.value)}
            placeholder="Hükmen mağlubiyet — kadro eksik"
          />
        </Alan>
        <div>
          <Dugme type="submit" disabled={bekle}>
            {bekle ? "Ekleniyor…" : "Ekle"}
          </Dugme>
        </div>
      </div>
    </form>
  );
}

function DevirSatiri({
  takim,
  guncel,
  kaydedildi,
  hataVer,
}: {
  takim: Takim;
  guncel?: Satir;
  kaydedildi: (m: string) => Promise<void>;
  hataVer: (m: string) => void;
}) {
  const alanlar = [
    { k: "devir_o" as const, l: "O" },
    { k: "devir_g" as const, l: "G" },
    { k: "devir_b" as const, l: "B" },
    { k: "devir_m" as const, l: "M" },
    { k: "devir_a" as const, l: "A" },
    { k: "devir_y" as const, l: "Y" },
  ];
  const baslangic = Object.fromEntries(
    alanlar.map((a) => [a.k, String(takim[a.k] ?? 0)]),
  ) as Record<string, string>;

  const [degerler, setDegerler] = useState(baslangic);
  const [bekle, setBekle] = useState(false);
  const degisti = alanlar.some((a) => degerler[a.k] !== baslangic[a.k]);

  async function kaydet() {
    setBekle(true);
    try {
      await devirKaydet(takim.id, {
        devir_o: Number(degerler.devir_o) || 0,
        devir_g: Number(degerler.devir_g) || 0,
        devir_b: Number(degerler.devir_b) || 0,
        devir_m: Number(degerler.devir_m) || 0,
        devir_a: Number(degerler.devir_a) || 0,
        devir_y: Number(degerler.devir_y) || 0,
      });
      await kaydedildi(`${takim.ad} devir istatistikleri güncellendi.`);
    } catch (e) {
      hataVer(e instanceof Error ? e.message : "Kaydedilemedi.");
    }
    setBekle(false);
  }

  return (
    <li className="rounded border border-white/12 bg-ink-2 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-[family-name:var(--font-data)] font-bold">{takim.ad}</span>
        {guncel && (
          <span className="text-xs text-muted-dark">
            şu anki tablo: {guncel.o} maç · {guncel.p} puan · averaj{" "}
            {guncel.av > 0 ? `+${guncel.av}` : guncel.av}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {alanlar.map((a) => (
          <label key={a.k} className="block">
            <span className="mb-1 block text-center font-[family-name:var(--font-data)] text-xs tracking-[0.12em] text-muted-dark uppercase">
              {a.l}
            </span>
            <Girdi
              inputMode="numeric"
              value={degerler[a.k]}
              onChange={(e) =>
                setDegerler((d) => ({ ...d, [a.k]: e.target.value.replace(/\D/g, "") }))
              }
              className="text-center font-[family-name:var(--font-display)] text-lg"
            />
          </label>
        ))}
      </div>

      <div className="mt-3">
        <Dugme type="button" onClick={kaydet} disabled={!degisti || bekle}>
          {bekle ? "Kaydediliyor…" : "Kaydet"}
        </Dugme>
      </div>
    </li>
  );
}
