import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions générales d\'utilisation',
  description: 'Conditions générales d\'utilisation de l\'application ONKHALASS.',
  robots: { index: true, follow: true },
}

const TERRA = '#e07a5f'
const INK = '#2d2a26'
const CREAM = '#faf4ed'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold" style={{ color: INK }}>{title}</h2>
      <div className="text-zinc-600 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div style={{ background: CREAM, minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(45,42,38,0.08)' }} className="bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold tracking-wider text-sm" style={{ color: INK }}>
            ← ONKHALASS
          </Link>
          <span className="text-xs text-zinc-400">Conditions générales d'utilisation</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-14 space-y-10">
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest" style={{ color: TERRA }}>Légal</p>
          <h1 className="text-4xl font-semibold tracking-tight" style={{ color: INK, fontFamily: 'Georgia, serif' }}>
            Conditions générales d'utilisation
          </h1>
          <p className="text-sm text-zinc-400">Dernière mise à jour : mai 2026</p>
        </div>

        <Section title="1. Objet">
          <p>Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de l'application ONKHALASS, disponible à l'adresse <strong>onkhalass.netlify.app</strong>.</p>
          <p>En créant un compte, vous acceptez ces CGU dans leur intégralité.</p>
        </Section>

        <Section title="2. Description du service">
          <p>ONKHALASS est une application de gestion de budget pour couples permettant :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Le suivi des dépenses communes et personnelles.</li>
            <li>La gestion de charges fixes récurrentes.</li>
            <li>La définition de budgets mensuels par catégorie.</li>
            <li>La création de pots d'épargne avec objectifs.</li>
            <li>Le calcul de l'équité financière entre partenaires.</li>
          </ul>
        </Section>

        <Section title="3. Inscription et compte">
          <p>L'accès au service nécessite la création d'un compte avec une adresse email valide. L'authentification s'effectue par lien magique (sans mot de passe). Vous êtes responsable de la confidentialité de votre accès.</p>
          <p>Chaque utilisateur ne peut disposer que d'un seul compte. Les comptes partagés sont interdits.</p>
        </Section>

        <Section title="4. Gratuité et évolution du service">
          <p>ONKHALASS est <strong>gratuit</strong> pendant la période beta. L'éditeur se réserve le droit d'introduire des offres payantes à l'avenir, avec un préavis raisonnable. Les fonctionnalités de base resteront accessibles gratuitement.</p>
        </Section>

        <Section title="5. Utilisation acceptable">
          <p>Vous vous engagez à utiliser ONKHALASS uniquement à des fins personnelles et légales. Sont notamment interdits :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Toute tentative d'accès non autorisé aux données d'autres utilisateurs.</li>
            <li>L'utilisation du service à des fins commerciales sans autorisation.</li>
            <li>La transmission de contenus illicites, diffamatoires ou portant atteinte aux droits de tiers.</li>
          </ul>
        </Section>

        <Section title="6. Données et confidentialité">
          <p>Le traitement de vos données personnelles est régi par notre <Link href="/legal/privacy" className="underline" style={{ color: TERRA }}>Politique de confidentialité</Link>. Vos données financières sont privées et accessibles uniquement à vous et votre partenaire.</p>
        </Section>

        <Section title="7. Disponibilité et responsabilité">
          <p>ONKHALASS est fourni "en l'état". L'éditeur s'efforce d'assurer la disponibilité du service mais ne peut garantir une accessibilité sans interruption. L'éditeur ne saurait être tenu responsable des décisions financières prises sur la base des données affichées dans l'application.</p>
        </Section>

        <Section title="8. Propriété intellectuelle">
          <p>L'application, son code, son design et ses contenus sont la propriété exclusive de l'éditeur et sont protégés par le droit de la propriété intellectuelle. Toute reproduction ou distribution sans autorisation est interdite.</p>
        </Section>

        <Section title="9. Suppression de compte">
          <p>Vous pouvez demander la suppression de votre compte à tout moment via les paramètres de l'application ou en contactant <a href="mailto:hello@onkhalass.app" className="underline" style={{ color: TERRA }}>hello@onkhalass.app</a>. Toutes vos données seront supprimées sous 30 jours.</p>
        </Section>

        <Section title="10. Modification des CGU">
          <p>L'éditeur se réserve le droit de modifier les présentes CGU. En cas de modification substantielle, les utilisateurs seront notifiés par email. La poursuite de l'utilisation du service vaut acceptation des nouvelles conditions.</p>
        </Section>

        <Section title="11. Droit applicable">
          <p>Les présentes CGU sont soumises au droit français. Tout litige sera soumis à la compétence exclusive des tribunaux français.</p>
        </Section>

        <Section title="12. Contact">
          <p>Pour toute question : <a href="mailto:hello@onkhalass.app" className="underline" style={{ color: TERRA }}>hello@onkhalass.app</a>.</p>
        </Section>
      </main>

      <footer className="border-t max-w-3xl mx-auto px-5 py-8 flex items-center justify-between text-xs text-zinc-400" style={{ borderColor: 'rgba(45,42,38,0.08)' }}>
        <span>© 2026 ONKHALASS</span>
        <Link href="/legal/privacy" className="hover:opacity-70 transition-opacity">Confidentialité →</Link>
      </footer>
    </div>
  )
}
