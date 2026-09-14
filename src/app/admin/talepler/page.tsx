"use client";

import { useEffect, useState } from "react";
import { Bildirim, BosDurum, Dugme, Iskelet, Panel, Uyari } from "@/components/admin/ui";
import { talepOkundu, talepSil, talepleriGetir } from "@/lib/admin-veri";

type Talep = Awaited<ReturnType<typeof talepleriGetir>>[number];

export default function AdminTalepler() {
  const [talepler, setTalepler] = useState<Talep[]>([]);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bekle, setBekle] = useState(false);

  async function yenile() {
    try {
      const yeni = await talepleriGetir();
      setTalepler(yeni);
      // Silinen/kaybolan kayıtlar seçimde asılı kalmasın.
      setSecili((s) => new Set([...s].filter((id) => yeni.some((t) => t.id === id))));
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Talepler okunamadı.");
    }
    setYukleniyor(false);
  }

  useEffect(() => {
    yenile();
  }, []);

  function secimDegistir(id: string) {
    setSecili((s) => {
      const yeni = new Set(s);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return yeni;
    });
  }

  async function okunduDegistir(t: Talep) {
    try {
      await talepOkundu(t.id, !t.okundu);
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "İşaretlenemedi." });
    }
  }

  async function sil(idler: string[], soru: string) {
    if (!idler.length) return;
    if (!window.confirm(soru)) return;

    setBekle(true);
    try {
      const adet = await talepSil(idler);
      setMesaj({ tur: "basari", metin: `${adet} talep silindi.` });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Silinemedi." });
    }
    setBekle(false);
  }

  if (yukleniyor) return <Iskelet satir={2} />;
  if (hata) return <Uyari tur="hata">{hata}</Uyari>;

  const okunmamis = talepler.filter((t) => !t.okundu).length;
  const hepsiSecili = talepler.length > 0 && secili.size === talepler.length;

  return (
    <div className="grid gap-6">
      <Bildirim mesaj={mesaj} kapat={() => setMesaj(null)} />

      <Panel baslik="Gelen talepler" sag={`${okunmamis} okunmamış / ${talepler.length} toplam`}>
        {talepler.length === 0 ? (
          <BosDurum
            simge="✉"
            baslik="Henüz talep yok"
            metin="Siteden iletişim veya katılım formu gönderildiğinde burada listelenir."
          />
        ) : (
          <>
            {/* Toplu işlem çubuğu — seçim varken içeriği değişiyor. */}
            <div className="flex flex-wrap items-center gap-3 border-b border-white/8 px-4 py-3">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#cfe0d5]">
                <input
                  type="checkbox"
                  checked={hepsiSecili}
                  onChange={(e) =>
                    setSecili(e.target.checked ? new Set(talepler.map((t) => t.id)) : new Set())
                  }
                  className="h-4 w-4 accent-[#17A33A]"
                />
                Tümünü seç
              </label>

              {secili.size > 0 && (
                <>
                  <span className="text-sm text-muted-dark">{secili.size} seçildi</span>
                  <div className="ml-auto flex gap-2">
                    <Dugme type="button" tur="ikincil" onClick={() => setSecili(new Set())}>
                      Seçimi bırak
                    </Dugme>
                    <Dugme
                      type="button"
                      tur="tehlike"
                      disabled={bekle}
                      onClick={() =>
                        sil(
                          [...secili],
                          `${secili.size} talep kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`,
                        )
                      }
                    >
                      {bekle ? "Siliniyor…" : `Seçilenleri sil (${secili.size})`}
                    </Dugme>
                  </div>
                </>
              )}
            </div>

            <ul className="divide-y divide-white/8">
              {talepler.map((t) => (
                <li
                  key={t.id}
                  className={`grid gap-2 p-4 md:grid-cols-[auto_1fr_auto] md:items-start ${
                    secili.has(t.id) ? "bg-brand/8" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    aria-label={`${t.ad ?? "İsimsiz"} talebini seç`}
                    checked={secili.has(t.id)}
                    onChange={() => secimDegistir(t.id)}
                    className="mt-1 h-4 w-4 accent-[#17A33A]"
                  />

                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-data)]">
                      <span className="font-bold">{t.ad ?? "İsimsiz"}</span>
                      {t.takim && <span className="text-muted-dark"> · {t.takim}</span>}
                      {t.telefon && <span className="text-muted-dark"> · {t.telefon}</span>}
                    </p>
                    {t.mesaj && <p className="mt-1 text-sm text-[#cfe0d5]">{t.mesaj}</p>}
                    <p className="mt-1 text-xs text-muted-dark">
                      {t.tur === "katilim" ? "Katılım" : "İletişim"} ·{" "}
                      {new Date(t.olusturuldu).toLocaleString("tr-TR")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-start justify-end gap-2">
                    {t.telefon && (
                      <a
                        href={`https://wa.me/${t.telefon.replace(/\D/g, "").replace(/^0/, "90")}`}
                        target="_blank"
                        rel="noopener"
                        className="rounded-sm border border-white/20 px-3 py-1.5 font-[family-name:var(--font-data)] text-xs tracking-wider text-[#cfe0d5] uppercase hover:border-brand-lite hover:text-white"
                      >
                        WhatsApp
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => okunduDegistir(t)}
                      className={`rounded-sm border px-3 py-1.5 font-[family-name:var(--font-data)] text-xs tracking-wider uppercase ${
                        t.okundu
                          ? "border-white/15 text-muted-dark"
                          : "border-brand/50 bg-brand/15 text-brand-lite"
                      }`}
                    >
                      {t.okundu ? "Okundu" : "Okundu işaretle"}
                    </button>
                    <button
                      type="button"
                      disabled={bekle}
                      onClick={() =>
                        sil([t.id], `${t.ad ?? "Bu"} talebi kalıcı olarak silinsin mi?`)
                      }
                      className="rounded-sm border border-lose/50 px-3 py-1.5 font-[family-name:var(--font-data)] text-xs tracking-wider text-[#ff9a8f] uppercase hover:bg-lose/15 disabled:opacity-40"
                    >
                      Sil
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <Uyari>
        Silme geri alınamaz — talep kaydı tamamen gider. Sık gelen ama işe yaramayan
        kayıtları temizlemek için kutuları işaretleyip{" "}
        <strong>Seçilenleri sil</strong> kullanabilirsin.
      </Uyari>
    </div>
  );
}
