"use client";

import { useEffect, useState } from "react";
import { Alan, Dugme, Girdi, Panel, Secim, Uyari } from "@/components/admin/ui";
import {
  bugun,
  duyuruEkle,
  duyuruGuncelle,
  duyuruSil,
  duyurulariGetir,
  type Duyuru,
} from "@/lib/admin-veri";

const metinSinif =
  "w-full rounded-sm border border-white/15 bg-[#07200f] px-3 py-2.5 text-white placeholder:text-white/30 focus:border-brand-lite";

export default function AdminDuyurular() {
  const [kayitlar, setKayitlar] = useState<Duyuru[]>([]);
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  async function yenile() {
    try {
      setKayitlar(await duyurulariGetir());
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

  const duyurular = kayitlar.filter((k) => k.tur === "duyuru");
  const kurallar = kayitlar.filter((k) => k.tur === "kural");

  return (
    <div className="grid gap-6">
      {mesaj && <Uyari tur={mesaj.tur}>{mesaj.metin}</Uyari>}

      <YeniKayit
        kaydedildi={async (metin) => {
          setMesaj({ tur: "basari", metin });
          await yenile();
        }}
        hataVer={(metin) => setMesaj({ tur: "hata", metin })}
      />

      {yukleniyor ? (
        <p className="text-muted-dark">Yükleniyor…</p>
      ) : (
        <>
          <Panel baslik="Duyurular" sag={`${duyurular.length} kayıt`}>
            {duyurular.length === 0 ? (
              <p className="p-5 text-sm text-muted-dark">Henüz duyuru yok.</p>
            ) : (
              <ul className="divide-y divide-white/8">
                {duyurular.map((d) => (
                  <Satir key={d.id} kayit={d} yenile={yenile} setMesaj={setMesaj} />
                ))}
              </ul>
            )}
          </Panel>

          <Panel baslik="Lig kuralları" sag={`${kurallar.length} kayıt`}>
            {kurallar.length === 0 ? (
              <p className="p-5 text-sm text-muted-dark">Henüz kural yok.</p>
            ) : (
              <ul className="divide-y divide-white/8">
                {kurallar.map((d) => (
                  <Satir key={d.id} kayit={d} yenile={yenile} setMesaj={setMesaj} />
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}

      <Uyari>
        Duyurular tarihe göre yeniden eskiye, kurallar verdiğin sıra numarasına göre
        dizilir. <strong>Öne çıkar</strong> işaretlediğin kayıt en üstte, altın çerçeveli
        görünür. Metinde paragrafları boş satır bırakarak ayırabilirsin.
      </Uyari>
    </div>
  );
}

function YeniKayit({
  kaydedildi,
  hataVer,
}: {
  kaydedildi: (metin: string) => Promise<void>;
  hataVer: (metin: string) => void;
}) {
  const [tur, setTur] = useState<"duyuru" | "kural">("duyuru");
  const [tarih, setTarih] = useState("");
  const [baslik, setBaslik] = useState("");
  const [metin, setMetin] = useState("");
  const [sabit, setSabit] = useState(false);
  const [sira, setSira] = useState("0");
  const [bekle, setBekle] = useState(false);

  useEffect(() => {
    setTarih(bugun());
  }, []);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (!baslik.trim()) return hataVer("Başlık gerekli.");
    setBekle(true);
    try {
      await duyuruEkle({
        tur,
        tarih: tur === "duyuru" ? tarih || bugun() : null,
        baslik: baslik.trim(),
        metin: metin.trim(),
        sabit,
        sira: Number(sira) || 0,
      });
      setBaslik("");
      setMetin("");
      setSabit(false);
      setTarih(bugun());
      await kaydedildi(tur === "duyuru" ? "Duyuru eklendi." : "Kural eklendi.");
    } catch (err) {
      hataVer(err instanceof Error ? err.message : "Eklenemedi.");
    }
    setBekle(false);
  }

  return (
    <Panel baslik="Yeni kayıt" sag="Duyuru veya kural">
      <form onSubmit={gonder} className="grid gap-4 p-4">
        <div className="grid gap-4 sm:grid-cols-[160px_200px_1fr]">
          <Alan etiket="Tür">
            <Secim value={tur} onChange={(e) => setTur(e.target.value as "duyuru" | "kural")}>
              <option value="duyuru">Duyuru</option>
              <option value="kural">Kural</option>
            </Secim>
          </Alan>

          {tur === "duyuru" ? (
            <Alan etiket="Tarih">
              <Girdi type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
            </Alan>
          ) : (
            <Alan etiket="Sıra numarası">
              <Girdi
                inputMode="numeric"
                value={sira}
                onChange={(e) => setSira(e.target.value.replace(/\D/g, ""))}
              />
            </Alan>
          )}

          <Alan etiket="Başlık">
            <Girdi
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              placeholder={tur === "duyuru" ? "Bu hafta maçlar ertelendi" : "Maç saati ve geç kalma"}
            />
          </Alan>
        </div>

        <Alan etiket="Metin">
          <textarea
            rows={4}
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            className={metinSinif}
          />
        </Alan>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2.5 text-sm text-[#cfe0d5]">
            <input
              type="checkbox"
              checked={sabit}
              onChange={(e) => setSabit(e.target.checked)}
              className="h-4 w-4"
            />
            Öne çıkar (en üstte göster)
          </label>
          <Dugme type="submit" disabled={bekle}>
            {bekle ? "Kaydediliyor…" : "Kaydet"}
          </Dugme>
        </div>
      </form>
    </Panel>
  );
}

function Satir({
  kayit,
  yenile,
  setMesaj,
}: {
  kayit: Duyuru;
  yenile: () => Promise<void>;
  setMesaj: (m: { tur: "basari" | "hata"; metin: string }) => void;
}) {
  const [acik, setAcik] = useState(false);
  const [baslik, setBaslik] = useState(kayit.baslik);
  const [metin, setMetin] = useState(kayit.metin);
  const [tarih, setTarih] = useState(kayit.tarih ?? "");
  const [sira, setSira] = useState(String(kayit.sira));
  const [bekle, setBekle] = useState(false);

  async function kaydet() {
    setBekle(true);
    try {
      await duyuruGuncelle(kayit.id, {
        baslik: baslik.trim(),
        metin: metin.trim(),
        tarih: kayit.tur === "duyuru" ? tarih || null : null,
        sira: Number(sira) || 0,
      });
      setMesaj({ tur: "basari", metin: "Güncellendi." });
      setAcik(false);
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Kaydedilemedi." });
    }
    setBekle(false);
  }

  async function degistir(degisiklik: Partial<Duyuru>) {
    try {
      await duyuruGuncelle(kayit.id, degisiklik);
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Güncellenemedi." });
    }
  }

  async function sil() {
    if (!window.confirm(`"${kayit.baslik}" silinsin mi?`)) return;
    try {
      await duyuruSil(kayit.id);
      setMesaj({ tur: "basari", metin: "Silindi." });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Silinemedi." });
    }
  }

  return (
    <li className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-[family-name:var(--font-data)] text-xs tracking-[0.12em] text-muted-dark uppercase">
          {kayit.tur === "duyuru"
            ? (kayit.tarih ?? "tarihsiz")
            : `#${kayit.sira}`}
        </span>
        <span className="font-[family-name:var(--font-data)] font-semibold">{kayit.baslik}</span>
        {kayit.sabit && (
          <span className="rounded-full border border-gold/50 bg-gold/15 px-2 py-0.5 text-[11px] tracking-wider text-gold uppercase">
            Öne çıkan
          </span>
        )}
        {!kayit.yayinda && (
          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] tracking-wider text-muted-dark uppercase">
            Gizli
          </span>
        )}

        <div className="ml-auto flex flex-wrap gap-2">
          <Dugme type="button" tur="ikincil" onClick={() => setAcik((v) => !v)}>
            {acik ? "Kapat" : "Düzenle"}
          </Dugme>
          <Dugme type="button" tur="ikincil" onClick={() => degistir({ sabit: !kayit.sabit })}>
            {kayit.sabit ? "Öne çıkarma" : "Öne çıkar"}
          </Dugme>
          <Dugme type="button" tur="ikincil" onClick={() => degistir({ yayinda: !kayit.yayinda })}>
            {kayit.yayinda ? "Gizle" : "Yayınla"}
          </Dugme>
          <Dugme type="button" tur="tehlike" onClick={sil}>
            Sil
          </Dugme>
        </div>
      </div>

      {acik && (
        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            {kayit.tur === "duyuru" ? (
              <Alan etiket="Tarih">
                <Girdi type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
              </Alan>
            ) : (
              <Alan etiket="Sıra numarası">
                <Girdi
                  inputMode="numeric"
                  value={sira}
                  onChange={(e) => setSira(e.target.value.replace(/\D/g, ""))}
                />
              </Alan>
            )}
            <Alan etiket="Başlık">
              <Girdi value={baslik} onChange={(e) => setBaslik(e.target.value)} />
            </Alan>
          </div>
          <Alan etiket="Metin">
            <textarea
              rows={4}
              value={metin}
              onChange={(e) => setMetin(e.target.value)}
              className={metinSinif}
            />
          </Alan>
          <div>
            <Dugme type="button" onClick={kaydet} disabled={bekle}>
              {bekle ? "Kaydediliyor…" : "Değişikliği Kaydet"}
            </Dugme>
          </div>
        </div>
      )}
    </li>
  );
}
