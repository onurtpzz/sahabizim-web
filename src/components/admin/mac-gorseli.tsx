"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dugme, Pencere } from "@/components/admin/ui";
import { LIG_SAAT_DILIMI, ligSaati } from "@/lib/zaman";

/**
 * Maç sonucu paylaşım görseli — 1080×1080 PNG.
 *
 * Görsel tarayıcıda `canvas` ile çiziliyor; sunucu, ek servis veya kütüphane
 * gerekmiyor. Takım logoları Supabase Storage'dan `crossOrigin="anonymous"`
 * ile çekiliyor — böylece canvas "kirlenmiyor" ve PNG indirilebiliyor.
 * Logo yoksa ya da yüklenemezse baş harf rozetine düşülüyor.
 */

const BOYUT = 1080;

const ROZET_RENKLERI = [
  "#17A33A", "#0B5219", "#B8860B", "#1F6F8B", "#8B2E2E",
  "#3B4C7A", "#6B4423", "#2E7D6B", "#7A3E8B", "#B5651D",
];

function rozetBilgisi(ad: string) {
  const parcalar = ad.split(" ").filter(Boolean);
  const bas = (parcalar[0] ?? "?").slice(0, 1);
  const ikinci = parcalar[1] ? parcalar[1].slice(0, 1) : (parcalar[0] ?? "?").slice(1, 2);
  let h = 0;
  for (const ch of ad) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    harf: (bas + ikinci).toLocaleUpperCase("tr"),
    renk: ROZET_RENKLERI[h % ROZET_RENKLERI.length],
  };
}

/** Metni verilen genişliğe sığana kadar küçültür. */
function sigdir(
  ctx: CanvasRenderingContext2D,
  metin: string,
  aile: string,
  baslangicPuntosu: number,
  enGenis: number,
  enKucuk = 22,
) {
  let punto = baslangicPuntosu;
  ctx.font = `${punto}px ${aile}`;
  while (ctx.measureText(metin).width > enGenis && punto > enKucuk) {
    punto -= 2;
    ctx.font = `${punto}px ${aile}`;
  }
  return punto;
}

function fontAilesi(degisken: string, yedek: string) {
  if (typeof window === "undefined") return yedek;
  const deger = getComputedStyle(document.documentElement)
    .getPropertyValue(degisken)
    .trim();
  return deger || yedek;
}

/** Görseli canvas'a çizilebilecek şekilde yükler; olmazsa null döner. */
function gorselYukle(url: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((cozul) => {
    const img = new Image();
    // CORS başlığı gelmezse onerror tetiklenir; canvas kirlenmez.
    if (!url.startsWith("/")) img.crossOrigin = "anonymous";
    img.onload = () => cozul(img);
    img.onerror = () => cozul(null);
    img.src = url;
  });
}

/** Kare olmayan logoyu daireye sığdırarak ortalar. */
function daireyeCiz(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  yaricap: number,
) {
  const oran = Math.min((yaricap * 1.62) / img.width, (yaricap * 1.62) / img.height);
  const g = img.width * oran;
  const yk = img.height * oran;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, yaricap, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.drawImage(img, x - g / 2, y - yk / 2, g, yk);
  ctx.restore();
}

export type MacGorselVerisi = {
  evAd: string;
  depAd: string;
  evLogo?: string | null;
  depLogo?: string | null;
  /**
   * Skor doluysa "maç sonucu" görseli, boşsa "yaklaşan maç" duyurusu çizilir.
   * Duyuruda skorun yerini saat alır ve kazanan vurgusu yapılmaz.
   */
  evSkor: number | null;
  depSkor: number | null;
  tarih: string | null;
  /** Saat yer tutucuysa (öğlen) görselde saat yerine "açıklanacak" yazılır. */
  saatBelirsiz?: boolean;
  sezon: string;
  hukmen?: boolean;
};

export function MacGorseli({
  mac,
  kapat,
}: {
  mac: MacGorselVerisi;
  kapat: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hazir, setHazir] = useState(false);
  /**
   * Görsel çizilince PNG bir kez üretilip burada tutuluyor. Paylaşım için şart:
   * iPhone Safari `navigator.share`i yalnız dokunuşun hemen ardından kabul ediyor;
   * dokununca PNG üretmeyi beklersek izin düşüyor ve paylaşım penceresi açılmıyor.
   */
  const pngRef = useRef<Blob | null>(null);

  const ciz = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const display = fontAilesi("--font-display", 'Impact, "Arial Narrow", sans-serif');
    const data = fontAilesi("--font-data", '"Arial Narrow", Arial, sans-serif');

    // Fontlar sayfada kullanılmadıysa tarayıcı henüz indirmemiş olabilir;
    // canvas'a çizmeden önce açıkça yükletiyoruz, yoksa yedek fonta düşer.
    try {
      // allSettled: yedek font tanımlarından biri hata verse bile
      // (next/font "… Fallback" girdileri verebiliyor) beklemeye devam et.
      await Promise.allSettled([
        document.fonts.load(`120px ${display}`),
        document.fonts.load(`700 62px ${data}`),
      ]);
      await document.fonts.ready;
    } catch {
      /* font API yoksa yedek fontlarla devam */
    }

    const M = BOYUT / 2;

    // Zemin
    ctx.fillStyle = "#04150B";
    ctx.fillRect(0, 0, BOYUT, BOYUT);

    // Çapraz ince şeritler
    ctx.save();
    ctx.strokeStyle = "rgba(74,222,128,0.07)";
    ctx.lineWidth = 3;
    for (let x = -BOYUT; x < BOYUT * 2; x += 46) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + BOYUT, BOYUT);
      ctx.stroke();
    }
    ctx.restore();

    // Ortada yumuşak yeşil ışık
    const isik = ctx.createRadialGradient(M, 560, 40, M, 560, 620);
    isik.addColorStop(0, "rgba(23,163,58,0.30)");
    isik.addColorStop(1, "rgba(4,21,11,0)");
    ctx.fillStyle = isik;
    ctx.fillRect(0, 0, BOYUT, BOYUT);

    // Üst ve alt altın çizgi
    ctx.fillStyle = "#D4A72C";
    ctx.fillRect(0, 0, BOYUT, 10);
    ctx.fillRect(0, BOYUT - 10, BOYUT, 10);

    // SahaBizim logosu — logonun kendi zemini koyu yeşil olduğu için
    // arkasına açık bir daire ve altın halka konuyor, yoksa zemine karışıyor.
    const logoBoy = 245;
    const logoMerkezY = 36 + logoBoy / 2;
    const logo = await gorselYukle("/images/logo.png");
    ctx.textAlign = "center";

    // "Maç Yapalım" logosu üstte iki yana, küçük. Aynı kaynaktan (site içi)
    // geldiği için canvas kirlenmiyor; yüklenemezse sessizce atlanıyor.
    const yanLogo = await gorselYukle("/images/mac-yapalim.png");
    if (yanLogo) {
      const enG = 150;
      const oran = enG / yanLogo.width;
      const g = enG;
      const yk = yanLogo.height * oran;
      const yanY = logoMerkezY - yk / 2;
      ctx.drawImage(yanLogo, 48, yanY, g, yk);
      ctx.drawImage(yanLogo, BOYUT - 48 - g, yanY, g, yk);
    }

    const halo = ctx.createRadialGradient(
      M, logoMerkezY, 10,
      M, logoMerkezY, logoBoy / 2 + 26,
    );
    halo.addColorStop(0, "rgba(255,255,255,0.16)");
    halo.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(M, logoMerkezY, logoBoy / 2 + 26, 0, Math.PI * 2);
    ctx.fill();

    if (logo) {
      const oran = Math.min(logoBoy / logo.width, logoBoy / logo.height);
      const g = logo.width * oran;
      const yk = logo.height * oran;
      ctx.drawImage(logo, M - g / 2, logoMerkezY - yk / 2, g, yk);
    } else {
      ctx.fillStyle = "#D4A72C";
      ctx.font = `700 58px ${data}`;
      ctx.fillText("SB", M, logoMerkezY + 20);
    }

    ctx.beginPath();
    ctx.arc(M, logoMerkezY, logoBoy / 2 + 6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(212,167,44,0.85)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // SAHABİZİM LİGİ
    ctx.fillStyle = "#D4A72C";
    ctx.font = `700 30px ${data}`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "10px";
    // Logo büyüdüğü için yazılar aşağı kaydı; altın halkayla çakışmasın.
    ctx.fillText("SAHABİZİM LİGİ", M, 322);

    // Üst etiket — sonuç mu, yaklaşan maç duyurusu mu?
    const duyuru = mac.evSkor === null || mac.depSkor === null;
    ctx.fillStyle = duyuru ? "#4ADE80" : "rgba(207,224,213,0.75)";
    ctx.font = `700 26px ${data}`;
    ctx.fillText(
      duyuru ? "YAKLAŞAN MAÇ" : mac.hukmen ? "HÜKMEN SONUÇ" : "MAÇ SONUCU",
      M,
      362,
    );
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

    // Takım blokları
    const solX = 262;
    const sagX = BOYUT - 262;
    const rozetY = 516;
    const yaricap = 96;

    // Duyuruda henüz kazanan yok; altın vurgu yalnız sonuç görselinde.
    const kazananEv = !duyuru && (mac.evSkor as number) > (mac.depSkor as number);
    const kazananDep = !duyuru && (mac.depSkor as number) > (mac.evSkor as number);

    const [evArma, depArma] = await Promise.all([
      gorselYukle(mac.evLogo),
      gorselYukle(mac.depLogo),
    ]);

    const taraflar = [
      { ad: mac.evAd, x: solX, kazandi: kazananEv, arma: evArma },
      { ad: mac.depAd, x: sagX, kazandi: kazananDep, arma: depArma },
    ];

    for (const t of taraflar) {
      const r = rozetBilgisi(t.ad);

      if (t.kazandi) {
        ctx.beginPath();
        ctx.arc(t.x, rozetY, yaricap + 12, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(212,167,44,0.22)";
        ctx.fill();
      }

      if (t.arma) {
        daireyeCiz(ctx, t.arma, t.x, rozetY, yaricap);
      } else {
        ctx.beginPath();
        ctx.arc(t.x, rozetY, yaricap, 0, Math.PI * 2);
        ctx.fillStyle = r.renk;
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = `700 62px ${data}`;
        ctx.textBaseline = "middle";
        ctx.fillText(r.harf, t.x, rozetY + 4);
        ctx.textBaseline = "alphabetic";
      }

      ctx.beginPath();
      ctx.arc(t.x, rozetY, yaricap, 0, Math.PI * 2);
      ctx.lineWidth = 5;
      ctx.strokeStyle = t.kazandi ? "#D4A72C" : "rgba(255,255,255,0.22)";
      ctx.stroke();

      ctx.fillStyle = "#ffffff";

      // Takım adı — uzunsa küçülür, çok uzunsa iki satıra bölünür
      ctx.fillStyle = "#ffffff";
      const enGenis = 430;
      let punto = sigdir(ctx, t.ad.toLocaleUpperCase("tr"), display, 52, enGenis, 30);
      const buyukAd = t.ad.toLocaleUpperCase("tr");
      if (punto <= 30 && buyukAd.includes(" ")) {
        const kelimeler = buyukAd.split(" ");
        const orta = Math.ceil(kelimeler.length / 2);
        const satir1 = kelimeler.slice(0, orta).join(" ");
        const satir2 = kelimeler.slice(orta).join(" ");
        punto = Math.min(
          sigdir(ctx, satir1, display, 48, enGenis, 26),
          sigdir(ctx, satir2, display, 48, enGenis, 26),
        );
        ctx.font = `${punto}px ${display}`;
        ctx.fillText(satir1, t.x, rozetY + 168);
        ctx.fillText(satir2, t.x, rozetY + 168 + punto);
      } else {
        ctx.font = `${punto}px ${display}`;
        ctx.fillText(buyukAd, t.x, rozetY + 168);
      }
    }

    if (duyuru) {
      // Ortada skor yerine karşılaşma işareti ve saat.
      ctx.fillStyle = "rgba(255,255,255,0.34)";
      ctx.font = `62px ${display}`;
      ctx.fillText("VS", M, rozetY - 22);

      if (!mac.saatBelirsiz && mac.tarih) {
        // Lig saatine sabit: yönetici yurt dışındayken görselde kayık
        // saat çıkmasın, sitede yazan saatle birebir aynı olsun.
        const saat = ligSaati(mac.tarih);
        ctx.fillStyle = "#4ADE80";
        ctx.font = `86px ${display}`;
        ctx.fillText(saat, M, rozetY + 78);
      }
    } else {
      // Skor — ayraç olarak yazı yerine kısa bir çubuk çiziliyor,
      // Anton'un tire karakteri bu boyutta kaybolduğu için.
      ctx.fillStyle = "#ffffff";
      ctx.font = `132px ${display}`;
      ctx.fillText(`${mac.evSkor}`, M - 92, rozetY + 46);
      ctx.fillText(`${mac.depSkor}`, M + 92, rozetY + 46);
      ctx.fillStyle = "#4ADE80";
      ctx.fillRect(M - 22, rozetY - 6, 44, 11);
    }

    // Alt bilgi
    // Duyuruda gün adı da yazılıyor — "Cumartesi" bilgisi paylaşımda işe yarıyor.
    const tarihYazi = mac.tarih
      ? new Date(mac.tarih).toLocaleDateString("tr-TR", {
          timeZone: LIG_SAAT_DILIMI,
          weekday: duyuru ? "long" : undefined,
          day: "numeric",
          month: "long",
          year: duyuru ? undefined : "numeric",
        })
      : mac.sezon;

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(180, 838);
    ctx.lineTo(BOYUT - 180, 838);
    ctx.stroke();

    ctx.fillStyle = "#cfe0d5";
    ctx.font = `600 30px ${data}`;
    // Sonuç görselinin alt yazısı olduğu gibi bırakıldı; yalnız duyuru
    // büyük harfe çekiliyor, saat yoksa onu da burada söylüyoruz.
    ctx.fillText(
      duyuru
        ? `${tarihYazi}${mac.saatBelirsiz ? " · SAAT AÇIKLANACAK" : ""}`.toLocaleUpperCase("tr")
        : `${tarihYazi} · ${mac.sezon} Sezonu`,
      M,
      894,
    );

    ctx.fillStyle = "#D4A72C";
    ctx.font = `700 28px ${data}`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "6px";
    ctx.fillText("WWW.SAHABIZIM.COM.TR", M, 952);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

    pngRef.current = null;
    try {
      canvas.toBlob((b) => {
        pngRef.current = b;
      }, "image/png");
    } catch {
      /* logo "kirletmişse" toBlob hata atar; indir/paylaş aynı hatayı kullanıcıya söyler */
    }
    setHazir(true);
  }, [mac]);

  useEffect(() => {
    ciz();
  }, [ciz]);

  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");

  const duyuruMu = mac.evSkor === null || mac.depSkor === null;
  // Dosya adı: Türkçe harfler sadeleşir ("Gençlik" → "genclik"), gerisi tireye döner.
  const temiz = (x: string) =>
    x
      .toLocaleLowerCase("tr")
      .replace(/[çğıöşü]/g, (h) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[h] ?? h)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const dosyaAdi = duyuruMu
    ? `sahabizim-mac-${temiz(mac.evAd)}-${temiz(mac.depAd)}.png`
    : `sahabizim-${temiz(mac.evAd)}-${mac.evSkor}-${mac.depSkor}-${temiz(mac.depAd)}.png`;
  const paylasimMetni = duyuruMu
    ? `${mac.evAd} – ${mac.depAd} · SahaBizim Ligi`
    : `${mac.evAd} ${mac.evSkor}–${mac.depSkor} ${mac.depAd} · SahaBizim Ligi`;

  const KIRLI_HATA =
    "Görsel hazırlanamadı — takım logolarından biri tarayıcının izin vermediği bir adresten geliyor. Logoyu panelden tekrar yükleyip dener misin?";

  /** Hazır PNG; yoksa (çok hızlı basıldıysa) şimdi üretir. */
  function pngAl(): Promise<Blob> {
    if (pngRef.current) return Promise.resolve(pngRef.current);
    return new Promise((coz, reddet) => {
      try {
        canvasRef.current?.toBlob((b) => (b ? coz(b) : reddet(new Error("bos"))), "image/png");
      } catch (e) {
        reddet(e);
      }
    });
  }

  /**
   * Dosya paylaşımı destekleniyor mu? Telefonlarda (Android Chrome, iPhone
   * Safari) ve Windows/Mac'te Edge/Safari'de evet; masaüstü Firefox'ta hayır.
   * Pencere yalnız tıklamayla açıldığı için burada `navigator` her zaman var.
   */
  const dosyaPaylasilir =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [new File([""], "deneme.png", { type: "image/png" })] });

  async function indir() {
    setHata("");
    try {
      const blob = await pngAl();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = dosyaAdi;
      a.click();
      // İptal etmeyi bir tur geciktiriyoruz: bazı tarayıcılarda `click()`
      // hemen ardından iptal edilirse indirme hiç başlamıyor.
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      setHata(KIRLI_HATA);
    }
  }

  /**
   * Telefonun paylaşım penceresini açar (Instagram, WhatsApp, Galeriye kaydet…).
   * Desteklemeyen tarayıcıda görseli panoya kopyalar; o da yoksa indirir.
   */
  async function paylas() {
    setHata("");
    setBilgi("");
    const hazirPng = pngRef.current;
    try {
      if (dosyaPaylasilir) {
        // Hazır PNG varsa beklemeden paylaş — Safari'de dokunuş izni düşmesin.
        const blob = hazirPng ?? (await pngAl());
        const dosya = new File([blob], dosyaAdi, { type: "image/png" });
        await navigator.share({ files: [dosya], title: "SahaBizim Ligi", text: paylasimMetni });
        return;
      }
      const blob = hazirPng ?? (await pngAl());
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setBilgi("Görsel panoya kopyalandı — WhatsApp Web'e ya da Instagram'a yapıştırabilirsin.");
        return;
      }
      await indir();
      setBilgi("Bu tarayıcı doğrudan paylaşımı desteklemiyor; görsel indirildi.");
    } catch (e) {
      // Kullanıcı paylaşım penceresini kapattıysa hata değil.
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (e instanceof DOMException && e.name === "NotAllowedError") {
        setHata("Paylaşım penceresi açılamadı. Bir kez daha \"Paylaş\"a dokun.");
        return;
      }
      setHata(KIRLI_HATA);
    }
  }

  return (
    <Pencere
      baslik={
        mac.evSkor === null || mac.depSkor === null
          ? "Yaklaşan maç duyuru görseli"
          : "Maç sonucu görseli"
      }
      kapat={kapat}
      genislik="max-w-[520px]"
    >
      <div className="grid gap-4 p-5">
        <div className="flex items-center gap-3">
          <h2 className="font-[family-name:var(--font-data)] text-sm tracking-[0.12em] text-[#cfe0d5] uppercase">
            Instagram görseli · 1080×1080
          </h2>
          <button
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="ml-auto rounded-sm border border-white/20 px-2.5 py-1 text-white/70 hover:border-lose hover:text-[#ff9a8f]"
          >
            ✕
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={BOYUT}
          height={BOYUT}
          className="w-full rounded border border-white/10 bg-ink"
        />

        {bilgi && (
          <p className="rounded border border-brand/50 bg-brand/10 px-4 py-3 text-sm text-[#d7f5df]">
            {bilgi}
          </p>
        )}

        {hata && (
          <p className="rounded border border-lose/50 bg-lose/10 px-4 py-3 text-sm text-[#ffd7d2]">
            {hata}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Dugme
            type="button"
            onClick={paylas}
            disabled={!hazir}
            className="inline-flex items-center gap-2"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12M8 7l4-4 4 4" />
              <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
            </svg>
            {hazir ? (dosyaPaylasilir ? "Paylaş" : "Kopyala") : "Hazırlanıyor…"}
          </Dugme>
          <Dugme type="button" tur="ikincil" onClick={indir} disabled={!hazir}>
            PNG İndir
          </Dugme>
          <Dugme type="button" tur="ikincil" onClick={kapat}>
            Kapat
          </Dugme>
        </div>

        <p className="text-xs text-muted-dark">
          <strong className="text-[#cfe0d5]">Paylaş</strong> telefonda Instagram, WhatsApp ve
          galeriye kaydet seçeneklerini açar; bilgisayarda görseli panoya kopyalar. Takımın
          logosu panelde yüklüyse görselde arma olarak çıkar; yoksa baş harf rozeti
          kullanılır.
        </p>
      </div>
    </Pencere>
  );
}
