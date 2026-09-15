"use client";

import { useSyncExternalStore } from "react";

/**
 * "Uygulama olarak yükle" durumu — sitedeki şerit, mobil menü, altbilgi ve
 * yönetim paneli başlığı aynı kaynağı dinliyor.
 *
 * Tarayıcı farkı (değiştirilemez, tarayıcıların kararı):
 *   Chrome / Edge / Samsung (Android + masaüstü) → `beforeinstallprompt` olayı
 *     gelir; saklayıp düğmeye basılınca `prompt()` çağırıyoruz.
 *   iPhone / iPad (Safari ve iOS'taki bütün tarayıcılar) → böyle bir olay YOK.
 *     Kullanıcı Paylaş → "Ana Ekrana Ekle" yapmak zorunda; biz tarif gösteriyoruz.
 *   Firefox masaüstü → yükleme desteklenmiyor, hiçbir şey gösterilmiyor.
 *
 * Olay sayfa yüklenir yüklenmez gelebiliyor, React'ten önce. Kök layout'taki
 * satır içi betik onu `window.__sbYukleme` içine yakalıyor; burada oradan okunur.
 */

type YuklemeOlayi = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __sbYukleme?: YuklemeOlayi | null;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export type YuklemeDurumu = "bilinmiyor" | "yuklu" | "tarayici" | "ios" | "yok";

const dinleyiciler = new Set<() => void>();
let kuruldu = false;
let durum: YuklemeDurumu = "bilinmiyor";

function hesapla(): YuklemeDurumu {
  if (typeof window === "undefined") return "bilinmiyor";
  const bagimsiz =
    window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (bagimsiz) return "yuklu";
  if (window.__sbYukleme) return "tarayici";
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "yok";
}

function yenile() {
  const yeni = hesapla();
  if (yeni !== durum) {
    durum = yeni;
    dinleyiciler.forEach((d) => d());
  }
}

function kur() {
  if (kuruldu || typeof window === "undefined") return;
  kuruldu = true;
  durum = hesapla();
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.__sbYukleme = e as YuklemeOlayi;
    yenile();
  });
  window.addEventListener("appinstalled", () => {
    window.__sbYukleme = null;
    durum = "yuklu";
    dinleyiciler.forEach((d) => d());
  });
  window.matchMedia("(display-mode: standalone)").addEventListener("change", yenile);
}

function abone(d: () => void) {
  kur();
  dinleyiciler.add(d);
  return () => dinleyiciler.delete(d);
}

export function useYuklemeDurumu(): YuklemeDurumu {
  return useSyncExternalStore(
    abone,
    () => {
      kur();
      return durum;
    },
    () => "bilinmiyor",
  );
}

/** Chrome ailesinde yükleme penceresini açar. Kabul edildiyse true. */
export async function yuklemeyiBaslat(): Promise<boolean> {
  const olay = window.__sbYukleme;
  if (!olay) return false;
  await olay.prompt();
  const secim = await olay.userChoice;
  // Olay tek kullanımlık; reddedilirse tarayıcı ileride yenisini gönderebilir.
  window.__sbYukleme = null;
  yenile();
  return secim.outcome === "accepted";
}

