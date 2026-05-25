import Link from "next/link";

export const metadata = { title: "Mentions légales — Karaf" };

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-[720px] mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] mb-10 transition-opacity hover:opacity-70" style={{ color: "var(--foreground-dim)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Retour à l&apos;accueil
        </Link>

        <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>Légal</p>
        <h1 className="font-semibold mb-10" style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}>
          Mentions légales
        </h1>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>Éditeur du site</h2>
            <p>Le site <strong style={{ color: "var(--foreground)" }}>karaf.fr</strong> est édité par :</p>
            <div className="mt-3 space-y-1 font-mono text-[12px]" style={{ color: "var(--foreground-dim)" }}>
              <p>Karaf</p>
              <p>France</p>
              <p>Tél. : +33 6 23 94 80 53</p>
              <p>Email : contact@karaf.fr</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>Hébergement</h2>
            <div className="space-y-1 font-mono text-[12px]" style={{ color: "var(--foreground-dim)" }}>
              <p>Netlify, Inc.</p>
              <p>44 Montgomery Street, Suite 300</p>
              <p>San Francisco, CA 94104 — États-Unis</p>
              <p>netlify.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des contenus présents sur le site karaf.fr (textes, images, logos, icônes, code) est la propriété exclusive de Karaf et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation ou exploitation, totale ou partielle, sans autorisation expresse est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>Données personnelles</h2>
            <p>
              Les informations collectées sur ce site font l&apos;objet d&apos;un traitement informatique destiné à la gestion des comptes utilisateurs et à l&apos;amélioration du service. Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez-nous à <span style={{ color: "var(--accent)" }}>contact@karaf.fr</span>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>Cookies</h2>
            <p>
              Le site utilise des cookies techniques nécessaires au fonctionnement du service (authentification, session). Aucun cookie publicitaire ou de tracking tiers n&apos;est déposé sans votre consentement.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-3" style={{ color: "var(--foreground)" }}>Responsabilité</h2>
            <p>
              Karaf s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur ce site. Toutefois, Karaf ne saurait être tenu responsable des erreurs, omissions ou des résultats qui pourraient être obtenus par un mauvais usage de ces informations.
            </p>
          </section>

          <p className="font-mono text-[11px]" style={{ color: "var(--foreground-dim)" }}>Dernière mise à jour : mai 2026</p>
        </div>
      </div>
    </div>
  );
}
