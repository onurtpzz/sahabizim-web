"use client";

import { useEffect, useState } from "react";
import { Panel, Uyari } from "@/components/admin/ui";
import { talepOkundu, talepleriGetir } from "@/lib/admin-veri";

type Talep = Awaited<ReturnType<typeof talepleriGetir>>[number];

export default function AdminTalepler() {
  const [talepler, setTalepler] = useState<Talep[]>([]);
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);

  async function yenile() {
    try {
      setTalepler(await talepleriGetir());
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Talepler okunamadı.");
    }
    setYukleniyor(false);
  }

  useEffect(() => {
    yenile();
  }, []);

  if (yukleniyor) return <p className="text-muted-dark">Yükleniyor…</p>;
  if (hata) return <Uyari tur="hata">{hata}</Uyari>;

  return (
    <div className="grid gap-6">
      <Panel
        baslik="Gelen talepler"
        sag={`${talepler.filter((t) => !t.okundu).length} okunmamış`}
      >
        {talepler.length === 0 ? (
          <p className="p-5 text-sm text-muted-dark">
            Henüz talep yok. Siteden form gönderildiğinde burada listelenir.
          </p>
        ) : (
          <ul className="divide-y divide-white/8">
            {talepler.map((t) => (
              <li key={t.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-[family-name:var(--font-data)]">
                    <span className="font-bold">{t.ad ?? "İsimsiz"}</span>
                    {t.takim && <span className="text-muted-dark"> · {t.takim}</span>}
                    {t.telefon && <span className="text-muted-dark"> · {t.telefon}</span>}
                  </p>
                  {t.mesaj && <p className="mt-1 text-sm text-[#cfe0d5]">{t.mesaj}</p>}
                  <p className="mt-1 text-xs text-white/35">
                    {t.tur === "katilim" ? "Katılım" : "İletişim"} ·{" "}
                    {new Date(t.olusturuldu).toLocaleString("tr-TR")}
                  </p>
                </div>
                <div className="flex items-start justify-end gap-2">
                  {t.telefon && (
                    <a
                      href={`https://wa.me/${t.telefon.replace(/\D/g, "").replace(/^0/, "90")}`}
                      target="_blank"
                      rel="noopener"
                      className="rounded-sm border border-white/20 px-3 py-1.5 font-[family-name:var(--font-data)] text-xs uppercase tracking-wider text-[#cfe0d5] hover:border-brand-lite hover:text-white"
                    >
                      WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await talepOkundu(t.id, !t.okundu);
                      await yenile();
                    }}
                    className={`rounded-sm border px-3 py-1.5 font-[family-name:var(--font-data)] text-xs uppercase tracking-wider ${
                      t.okundu
                        ? "border-white/15 text-muted-dark"
                        : "border-brand/50 bg-brand/15 text-brand-lite"
                    }`}
                  >
                    {t.okundu ? "Okundu" : "Okundu işaretle"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
