"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check } from "lucide-react";

const features = [
  "Protocoles centralisés",
  "Confirmation de lecture",
  "Gestion des retards",
  "Challenges & trophées",
  "Fiches employés",
  "Avis Google nominatifs",
  "Passations de service",
  "Dashboard patron",
];

const plans = [
  {
    name: "Starter",
    tagline: "Pour les petites équipes",
    price: "29",
    limit: "Jusqu'à 15 utilisateurs",
    cta: "Commencer",
    primary: false,
  },
  {
    name: "Standard",
    tagline: "Pour les équipes établies",
    price: "59",
    limit: "Jusqu'à 35 utilisateurs",
    cta: "Commencer",
    primary: true,
    badge: "Le plus choisi",
  },
  {
    name: "Pro",
    tagline: "Pour les grandes équipes",
    price: "99",
    limit: "35+ utilisateurs (illimité)",
    cta: "Nous contacter",
    primary: false,
    extra: "+ Support prioritaire",
  },
];

export default function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="pricing" className="py-32" style={{ background: "var(--background-soft)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
            Tarifs
          </p>
          <h2
            className="font-semibold tracking-tight leading-tight mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
          >
            Un prix juste. Sans surprise.
          </h2>
          <p className="text-base" style={{ color: "var(--foreground-muted)" }}>
            Choisissez selon la taille de votre équipe. Changez quand vous voulez.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.1 }}
              className="relative p-8 rounded-xl flex flex-col transition-transform duration-200 hover:-translate-y-1"
              style={{
                background: "var(--background)",
                border: plan.primary ? "1px solid rgba(6,182,212,0.4)" : "1px solid var(--border)",
                ...(plan.primary ? { boxShadow: "0 0 60px 0 rgba(6,182,212,0.1)" } : {}),
              }}
            >
              {plan.badge && (
                <div
                  className="absolute -top-3 left-6 font-mono text-[9px] uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{ background: "var(--accent)", color: "#09090B" }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--foreground)" }}>{plan.name}</p>
                <p className="text-[12px]" style={{ color: "var(--foreground-muted)" }}>{plan.tagline}</p>
              </div>

              <div className="flex items-end gap-1 mb-2">
                <span className="text-[40px] font-semibold leading-none" style={{ color: "var(--foreground)" }}>{plan.price}€</span>
                <span className="text-[12px] mb-1.5" style={{ color: "var(--foreground-dim)" }}>/mois HT</span>
              </div>
              <p className="font-mono text-[10px] mb-6" style={{ color: "var(--foreground-dim)" }}>{plan.limit}</p>

              <ul className="space-y-2.5 mb-6 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <Check size={11} strokeWidth={2.5} style={{ color: plan.primary ? "var(--accent)" : "var(--success)" }} />
                    <span className="text-[12px]" style={{ color: "var(--foreground-muted)" }}>{f}</span>
                  </li>
                ))}
                {plan.extra && (
                  <li className="flex items-center gap-2">
                    <Check size={11} strokeWidth={2.5} style={{ color: "var(--accent)" }} />
                    <span className="text-[12px] font-medium" style={{ color: "var(--accent)" }}>{plan.extra}</span>
                  </li>
                )}
              </ul>

              <a
                href="#cta"
                className="w-full text-center py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={plan.primary
                  ? { background: "var(--accent)", color: "#09090B" }
                  : { color: "var(--foreground-muted)", border: "1px solid var(--border)" }
                }
                onMouseEnter={e => {
                  if (!plan.primary) { e.currentTarget.style.color = "var(--foreground)"; e.currentTarget.style.borderColor = "var(--foreground-dim)"; }
                }}
                onMouseLeave={e => {
                  if (!plan.primary) { e.currentTarget.style.color = "var(--foreground-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }
                }}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        <p className="text-center font-mono text-[11px]" style={{ color: "var(--foreground-dim)" }}>
          14 jours d&apos;essai gratuit · Sans carte bancaire · Sans engagement
        </p>
      </div>
    </section>
  );
}
