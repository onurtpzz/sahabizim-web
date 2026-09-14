import { ImageResponse } from "next/og";
import { OG_OLCU, OG_RENK, ogFontlari } from "@/lib/og-fontlari";
import { SITE } from "@/lib/site";
import { getPuanDurumu } from "@/lib/veri";

export const size = OG_OLCU;
export const contentType = "image/png";
export const alt = "SahaBizim Ligi takım kartı";

/** Uzun takım adları taşmasın diye harf sayısına göre punto. */
function baslikPuntosu(ad: string) {
  if (ad.length <= 11) return 118;
  if (ad.length <= 15) return 96;
  if (ad.length <= 20) return 78;
  return 64;
}

const FORM_RENK: Record<string, string> = {
  G: OG_RENK.brand,
  B: "#9aa79c",
  M: OG_RENK.lose,
};

function Kutu({ etiket, deger, vurgu }: { etiket: string; deger: string; vurgu?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 176,
        height: 152,
        borderRadius: 10,
        background: vurgu ? "rgba(212,167,44,0.14)" : "rgba(255,255,255,0.06)",
        border: `2px solid ${vurgu ? OG_RENK.gold : "rgba(255,255,255,0.14)"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Barlow",
          fontSize: 25,
          letterSpacing: 4,
          color: vurgu ? OG_RENK.gold : OG_RENK.mutedDark,
          marginBottom: 6,
        }}
      >
        {etiket}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Anton",
          fontSize: 66,
          lineHeight: 1,
          color: vurgu ? OG_RENK.gold : OG_RENK.beyaz,
        }}
      >
        {deger}
      </div>
    </div>
  );
}

/**
 * Takım sayfası için paylaşım görseli — `/takim/[slug]` linki WhatsApp'a
 * yapıştırıldığında takımın adı, sırası ve puanı görselde çıkar.
 * Takım henüz maç oynamadıysa istatistik yerine bilgi metni gösterilir.
 */
export default async function TakimOgGorseli({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, fonts] = await Promise.all([params, ogFontlari()]);
  const tablo = await getPuanDurumu();
  const takim = tablo.find((t) => t.slug === slug);

  const ad = (takim?.ad ?? "SAHABİZİM LİGİ").toLocaleUpperCase("tr");
  const sampiyon = takim?.sira === 1;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: OG_RENK.ink,
          padding: "56px 72px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -300,
            right: -180,
            width: 780,
            height: 780,
            borderRadius: 9999,
            background: sampiyon
              ? "radial-gradient(circle, rgba(212,167,44,0.34) 0%, rgba(4,21,11,0) 70%)"
              : "radial-gradient(circle, rgba(23,163,58,0.38) 0%, rgba(4,21,11,0) 70%)",
            display: "flex",
          }}
        />

        {/* Üst şerit */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 9999,
              background: OG_RENK.gold,
            }}
          />
          <div
            style={{
              display: "flex",
              fontFamily: "Barlow",
              fontSize: 28,
              letterSpacing: 5,
              color: OG_RENK.mutedDark,
            }}
          >
            {`${SITE.ad.toLocaleUpperCase("tr")} LİGİ · ${SITE.sezon}`}
          </div>
        </div>

        {/* Takım adı */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1010 }}>
          {sampiyon && (
            <div
              style={{
                display: "flex",
                fontFamily: "Barlow",
                fontSize: 30,
                letterSpacing: 6,
                color: OG_RENK.gold,
                marginBottom: 12,
              }}
            >
              LİDER
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontFamily: "Anton",
              fontSize: baslikPuntosu(ad),
              lineHeight: 0.94,
              color: OG_RENK.beyaz,
              letterSpacing: 1,
            }}
          >
            {ad}
          </div>
        </div>

        {/* Alt: istatistikler + form */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              width: "100%",
              height: 4,
              background: sampiyon ? OG_RENK.gold : OG_RENK.brand,
              marginBottom: 26,
            }}
          />

          {takim && takim.oynadi ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 16 }}>
                <Kutu etiket="SIRA" deger={String(takim.sira)} vurgu={sampiyon} />
                <Kutu etiket="OYNADI" deger={String(takim.O)} />
                <Kutu
                  etiket="AVERAJ"
                  deger={takim.AV > 0 ? `+${takim.AV}` : String(takim.AV)}
                />
                <Kutu etiket="PUAN" deger={String(takim.P)} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div
                  style={{
                    display: "flex",
                    fontFamily: "Barlow",
                    fontSize: 24,
                    letterSpacing: 4,
                    color: OG_RENK.mutedDark,
                    marginBottom: 12,
                  }}
                >
                  SON 3 MAÇ
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {takim.son.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 56,
                        height: 56,
                        borderRadius: 8,
                        fontFamily: "Anton",
                        fontSize: 32,
                        color: s ? OG_RENK.beyaz : "rgba(255,255,255,0.28)",
                        background: s ? FORM_RENK[s] : "transparent",
                        border: s ? "none" : "2px dashed rgba(255,255,255,0.22)",
                      }}
                    >
                      {s || "·"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                fontFamily: "Barlow",
                fontSize: 38,
                letterSpacing: 2,
                color: OG_RENK.mutedDark,
              }}
            >
              {takim
                ? "SEZONA HAZIRLANIYOR · İLK MAÇ BEKLENİYOR"
                : "PUAN DURUMU · FİKSTÜR · TAKIM SAYFALARI"}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
