"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Check, Download, Award } from "lucide-react";

const reviews = [
  { name: "Marie D.", text: "Yasmine a été formidable, service impeccable. On reviendra !", date: "il y a 2j" },
  { name: "Thomas B.", text: "Accueil exceptionnel, Yasmine a rendu notre soirée inoubliable.", date: "il y a 5j" },
  { name: "Camille L.", text: "Chef de salle au top, recommend fortement !", date: "il y a 8j" },
];

const skills = ["Gestion de salle", "Encaissement", "Allergènes", "Gestion VIP", "Onboarding équipe"];
const badges = ["Ponctuel", "Top équipe Q1", "Expert service", "Zéro retard"];

function useCountUp(target: number, active: boolean, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let t: ReturnType<typeof setTimeout>;
    t = setTimeout(() => {
      let current = 0;
      const step = Math.ceil(target / 40);
      const id = setInterval(() => {
        current = Math.min(current + step, target);
        setVal(current);
        if (current >= target) clearInterval(id);
      }, 30);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(t);
  }, [active, target, delay]);
  return val;
}

export default function EmployeeSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const protocols = useCountUp(47, inView, 300);
  const challenges = useCountUp(8, inView, 500);

  return (
    <section className="py-14 md:py-32" style={{ background: "var(--background)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
            Différenciant
          </p>
          <h2
            className="font-semibold tracking-tight leading-tight mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
          >
            La fiche pro de chaque employé.<br />Construite jour après jour.
          </h2>
          <p className="text-base max-w-[54ch]" style={{ color: "var(--foreground-muted)" }}>
            Chez vous, ils construisent une vraie réputation. C&apos;est ce qui les fait rester.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 items-start">
          {/* Employee card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--background-soft)", border: "1px solid var(--border)", boxShadow: "inset 0 1px 0 rgba(6,182,212,0.10), 0 4px 32px rgba(6,182,212,0.06)" }}
          >
            {/* Header */}
            <div className="p-6" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold flex-shrink-0"
                  style={{ background: "rgba(6,182,212,0.15)", border: "2px solid rgba(6,182,212,0.3)", color: "var(--accent)" }}
                >
                  YB
                </div>
                <div className="flex-1">
                  <h3 className="text-[18px] font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>Yasmine Benali</h3>
                  <p className="text-sm mb-0.5" style={{ color: "var(--foreground-muted)" }}>Chef de salle</p>
                  <p className="text-[12px] font-mono" style={{ color: "var(--foreground-dim)" }}>Le Comptoir des Halles</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-5">
                <div>
                  <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>2 ans 4 mois</p>
                  <p className="font-mono text-[9px]" style={{ color: "var(--foreground-dim)" }}>Ancienneté</p>
                </div>
                <div>
                  <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>{protocols}</p>
                  <p className="font-mono text-[9px]" style={{ color: "var(--foreground-dim)" }}>Protocoles validés</p>
                </div>
                <div>
                  <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>{challenges}</p>
                  <p className="font-mono text-[9px]" style={{ color: "var(--foreground-dim)" }}>Challenges gagnés</p>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>Badges</p>
              <div className="flex flex-wrap gap-2">
                {badges.map((b, i) => (
                  <motion.span
                    key={b}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 + i * 0.08 }}
                    className="flex items-center gap-1 font-mono text-[9px] px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.18)", color: "var(--accent)" }}
                  >
                    <Award size={8} />
                    {b}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>Avis clients reçus</p>
              <div className="space-y-3">
                {reviews.map(({ name, text, date }, i) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.6 + i * 0.1 }}
                    className="p-3 rounded-xl"
                    style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex gap-0.5 mb-1.5">
                      {[1,2,3,4,5].map(s=><Star key={s} size={9} style={{ color:"#F59E0B", fill:"#F59E0B" }} />)}
                    </div>
                    <p className="text-[10px] leading-relaxed mb-1.5" style={{ color: "var(--foreground-muted)" }}>&ldquo;{text}&rdquo;</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[8px]" style={{ color: "var(--foreground-dim)" }}>{name}</span>
                      <span className="font-mono text-[8px]" style={{ color: "var(--foreground-dim)" }}>·</span>
                      <span className="font-mono text-[8px]" style={{ color: "var(--foreground-dim)" }}>Google</span>
                      <span className="font-mono text-[8px]" style={{ color: "var(--foreground-dim)" }}>·</span>
                      <span className="font-mono text-[8px]" style={{ color: "var(--foreground-dim)" }}>{date}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-3" style={{ color: "var(--foreground-dim)" }}>Compétences validées</p>
              <div className="space-y-1.5">
                {skills.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, x: -8 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.8 + i * 0.07 }}
                    className="flex items-center gap-2"
                  >
                    <Check size={11} strokeWidth={2.5} style={{ color: "var(--success)" }} />
                    <span className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>{s}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Export */}
            <div className="px-6 py-4">
              <button
                className="flex items-center gap-2 text-[11px] font-medium px-4 py-2 rounded-lg transition-all duration-150"
                style={{ color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--foreground)"; e.currentTarget.style.borderColor = "var(--foreground-dim)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--foreground-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                <Download size={12} />
                Exporter ma fiche en PDF
              </button>
            </div>
          </motion.div>

          {/* Right: arguments */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="space-y-6"
          >
            {[
              { label: "Une lettre de recommandation moderne.", body: "Mois après mois, la fiche se remplit : compétences, avis, badges. Votre employé emporte sa réputation. C'est ce qui le pousse à s'investir." },
              { label: "Féliciter en un clic.", body: "À côté de chaque action validée, un bouton Bravo. Aussi rapide qu'un like. L'équipe sent que son travail compte." },
              { label: "Ils restent. Vraiment.", body: "Plus votre équipe est valorisée, moins elle veut partir. Un nouveau type de relation avec votre équipe." },
            ].map(({ label, body }, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[9px] font-mono tracking-widest" style={{ color: "var(--foreground-dim)" }}>[ POURQUOI ÇA COMPTE ]</p>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{label}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{body}</p>
              </div>
            ))}

            <div className="mt-8 space-y-1 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Vous avez deux choix.</p>
              <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Soit vous gardez vos employés en les empêchant de briller, et ils partent quand même.</p>
              <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>Soit vous les faites briller, et ils restent parce que nulle part ailleurs ils ne seront aussi valorisés.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
