import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Carafe : L'app de communication pro pour la restauration",
  description:
    "Carafe remplace les groupes WhatsApp pro dans votre restaurant. Protocoles centralisés, retards tracés, équipe motivée. Tout au même endroit.",
  keywords: ["restaurant", "communication professionnelle", "protocoles", "gestion équipe", "restauration"],
  openGraph: {
    title: "Carafe. Tout coule. Rien ne se perd.",
    description:
      "L'app de communication pro pensée pour la restauration. Pas pour faire des smileys, pour faire tourner votre établissement.",
    type: "website",
    locale: "fr_FR",
  },
};

/* Inject design tokens as inline styles to bypass Tailwind v4 variable stripping */
const tokens = {
  "--background":        "#09090B",
  "--background-soft":   "#111114",
  "--background-elev":   "#1A1A1F",
  "--border":            "#27272A",
  "--border-soft":       "#1F1F23",
  "--foreground":        "#FAFAFA",
  "--foreground-muted":  "#A1A1AA",
  "--foreground-dim":    "#71717A",
  "--accent":            "#06B6D4",
  "--accent-glow":       "#22D3EE",
  "--accent-deep":       "#0891B2",
  "--success":           "#10B981",
  "--warning":           "#F59E0B",
  "--danger":            "#EF4444",
} as unknown as React.CSSProperties;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`} style={tokens}>
      <body
        className="font-sans antialiased"
        style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
      >
        {children}
      </body>
    </html>
  );
}
