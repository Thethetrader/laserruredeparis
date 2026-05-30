"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

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

function WhatsAppPhone() {
  return (
    <div
      style={{
        position: "relative",
        width: 260,
        height: 534,
        borderRadius: 36,
        background: "#111",
        boxShadow: "0 0 0 2px #333, 0 0 0 4px #1a1a1a, 0 32px 80px rgba(0,0,0,0.5)",
        padding: 6,
        flexShrink: 0,
        margin: "0 auto",
      }}
    >
      {/* Notch */}
      <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 80, height: 22, background: "#111", borderRadius: 99, zIndex: 10 }} />

      {/* Screen */}
      <div style={{ width: "100%", height: "100%", borderRadius: 30, overflow: "hidden", background: "#0B141A", display: "flex", flexDirection: "column" }}>
        {/* Status bar */}
        <div style={{ background: "#1F2C34", padding: "20px 12px 8px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#128C7E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff", flexShrink: 0 }}>R+</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#E9EDEF" }}>Restaurant Équipe 🍽️</p>
            <p style={{ margin: 0, fontSize: 8, color: "#8696A0" }}>47 membres</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              animation: "scroll-msgs 20s linear infinite",
              paddingTop: 8,
            }}
          >
            {[...messages, ...messages].map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.self ? "flex-end" : "flex-start", padding: "2px 8px" }}>
                <div
                  style={{
                    maxWidth: "72%",
                    padding: "5px 8px",
                    borderRadius: msg.self ? "10px 2px 10px 10px" : "2px 10px 10px 10px",
                    background: msg.self ? "#005C4B" : "#1F2C34",
                    marginBottom: 1,
                  }}
                >
                  {!msg.self && (
                    <p style={{ margin: 0, fontSize: 7, fontWeight: 600, color: "#53BDEB", marginBottom: 1 }}>{msg.from}</p>
                  )}
                  <p style={{ margin: 0, fontSize: 8, lineHeight: 1.4, color: "#E9EDEF" }}>{msg.text}</p>
                  <p style={{ margin: 0, fontSize: 6, textAlign: "right", marginTop: 1, color: "#8696A0" }}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 32, background: "linear-gradient(#0B141A, transparent)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, background: "linear-gradient(transparent, #0B141A)", pointerEvents: "none" }} />
        </div>

        {/* Input bar */}
        <div style={{ background: "#1F2C34", padding: "6px 8px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{ flex: 1, background: "#2A3942", borderRadius: 20, padding: "5px 10px", fontSize: 8, color: "#8696A0" }}>Message…</div>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#00A884", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 10 }}>🎤</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProblemSection() {
  const titleRef = useRef<HTMLDivElement>(null);
  const inView = useInView(titleRef, { once: true, margin: "-80px" });

  return (
    <section className="py-12 md:py-20 overflow-hidden" style={{ background: "var(--background)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">
        {/* Title */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 md:mb-14"
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
            WhatsApp, c&apos;est un flux où tout passe — et où tout se perd.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* iPhone mockup WhatsApp */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <WhatsAppPhone />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <p className="text-lg leading-relaxed mb-4" style={{ color: "var(--foreground-muted)" }}>
              Des infos importantes noyées entre les GIFs et les retards de train.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--foreground-dim)" }}>
              C&apos;est pas de la mauvaise volonté. C&apos;est le mauvais outil.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
