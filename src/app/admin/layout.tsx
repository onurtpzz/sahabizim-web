import type { Metadata } from "next";
import { AdminKabuk } from "./admin-kabuk";

/**
 * Yönetim paneli ayrı bir uygulama olarak yüklenebiliyor: kendi manifesti
 * (`/admin.webmanifest`, kapsamı yalnız /admin), kendi simgesi ve adı var.
 * Sitenin uygulamasıyla karışmasın diye bilgiler burada, sunucu layout'unda;
 * oturum ve menü mantığı istemci tarafındaki `AdminKabuk` içinde.
 */
export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s · SahaBizim Yönetim" },
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "SB Yönetim", statusBarStyle: "black" },
  icons: { apple: "/icons/admin-apple-180.png" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminKabuk>{children}</AdminKabuk>;
}
