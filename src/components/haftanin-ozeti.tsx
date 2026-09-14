import Link from "next/link";
import { Reveal } from "@/components/reveal";
import type { HaftaOzeti, MacOzeti } from "@/lib/hafta";

/** Anasayfadaki "Haftanın özeti" bölümü. Veriler fikstürden hesaplanıyor. */

function tarihAraligi(baslangic: string, bitis: string) {
  const b = new Date(`${baslangic}T12:00:00`);
  const s = new Date(`${bitis}T12:00:00`);
  const gunAy = (d: Date) =>
    d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  return `${gunAy(b)} – ${gunAy(s)}`;
}

function Skor({ mac }: { mac: MacOzeti }) {
  return (
    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <Link
        href={`/takim/${mac.ev.slug}`}
        className="text-right font-[family-name:var(--font-data)] leading-tight font-bold hover:text-brand-lite"
      >
        {mac.ev.ad}
      </Link>
      <span className="display tabular rounded-sm bg-white/10 px-3 py-1.5 text-2xl text-white">
        {mac.evSkor}–{mac.depSkor}
      </span>
      <Link
        href={`/takim/${mac.dep.slug}`}
        className="font-[family-name:var(--font-data)] leading-tight font-bold hover:text-brand-lite"
      >
        {mac.dep.ad}
      </Link>
    </div>
  );
}

function Kart({
  etiket,
  renk,
  children,
}: {
  etiket: string;
  renk: "brand" | "gold" | "lose" | "beyaz";
  children: React.ReactNode;
}) {
  const cizgi = {
    brand: "border-l-brand",
    gold: "border-l-gold",
    lose: "border-l-lose",
    beyaz: "border-l-white/40",
  }[renk];
  const yazi = {
    brand: "text-brand-lite",
    gold: "text-gold",
    lose: "text-[#ff9a8f]",
    beyaz: "text-white/70",
  }[renk];

  return (
    <article
      className={`flex flex-col border-l-[3px] bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.07] ${cizgi}`}
    >
      <p className={`eyebrow ${yazi}`}>{etiket}</p>
      <div className="mt-2 flex flex-1 flex-col justify-between">{children}</div>
    </article>
  );
}

export function HaftaninOzeti({ ozet }: { ozet: HaftaOzeti }) {
  const kartlar: React.ReactNode[] = [];

  if (ozet.macinMaci) {
    const m = ozet.macinMaci;
    kartlar.push(
      <Kart key="mac" etiket="Haftanın maçı" renk="brand">
        <div>
          <p className="text-[15px] text-[#cfe0d5]">
            {m.ev.sira && m.dep.sira
              ? `Tabloda ${Math.min(m.ev.sira, m.dep.sira)}. ve ${Math.max(m.ev.sira, m.dep.sira)}. sıranın karşılaşması.`
              : "Haftanın öne çıkan karşılaşması."}
          </p>
          <Skor mac={m} />
        </div>
      </Kart>,
    );
  }

  if (ozet.yukselen) {
    const y = ozet.yukselen;
    kartlar.push(
      <Kart key="yukselen" etiket="Haftanın yükseleni" renk="gold">
        <div>
          <Link
            href={`/takim/${y.slug}`}
            className="display block text-[clamp(1.5rem,3.5vw,2rem)] text-white hover:text-gold"
          >
            {y.ad}
          </Link>
          <p className="mt-2 font-[family-name:var(--font-data)] text-[15px] text-[#cfe0d5]">
            {y.mac} maçta{" "}
            <strong className="text-gold">{y.puan} puan</strong>
            {y.av !== 0 && `, averaj ${y.av > 0 ? `+${y.av}` : y.av}`}
          </p>
        </div>
      </Kart>,
    );
  }

  if (ozet.surpriz) {
    const s = ozet.surpriz;
    kartlar.push(
      <Kart key="surpriz" etiket="Haftanın sürprizi" renk="lose">
        <div>
          <p className="text-[15px] text-[#cfe0d5]">
            <Link
              href={`/takim/${s.kazananSlug}`}
              className="font-bold text-white hover:text-brand-lite"
            >
              {s.kazanan}
            </Link>{" "}
            {s.fark} sıra üstündeki rakibini devirdi.
          </p>
          <Skor mac={s.mac} />
        </div>
      </Kart>,
    );
  }

  if (ozet.enGollu) {
    const g = ozet.enGollu;
    kartlar.push(
      <Kart key="gol" etiket="En gollü maç" renk="beyaz">
        <div>
          <p className="text-[15px] text-[#cfe0d5]">
            Doksan dakikada <strong className="text-white">{g.toplamGol} gol</strong> çıktı.
          </p>
          <Skor mac={g} />
        </div>
      </Kart>,
    );
  }

  if (kartlar.length === 0) return null;

  return (
    <section className="border-y border-white/10 bg-ink text-white">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-18">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-brand-lite">
              {tarihAraligi(ozet.baslangic, ozet.bitis)}
            </p>
            <h2 className="display mt-2 text-[clamp(1.9rem,5vw,3rem)]">Haftanın Özeti</h2>
          </div>
          <p className="font-[family-name:var(--font-data)] text-[15px] text-muted-dark">
            <span className="display mr-1 text-2xl text-white">{ozet.macSayisi}</span> maç ·
            <span className="display mx-1 text-2xl text-white">{ozet.toplamGol}</span> gol
          </p>
        </Reveal>

        <Reveal className="grid gap-px overflow-hidden rounded border border-white/12 bg-white/12 md:grid-cols-2">
          {kartlar}
        </Reveal>

        <p className="mt-4 text-sm text-muted-dark">
          <Link href="/fikstur" className="font-semibold text-brand-lite hover:underline">
            Tüm maçlar →
          </Link>
        </p>
      </div>
    </section>
  );
}
