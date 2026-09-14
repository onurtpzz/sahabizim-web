"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alan,
  Bildirim,
  BosDurum,
  Dugme,
  Girdi,
  Iskelet,
  Panel,
  TakimSecici,
  Uyari,
} from "@/components/admin/ui";
import { MacGorseli } from "@/components/admin/mac-gorseli";
import { useKirli } from "@/lib/kirli";
import { SITE } from "@/lib/site";
import {
  aktifSezon,
  bugun,
  isoSaati,
  isoTarihi,
  macEkle,
  tarihiIsoYap,
  macSil,
  maclariGetir,
  saatBelirsizMi,
  macKaydet,
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
  const [arama, setArama] = useState("");
  const [sadeceSkorsuz, setSadeceSkorsuz] = useState(false);
  // Sezon ilerledikçe liste binleri buluyor; hepsini birden basmak sayfayı
  // yavaşlatıyordu. Kademeli gösteriyoruz.
  const [gosterilen, setGosterilen] = useState(60);

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

  if (yukleniyor) return <Iskelet satir={3} />;

  if (!sezon) {
    return (
      <Uyari tur="hata">
        Aktif sezon bulunamadı. Sezon sekmesinden bir sezon başlat.
      </Uyari>
    );
  }

  const anahtar = arama.trim().toLocaleLowerCase("tr");
  const eslesir = (m: Mac) =>
    !anahtar ||
    (bilgiler[m.ev_id]?.ad ?? "").toLocaleLowerCase("tr").includes(anahtar) ||
    (bilgiler[m.dep_id]?.ad ?? "").toLocaleLowerCase("tr").includes(anahtar);

  const bekleyen = maclar.filter((m) => m.durum === "oynanacak" && eslesir(m));
  const tumOynanan = maclar.filter((m) => m.durum !== "oynanacak" && eslesir(m));
  const oynanan = tumOynanan.slice(0, gosterilen);
  const suzuluyor = anahtar !== "" || sadeceSkorsuz;

  return (
    <div className="grid gap-6">
      <Bildirim mesaj={mesaj} kapat={() => setMesaj(null)} />

      <YeniMac
        sezonId={sezon.id}
        takimlar={takimlar}
        kaydedildi={async (metin) => {
          setMesaj({ tur: "basari", metin });
          await yenile();
        }}
        hataVer={(metin) => setMesaj({ tur: "hata", metin })}
      />

      <Panel baslik="Listede ara">
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <Girdi
            type="search"
            aria-label="Takım adına göre ara"
            placeholder="Takım adı yaz — iki taraf da aranır"
            value={arama}
            onChange={(e) => {
              setArama(e.target.value);
              setGosterilen(60);
            }}
          />
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#cfe0d5]">
            <input
              type="checkbox"
              checked={sadeceSkorsuz}
              onChange={(e) => setSadeceSkorsuz(e.target.checked)}
              className="h-4 w-4 accent-[#17A33A]"
            />
            Sadece skoru girilmemişler
          </label>
        </div>
      </Panel>

      {bekleyen.length > 0 && (
        <Panel baslik="Skor bekleyen maçlar" sag={`${bekleyen.length} maç`}>
          <ul className="divide-y divide-white/8">
            {bekleyen.map((m) => (
              <MacSatiri key={m.id} mac={m} bilgiler={bilgiler} yenile={yenile} setMesaj={setMesaj} />
            ))}
          </ul>
        </Panel>
      )}

      {sadeceSkorsuz && bekleyen.length === 0 && (
        <Panel baslik="Skor bekleyen maçlar">
          <p className="p-5 text-sm text-muted-dark">
            {anahtar
              ? "Bu aramayla eşleşen, skoru girilmemiş maç yok."
              : "Skoru girilmemiş maç yok — hepsi tamam."}
          </p>
        </Panel>
      )}

      {!sadeceSkorsuz && (
      <Panel
        baslik="Girilen sonuçlar"
        sag={
          tumOynanan.length > oynanan.length
            ? `${oynanan.length} / ${tumOynanan.length} maç`
            : `${tumOynanan.length} maç`
        }
      >
        {oynanan.length === 0 ? (
          <BosDurum
            simge="⚽"
            baslik={suzuluyor ? "Eşleşen sonuç yok" : "Henüz sonuç girilmedi"}
            metin={
              suzuluyor
                ? "Arama kutusunu temizleyip tekrar dene."
                : "Yukarıdaki formdan maç ekleyip skorunu girebilirsin. Skoru boş bırakırsan maç fikstüre düşer."
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-white/8">
              {oynanan.map((m) => (
                <MacSatiri key={m.id} mac={m} bilgiler={bilgiler} yenile={yenile} setMesaj={setMesaj} />
              ))}
            </ul>
            {tumOynanan.length > oynanan.length && (
              <div className="border-t border-white/8 p-4">
                <Dugme type="button" tur="ikincil" onClick={() => setGosterilen((n) => n + 60)}>
                  Daha fazla göster ({tumOynanan.length - oynanan.length} maç kaldı)
                </Dugme>
              </div>
            )}
          </>
        )}
      </Panel>
      )}

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

  // Tarih ve saat de buradan düzenlenebiliyor: saat alanı sonradan
  // eklendiği için eski maçlarda saat yer tutucu (öğlen) olarak duruyor,
  // duyuru görseli paylaşmadan önce buradan düzeltiliyor.
  const ilkTarih = isoTarihi(mac.oynanma);
  const ilkSaat = saatBelirsizMi(mac.oynanma) ? "" : isoSaati(mac.oynanma);
  const [tarih, setTarih] = useState(ilkTarih);
  const [saat, setSaat] = useState(ilkSaat);

  const skorDegisti =
    ev !== (mac.ev_skor?.toString() ?? "") || dep !== (mac.dep_skor?.toString() ?? "");
  const zamanDegisti = tarih !== ilkTarih || saat !== ilkSaat;
  const degisti = skorDegisti || zamanDegisti;

  // Kaydedilmemiş değişiklik defterine yazılıyor; layout menüden çıkışta soruyor.
  useKirli(`mac:${mac.id}`, degisti);

  /** Skor kutusundayken Enter — telefondan arka arkaya sonuç girerken hızlı. */
  function enterIleKaydet(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && degisti && !bekle) {
      e.preventDefault();
      kaydet();
    }
  }

  async function kaydet() {
    // Tek skor girilmesi engelleniyor: eskiden (3, boş) kaydediliyor, maç
    // "oynanacak" kalıyordu. Panel "kaydedildi" diyor, maç puana girmiyor ve
    // yarım girildiği hiçbir yerde görünmüyordu.
    if (skorDegisti && (ev === "") !== (dep === "")) {
      return setMesaj({
        tur: "hata",
        metin: "İki takımın da skorunu gir — biri boş bırakılamaz.",
      });
    }

    setBekle(true);
    try {
      // Tarih ve skor tek yazmada gidiyor: ayrı ayrı gönderilirken ikincisi
      // patlarsa ekran "kaydedilemedi" diyor ama tarih çoktan yazılmış oluyordu.
      await macKaydet(
        mac,
        skorDegisti
          ? {
              ...(zamanDegisti ? { oynanma: tarihiIsoYap(tarih, saat) } : {}),
              ev_skor: ev === "" ? null : Number(ev),
              dep_skor: dep === "" ? null : Number(dep),
            }
          : { oynanma: tarihiIsoYap(tarih, saat) },
      );
      setMesaj({
        tur: "basari",
        metin: skorDegisti ? "Maç kaydedildi." : "Tarih ve saat güncellendi.",
      });
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Kaydedilemedi." });
    }
    // Başarıda da hatada da ekranı veritabanıyla eşitliyoruz; yarım kalmış bir
    // yazmadan sonra kutuların eski değerleri göstermesi yanıltıcıydı.
    await yenile();
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
    <li
      className={`grid gap-3 p-4 md:grid-cols-[172px_1fr_auto] md:items-center ${
        degisti ? "border-l-[3px] border-l-gold bg-gold/5 pl-[13px] md:pl-[13px]" : ""
      }`}
    >
      <div className="grid grid-cols-[1fr_92px] gap-2">
        <Girdi
          aria-label="Maç tarihi"
          type="date"
          value={tarih}
          onChange={(e) => setTarih(e.target.value)}
          className="text-xs"
        />
        <Girdi
          aria-label="Maç saati"
          type="time"
          value={saat}
          onChange={(e) => setSaat(e.target.value)}
          className="text-xs"
        />
      </div>

      {/* Mobilde her takım kendi skorunun yanında; masaüstünde klasik karşılaşma dizilimi */}
      <div className="grid grid-cols-[1fr_76px] items-center gap-2 md:grid-cols-[1fr_56px_16px_56px_1fr]">
        <span className="truncate font-[family-name:var(--font-data)] font-semibold md:order-1 md:text-right">
          {bilgiler[mac.ev_id]?.ad ?? "?"}
        </span>
        <Girdi
          aria-label="Ev sahibi skoru"
          inputMode="numeric"
          value={ev}
          onChange={(e) => setEv(e.target.value.replace(/\D/g, ""))}
          onKeyDown={enterIleKaydet}
          className="h-14 text-center font-[family-name:var(--font-display)] text-3xl md:order-2 md:h-auto md:text-xl"
        />
        <span className="truncate font-[family-name:var(--font-data)] font-semibold md:order-5">
          {bilgiler[mac.dep_id]?.ad ?? "?"}
        </span>
        <Girdi
          aria-label="Deplasman skoru"
          inputMode="numeric"
          value={dep}
          onChange={(e) => setDep(e.target.value.replace(/\D/g, ""))}
          onKeyDown={enterIleKaydet}
          className="h-14 text-center font-[family-name:var(--font-display)] text-3xl md:order-4 md:h-auto md:text-xl"
        />
        <span className="hidden text-center text-muted-dark md:order-3 md:block">–</span>
      </div>

      <div className="flex justify-end gap-2">
        <Dugme
          type="button"
          onClick={kaydet}
          disabled={!degisti || bekle}
          className={degisti ? "ring-2 ring-gold/70" : ""}
        >
          {bekle ? "Kaydediliyor…" : degisti ? "Kaydet ●" : "Kaydet"}
        </Dugme>
        {/* Skor girilmemiş maçta duyuru, girilmişte sonuç görseli çıkar. */}
        <Dugme type="button" tur="ikincil" onClick={() => setGorsel(true)}>
          Görsel
        </Dugme>
        <Dugme type="button" tur="tehlike" onClick={sil}>
          Sil
        </Dugme>
      </div>

      {gorsel && (
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
            saatBelirsiz: saatBelirsizMi(mac.oynanma),
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
  const [saat, setSaat] = useState("");
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
    if ((ev === "") !== (dep === "")) {
      return hataVer("İki takımın da skorunu gir, ya da ikisini de boş bırak.");
    }
    setBekle(true);
    try {
      await macEkle({
        sezon_id: sezonId,
        oynanma: tarihiIsoYap(tarih, saat),
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
        <div className="grid max-w-[380px] grid-cols-[1fr_130px] gap-3">
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
          <Alan etiket="Saat">
            <Girdi
              id="saat"
              type="time"
              value={saat}
              onChange={(e) => setSaat(e.target.value)}
            />
          </Alan>
        </div>
        <p className="-mt-2 text-xs text-muted-dark">
          Saat, fikstür duyuru görselinde yazar. Boş bırakırsan görselde
          &ldquo;saat açıklanacak&rdquo; der, sonradan da girebilirsin.
        </p>

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
