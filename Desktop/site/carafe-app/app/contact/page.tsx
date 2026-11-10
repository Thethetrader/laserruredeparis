import Link from "next/link";

export const metadata = { title: "Contact — Karaf" };

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center" style={{ background: "var(--background)" }}>
      <div className="max-w-[600px] mx-auto px-6 py-16 w-full">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] mb-10 transition-opacity hover:opacity-70" style={{ color: "var(--foreground-dim)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Retour à l&apos;accueil
        </Link>

        <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>Nous contacter</p>
        <h1 className="font-semibold mb-4" style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}>
          On est là.
        </h1>
        <p className="text-base mb-12" style={{ color: "var(--foreground-muted)" }}>
          Une question, un problème ou envie d&apos;essayer Karaf dans votre établissement — on vous répond vite.
        </p>

        <div className="space-y-4">
          <a
            href="tel:+33623948053"
            className="flex items-center gap-4 p-5 rounded-xl transition-colors duration-150 group"
            style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.03 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--foreground-dim)" }}>Téléphone</p>
              <p className="text-base font-medium" style={{ color: "var(--foreground)" }}>+33 6 23 94 80 53</p>
            </div>
          </a>

          <a
            href="mailto:contact@karaf.fr"
            className="flex items-center gap-4 p-5 rounded-xl transition-colors duration-150 group"
            style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--foreground-dim)" }}>Email</p>
              <p className="text-base font-medium" style={{ color: "var(--foreground)" }}>contact@karaf.fr</p>
            </div>
          </a>
        </div>

        <div className="mt-12 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="font-mono text-[11px]" style={{ color: "var(--foreground-dim)" }}>
            Disponible du lundi au vendredi · Réponse sous 24h
          </p>
        </div>
      </div>
    </div>
  );
}
