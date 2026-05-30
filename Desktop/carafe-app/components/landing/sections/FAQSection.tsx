"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "Est-ce que Karaf remplace WhatsApp ?",
    a: "Oui, pour la communication pro entre la direction et l'équipe. Si vos employés veulent garder un groupe WhatsApp entre eux, ils peuvent, ce n'est pas notre rôle, et ça vous protège juridiquement.",
  },
  {
    q: "Combien de temps pour mettre en place Karaf ?",
    a: "Cinq minutes pour créer votre compte, ajouter votre équipe, et publier vos premiers protocoles. Une heure pour tout transférer de vos anciens supports. Ensuite c'est l'app qui travaille.",
  },
  {
    q: "Mes employés vont-ils vraiment l'utiliser ?",
    a: "Oui, parce qu'ils y trouvent leur intérêt : leur fiche se remplit avec leurs avis, leurs compétences, leurs trophées. Mois après mois, ça devient une lettre de recommandation qu'ils emportent. Karaf valorise leur travail, il ne les surveille pas.",
  },
  {
    q: "Et si je ne suis pas à l'aise avec la tech ?",
    a: "L'app est faite pour la restauration, pas pour des ingénieurs. Si vous savez utiliser WhatsApp, vous savez utiliser Karaf.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Hébergement en France, conformité RGPD, chiffrement des données. Vous pouvez exporter ou supprimer toutes vos données à tout moment.",
  },
  {
    q: "Puis-je essayer avant de m'engager ?",
    a: "14 jours d'essai gratuit, sans carte bancaire. Si vous ne renouvelez pas, votre compte s'arrête, point.",
  },
  {
    q: "Comment ça marche si j'ai plusieurs restaurants ?",
    a: "Vous payez 39€/mois pour votre premier établissement. À partir du 2e, chaque restaurant supplémentaire est à 29€/mois jusqu'au 5e. Au-delà, on définit un tarif réseau personnalisé selon votre structure. Tous les établissements sont gérés depuis un seul compte, avec des protocoles et des équipes propres à chacun.",
  },
  {
    q: "Le tarif dépend du nombre d'employés ?",
    a: "Non. Vous payez par établissement, pas par utilisateur. Que vous ayez 5 ou 30 personnes dans votre équipe, le prix reste le même. Vous embauchez sans vous soucier du coût de l'app.",
  },
  {
    q: "Et si j'ai déjà un planning Combo / Skello ?",
    a: "Gardez-les. Karaf ne fait pas de planning. On se concentre sur ce que les autres ne font pas bien : communication, protocoles, motivation, reconnaissance.",
  },
  {
    q: "Comment Karaf vous aide concrètement chaque semaine ?",
    a: "Karaf analyse les données de votre établissement et vous prépare un récap chaque lundi matin. Qui a brillé, qui a eu des retards, quels challenges ont été gagnés. Cinq minutes pour piloter. Karaf propose, vous décidez.",
  },
  {
    q: "Et les avis Google, vous gérez ça ?",
    a: "Pour l'instant, quand vous recevez un avis client qui mentionne un de vos employés, vous le collez dans Karaf en 30 secondes. Il s'archive sur la fiche de cet employé. Une intégration directe avec Google est prévue plus tard.",
  },
];

function FAQItem({ q, a, index, inView }: { q: string; a: string; index: number; inView: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span
          className="text-sm font-medium pr-8 transition-colors duration-150"
          style={{ color: open ? "var(--foreground)" : "var(--foreground-muted)" }}
        >
          {q}
        </span>
        <span
          className="font-mono text-base flex-shrink-0 transition-colors duration-150"
          style={{ color: open ? "var(--accent)" : "var(--foreground-dim)" }}
        >
          {open ? "[−]" : "[+]"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm leading-relaxed pb-5" style={{ color: "var(--foreground-dim)" }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="faq" className="py-12 md:py-16 overflow-hidden" style={{ background: "var(--background)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-16">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
              FAQ
            </p>
            <h2
              className="font-semibold tracking-tight leading-tight mb-4"
              style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
            >
              Les questions qu&apos;on me pose souvent.
            </h2>
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
              Une question pas dans la liste ? Écrivez-nous.
            </p>
          </motion.div>

          <div style={{ borderTop: "1px solid var(--border)" }}>
            {faqs.map((faq, i) => (
              <FAQItem key={faq.q} {...faq} index={i} inView={inView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
