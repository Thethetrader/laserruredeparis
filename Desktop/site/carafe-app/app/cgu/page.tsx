import Link from "next/link";

export const metadata = { title: "Conditions générales d'utilisation — Karaf" };

export default function CGUPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-[720px] mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] mb-10 transition-opacity hover:opacity-70" style={{ color: "var(--foreground-dim)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Retour à l&apos;accueil
        </Link>

        <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>Légal</p>
        <h1 className="font-semibold mb-10" style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}>
          Conditions générales d&apos;utilisation
        </h1>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>1. Objet</h2>
            <p>
              Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation de la plateforme Karaf, accessible à l&apos;adresse <span style={{ color: "var(--accent)" }}>karaf.fr</span>. En créant un compte, vous acceptez sans réserve les présentes conditions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>2. Description du service</h2>
            <p>
              Karaf est une application de communication professionnelle destinée aux équipes de restauration. Elle permet la gestion des protocoles, le suivi des retours clients, la reconnaissance des équipes et la communication interne.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>3. Accès au service</h2>
            <p>
              L&apos;accès à Karaf nécessite la création d&apos;un compte avec une adresse email valide. L&apos;utilisateur est responsable de la confidentialité de ses identifiants. Tout accès avec vos identifiants est réputé effectué par vous.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>4. Obligations de l&apos;utilisateur</h2>
            <p>L&apos;utilisateur s&apos;engage à :</p>
            <ul className="mt-2 space-y-1 list-none pl-4">
              {[
                "Utiliser le service dans le cadre légal et professionnel prévu",
                "Ne pas partager ses identifiants avec des tiers",
                "Ne pas utiliser le service à des fins illicites ou contraires aux bonnes mœurs",
                "Respecter la vie privée des autres membres de l'équipe",
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span style={{ color: "var(--accent)" }}>—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>5. Tarification</h2>
            <p>
              Karaf propose une période d&apos;essai gratuite de 14 jours sans engagement ni carte bancaire. À l&apos;issue de cette période, l&apos;accès au service est soumis à un abonnement dont les tarifs sont disponibles sur la page Tarifs du site.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>6. Données et confidentialité</h2>
            <p>
              Les données saisies sur Karaf (retours clients, protocoles, informations d&apos;équipe) sont hébergées de manière sécurisée et ne sont pas partagées avec des tiers à des fins commerciales. Voir notre <Link href="/confidentialite" style={{ color: "var(--accent)" }}>Politique de confidentialité</Link> pour plus de détails.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>7. Suspension et résiliation</h2>
            <p>
              Karaf se réserve le droit de suspendre ou résilier tout compte en cas de violation des présentes CGU, sans préavis ni remboursement. L&apos;utilisateur peut résilier son compte à tout moment en contactant le support.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>8. Modification des CGU</h2>
            <p>
              Karaf se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email de toute modification substantielle. L&apos;utilisation continue du service après notification vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>9. Droit applicable</h2>
            <p>
              Les présentes CGU sont soumises au droit français. Tout litige relatif à leur application sera soumis à la compétence des tribunaux français.
            </p>
          </section>

          <p className="font-mono text-[11px]" style={{ color: "var(--foreground-dim)" }}>Dernière mise à jour : mai 2026</p>
        </div>
      </div>
    </div>
  );
}
