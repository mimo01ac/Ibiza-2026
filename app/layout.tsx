import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
import Navbar from "./components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ibiza 2026",
  description: "The ultimate Ibiza trip portal - June 27, 2026",
  robots: {
    index: false,
    follow: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ibiza 2026",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/icon-192.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
        <Script
          id="sw-register"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
      </body>
    </html>
  );
}
