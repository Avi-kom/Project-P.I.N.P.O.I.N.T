import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PinsProvider } from "@/lib/pins-context";
import { RegisterServiceWorker } from "@/components/register-sw";
import { OfflineBanner } from "@/components/offline-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "P.I.N.P.O.I.N.T.",
  description: "See it. Pin it. Solve it.",
  manifest: "/manifest.json",
  icons: [{ rel: "icon", url: "/icon.svg" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "P.I.N.P.O.I.N.T.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-[100dvh] flex-col overflow-hidden bg-slate-950">
        <RegisterServiceWorker />
        <PinsProvider>
          <OfflineBanner />
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </PinsProvider>
      </body>
    </html>
  );
}
