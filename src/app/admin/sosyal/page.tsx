"use client";

import { useEffect, useState } from "react";
import { Alan, Dugme, Girdi, Panel, Uyari } from "@/components/admin/ui";
import {
  sosyalEkle,
  sosyalGetir,
  sosyalGuncelle,
  sosyalSil,
  type SosyalKayit,
} from "@/lib/admin-veri";
import { instagramPermalink, turTahmini, youtubeId } from "@/lib/sosyal";

export default function AdminSosyal() {
  const [kayitlar, setKayitlar] = useState<SosyalKayit[]>([]);
  const [url, setUrl] = useState("");
  const [baslik, setBaslik] = useState("");
  const [mesaj, setMesaj] = useState<{ tur: "basari" | "hata"; metin: string } | null>(null);
  const [bekle, setBekle] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  const tur = url.trim() ? turTahmini(url) : null;

  async function yenile() {
    try {
      setKayitlar(await sosyalGetir());
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "İçerikler okunamadı." });
    }
    setYukleniyor(false);
  }

  useEffect(() => {
    yenile();
  }, []);

  async function ekle(e: React.FormEvent) {
    e.preventDefault();
    if (!tur) {
      setMesaj({
        tur: "hata",
        metin: "Bağlantı tanınmadı. Instagram gönderi/reel veya YouTube video adresi yapıştır.",
      });
      return;
    }
    setBekle(true);
    try {
      await sosyalEkle({ tur, url: url.trim(), baslik: baslik.trim() || null });
      setUrl("");
      setBaslik("");
      setMesaj({ tur: "basari", metin: "İçerik eklendi. Sitede bir dakika içinde görünür." });
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Eklenemedi." });
    }
    setBekle(false);
  }

  async function sil(k: SosyalKayit) {
    if (!window.confirm("Bu içerik kaldırılsın mı?")) return;
    try {
      await sosyalSil(k.id);
      await yenile();
    } catch (e) {
      setMesaj({ tur: "hata", metin: e instanceof Error ? e.message : "Silinemedi." });
    }
  }

  async function siraDegistir(k: SosyalKayit, yon: -1 | 1) {
    await sosyalGuncelle(k.id, { sira: k.sira + yon });
    await yenile();
  }

  if (yukleniyor) return <p className="text-muted-dark">Yükleniyor…</p>;

  const yayinda = kayitlar.filter((k) => k.yayinda).length;

  return (
    <div className="grid gap-6">
      {mesaj && <Uyari tur={mesaj.tur}>{mesaj.metin}</Uyari>}

      <Panel baslik="İçerik ekle" sag="Anasayfada en fazla 6 içerik gösterilir">
        <form onSubmit={ekle} className="grid gap-4 p-4">
          <Alan etiket="Bağlantı">
            <Girdi
              id="sosyal-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/... veya https://www.youtube.com/watch?v=..."
            />
          </Alan>
          <Alan etiket="Başlık (isteğe bağlı)">
            <Girdi
              id="sosyal-baslik"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              placeholder="Curcuna FC – Hane FC özeti"
            />
          </Alan>

          <p className="text-sm">
            {url.trim() === "" ? (
              <span className="text-muted-dark">
                Instagram gönderisi/reel&apos;i veya YouTube videosunun adresini yapıştır.
              </span>
            ) : tur === "youtube" ? (
              <span className="text-brand-lite">YouTube videosu tanındı ✓</span>
            ) : tur === "instagram" ? (
              <span className="text-brand-lite">Instagram gönderisi tanındı ✓</span>
            ) : (
              <span className="text-[#ff9a8f]">
                Bu bağlantı tanınmadı. Instagram için /p/ veya /reel/ içeren adres, YouTube için
                watch, youtu.be veya shorts adresi olmalı.
              </span>
            )}
          </p>

          <div>
            <Dugme type="submit" disabled={bekle || !tur}>
              {bekle ? "Ekleniyor…" : "Ekle"}
            </Dugme>
          </div>
        </form>
      </Panel>

      <Panel baslik="Eklenen içerikler" sag={`${yayinda} yayında / ${kayitlar.length} toplam`}>
        {kayitlar.length === 0 ? (
          <p className="p-5 text-sm text-muted-dark">
            Henüz içerik yok. Eklediğinde anasayfada &quot;Sosyal medya&quot; bölümü görünür.
          </p>
        ) : (
          <ul className="divide-y divide-white/8">
            {kayitlar.map((k) => {
              const id = k.tur === "youtube" ? youtubeId(k.url) : null;
              return (
                <li key={k.id} className="grid gap-3 p-4 md:grid-cols-[128px_1fr_auto] md:items-center">
                  <div className="relative aspect-video overflow-hidden rounded border border-white/12 bg-black/40">
                    {id ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full place-items-center font-[family-name:var(--font-data)] text-xs uppercase tracking-wider text-muted-dark">
                        Instagram
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-data)] font-bold">
                      {k.baslik ?? (k.tur === "youtube" ? "YouTube videosu" : "Instagram gönderisi")}
                    </p>
                    <a
                      href={k.tur === "instagram" ? (instagramPermalink(k.url) ?? k.url) : k.url}
                      target="_blank"
                      rel="noopener"
                      className="block truncate text-sm text-muted-dark hover:text-brand-lite"
                    >
                      {k.url}
                    </a>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => siraDegistir(k, -1)}
                      aria-label="Yukarı taşı"
                      className="rounded-sm border border-white/20 px-3 py-1.5 text-xs text-[#cfe0d5] hover:border-brand-lite hover:text-white"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => siraDegistir(k, 1)}
                      aria-label="Aşağı taşı"
                      className="rounded-sm border border-white/20 px-3 py-1.5 text-xs text-[#cfe0d5] hover:border-brand-lite hover:text-white"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await sosyalGuncelle(k.id, { yayinda: !k.yayinda });
                        await yenile();
                      }}
                      className={`rounded-sm border px-3 py-1.5 font-[family-name:var(--font-data)] text-xs uppercase tracking-wider ${
                        k.yayinda
                          ? "border-brand/50 bg-brand/15 text-brand-lite"
                          : "border-white/15 text-muted-dark"
                      }`}
                    >
                      {k.yayinda ? "Yayında" : "Gizli"}
                    </button>
                    <button
                      type="button"
                      onClick={() => sil(k)}
                      className="rounded-sm border border-lose/50 px-3 py-1.5 font-[family-name:var(--font-data)] text-xs uppercase tracking-wider text-[#ff9a8f] hover:bg-lose/15"
                    >
                      Sil
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Uyari>
        Instagram gönderisinin herkese açık bir hesapta olması gerekiyor; gizli hesaplardaki
        gönderiler sitede görünmez. Bölümün başlığı ve açıklaması Ayarlar sekmesinden değiştirilir.
      </Uyari>
    </div>
  );
}
