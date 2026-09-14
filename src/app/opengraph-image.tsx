import { ImageResponse } from "next/og";
import { OG_OLCU, OG_RENK, ogFontlari } from "@/lib/og-fontlari";
import { SITE } from "@/lib/site";

export const size = OG_OLCU;
export const contentType = "image/png";
export const alt = `${SITE.ad} Ligi — puan durumu, fikstür ve takım sayfaları`;

/**
 * Sitenin geneli için paylaşım görseli. WhatsApp, Instagram ve X'te
 * herhangi bir sayfanın linki paylaşıldığında (takım sayfaları hariç,
 * onların kendi görseli var) bu kart çıkar.
 */
export default async function OgGorseli() {
  const fonts = await ogFontlari();

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
          padding: "64px 72px",
          position: "relative",
        }}
      >
        {/* Stadyum ışığı hissi — sağ üstten inen yumuşak yeşil parlama */}
        <div
          style={{
            position: "absolute",
            top: -280,
            right: -160,
            width: 760,
            height: 760,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(23,163,58,0.42) 0%, rgba(4,21,11,0) 70%)",
            display: "flex",
          }}
        />

        {/* Üst şerit */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 16,
              height: 16,
              borderRadius: 9999,
              background: OG_RENK.gold,
            }}
          />
          <div
            style={{
              display: "flex",
              fontFamily: "Barlow",
              fontSize: 30,
              letterSpacing: 6,
              color: OG_RENK.mutedDark,
            }}
          >
            {SITE.slogan.toLocaleUpperCase("tr")}
          </div>
        </div>

        {/* Orta — marka adı ve sitenin ne olduğu */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Anton",
              fontSize: 168,
              lineHeight: 0.9,
              color: OG_RENK.beyaz,
              letterSpacing: 2,
            }}
          >
            SAHABİZİM
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Anton",
              fontSize: 168,
              lineHeight: 0.9,
              color: OG_RENK.brandLite,
              letterSpacing: 2,
            }}
          >
            LİGİ
          </div>
        </div>

        {/* Alt şerit */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              width: "100%",
              height: 5,
              background: OG_RENK.gold,
              marginBottom: 26,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Barlow",
                fontSize: 36,
                letterSpacing: 3,
                color: OG_RENK.beyaz,
              }}
            >
              PUAN DURUMU · FİKSTÜR · TAKIM SAYFALARI
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Barlow",
                fontSize: 36,
                letterSpacing: 3,
                color: OG_RENK.gold,
              }}
            >
              {SITE.sezon}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
