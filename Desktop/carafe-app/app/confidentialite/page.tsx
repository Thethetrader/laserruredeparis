import Link from "next/link";

export const metadata = { title: "Politique de confidentialité — Karaf" };

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-[720px] mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] mb-10 transition-opacity hover:opacity-70" style={{ color: "var(--foreground-dim)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Retour à l&apos;accueil
        </Link>

        <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>Légal</p>
        <h1 className="font-semibold mb-10" style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}>
          Politique de confidentialité
        </h1>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données personnelles collectées via karaf.fr est Karaf (France). Contact : <span style={{ color: "var(--accent)" }}>contact@karaf.fr</span>
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>2. Données collectées</h2>
            <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
            <ul className="mt-2 space-y-1 pl-4">
              {[
                "Données d'identification : nom, prénom, adresse email",
                "Données de l'établissement : nom, ville",
                "Données d'usage : retours clients saisis, protocoles, présences",
                "Données techniques : adresse IP, navigateur (logs serveur)",
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span style={{ color: "var(--accent)" }}>—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>3. Finalités du traitement</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="mt-2 space-y-1 pl-4">
              {[
                "Créer et gérer votre compte utilisateur",
                "Fournir les fonctionnalités de l'application",
                "Envoyer des notifications liées à votre activité",
                "Améliorer le service (données agrégées et anonymisées)",
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span style={{ color: "var(--accent)" }}>—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>4. Base légale</h2>
            <p>
              Le traitement de vos données est fondé sur l&apos;exécution du contrat (CGU) que vous avez accepté lors de la création de votre compte, conformément à l&apos;article 6(1)(b) du RGPD.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>5. Conservation des données</h2>
            <p>
              Vos données sont conservées pendant la durée de vie de votre compte. En cas de suppression du compte, les données personnelles sont effacées dans un délai de 30 jours, sauf obligation légale de conservation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>6. Sous-traitants</h2>
            <p>Nous faisons appel aux sous-traitants suivants pour opérer le service :</p>
            <div className="mt-3 space-y-2">
              {[
                { name: "Supabase", role: "Base de données et authentification", pays: "UE" },
                { name: "Netlify", role: "Hébergement et déploiement", pays: "États-Unis" },
                { name: "Anthropic", role: "Analyse IA des retours clients", pays: "États-Unis" },
              ].map(({ name, role, pays }) => (
                <div key={name} className="flex items-start justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <span className="font-medium" style={{ color: "var(--foreground)" }}>{name}</span>
                    <span className="ml-2">{role}</span>
                  </div>
                  <span className="font-mono text-[11px] flex-shrink-0 ml-4" style={{ color: "var(--foreground-dim)" }}>{pays}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>7. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="mt-2 space-y-1 pl-4">
              {[
                "Droit d'accès à vos données personnelles",
                "Droit de rectification des données inexactes",
                "Droit à l'effacement (droit à l'oubli)",
                "Droit à la portabilité de vos données",
                "Droit d'opposition au traitement",
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span style={{ color: "var(--accent)" }}>—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Pour exercer ces droits : <span style={{ color: "var(--accent)" }}>contact@karaf.fr</span>. Vous pouvez également introduire une réclamation auprès de la <strong style={{ color: "var(--foreground)" }}>CNIL</strong> (cnil.fr).
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>8. Cookies</h2>
            <p>
              Karaf utilise uniquement des cookies techniques (session d&apos;authentification). Aucun cookie publicitaire ou analytique tiers n&apos;est utilisé.
            </p>
          </section>

          <p className="font-mono text-[11px]" style={{ color: "var(--foreground-dim)" }}>Dernière mise à jour : mai 2026</p>
        </div>
      </div>
    </div>
  );
}
