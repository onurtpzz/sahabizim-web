"use client";

import { useEffect, useMemo, useState } from "react";
import { Alan, Dugme, Girdi, Panel, TakimSecici, Uyari } from "@/components/admin/ui";
import { MacGorseli } from "@/components/admin/mac-gorseli";
import { SITE } from "@/lib/site";
import {
  aktifSezon,
  bugun,
  macEkle,
  tarihiIsoYap,
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

  // Maç satırlarında hem ad hem logo lazım (logo paylaşım görseline giriyor).
  const bilgiler = useMemo(
    () =>
      Object.fromEntries(
        takimlar.map((t) => [t.id, { ad: t.ad, logo: t.logo_url }]),
      ) as Record<string, { ad: string; logo: string | null }>,
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
              <MacSatiri key={m.id} mac={m} bilgiler={bilgiler} yenile={yenile} setMesaj={setMesaj} />
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
              <MacSatiri key={m.id} mac={m} bilgiler={bilgiler} yenile={yenile} setMesaj={setMesaj} />
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
  bilgiler,
  yenile,
  setMesaj,
}: {
  mac: Mac;
  bilgiler: Record<string, { ad: string; logo: string | null }>;
  yenile: () => Promise<void>;
  setMesaj: (m: { tur: "basari" | "hata"; metin: string }) => void;
}) {
  const [ev, setEv] = useState(mac.ev_skor?.toString() ?? "");
  const [dep, setDep] = useState(mac.dep_skor?.toString() ?? "");
  const [bekle, setBekle] = useState(false);
  const [gorsel, setGorsel] = useState(false);
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

      {/* Mobilde her takım kendi skorunun yanında; masaüstünde klasik karşılaşma dizilimi */}
      <div className="grid grid-cols-[1fr_60px] items-center gap-2 md:grid-cols-[1fr_56px_16px_56px_1fr]">
        <span className="truncate font-[family-name:var(--font-data)] font-semibold md:order-1 md:text-right">
          {bilgiler[mac.ev_id]?.ad ?? "?"}
        </span>
        <Girdi
          aria-label="Ev sahibi skoru"
          inputMode="numeric"
          value={ev}
          onChange={(e) => setEv(e.target.value.replace(/\D/g, ""))}
          className="text-center font-[family-name:var(--font-display)] text-xl md:order-2"
        />
        <span className="truncate font-[family-name:var(--font-data)] font-semibold md:order-5">
          {bilgiler[mac.dep_id]?.ad ?? "?"}
        </span>
        <Girdi
          aria-label="Deplasman skoru"
          inputMode="numeric"
          value={dep}
          onChange={(e) => setDep(e.target.value.replace(/\D/g, ""))}
          className="text-center font-[family-name:var(--font-display)] text-xl md:order-4"
        />
        <span className="hidden text-center text-muted-dark md:order-3 md:block">–</span>
      </div>

      <div className="flex justify-end gap-2">
        <Dugme type="button" onClick={kaydet} disabled={!degisti || bekle}>
          Kaydet
        </Dugme>
        {mac.ev_skor !== null && mac.dep_skor !== null && (
          <Dugme type="button" tur="ikincil" onClick={() => setGorsel(true)}>
            Görsel
          </Dugme>
        )}
        <Dugme type="button" tur="tehlike" onClick={sil}>
          Sil
        </Dugme>
      </div>

      {gorsel && mac.ev_skor !== null && mac.dep_skor !== null && (
        <MacGorseli
          kapat={() => setGorsel(false)}
          mac={{
            evAd: bilgiler[mac.ev_id]?.ad ?? "?",
            depAd: bilgiler[mac.dep_id]?.ad ?? "?",
            evLogo: bilgiler[mac.ev_id]?.logo,
            depLogo: bilgiler[mac.dep_id]?.logo,
            evSkor: mac.ev_skor,
            depSkor: mac.dep_skor,
            tarih: mac.oynanma,
            sezon: SITE.sezon,
            hukmen: mac.durum === "hukmen",
          }}
        />
      )}
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
  // Tarih sunucuda değil, tarayıcıda belirlenir: sayfa hangi gün açıldıysa o günün
  // tarihi gelir. Panel gece boyunca açık kalırsa sekmeye dönüldüğünde tazelenir —
  // ama sen tarihi elle değiştirdiysen dokunulmaz.
  const [tarih, setTarih] = useState("");
  const [elleSecildi, setElleSecildi] = useState(false);
  const [evId, setEvId] = useState("");
  const [depId, setDepId] = useState("");
  const [ev, setEv] = useState("");
  const [dep, setDep] = useState("");
  const [bekle, setBekle] = useState(false);

  useEffect(() => {
    if (!elleSecildi) setTarih(bugun());
    function tazele() {
      if (!document.hidden && !elleSecildi) setTarih(bugun());
    }
    document.addEventListener("visibilitychange", tazele);
    return () => document.removeEventListener("visibilitychange", tazele);
  }, [elleSecildi]);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (!evId || !depId) return hataVer("İki takımı da seç.");
    if (evId === depId) return hataVer("Bir takım kendisiyle oynayamaz.");
    setBekle(true);
    try {
      await macEkle({
        sezon_id: sezonId,
        hafta: null,
        oynanma: tarihiIsoYap(tarih),
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
      // Arka arkaya sonuç girerken tarih yine bugüne dönsün.
      setElleSecildi(false);
      setTarih(bugun());
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
            <Girdi
              id="tarih"
              type="date"
              value={tarih}
              onChange={(e) => {
                setElleSecildi(true);
                setTarih(e.target.value);
              }}
            />
          </Alan>
        </div>

        {/* Mobilde: her takım kendi skoruyla aynı satırda.
            Masaüstünde: ev · skor · skor · deplasman (order sınıflarıyla). */}
        <div className="grid grid-cols-[1fr_84px] items-end gap-3 md:grid-cols-[1fr_80px_80px_1fr]">
          <div className="md:order-1">
            <Alan etiket="Ev sahibi">
              <TakimSecici takimlar={takimlar} deger={evId} degistir={setEvId} />
            </Alan>
          </div>
          <div className="md:order-2">
            <Alan etiket="Skor">
              <Girdi
                inputMode="numeric"
                value={ev}
                onChange={(e) => setEv(e.target.value.replace(/\D/g, ""))}
                className="text-center font-[family-name:var(--font-display)] text-xl"
              />
            </Alan>
          </div>
          <div className="md:order-4">
            <Alan etiket="Deplasman">
              <TakimSecici takimlar={takimlar} deger={depId} degistir={setDepId} />
            </Alan>
          </div>
          <div className="md:order-3">
            <Alan etiket="Skor">
              <Girdi
                inputMode="numeric"
                value={dep}
                onChange={(e) => setDep(e.target.value.replace(/\D/g, ""))}
                className="text-center font-[family-name:var(--font-display)] text-xl"
              />
            </Alan>
          </div>
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
