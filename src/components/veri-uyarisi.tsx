/**
 * Veritabanına ulaşılamadığında ziyaretçiye gösterilen uyarı.
 *
 * Neden var: site eskiden hata anında sessizce `src/data/takimlar.ts`
 * içindeki eski tabloya düşüyordu. Sayfa normal görünüyor, rakamlar donuk
 * kalıyordu; ziyaretçi eski veriyi güncel sanıyordu. Artık tablo hiç
 * gösterilmiyor, yerine bu şerit çıkıyor.
 *
 * Yönetici tarafındaki karşılığı `/admin` özet ekranındaki bağlantı şeridi
 * (`/api/durum`); orası teknik sebebi de yazar, burası yazmaz.
 */
export function VeriUyarisi({
  baslik = "Şu an güncellenemiyor",
  metin = "Sunucu veritabanına ulaşamadı. Eski ve yanlış rakam göstermemek için tablo gizlendi. Birkaç dakika içinde kendiliğinden düzelir; sayfayı yenilemen yeterli.",
}: {
  baslik?: string;
  metin?: string;
}) {
  return (
    <div
      role="status"
      className="rounded border border-line border-l-4 border-l-gold bg-gold/10 p-5 md:p-6"
    >
      <p className="flex items-center gap-2.5 font-[family-name:var(--font-data)] text-lg font-bold tracking-wide uppercase">
        <span aria-hidden className="text-gold">
          ⚠
        </span>
        {baslik}
      </p>
      <p className="mt-2 max-w-[62ch] text-muted">{metin}</p>
    </div>
  );
}
