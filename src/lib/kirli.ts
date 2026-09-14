"use client";

import { useEffect } from "react";

/**
 * "Kaydedilmemiş değişiklik var mı?" defteri.
 *
 * Neden gerekli: panelde bir maçın skorunu yazıp Kaydet'e basmadan başka
 * sekmeye geçince yazdığın sessizce gidiyordu. Hangi satırların kirli olduğunu
 * burada tutuyoruz; admin layout menüye tıklamadan önce buraya bakıp soruyor,
 * tarayıcı sekmesi kapatılırken de uyarı çıkıyor.
 *
 * React context yerine modül içi küçük bir defter: kirli satır sayısı panelin
 * her yerinden okunacak ama sık değişmeyecek bir bilgi, bunun için bütün ağacı
 * saran bir sağlayıcı kurmak gereksiz.
 */

const kirliler = new Set<string>();
const dinleyiciler = new Set<() => void>();

function duyur() {
  for (const d of dinleyiciler) d();
}

/** Kaydedilmemiş değişiklik olan bir alan var mı? */
export function kirliVarMi() {
  return kirliler.size > 0;
}

/** Kaç ayrı alanda kaydedilmemiş değişiklik var? */
export function kirliSayisi() {
  return kirliler.size;
}

/** Değişiklik olup olmadığını haber verir. `id` her alan için benzersiz olmalı. */
export function kirliBildir(id: string, kirli: boolean) {
  const vardi = kirliler.has(id);
  if (kirli === vardi) return;
  if (kirli) kirliler.add(id);
  else kirliler.delete(id);
  duyur();
}

export function kirliDinle(fn: () => void) {
  dinleyiciler.add(fn);
  return () => {
    dinleyiciler.delete(fn);
  };
}

/**
 * Bir alanın kaydedilmemiş durumunu deftere bağlar.
 * Bileşen ekrandan kalkarsa kaydı kendiliğinden siliyor — yoksa silinmiş bir
 * maç satırı sonsuza kadar "kirli" kalırdı.
 */
export function useKirli(id: string, kirli: boolean) {
  useEffect(() => {
    kirliBildir(id, kirli);
  }, [id, kirli]);

  useEffect(() => {
    return () => kirliBildir(id, false);
  }, [id]);
}
