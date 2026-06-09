import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Karaf",
  description: "L'app de management pro pour la restauration",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Karaf",
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-32.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#06B6D4",
  viewportFit: "cover",
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Apply theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('karaf-theme');
            if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
          })();
        `}} />
        <style>{`
          body { background: #09090B; }
          html[data-theme="light"] body { background: #fafaf7; }
          #splash {
            position: fixed; inset: 0; z-index: 99999;
            background: #09090B;
            display: flex; align-items: center; justify-content: center;
            transition: opacity 0.4s ease;
          }
          html[data-theme="light"] #splash { background: #fafaf7; }
          #splash.fade { opacity: 0; pointer-events: none; }
          #splash img { width: 140px; height: 140px; object-fit: contain; }
        `}</style>
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <div id="splash">
          <img src="/logo.png" alt="Karaf" />
        </div>
        {/* Script placed after #splash so the element exists in DOM */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            function removeSplash() {
              var splash = document.getElementById('splash');
              if (!splash) return;
              splash.classList.add('fade');
              setTimeout(function() { if (splash && splash.parentNode) splash.parentNode.removeChild(splash); }, 450);
            }
            window.addEventListener('load', function() { setTimeout(removeSplash, 300); });
          })();
        `}} />
        <ServiceWorkerRegistration />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
