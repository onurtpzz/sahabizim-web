"use client";

import { useEffect, useState } from "react";
import { Alan, Bildirim, Dugme, Girdi, Panel, TehlikeliBolge } from "@/components/admin/ui";
import { sezonlariGetir, sezonuArsivle, yeniSezon, type Sezon } from "@/lib/admin-veri";

export default function AdminSezon() {
  const [sezonlar, setSezonlar] = useState<Sezon[]>([]);
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);
  const [ad, setAd] = useState("");
  const [onay, setOnay] = useState("");
  const [tasi, setTasi] = useState(true);
  const [bekle, setBekle] = useState(false);
  const [arsivBekle, setArsivBekle] = useState(false);

  async function yenile() {
    try {
      setSezonlar(await sezonlariGetir());
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Sezonlar okunamadı." });
    }
  }

  useEffect(() => {
    yenile();
  }, []);

  const aktif = sezonlar.find((s) => s.aktif);

  async function baslat(e: React.FormEvent) {
    e.preventDefault();
    if (onay.trim() !== "SIFIRLA") {
      setMesaj({ tur: "hata", metin: "Onaylamak için kutuya SIFIRLA yaz." });
      return;
    }
    if (!ad.trim()) {
      setMesaj({ tur: "hata", metin: "Yeni sezon adı gerekli." });
      return;
    }
    setBekle(true);
    try {
      await yeniSezon(ad.trim(), tasi);
      setAd("");
      setOnay("");
      setMesaj({ tur: "basari", metin: "Yeni sezon başladı. Puan durumu sıfırlandı." });
      await yenile();
    } catch (err) {
      setMesaj({ tur: "hata", metin: err instanceof Error ? err.message : "İşlem başarısız." });
    }
    setBekle(false);
  }

  return (
    <div className="grid gap-6">
      <Bildirim mesaj={mesaj} kapat={() => setMesaj(null)} />

      <Panel baslik="Sezonlar" sag={aktif ? `Aktif: ${aktif.ad}` : "Aktif sezon yok"}>
        <ul className="divide-y divide-white/8">
          {sezonlar.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="font-[family-name:var(--font-data)] text-lg font-bold">{s.ad}</span>
              {s.aktif ? (
                <span className="rounded-full border border-brand/50 bg-brand/15 px-2.5 py-1 text-xs uppercase tracking-wider text-brand-lite">
                  Aktif
                </span>
              ) : (
                <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs uppercase tracking-wider text-muted-dark">
                  Arşiv
                </span>
              )}
              <span className="ml-auto text-sm text-muted-dark">
                {s.basladi ?? "—"} {s.bitti ? `→ ${s.bitti}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel baslik="Şimdi arşivle" sag="Sezonu bitirmeden yedek al">
        <div className="grid gap-3 p-4">
          <p className="text-sm text-[#cfe0d5]">
            Şu anki puan durumunun bir kopyasını arşive yazar; sezon açık kalmaya devam
            eder. Aynı sezon için tekrar bastığında kopya güncellenir. Sezonu bitirdiğinde
            bu zaten kendiliğinden yapılır — bu buton sadece ekstra güvence.
          </p>
          <div>
            <Dugme
              type="button"
              tur="ikincil"
              disabled={!aktif || arsivBekle}
              onClick={async () => {
                if (!aktif) return;
                setArsivBekle(true);
                try {
                  const adet = await sezonuArsivle(aktif.id);
                  setMesaj({
                    tur: "basari",
                    metin: `${adet} takım ${aktif.ad} sezonunun arşivine yazıldı.`,
                  });
                } catch (e) {
                  setMesaj({
                    tur: "hata",
                    metin: e instanceof Error ? e.message : "Arşivlenemedi.",
                  });
                }
                setArsivBekle(false);
              }}
            >
              {arsivBekle ? "Arşivleniyor…" : "Puan durumunu arşive kopyala"}
            </Dugme>
          </div>
        </div>
      </Panel>

      <TehlikeliBolge
        baslik="Tehlikeli bölge — sezonu bitir"
        aciklama={
          <>
            <strong>Bu işlem geri alınamaz.</strong> Mevcut sezon arşive kaldırılır, tüm
            takımların puanı, galibiyeti ve gol istatistiği sıfırlanır. Geçmiş maç kayıtları
            eski sezonda kalır. Sezon bittiğinde, yalnızca sezon bittiğinde kullan.
          </>
        }
      >
        <form onSubmit={baslat} className="grid gap-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Alan etiket="Yeni sezon adı">
              <Girdi
                id="sezon-ad"
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                placeholder="2027–2028"
              />
            </Alan>
            <Alan etiket="Onay — kutuya SIFIRLA yaz">
              <Girdi id="sezon-onay" value={onay} onChange={(e) => setOnay(e.target.value)} />
            </Alan>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-[#cfe0d5]">
            <input
              id="tasi"
              type="checkbox"
              checked={tasi}
              onChange={(e) => setTasi(e.target.checked)}
              className="h-4 w-4"
            />
            Mevcut takımlar yeni sezonda da aktif kalsın
          </label>

          <div>
            <Dugme type="submit" tur="tehlike" disabled={bekle}>
              {bekle ? "İşleniyor…" : "Sezonu Bitir ve Yeni Sezon Başlat"}
            </Dugme>
          </div>
        </form>
      </TehlikeliBolge>
    </div>
  );
}
