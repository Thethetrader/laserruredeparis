import React from 'react'
import './globals.css'

export const metadata = {
  title: 'Propulsemysite - Agence de création de sites web',
  description: 'Créez votre site web professionnel avec Propulsemysite',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
} 