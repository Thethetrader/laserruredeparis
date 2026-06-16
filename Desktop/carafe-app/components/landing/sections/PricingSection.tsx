"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const FEATURES = [
  "Planning de l'équipe généré par l'IA",
  "Protocoles accessibles à toute l'équipe",
  "Challenges, primes et reconnaissance",
  "Retours clients en temps réel",
  "Récap hebdo automatique",
  "Support inclus",
];

const TABLE_ROWS = [
  { label: "1 petit étab (< 10 sal.)", total: "29€", devis: false },
  { label: "1 grand étab (≥ 10 sal.)", total: "39€", devis: false },
  { label: "2 petits étabs", total: "48€", devis: false },
  { label: "2 grands étabs", total: "68€", devis: false },
  { label: "Petit + grand", total: "58€", devis: false },
  { label: "3 étabs et plus", total: "Sur devis", devis: true },
];

export default function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="pricing" className="py-20" style={{ background: "var(--background-soft)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
            [ TARIFS ]
          </p>
          <h2
            className="font-semibold tracking-tight leading-tight mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
          >
            Un prix par établissement. Sans surprise.
          </h2>
          <p className="text-base max-w-[52ch] mx-auto" style={{ color: "var(--foreground-muted)" }}>
            Tout inclus, quelle que soit la taille de votre équipe. Plus vous avez d&apos;établissements, plus le prix baisse.
          </p>
        </motion.div>

        {/* Carte principale */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="mx-auto mb-6 rounded-2xl pricing-glow"
          style={{
            maxWidth: 580,
            background: "var(--background)",
            border: "1px solid rgba(15,81,50,0.3)",
            padding: "48px",
          }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest mb-6" style={{ color: "var(--accent)" }}>
            [ TARIF DE BASE ]
          </p>

          <div className="flex items-end gap-4 mb-2">
            <div>
              <span
                className="font-semibold leading-none"
                style={{ fontSize: 72, color: "var(--accent)", letterSpacing: "-0.04em" }}
              >
                29€
              </span>
              <span className="text-base ml-1" style={{ color: "var(--foreground-muted)" }}>/mois</span>
            </div>
            <div className="pb-3 flex flex-col items-start">
              <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded mb-1" style={{ background: "var(--background-elev)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}>ou 39€</span>
              <span className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>≥ 10 salariés</span>
            </div>
          </div>
          <p className="text-base mb-8" style={{ color: "var(--foreground-muted)" }}>
            HT par établissement · 19€ ou 29€ pour chaque étab supplémentaire
          </p>

          <div className="mb-8" style={{ height: 1, background: "var(--border)" }} />

          <ul className="space-y-3 mb-8">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3">
                <span
                  className="flex-shrink-0 font-mono text-[12px] leading-none"
                  style={{ color: "var(--accent)" }}
                >
                  ✓
                </span>
                <span className="text-[13px]" style={{ color: "var(--foreground-muted)" }}>{f}</span>
              </li>
            ))}
          </ul>

          <div className="mb-8" style={{ height: 1, background: "var(--border)" }} />

          <p className="font-mono text-[13px] mb-8" style={{ color: "var(--foreground-muted)" }}>
            Vous avez plusieurs établissements ? Le 2e à 5e passe à 29€/mois chacun.
          </p>

          <a
            href="/signup"
            className="block w-full text-center py-3.5 rounded-xl text-[14px] font-semibold transition-opacity hover:opacity-90 mb-3"
            style={{ background: "var(--accent)", color: "#fafaf7" }}
          >
            Commencer maintenant
          </a>
          <a
            href="#cta"
            className="block w-full text-center py-3 rounded-xl text-[13px] transition-colors duration-150"
            style={{ color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--foreground)"; e.currentTarget.style.borderColor = "var(--foreground-dim)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--foreground-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            Rejoindre la liste d&apos;attente
          </a>
        </motion.div>

        {/* Tableau dégressivité */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          className="mx-auto mb-10"
          style={{ maxWidth: 580 }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest mb-3 text-center" style={{ color: "var(--foreground-dim)" }}>
            [ EXEMPLES ]
          </p>
          <h3
            className="font-semibold text-center mb-5 tracking-tight"
            style={{ fontSize: "clamp(16px, 2vw, 20px)", letterSpacing: "-0.03em", color: "var(--foreground)" }}
          >
            Selon le nombre de vos établissements.
          </h3>

          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div
              className="grid grid-cols-2 px-4 py-2.5"
              style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}
            >
              <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "var(--foreground-dim)" }}>
                Nombre d&apos;établissements
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-right" style={{ color: "var(--foreground-dim)" }}>
                Total mensuel
              </span>
            </div>

            {TABLE_ROWS.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.35 + i * 0.08 }}
                className="grid grid-cols-2 px-4 py-3 transition-colors duration-100 cursor-default"
                style={{
                  borderBottom: i < TABLE_ROWS.length - 1 ? "1px solid var(--border)" : "none",
                  background: "var(--background)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--background-elev)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--background)"; }}
              >
                <span className="text-[13px]" style={{ color: "var(--foreground)" }}>{row.label}</span>
                {row.devis ? (
                  <a
                    href="mailto:contact@karaf.fr"
                    className="font-mono text-[13px] text-right transition-all duration-150"
                    style={{ color: "var(--accent)" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-glow)"; e.currentTarget.style.textDecoration = "underline"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.textDecoration = "none"; }}
                  >
                    {row.total}
                  </a>
                ) : (
                  <span className="font-mono text-[13px] text-right" style={{ color: "var(--accent)" }}>{row.total}</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mention légale */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-center font-mono text-[11px]"
          style={{ color: "var(--foreground-dim)" }}
        >
          Accès immédiat après paiement · Sans engagement · Annulation en un clic
        </motion.p>
      </div>

      <style>{`
        .pricing-glow {
          box-shadow: 0 0 40px rgba(15,81,50,0.1);
          animation: pricing-pulse 4s ease-in-out infinite;
        }
        @keyframes pricing-pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(15,81,50,0.1); }
          50%       { box-shadow: 0 0 60px rgba(15,81,50,0.2); }
        }
      `}</style>
    </section>
  );
}
