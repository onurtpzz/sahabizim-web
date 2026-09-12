"use client";

import { useEffect, useMemo, useState } from "react";
import { Alan, Dugme, Girdi, Panel, Secim, Uyari } from "@/components/admin/ui";
import {
  aktifSezon,
  macEkle,
  macSil,
  maclariGetir,
  skorKaydet,
  takimlariGetir,
  type Mac,
  type Sezon,
  type Takim,
} from "@/lib/admin-veri";

export default function AdminMaclar() {
  const [sezon, setSezon] = useState<Sezon | null>(null);
  const [takimlar, setTakimlar] = useState<Takim[]>([]);
  const [maclar, setMaclar] = useState<Mac[]>([]);
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const adlar = useMemo(
    () => Object.fromEntries(takimlar.map((t) => [t.id, t.ad])),
    [takimlar],
  );

  async function yenile() {
    try {
      const s = await aktifSezon();
      setSezon(s);
      const [t, m] = await Promise.all([
        takimlariGetir(),
        s ? maclariGetir(s.id) : Promise.resolve([]),
      ]);
      setTakimlar(t.filter((x) => x.aktif));
      setMaclar(m);
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Veriler okunamadı." });
    }
    setYukleniyor(false);
  }

  useEffect(() => {
    yenile();
  }, []);

  if (yukleniyor) return <p className="text-muted-dark">Yükleniyor…</p>;

  if (!sezon) {
    return (
      <Uyari tur="hata">
        Aktif sezon bulunamadı. Sezon sekmesinden bir sezon başlat.
      </Uyari>
    );
  }

  const bekleyen = maclar.filter((m) => m.durum === "oynanacak");
  const oynanan = maclar.filter((m) => m.durum !== "oynanacak");

  return (
    <div className="grid gap-6">
      {mesaj && <Uyari tur={mesaj.tur}>{mesaj.metin}</Uyari>}

      <YeniMac
        sezonId={sezon.id}
        takimlar={takimlar}
        kaydedildi={async (metin) => {
          setMesaj({ tur: "basari", metin });
          await yenile();
        }}
        hataVer={(metin) => setMesaj({ tur: "hata", metin })}
      />

      {bekleyen.length > 0 && (
        <Panel baslik="Skor bekleyen maçlar" sag={`${bekleyen.length} maç`}>
          <ul className="divide-y divide-white/8">
            {bekleyen.map((m) => (
              <MacSatiri key={m.id} mac={m} adlar={adlar} yenile={yenile} setMesaj={setMesaj} />
            ))}
          </ul>
        </Panel>
      )}

      <Panel baslik="Girilen sonuçlar" sag={`${oynanan.length} maç`}>
        {oynanan.length === 0 ? (
          <p className="p-5 text-sm text-muted-dark">
            Henüz maç sonucu girilmedi. Yukarıdan ekleyebilirsin.
          </p>
        ) : (
          <ul className="divide-y divide-white/8">
            {oynanan.map((m) => (
              <MacSatiri key={m.id} mac={m} adlar={adlar} yenile={yenile} setMesaj={setMesaj} />
            ))}
          </ul>
        )}
      </Panel>

      <Uyari>
        Skoru kaydettiğin anda puan durumu, takım sayfaları ve anasayfa yeniden hesaplanır.
        Yanlış girersen düzeltmen yeterli — tüm tablolar geri hesaplanır.
      </Uyari>
    </div>
  );
}

function MacSatiri({
  mac,
  adlar,
  yenile,
  setMesaj,
}: {
  mac: Mac;
  adlar: Record<string, string>;
  yenile: () => Promise<void>;
  setMesaj: (m: { tur: "basari" | "hata"; metin: string }) => void;
}) {
  const [ev, setEv] = useState(mac.ev_skor?.toString() ?? "");
  const [dep, setDep] = useState(mac.dep_skor?.toString() ?? "");
  const [bekle, setBekle] = useState(false);
  const degisti =
    ev !== (mac.ev_skor?.toString() ?? "") || dep !== (mac.dep_skor?.toString() ?? "");

  async function kaydet() {
    setBekle(true);
    try {
      await skorKaydet(
        mac.id,
        ev === "" ? null : Number(ev),
        dep === "" ? null : Number(dep),
      );
      setMesaj({ tur: "basari", metin: "Skor kaydedildi." });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Kaydedilemedi." });
    }
    setBekle(false);
  }

  async function sil() {
    if (!window.confirm("Bu maç silinsin mi?")) return;
    try {
      await macSil(mac.id);
      setMesaj({ tur: "basari", metin: "Maç silindi." });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Silinemedi." });
    }
  }

  return (
    <li className="grid gap-3 p-4 md:grid-cols-[110px_1fr_auto] md:items-center">
      <p className="font-[family-name:var(--font-data)] text-xs uppercase tracking-[0.12em] text-muted-dark">
        {mac.oynanma
          ? new Date(mac.oynanma).toLocaleDateString("tr-TR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Tarih yok"}
      </p>

      <div className="grid grid-cols-[1fr_56px_16px_56px_1fr] items-center gap-2">
        <span className="truncate text-right font-[family-name:var(--font-data)] font-semibold">
          {adlar[mac.ev_id] ?? "?"}
        </span>
        <Girdi
          aria-label="Ev sahibi skoru"
          inputMode="numeric"
          value={ev}
          onChange={(e) => setEv(e.target.value.replace(/\D/g, ""))}
          className="text-center font-[family-name:var(--font-display)] text-xl"
        />
        <span className="text-center text-muted-dark">–</span>
        <Girdi
          aria-label="Deplasman skoru"
          inputMode="numeric"
          value={dep}
          onChange={(e) => setDep(e.target.value.replace(/\D/g, ""))}
          className="text-center font-[family-name:var(--font-display)] text-xl"
        />
        <span className="truncate font-[family-name:var(--font-data)] font-semibold">
          {adlar[mac.dep_id] ?? "?"}
        </span>
      </div>

      <div className="flex justify-end gap-2">
        <Dugme type="button" onClick={kaydet} disabled={!degisti || bekle}>
          Kaydet
        </Dugme>
        <Dugme type="button" tur="tehlike" onClick={sil}>
          Sil
        </Dugme>
      </div>
    </li>
  );
}

function YeniMac({
  sezonId,
  takimlar,
  kaydedildi,
  hataVer,
}: {
  sezonId: string;
  takimlar: Takim[];
  kaydedildi: (metin: string) => Promise<void>;
  hataVer: (metin: string) => void;
}) {
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10));
  const [evId, setEvId] = useState("");
  const [depId, setDepId] = useState("");
  const [ev, setEv] = useState("");
  const [dep, setDep] = useState("");
  const [bekle, setBekle] = useState(false);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (!evId || !depId) return hataVer("İki takımı da seç.");
    if (evId === depId) return hataVer("Bir takım kendisiyle oynayamaz.");
    setBekle(true);
    try {
      await macEkle({
        sezon_id: sezonId,
        hafta: null,
        oynanma: tarih ? new Date(tarih).toISOString() : null,
        ev_id: evId,
        dep_id: depId,
        ev_skor: ev === "" ? null : Number(ev),
        dep_skor: dep === "" ? null : Number(dep),
        saha: null,
      });
      setEv("");
      setDep("");
      setEvId("");
      setDepId("");
      await kaydedildi("Maç eklendi.");
    } catch (err) {
      hataVer(err instanceof Error ? err.message : "Eklenemedi.");
    }
    setBekle(false);
  }

  return (
    <Panel baslik="Maç ekle" sag="Skoru boş bırakırsan fikstüre eklenir">
      <form onSubmit={gonder} className="grid gap-4 p-4">
        <div className="max-w-[220px]">
          <Alan etiket="Maç tarihi">
            <Girdi id="tarih" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
          </Alan>
        </div>

        <div className="grid items-end gap-3 md:grid-cols-[1fr_80px_80px_1fr]">
          <Alan etiket="Ev sahibi">
            <Secim value={evId} onChange={(e) => setEvId(e.target.value)}>
              <option value="">Takım seç</option>
              {takimlar.map((t) => (
                <option key={t.id} value={t.id}>{t.ad}</option>
              ))}
            </Secim>
          </Alan>
          <Alan etiket="Skor">
            <Girdi
              inputMode="numeric"
              value={ev}
              onChange={(e) => setEv(e.target.value.replace(/\D/g, ""))}
              className="text-center font-[family-name:var(--font-display)] text-xl"
            />
          </Alan>
          <Alan etiket="Skor">
            <Girdi
              inputMode="numeric"
              value={dep}
              onChange={(e) => setDep(e.target.value.replace(/\D/g, ""))}
              className="text-center font-[family-name:var(--font-display)] text-xl"
            />
          </Alan>
          <Alan etiket="Deplasman">
            <Secim value={depId} onChange={(e) => setDepId(e.target.value)}>
              <option value="">Takım seç</option>
              {takimlar.map((t) => (
                <option key={t.id} value={t.id}>{t.ad}</option>
              ))}
            </Secim>
          </Alan>
        </div>

        <div>
          <Dugme type="submit" disabled={bekle}>
            {bekle ? "Kaydediliyor…" : "Maçı Kaydet"}
          </Dugme>
        </div>
      </form>
    </Panel>
  );
}
