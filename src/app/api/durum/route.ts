import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Sunucu tarafının veritabanını görüp göremediğini bildirir.
 *
 * Neden gerekli: ziyaretçiye açık sayfalar sunucuda üretiliyor ve Supabase'e
 * ulaşılamazsa site sessizce `src/data/takimlar.ts` içindeki eski yedek veriye
 * düşüyor — sayfa normal görünüyor ama rakamlar donuk kalıyor. Yönetim paneli
 * bu adresi okuyup durumu açıkça söylüyor.
 *
 * Dışarı yalnızca sayılar çıkıyor; anahtar veya bağlantı bilgisi dönmüyor.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabase) {
    return NextResponse.json({
      hazir: false,
      sebep: "ortam-degiskeni-yok",
      mesaj:
        "Sunucuda NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil.",
    });
  }

  const [takimlar, maclar, sezonlar] = await Promise.all([
    supabase.from("takimlar").select("id", { count: "exact", head: true }),
    supabase.from("maclar").select("id", { count: "exact", head: true }),
    supabase.from("sezonlar").select("ad").eq("aktif", true).limit(1),
  ]);

  const hata = takimlar.error?.message ?? maclar.error?.message ?? null;

  if (hata) {
    return NextResponse.json({
      hazir: false,
      sebep: "sorgu-hatasi",
      mesaj: `Veritabanına ulaşıldı ama sorgu reddedildi: ${hata}`,
    });
  }

  return NextResponse.json({
    hazir: true,
    takim: takimlar.count ?? 0,
    mac: maclar.count ?? 0,
    sezon: (sezonlar.data?.[0]?.ad as string) ?? null,
  });
}
