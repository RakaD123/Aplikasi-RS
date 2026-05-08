import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Script from "next/script";

export const metadata: Metadata = {
  title: "RS Digital Portal — Platform Rumah Sakit Digital Terpadu",
  description: "Platform rumah sakit digital terpadu untuk kemudahan akses layanan kesehatan — pendaftaran online, konsultasi, hingga pemantauan kesehatan mandiri.",
  keywords: "rumah sakit digital, booking dokter, konsultasi online, telemedicine, kesehatan",
  openGraph: {
    title: "RS Digital Portal",
    description: "Platform rumah sakit digital terpadu untuk kemudahan akses layanan kesehatan.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
        <Script 
          src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true' 
            ? "https://app.midtrans.com/snap/snap.js" 
            : "https://app.sandbox.midtrans.com/snap/snap.js"} 
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-q9h4_gG5J7s3k0p2"}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
