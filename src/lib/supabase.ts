import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anahtar = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase ayarlı değilse `null` döner. Site bu durumda
 * `src/data/takimlar.ts` içindeki yedek veriyle çalışmaya devam eder,
 * böylece kurulum yarım kalsa bile sayfalar açılır.
 */
export const supabase: SupabaseClient | null =
  url && anahtar ? createClient(url, anahtar) : null;

export const supabaseHazir = Boolean(url && anahtar);
