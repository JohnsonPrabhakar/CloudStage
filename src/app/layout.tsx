import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import NotificationPermissionHandler from "@/components/NotificationPermissionHandler";

export const metadata: Metadata = {
  title: "CloudStage",
  description: "Your virtual stage for live events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a0000" />
      </head>
      <body
        className={cn(
          "min-h-screen font-body antialiased",
        )}
      >
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
        <NotificationPermissionHandler />
        <Script id="service-worker-registration">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/firebase-messaging-sw.js');
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
