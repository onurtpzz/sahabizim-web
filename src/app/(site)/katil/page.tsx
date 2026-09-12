import type { Metadata } from "next";
import { WhatsappForm } from "@/components/whatsapp-form";
import { SITE } from "@/lib/site";
import { getIcerik } from "@/lib/veri";

export const metadata: Metadata = {
  title: "Aramıza Katıl",
  description:
    "Takımını SahaBizim Ligi'ne kaydet. Formu doldur, WhatsApp'tan ulaş; fikstür ve saha detaylarını birlikte konuşalım.",
  alternates: { canonical: "/katil" },
};

export const revalidate = 60;

export default async function KatilSayfasi() {
  const icerik = await getIcerik();
  return (
    <div className="mx-auto grid w-full max-w-[1180px] items-start gap-9 px-5 py-12 md:grid-cols-2 md:py-16">
      <div>
        <p className="eyebrow text-brand">Aramıza Katıl</p>
        <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.4rem)]">{icerik.katil_baslik}</h1>
        <p className="mt-4 max-w-[52ch] text-muted">{icerik.katil_metin}</p>
        <ul className="mt-6 grid gap-3 font-[family-name:var(--font-data)] text-lg">
          {icerik.katil_maddeler
            .split("\n")
            .filter(Boolean)
            .map((m) => (
              <li key={m}>✅ {m}</li>
            ))}
        </ul>
        <p className="mt-6 font-[family-name:var(--font-data)] text-lg">
          {icerik.yetkili} · {icerik.telefon}
        </p>
      </div>
      <WhatsappForm tip="katilim" />
    </div>
  );
}
