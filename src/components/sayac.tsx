"use client";

import { useEffect, useRef, useState } from "react";

/** Görünüme girdiğinde 0'dan hedefe sayan rakam. JS yoksa hedef değeri gösterir. */
export function Sayac({ hedef, sure = 1100 }: { hedef: number; sure?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [deger, setDeger] = useState(hedef);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setDeger(0);
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      let t0: number | null = null;
      const adim = (ts: number) => {
        if (t0 === null) t0 = ts;
        const p = Math.min((ts - t0) / sure, 1);
        setDeger(Math.round(hedef * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(adim);
      };
      requestAnimationFrame(adim);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hedef, sure]);

  return (
    <span ref={ref} className="tabular">
      {deger}
    </span>
  );
}
