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
        <strong>Puan düzeltmesi</strong> ceza ve bonus içindir — sadece puanı değiştirir,
        maç istatistiğine dokunmaz. <strong>Tablo düzeltme</strong> ise takımın puan
        durumundaki rakamları Excel&apos;e eşitler: yazdığın sayılar tablonun{" "}
        <em>toplam</em> hâlidir, panel devir sayısını kendisi hesaplar. Sitede görünen
        tablo = devir (Excel birikimi) + bu sezon panele girilen maçlar.
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

      <Panel baslik="Tablo düzeltme (Excel senkronu)" sag="Takım ara, toplam rakamları yaz">
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
                <TabloSatiri
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

const ALANLAR = [
  { anahtar: "o", devir: "devir_o", etiket: "O" },
  { anahtar: "g", devir: "devir_g", etiket: "G" },
  { anahtar: "b", devir: "devir_b", etiket: "B" },
  { anahtar: "m", devir: "devir_m", etiket: "M" },
  { anahtar: "a", devir: "devir_a", etiket: "A" },
  { anahtar: "y", devir: "devir_y", etiket: "Y" },
] as const;

type AlanAnahtari = (typeof ALANLAR)[number]["anahtar"];
type Sayilar = Record<AlanAnahtari, number>;

function bosSayilar(): Sayilar {
  return { o: 0, g: 0, b: 0, m: 0, a: 0, y: 0 };
}

/**
 * Panelde gösterilen rakamlar tablonun TOPLAM hâlidir (devir + bu sezon oynanan maçlar).
 * Kaydederken devir = girilen toplam − bu sezon oynanan olarak geri hesaplanır;
 * böylece ekrandaki sayılar ile site tablosu birebir aynı şeyi söyler.
 */
function TabloSatiri({
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
  const devir = useMemo<Sayilar>(
    () => ({
      o: takim.devir_o ?? 0,
      g: takim.devir_g ?? 0,
      b: takim.devir_b ?? 0,
      m: takim.devir_m ?? 0,
      a: takim.devir_a ?? 0,
      y: takim.devir_y ?? 0,
    }),
    [takim],
  );

  // Bu sezon panele girilen maçlardan gelen kısım = tablo − devir.
  const oynanan = useMemo<Sayilar>(() => {
    if (!guncel) return bosSayilar();
    const fark = {
      o: guncel.o - devir.o,
      g: guncel.g - devir.g,
      b: guncel.b - devir.b,
      m: guncel.m - devir.m,
      a: guncel.a - devir.a,
      y: guncel.y - devir.y,
    };
    return Object.fromEntries(
      Object.entries(fark).map(([k, v]) => [k, Math.max(0, v)]),
    ) as Sayilar;
  }, [guncel, devir]);

  const toplam = useMemo<Sayilar>(
    () =>
      guncel
        ? { o: guncel.o, g: guncel.g, b: guncel.b, m: guncel.m, a: guncel.a, y: guncel.y }
        : devir,
    [guncel, devir],
  );

  // Puan düzeltmelerinden (ceza/bonus) gelen sapma — önizlemede korunur.
  const puanSapmasi = guncel ? guncel.p - (guncel.g * 3 + guncel.b) : 0;

  const baslangic = useMemo(
    () =>
      Object.fromEntries(ALANLAR.map((a) => [a.anahtar, String(toplam[a.anahtar])])) as Record<
        AlanAnahtari,
        string
      >,
    [toplam],
  );

  const [degerler, setDegerler] = useState(baslangic);
  const [bekle, setBekle] = useState(false);

  // Kaydettikten (ya da başka bir yerden veri yenilendikten) sonra kutular
  // tazelensin — eskiden state ilk değerinde donup kalıyordu.
  useEffect(() => {
    setDegerler(baslangic);
  }, [baslangic]);

  const degisti = ALANLAR.some((a) => degerler[a.anahtar] !== baslangic[a.anahtar]);
  const sayi = (k: AlanAnahtari) => Number(degerler[k]) || 0;

  const yeniPuan = sayi("g") * 3 + sayi("b") + puanSapmasi;
  const yeniAveraj = sayi("a") - sayi("y");
  const maclarUyumsuz = sayi("g") + sayi("b") + sayi("m") !== sayi("o");

  const eksik = ALANLAR.filter((a) => sayi(a.anahtar) < oynanan[a.anahtar]);

  async function kaydet() {
    if (maclarUyumsuz) {
      return hataVer(
        `G+B+M (${sayi("g") + sayi("b") + sayi("m")}) oynanan maç sayısına (${sayi("o")}) eşit olmalı.`,
      );
    }
    if (eksik.length > 0) {
      return hataVer(
        `Yazdığın toplam, bu sezon panele girilen maçlardan küçük olamaz: ` +
          eksik
            .map((a) => `${a.etiket} en az ${oynanan[a.anahtar]}`)
            .join(", ") +
          ". Önce ilgili maçı Maç & Skor ekranından düzelt.",
      );
    }
    setBekle(true);
    try {
      await devirKaydet(takim.id, {
        devir_o: sayi("o") - oynanan.o,
        devir_g: sayi("g") - oynanan.g,
        devir_b: sayi("b") - oynanan.b,
        devir_m: sayi("m") - oynanan.m,
        devir_a: sayi("a") - oynanan.a,
        devir_y: sayi("y") - oynanan.y,
      });
      await kaydedildi(`${takim.ad} tablosu güncellendi.`);
    } catch (e) {
      hataVer(e instanceof Error ? e.message : "Kaydedilemedi.");
    }
    setBekle(false);
  }

  return (
    <li className="rounded border border-white/12 bg-ink-2 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-[family-name:var(--font-data)] font-bold">{takim.ad}</span>
        {guncel && (
          <span className="text-xs text-muted-dark">
            tabloda {guncel.sira}. sıra · {guncel.o} maç · {guncel.p} puan · averaj{" "}
            {guncel.av > 0 ? `+${guncel.av}` : guncel.av}
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-dark">
        Kutulardaki sayılar <strong>tablonun toplamı</strong>. Bunun{" "}
        {oynanan.o > 0 ? (
          <>
            <strong>{oynanan.o} maçı</strong> bu sezon panelden girildi (
            {oynanan.g}G {oynanan.b}B {oynanan.m}M · {oynanan.a}-{oynanan.y}), gerisi Excel
            devri. Panelden girilen maçlar korunur, sen sadece toplamı yaz.
          </>
        ) : (
          <>tamamı Excel devri — bu sezon bu takıma henüz maç girilmemiş.</>
        )}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ALANLAR.map((a) => (
          <label key={a.anahtar} className="block">
            <span className="mb-1 block text-center font-[family-name:var(--font-data)] text-xs tracking-[0.12em] text-muted-dark uppercase">
              {a.etiket}
            </span>
            <Girdi
              inputMode="numeric"
              value={degerler[a.anahtar]}
              onChange={(e) =>
                setDegerler((d) => ({ ...d, [a.anahtar]: e.target.value.replace(/\D/g, "") }))
              }
              className="text-center font-[family-name:var(--font-display)] text-lg"
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Dugme type="button" onClick={kaydet} disabled={!degisti || bekle}>
          {bekle ? "Kaydediliyor…" : "Kaydet"}
        </Dugme>
        {degisti && (
          <span
            className={`text-xs ${maclarUyumsuz || eksik.length > 0 ? "text-[#ff9a8f]" : "text-muted-dark"}`}
          >
            {maclarUyumsuz
              ? `G+B+M ${sayi("g") + sayi("b") + sayi("m")} — oynanan maç ${sayi("o")} olmalı.`
              : eksik.length > 0
                ? `Bu sezon girilen maçlardan küçük olamaz (${eksik
                    .map((a) => `${a.etiket} ≥ ${oynanan[a.anahtar]}`)
                    .join(", ")}).`
                : `Kaydedince tablo: ${sayi("o")} maç · ${yeniPuan} puan · averaj ${
                    yeniAveraj > 0 ? `+${yeniAveraj}` : yeniAveraj
                  }`}
          </span>
        )}
      </div>
    </li>
  );
}
