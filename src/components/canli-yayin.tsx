import Link from "next/link";

/** Yanıp sönen "CANLI" rozeti — hem şeritte hem kartta kullanılıyor. */
export function CanliRozet({ koyuZemin = true }: { koyuZemin?: boolean }) {
  return (
    <span
      className={`inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 font-[family-name:var(--font-data)] text-[11px] font-bold uppercase tracking-[0.14em] ${
        koyuZemin ? "bg-lose text-white" : "bg-lose/12 text-lose"
      }`}
    >
      <span aria-hidden className="canli-nokta h-1.5 w-1.5 rounded-full bg-current" />
      Canlı
    </span>
  );
}

/**
 * Header'ın hemen altındaki ince şerit. Panelden `canli_yayin_aktif`
 * "hayir" yapılınca tamamen kaybolur.
 */
export function CanliYayinSeridi({
  aktif,
  metin,
  buton,
  link,
}: {
  aktif: boolean;
  metin: string;
  buton: string;
  link: string;
}) {
  if (!aktif || !metin.trim()) return null;

  const icerik = (
    <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
      <CanliRozet />
      <span className="font-[family-name:var(--font-data)] text-[15px] font-semibold text-white">
        {metin}
      </span>
      {link.trim() && (
        <span className="font-[family-name:var(--font-data)] text-[13px] font-bold uppercase tracking-wider text-brand-lite underline-offset-4 group-hover:underline">
          {buton} <span aria-hidden className="ok">→</span>
        </span>
      )}
    </span>
  );

  return (
    <div className="border-b border-white/10 bg-ink-2">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-2.5">
        {link.trim() ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            {icerik}
          </a>
        ) : (
          icerik
        )}
      </div>
    </div>
  );
}

/** Fikstür sayfasındaki daha büyük bilgi kartı. */
export function CanliYayinKarti({
  aktif,
  metin,
  aciklama,
  buton,
  link,
}: {
  aktif: boolean;
  metin: string;
  aciklama: string;
  buton: string;
  link: string;
}) {
  if (!aktif) return null;

  return (
    <aside className="mb-8 overflow-hidden rounded border border-line bg-white">
      <div className="flex flex-wrap items-center gap-4 border-l-[3px] border-lose p-5">
        <div className="min-w-[240px] flex-1">
          <div className="flex items-center gap-2.5">
            <CanliRozet koyuZemin={false} />
            <h2 className="font-[family-name:var(--font-data)] text-lg font-bold uppercase tracking-wide">
              {metin}
            </h2>
          </div>
          <p className="mt-2 max-w-[62ch] text-muted">{aciklama}</p>
        </div>
        {link.trim() && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-parla rounded-sm bg-lose px-5 py-3 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-white transition hover:-translate-y-0.5"
          >
            {buton}
          </a>
        )}
        {!link.trim() && (
          <Link
            href="/iletisim"
            className="btn-cizgi rounded-sm border-2 border-ink px-5 py-3 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider transition hover:border-brand hover:text-brand"
          >
            Yayın programı
          </Link>
        )}
      </div>
    </aside>
  );
}
