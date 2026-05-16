import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ONKHALASS · Le budget de votre couple, enfin clair',
  description: "Suivez vos dépenses à deux, programmez vos charges fixes, et soldez vos comptes chaque mois. À la fin : on khalass.",
  openGraph: {
    title: 'ONKHALASS · Le budget de votre couple, enfin clair',
    description: "Suivez vos dépenses à deux, programmez vos charges fixes, et soldez vos comptes chaque mois.",
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ONKHALASS · Le budget de votre couple, enfin clair',
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh]">{children}</div>
}
