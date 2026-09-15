"use client";

import { useState } from "react";
import { SITE, whatsappLink } from "@/lib/site";
import { supabase } from "@/lib/supabase";

type Tip = "katilim" | "iletisim";

export function WhatsappForm({ tip }: { tip: Tip }) {
  const [ad, setAd] = useState("");
  const [tel, setTel] = useState("");
  const [takim, setTakim] = useState("");
  const [mesaj, setMesaj] = useState("");

  const satirlar = [
    tip === "katilim"
      ? "Merhaba, SahaBizim Ligi'ne katılmak istiyorum."
      : "Merhaba, SahaBizim ile iletişime geçmek istiyorum.",
    ad && `Ad: ${ad}`,
    tel && `Telefon: ${tel}`,
    tip === "katilim" && takim ? `Takım: ${takim}` : "",
    mesaj,
  ].filter(Boolean);

  const link = whatsappLink(satirlar.join("\n"));

  return (
    <form
      className="rounded border border-line bg-white p-6"
      onSubmit={(e) => {
        e.preventDefault();
        // Talep panele de düşsün: kişi WhatsApp'ta vazgeçse bile kaydı kalır.
        // Kayıt başarısız olsa bile WhatsApp açılmasını engellemiyoruz.
        void supabase
          ?.from("talepler")
          .insert({ tur: tip, ad, telefon: tel, takim: tip === "katilim" ? takim : null, mesaj })
          .then(({ error }) => {
            if (error) console.warn("Talep kaydedilemedi:", error.message);
          });
        window.open(link, "_blank", "noopener");
      }}
    >
      <Alan id="ad" etiket="Ad Soyad" deger={ad} degistir={setAd} gerekli />
      <Alan id="tel" etiket="Telefon" deger={tel} degistir={setTel} tur="tel" gerekli />
      {tip === "katilim" && (
        <Alan id="takim" etiket="Takım Adı" deger={takim} degistir={setTakim} />
      )}
      <label className="mb-4 block" htmlFor="mesaj">
        <span className="mb-1.5 block font-[family-name:var(--font-data)] text-sm font-semibold uppercase tracking-[0.1em] text-muted">
          Mesaj
        </span>
        <textarea
          id="mesaj"
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          rows={4}
          className="girdi-neon w-full rounded-sm border border-line bg-paper px-3 py-2.5"
          placeholder={
            tip === "katilim"
              ? "Kaç kişilik kadromuz var, hangi günler müsaitiz…"
              : "Sormak istediğin şey…"
          }
        />
      </label>

      <button
        type="submit"
        className="btn-parla w-full rounded-sm bg-[#25d366] px-6 py-3.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-ink transition hover:bg-[#1fbe5b]"
      >
        WhatsApp&apos;tan Gönder
      </button>
      <p className="mt-3 text-sm text-muted">
        Gönderdiğinde hazır mesajla WhatsApp açılır ({SITE.telefonGorunen}). Mesajı göndermeden
        önce düzenleyebilirsin.
      </p>
    </form>
  );
}

function Alan({
  id,
  etiket,
  deger,
  degistir,
  tur = "text",
  gerekli = false,
}: {
  id: string;
  etiket: string;
  deger: string;
  degistir: (v: string) => void;
  tur?: string;
  gerekli?: boolean;
}) {
  return (
    <label className="mb-4 block" htmlFor={id}>
      <span className="mb-1.5 block font-[family-name:var(--font-data)] text-sm font-semibold uppercase tracking-[0.1em] text-muted">
        {etiket}
      </span>
      <input
        id={id}
        type={tur}
        required={gerekli}
        value={deger}
        onChange={(e) => degistir(e.target.value)}
        className="girdi-neon w-full rounded-sm border border-line bg-paper px-3 py-2.5"
      />
    </label>
  );
}
