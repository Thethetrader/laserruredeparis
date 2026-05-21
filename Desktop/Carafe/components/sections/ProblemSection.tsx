"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Waves, BellOff, FileX } from "lucide-react";

const messages = [
  { from: "Karim (Manager)", text: "Rappel procédure nettoyage hottes ! Voir doc Drive V2", time: "22:47", self: false },
  { from: "Vous", text: "👍", time: "23:01", self: true },
  { from: "Sofia", text: "Je serai en retard demain matin", time: "06:12", self: false },
  { from: "Marc", text: "moi aussi train annulé", time: "06:30", self: false },
  { from: "Karim (Manager)", text: "🔴 C'est quoi ça ??", time: "07:02", self: false },
  { from: "Patron", text: "Nouvelle carte lundi. Je vous envoie le PDF", time: "14:32", self: true },
  { from: "Patron", text: "📎 menu_ete_v3_FINAL_corrigé.pdf", time: "14:33", self: true },
  { from: "Julie", text: "c'est qui qui a fait la fermeture hier", time: "09:15", self: false },
  { from: "Julie", text: "la salle est dégueulasse", time: "09:16", self: false },
  { from: "Karim (Manager)", text: "Et la table 4 a laissé un mauvais avis on en parle demain", time: "02:48", self: false },
  { from: "Vous", text: "Rappel à 9h tout le monde pour mise en place !!!", time: "08:00", self: true },
  { from: "Sofia", text: "ok chef", time: "08:03", self: false },
  { from: "Marc", text: "Je suis là", time: "08:04", self: false },
  { from: "Karim (Manager)", text: "Rappel procédure nettoyage hottes ! Voir doc Drive V2", time: "22:47", self: false },
  { from: "Vous", text: "👍", time: "23:01", self: true },
];

const problems = [
  {
    icon: Waves,
    title: "Vous postez. Personne ne lit.",
    desc: "La procédure d'hygiène, la nouvelle carte, le rappel d'ouverture. Envoyés dans le groupe, noyés en dix minutes. L'info critique disparaît avec le reste.",
  },
  {
    icon: BellOff,
    title: "Les messages à 2h du mat.",
    desc: "L'équipe coupe les notifications. Les vrais sujets disparaissent avec le reste.",
  },
  {
    icon: FileX,
    title: "Le service commence dans le négatif.",
    desc: "Des reproches publics avant même le premier café. L'équipe arrive déjà à bout.",
  },
];

function WhatsAppMockup() {
  return (
    <div
      className="rounded-2xl overflow-hidden mx-auto"
      style={{ maxWidth: 320, background: "#0B141A", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Chat header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: "#1F2C34" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "#128C7E", color: "#fff" }}>R+</div>
        <div>
          <p className="text-[11px] font-semibold" style={{ color: "#E9EDEF" }}>Restaurant — Équipe 🍽️</p>
          <p className="text-[9px]" style={{ color: "#8696A0" }}>47 membres</p>
        </div>
      </div>
      {/* Messages scroll */}
      <div className="relative overflow-hidden" style={{ height: 280 }}>
        <div
          className="absolute inset-x-0"
          style={{
            top: 0,
            animation: "scroll-msgs 18s linear infinite",
          }}
        >
          {[...messages, ...messages].map((msg, i) => (
            <div key={i} className={`flex ${msg.self ? "justify-end" : "justify-start"} px-3 py-0.5`}>
              <div
                className="max-w-[72%] px-2.5 py-1.5 rounded-lg"
                style={{
                  background: msg.self ? "#005C4B" : "#1F2C34",
                  borderRadius: msg.self ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                }}
              >
                {!msg.self && (
                  <p className="text-[8px] font-semibold mb-0.5" style={{ color: "#53BDEB" }}>{msg.from}</p>
                )}
                <p className="text-[9px] leading-relaxed" style={{ color: "#E9EDEF" }}>{msg.text}</p>
                <p className="text-[7px] text-right mt-0.5" style={{ color: "#8696A0" }}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Fade masks */}
        <div className="absolute inset-x-0 top-0 h-12 pointer-events-none" style={{ background: "linear-gradient(#0B141A, transparent)" }} />
        <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none" style={{ background: "linear-gradient(transparent, #0B141A)" }} />
      </div>
    </div>
  );
}

export default function ProblemSection() {
  const titleRef = useRef<HTMLDivElement>(null);
  const inView = useInView(titleRef, { once: true, margin: "-80px" });

  return (
    <section className="pt-12 pb-28" style={{ background: "var(--background)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">
        {/* Title */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
            Le problème
          </p>
          <h2
            className="font-semibold tracking-tight leading-tight mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
          >
            Aujourd&apos;hui dans votre restau.
          </h2>
          <p className="text-base" style={{ color: "var(--foreground-muted)" }}>
            Reconnaissez-vous ce groupe ?
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center mb-14">
          {/* Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <WhatsAppMockup />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <p className="text-lg leading-relaxed mb-4" style={{ color: "var(--foreground-muted)" }}>
              47 membres. Des infos critiques noyées entre les GIFs et les retards de train.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--foreground-dim)" }}>
              C&apos;est pas de la mauvaise volonté. C&apos;est le mauvais outil.
            </p>
          </motion.div>
        </div>

        {/* Problems — zig-zag asymmetric, not 3 equal cols */}
        <div className="space-y-px" style={{ borderTop: "1px solid var(--border)" }}>
          {problems.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.12 }}
              className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 py-7"
              style={{
                borderBottom: "1px solid var(--border)",
                paddingLeft: i === 1 ? "clamp(0px, 4vw, 48px)" : undefined,
              }}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
                >
                  <Icon size={13} strokeWidth={1.5} style={{ color: "var(--foreground-dim)" }} />
                </div>
                <span
                  className="text-[13px] font-medium leading-tight"
                  style={{ color: "var(--foreground)", paddingTop: 4 }}
                >
                  {title}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)", maxWidth: "52ch" }}>
                {desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Signature */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-10 text-center font-mono text-[11px]"
          style={{ color: "var(--foreground-dim)" }}
        >
          Il y a un meilleur moyen.
        </motion.p>
      </div>
    </section>
  );
}
