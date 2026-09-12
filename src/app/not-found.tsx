import Link from "next/link";

export default function Bulunamadi() {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-24 text-center">
      <p className="eyebrow text-brand">404</p>
      <h1 className="display mt-3 text-[clamp(2.2rem,7vw,4rem)]">Bu sayfa sahada değil</h1>
      <p className="mt-4 text-muted">Aradığın sayfa taşınmış veya hiç var olmamış olabilir.</p>
      <Link
        href="/"
        className="mt-7 inline-block rounded-sm bg-brand px-6 py-3.5 font-[family-name:var(--font-data)] font-bold uppercase tracking-wider text-white"
      >
        Anasayfaya dön
      </Link>
    </div>
  );
}
