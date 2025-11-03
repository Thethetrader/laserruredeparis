import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "La Serrure de Paris - Serrurier Paris & Seine-Saint-Denis",
  description: "Service d'urgence serrurier 24h/24 à Paris et en Seine-Saint-Denis. Intervention rapide en moins de 30 minutes. Devis gratuit, tarifs transparents.",
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: "La Serrure de Paris - Serrurier Paris & Seine-Saint-Denis",
    description: "Service d'urgence serrurier 24h/24 à Paris et en Seine-Saint-Denis. Intervention rapide en moins de 30 minutes.",
    images: ['https://laserruredeparis.com/LOGOPNG.png'],
    type: 'website',
    url: 'https://laserruredeparis.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: "La Serrure de Paris - Serrurier Paris & Seine-Saint-Denis",
    description: "Service d'urgence serrurier 24h/24 à Paris et en Seine-Saint-Denis. Intervention rapide en moins de 30 minutes.",
    images: ['https://laserruredeparis.com/LOGOPNG.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
