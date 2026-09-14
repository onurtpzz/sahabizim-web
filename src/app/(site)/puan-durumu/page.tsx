import type { Metadata } from "next";
import { PuanTablosu } from "@/components/puan-tablosu";
import { getLigOzeti, getPuanDurumu } from "@/lib/veri";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Puan Durumu",
  description: `SahaBizim Ligi ${SITE.sezon} sezonu güncel puan durumu — oynanan maç, galibiyet, averaj ve puan.`,
  alternates: { canonical: "/puan-durumu" },
};

export const revalidate = 60;

export default async function PuanDurumuSayfasi() {
  const [satirlar, ozet] = await Promise.all([getPuanDurumu(), getLigOzeti()]);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-12 md:py-16">
      <p className="eyebrow text-brand">{SITE.sezon} Sezonu</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.6rem)]">Puan Durumu</h1>
      <p className="mt-3 max-w-[62ch] text-muted">
        {ozet.takimSayisi} takım, {ozet.toplamMac} oynanan maç, {ozet.toplamGol} gol.
        Sıralama puan, averaj ve atılan gol sırasıyla yapılır.
      </p>

      <div className="mt-7">
        <PuanTablosu satirlar={satirlar} />
      </div>

      <p className="mt-5 text-sm text-muted">
        O: oynanan · G: galibiyet · B: beraberlik · M: mağlubiyet · A: attığı gol ·
        Y: yediği gol · AV: averaj · P: puan
      </p>
    </div>
  );
}
