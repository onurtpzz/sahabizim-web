"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alan, Dugme, Girdi, Uyari } from "@/components/admin/ui";
import { supabase } from "@/lib/supabase";

export default function GirisSayfasi() {
  const router = useRouter();
  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [bekle, setBekle] = useState(false);

  async function giris(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBekle(true);
    setHata("");
    const { error } = await supabase.auth.signInWithPassword({ email: eposta, password: sifre });
    setBekle(false);
    if (error) {
      setHata(
        error.message.includes("Invalid login")
          ? "E-posta veya şifre hatalı."
          : error.message,
      );
      return;
    }
    router.replace("/admin");
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="display text-3xl">Yönetim Girişi</h1>
      <p className="mt-2 text-sm text-muted-dark">
        Yalnızca yetkili e-postalar giriş yapabilir.
      </p>

      <form onSubmit={giris} className="mt-7 grid gap-4">
        <Alan etiket="E-posta">
          <Girdi
            id="eposta"
            type="email"
            autoComplete="username"
            required
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
          />
        </Alan>
        <Alan etiket="Şifre">
          <Girdi
            id="sifre"
            type="password"
            autoComplete="current-password"
            required
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
          />
        </Alan>
        {hata && <Uyari tur="hata">{hata}</Uyari>}
        <Dugme type="submit" disabled={bekle}>
          {bekle ? "Giriş yapılıyor…" : "Giriş Yap"}
        </Dugme>
      </form>
    </div>
  );
}
