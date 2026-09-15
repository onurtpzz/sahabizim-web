import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { getIcerik } from "@/lib/veri";

export async function SiteFooter() {
  const icerik = await getIcerik();
  return (
    <footer className="border-t-[3px] border-brand bg-ink pt-11 pb-7 text-[#cfe0d5]">
      <div className="mx-auto w-full max-w-[1180px] px-5">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link href="/" className="logo-hover mb-3 flex items-center gap-3 text-white">
              <Image
                src="/images/logo-kucuk.png"
                alt=""
                width={44}
                height={44}
                unoptimized
                className="h-11 w-11 object-contain"
              />
              <span className="leading-none">
                <span className="display block text-xl">{SITE.ad}</span>
                <span className="font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.3em] text-gold">
                  {SITE.slogan}
                </span>
              </span>
            </Link>
            <p className="max-w-[42ch] text-[15px]">{icerik.footer_metin}</p>
          </div>

          <div>
            <h2 className="mb-3 font-[family-name:var(--font-data)] text-sm uppercase tracking-[0.16em] text-white">
              Lig
            </h2>
            <ul className="grid gap-2 font-[family-name:var(--font-data)] text-base">
              <li><Link href="/puan-durumu" className="alt-link">Puan Durumu</Link></li>
              <li><Link href="/fikstur" className="alt-link">Fikstür</Link></li>
              <li><Link href="/takimlar" className="alt-link">Takımlar</Link></li>
              <li><Link href="/kurallar-ve-duyurular" className="alt-link">Kurallar ve Duyurular</Link></li>
              <li><Link href="/arsiv" className="alt-link">Arşiv</Link></li>
              <li><Link href="/biz-kimiz" className="alt-link">Biz Kimiz</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 font-[family-name:var(--font-data)] text-sm uppercase tracking-[0.16em] text-white">
              İletişim
            </h2>
            <ul className="grid gap-2 font-[family-name:var(--font-data)] text-base">
              <li><Link href="/katil" className="alt-link">Aramıza Katıl</Link></li>
              <li><Link href="/iletisim" className="alt-link">{icerik.telefon}</Link></li>
              <li>
                <a href={icerik.instagram} className="alt-link">Instagram</a>
                {" · "}
                <a href={icerik.youtube} className="alt-link">YouTube</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-4 text-[13px] text-[#7e9887]">
          <span>© {new Date().getFullYear()} {SITE.ad} · www.sahabizim.com.tr</span>
          <span>{SITE.sezon} sezonu</span>
        </div>

        {icerik.katki_metin.trim() && (
          <p className="mt-3 text-center font-[family-name:var(--font-data)] text-[12.5px] tracking-[0.14em] text-[#6d8676] uppercase">
            <span aria-hidden className="mr-2 text-gold">◆</span>
            {icerik.katki_metin}
          </p>
        )}
      </div>
    </footer>
  );
}
