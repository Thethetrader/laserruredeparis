import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment ONKHALASS collecte, utilise et protège vos données personnelles.',
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

export default function PrivacyPage() {
  return (
    <div style={{ background: CREAM, minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(45,42,38,0.08)' }} className="bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold tracking-wider text-sm" style={{ color: INK }}>
            ← ONKHALASS
          </Link>
          <span className="text-xs text-zinc-400">Politique de confidentialité</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-14 space-y-10">
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest" style={{ color: TERRA }}>Légal</p>
          <h1 className="text-4xl font-semibold tracking-tight" style={{ color: INK, fontFamily: 'Georgia, serif' }}>
            Politique de confidentialité
          </h1>
          <p className="text-sm text-zinc-400">Dernière mise à jour : mai 2026</p>
        </div>

        <Section title="1. Qui sommes-nous ?">
          <p>ONKHALASS est une application web progressive (PWA) de gestion de budget pour couples, accessible à l'adresse <strong>onkhalass.netlify.app</strong>. L'éditeur est joignable à : <a href="mailto:hello@onkhalass.app" className="underline" style={{ color: TERRA }}>hello@onkhalass.app</a>.</p>
        </Section>

        <Section title="2. Données collectées">
          <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Compte</strong> : adresse email (pour l'authentification par lien magique).</li>
            <li><strong>Profil</strong> : prénom/pseudo, couleur d'avatar, photo de profil (facultatif).</li>
            <li><strong>Données financières</strong> : dépenses, montants, catégories, budgets, pots d'épargne saisis par vous et votre partenaire.</li>
            <li><strong>Données techniques</strong> : logs de connexion, adresse IP, navigateur (via Supabase Auth).</li>
          </ul>
          <p>Nous ne collectons <strong>aucune donnée bancaire</strong> (numéro de carte, IBAN, etc.).</p>
        </Section>

        <Section title="3. Finalités et base légale">
          <ul className="list-disc pl-5 space-y-1">
            <li>Fourniture du service : exécution du contrat (art. 6.1.b RGPD).</li>
            <li>Sécurité et prévention des abus : intérêt légitime (art. 6.1.f RGPD).</li>
            <li>Amélioration du service : intérêt légitime (art. 6.1.f RGPD).</li>
          </ul>
        </Section>

        <Section title="4. Hébergement et sous-traitants">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> (base de données et authentification) — données stockées en Europe (région EU West).</li>
            <li><strong>Netlify</strong> (hébergement frontend) — CDN mondial.</li>
          </ul>
          <p>Ces prestataires sont soumis à des contrats de sous-traitance conformes au RGPD.</p>
        </Section>

        <Section title="5. Durée de conservation">
          <p>Vos données sont conservées le temps de votre utilisation du service. En cas de suppression de compte, toutes vos données sont effacées sous <strong>30 jours</strong>.</p>
        </Section>

        <Section title="6. Vos droits">
          <p>Conformément au RGPD, vous disposez des droits suivants : accès, rectification, effacement, portabilité, opposition et limitation. Pour exercer ces droits, contactez-nous à <a href="mailto:hello@onkhalass.app" className="underline" style={{ color: TERRA }}>hello@onkhalass.app</a>.</p>
        </Section>

        <Section title="7. Cookies">
          <p>ONKHALASS n'utilise pas de cookies publicitaires. Seuls des cookies strictement nécessaires à l'authentification et à la session sont déposés.</p>
        </Section>

        <Section title="8. Sécurité">
          <p>Les données sont chiffrées au repos et en transit (HTTPS). L'authentification se fait par lien magique (sans mot de passe). L'accès aux données est contrôlé par des politiques RLS (Row Level Security) au niveau de la base de données.</p>
        </Section>

        <Section title="9. Contact">
          <p>Pour toute question relative à vos données : <a href="mailto:hello@onkhalass.app" className="underline" style={{ color: TERRA }}>hello@onkhalass.app</a>.</p>
        </Section>
      </main>

      <footer className="border-t max-w-3xl mx-auto px-5 py-8 flex items-center justify-between text-xs text-zinc-400" style={{ borderColor: 'rgba(45,42,38,0.08)' }}>
        <span>© 2026 ONKHALASS</span>
        <Link href="/legal/terms" className="hover:opacity-70 transition-opacity">CGU →</Link>
      </footer>
    </div>
  )
}
