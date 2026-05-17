import type { Metadata } from 'next'
import LandingClient from './LandingClient'

const BASE_URL = 'https://onkhalass.netlify.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'ONKHALASS — Budget couple : mieux dépenser, plus épargner',
  description:
    "L'app pour gérer votre budget à deux. Suivez vos dépenses communes, automatisez vos charges fixes, et faites grossir votre épargne ensemble — sans prise de tête.",
  keywords: [
    'budget couple',
    'application budget couple',
    'gestion dépenses couple',
    'épargne couple',
    'partage dépenses couple',
    'budget commun',
    'charges fixes couple',
    'application finance couple',
    'gérer argent couple',
    'optimiser dépenses',
  ],
  authors: [{ name: 'ONKHALASS' }],
  creator: 'ONKHALASS',
  publisher: 'ONKHALASS',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BASE_URL,
    siteName: 'ONKHALASS',
    title: 'ONKHALASS — Mieux dépenser, plus épargner ensemble',
    description:
      "L'app de budget pour couples. Dépenses partagées, charges fixes automatiques, épargne commune avec objectifs.",
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'ONKHALASS — Budget couple',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@onkhalass',
    creator: '@onkhalass',
    title: 'ONKHALASS — Budget couple',
    description: 'Mieux dépenser. Plus épargner. Ensemble.',
    images: ['/og.png'],
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ONKHALASS',
  },
  category: 'finance',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'ONKHALASS',
      description: "L'app de budget pour couples",
      inLanguage: 'fr-FR',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${BASE_URL}/login`,
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${BASE_URL}/#app`,
      name: 'ONKHALASS',
      description:
        "Application de gestion de budget pour couples — dépenses partagées, charges fixes automatiques, épargne commune avec objectifs visuels.",
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web, iOS, Android',
      url: BASE_URL,
      inLanguage: 'fr-FR',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Gratuit pendant la beta',
      },
      featureList: [
        'Suivi des dépenses en couple',
        'Charges fixes récurrentes automatiques',
        'Budget mensuel par catégorie',
        'Pots d\'épargne avec objectifs',
        'Solde et équité entre partenaires',
        'Synchronisation temps réel',
      ],
      screenshot: `${BASE_URL}/og.png`,
    },
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#org`,
      name: 'ONKHALASS',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.jpg`,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'hello@onkhalass.app',
        contactType: 'customer support',
        availableLanguage: 'French',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "C'est gratuit ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, totalement gratuit pendant la beta. Un plan premium très abordable arrivera plus tard, mais le cœur restera gratuit.",
          },
        },
        {
          '@type': 'Question',
          name: "Ça marche sur iPhone et Android ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "ONKHALASS est une PWA — installable depuis le navigateur sur iOS et Android comme une app native.",
          },
        },
        {
          '@type': 'Question',
          name: "Faut-il que mon/ma partenaire ait un compte ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, vous êtes deux comptes reliés. Vous l'invitez par email en un clic depuis l'app.",
          },
        },
        {
          '@type': 'Question',
          name: "Mes données sont-elles privées ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Données stockées en Europe, chiffrées au repos. Pas de pub, pas de revente, export possible à tout moment.",
          },
        },
      ],
    },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClient />
    </>
  )
}
