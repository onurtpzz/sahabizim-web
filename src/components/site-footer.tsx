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
            <Link href="/" className="mb-3 flex items-center gap-3 text-white">
              <Image
                src="/images/logo.png"
                alt=""
                width={44}
                height={44}
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
              <li><Link href="/puan-durumu" className="hover:text-brand-lite">Puan Durumu</Link></li>
              <li><Link href="/fikstur" className="hover:text-brand-lite">Fikstür</Link></li>
              <li><Link href="/takimlar" className="hover:text-brand-lite">Takımlar</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 font-[family-name:var(--font-data)] text-sm uppercase tracking-[0.16em] text-white">
              İletişim
            </h2>
            <ul className="grid gap-2 font-[family-name:var(--font-data)] text-base">
              <li><Link href="/katil" className="hover:text-brand-lite">Aramıza Katıl</Link></li>
              <li><Link href="/iletisim" className="hover:text-brand-lite">{icerik.telefon}</Link></li>
              <li>
                <a href={icerik.instagram} className="hover:text-brand-lite">Instagram</a>
                {" · "}
                <a href={icerik.youtube} className="hover:text-brand-lite">YouTube</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-4 text-[13px] text-[#7e9887]">
          <span>© {new Date().getFullYear()} {SITE.ad} · www.sahabizim.com.tr</span>
          <span>{SITE.sezon} sezonu</span>
        </div>
      </div>
    </footer>
  );
}
