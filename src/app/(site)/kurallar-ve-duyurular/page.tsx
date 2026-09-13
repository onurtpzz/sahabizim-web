import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SITE } from "@/lib/site";
import { getDuyurular } from "@/lib/veri";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Kurallar ve Duyurular",
  description:
    "SahaBizim Ligi'nin güncel duyuruları ve saha içi kuralları — maç saatleri, puanlama, disiplin ve kayıt şartları.",
  alternates: { canonical: "/kurallar-ve-duyurular" },
};

function tarihYaz(tarih: string | null) {
  if (!tarih) return null;
  const d = new Date(`${tarih}T12:00:00`);
  return {
    gun: d.toLocaleDateString("tr-TR", { day: "2-digit" }),
    ay: d.toLocaleDateString("tr-TR", { month: "short" }).replace(".", ""),
    yil: d.getFullYear(),
    tam: d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    iso: tarih,
  };
}

export default async function KurallarVeDuyurularSayfasi() {
  const hepsi = await getDuyurular();
  const duyurular = hepsi.filter((d) => d.tur === "duyuru");
  const kurallar = hepsi.filter((d) => d.tur === "kural");

  return (
    <>
      {/* BAŞLIK */}
      <section className="relative overflow-hidden border-b-[3px] border-brand bg-ink text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #4ADE80 0 2px, transparent 2px 34px)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[1180px] px-5 py-14 md:py-18">
          <p className="eyebrow text-brand-lite">{SITE.sezon} Sezonu</p>
          <h1 className="display mt-3 text-[clamp(2.3rem,7vw,4.2rem)]">
            Kurallar ve <em className="not-italic text-gold">Duyurular</em>
          </h1>
          <p className="mt-4 max-w-[58ch] text-[#cfe0d5] md:text-lg">
            Lig ile ilgili her duyuru önce buraya düşer. Aşağıda ayrıca sahaya çıkan
            herkesin uyması gereken kurallar var.
          </p>

          <nav className="mt-7 flex flex-wrap gap-2.5">
            <a
              href="#duyurular"
              className="rounded-sm border-2 border-white/35 px-5 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider transition hover:border-brand-lite hover:text-brand-lite"
            >
              Duyurular ({duyurular.length})
            </a>
            <a
              href="#kurallar"
              className="rounded-sm border-2 border-white/35 px-5 py-2.5 font-[family-name:var(--font-data)] text-sm font-bold uppercase tracking-wider transition hover:border-gold hover:text-gold"
            >
              Lig Kuralları ({kurallar.length})
            </a>
          </nav>
        </div>
      </section>

      {/* DUYURULAR */}
      <section id="duyurular" className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-18">
        <Reveal className="mb-8">
          <p className="eyebrow text-brand">Akış</p>
          <h2 className="display text-[clamp(1.8rem,5vw,2.8rem)]">Duyurular</h2>
        </Reveal>

        {duyurular.length === 0 ? (
          <p className="rounded border border-line bg-white p-6 text-muted">
            Henüz duyuru girilmedi. Yeni duyurular bu sayfada tarih sırasıyla görünecek.
          </p>
        ) : (
          <ol className="relative grid gap-4 md:pl-8">
            {/* Masaüstünde zaman çizgisi */}
            <span
              aria-hidden
              className="absolute top-2 bottom-2 left-[11px] hidden w-px bg-line md:block"
            />
            {duyurular.map((d) => {
              const t = tarihYaz(d.tarih);
              return (
                <li key={d.id} className="relative">
                  <span
                    aria-hidden
                    className={`absolute top-7 -left-8 hidden h-[9px] w-[9px] rounded-full md:block ${
                      d.sabit ? "bg-gold ring-4 ring-gold/20" : "bg-brand ring-4 ring-brand/15"
                    }`}
                    style={{ marginLeft: "7px" }}
                  />
                  <Reveal>
                    <article
                      className={`rounded border bg-white p-5 transition-shadow hover:shadow-[0_10px_30px_rgba(4,21,11,0.07)] md:p-6 ${
                        d.sabit ? "border-gold/60 border-l-[3px] border-l-gold" : "border-line"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        {t && (
                          <time
                            dateTime={t.iso}
                            className="flex flex-none items-baseline gap-1.5 rounded-sm bg-paper px-2.5 py-1.5 font-[family-name:var(--font-data)] text-muted"
                          >
                            <span className="display text-xl text-ink">{t.gun}</span>
                            <span className="text-sm uppercase tracking-wider">{t.ay}</span>
                            <span className="text-sm">{t.yil}</span>
                          </time>
                        )}
                        {d.sabit && (
                          <span className="rounded-full bg-gold/15 px-2.5 py-1 font-[family-name:var(--font-data)] text-[11px] font-bold tracking-[0.14em] text-[#8a6a12] uppercase">
                            Öne çıkan
                          </span>
                        )}
                      </div>

                      <h3 className="display mt-3 text-[clamp(1.3rem,3.5vw,1.75rem)]">
                        {d.baslik}
                      </h3>

                      {d.metin.trim() && (
                        <div className="mt-2.5 grid gap-3 leading-relaxed text-muted">
                          {d.metin
                            .split(/\n{2,}/)
                            .filter(Boolean)
                            .map((p, i) => (
                              <p key={i}>{p}</p>
                            ))}
                        </div>
                      )}
                    </article>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* KURALLAR */}
      <section id="kurallar" className="border-t border-line bg-white">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-18">
          <Reveal className="mb-8">
            <p className="eyebrow text-gold">Saha içi</p>
            <h2 className="display text-[clamp(1.8rem,5vw,2.8rem)]">Lig Kuralları</h2>
            <p className="mt-3 max-w-[62ch] text-muted">
              Bu kurallar bütün takımlar için geçerlidir. Lige kaydolan takım kuralları
              kabul etmiş sayılır.
            </p>
          </Reveal>

          {kurallar.length === 0 ? (
            <p className="rounded border border-line bg-paper p-6 text-muted">
              Kurallar henüz girilmedi.
            </p>
          ) : (
            <ol className="grid gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-2">
              {kurallar.map((k, i) => (
                <li key={k.id} className="group bg-white p-6">
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden
                      className="display flex-none text-3xl text-line transition-colors group-hover:text-brand"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-[family-name:var(--font-data)] text-lg font-bold tracking-wide uppercase">
                        {k.baslik}
                      </h3>
                      {k.metin.trim() && (
                        <p className="mt-1.5 leading-relaxed text-muted">{k.metin}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/iletisim"
              className="rounded-sm bg-brand px-6 py-3.5 font-[family-name:var(--font-data)] font-bold tracking-wider text-white uppercase transition hover:-translate-y-0.5"
            >
              Aklına takılan var mı?
            </Link>
            <Link
              href="/fikstur"
              className="rounded-sm border-2 border-ink px-6 py-3.5 font-[family-name:var(--font-data)] font-bold tracking-wider uppercase transition hover:border-brand hover:text-brand"
            >
              Fikstüre bak
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
