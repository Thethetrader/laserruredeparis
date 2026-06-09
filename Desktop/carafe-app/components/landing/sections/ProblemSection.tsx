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


function WhatsAppMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 300, height: 600 }}>
      {/* iPhone body */}
      <div
        className="absolute inset-0 rounded-[44px]"
        style={{ background: "#1C1C1E", boxShadow: "0 0 0 1px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.08), 0 32px 64px rgba(0,0,0,0.22)" }}
      />
      {/* Side buttons */}
      <div className="absolute rounded-r-sm" style={{ left: -3, top: 110, width: 3, height: 34, background: "#3A3A3C" }} />
      <div className="absolute rounded-r-sm" style={{ left: -3, top: 156, width: 3, height: 56, background: "#3A3A3C" }} />
      <div className="absolute rounded-r-sm" style={{ left: -3, top: 222, width: 3, height: 56, background: "#3A3A3C" }} />
      <div className="absolute rounded-l-sm" style={{ right: -3, top: 156, width: 3, height: 80, background: "#3A3A3C" }} />
      {/* Screen */}
      <div
        className="absolute overflow-hidden rounded-[36px]"
        style={{ inset: 10, background: "#EFEAE2" }}
      >
        {/* Dynamic Island */}
        <div
          className="absolute z-20 rounded-full"
          style={{ top: 12, left: "50%", transform: "translateX(-50%)", width: 108, height: 30, background: "#000" }}
        />
        {/* Status bar */}
        <div className="flex items-center justify-between px-5" style={{ height: 52, paddingTop: 14, background: "#008069" }}>
          <span className="text-[10px] font-semibold" style={{ color: "#fff" }}>9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-end gap-px">
              {[2, 3, 4, 5].map((h, i) => (
                <div key={i} className="w-1 rounded-sm" style={{ height: h * 2.5, background: i < 3 ? "#fff" : "rgba(255,255,255,0.4)" }} />
              ))}
            </div>
            <svg width="13" height="10" viewBox="0 0 12 9" fill="none"><path d="M6 1.5C8 1.5 9.7 2.4 11 3.8L12 2.8C10.4 1 8.3 0 6 0s-4.4 1-6 2.8l1 1C2.3 2.4 4 1.5 6 1.5z" fill="#fff" opacity=".6"/><path d="M6 4.5c1.1 0 2.1.4 2.8 1.1l1-1C8.7 3.6 7.4 3 6 3S3.3 3.6 2.2 4.6l1 1C3.9 4.9 4.9 4.5 6 4.5z" fill="#fff" opacity=".85"/><circle cx="6" cy="7.5" r="1.5" fill="#fff"/></svg>
            <svg width="24" height="12" viewBox="0 0 24 12"><rect x="0" y="1" width="20" height="10" rx="2" stroke="#fff" strokeWidth="1" fill="none" opacity=".7"/><rect x="1" y="2" width="15" height="8" rx="1" fill="#fff"/><path d="M21 4v4a2 2 0 0 0 0-4z" fill="#fff" opacity=".5"/></svg>
          </div>
        </div>
        {/* Chat header */}
        <div className="px-4 py-2.5 flex items-center gap-3" style={{ background: "#008069" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: "#25D366", color: "#fff" }}>R+</div>
          <div>
            <p className="text-[12px] font-semibold" style={{ color: "#fff" }}>Restaurant Équipe 🍽️</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>47 membres</p>
          </div>
        </div>
        {/* Messages scroll */}
        <div className="relative overflow-hidden" style={{ height: "calc(100% - 116px)", background: "#E5DDD5" }}>
          <div
            className="absolute inset-x-0"
            style={{ top: 0, animation: "scroll-msgs 18s linear infinite" }}
          >
            {[...messages, ...messages].map((msg, i) => (
              <div key={i} className={`flex ${msg.self ? "justify-end" : "justify-start"} px-3 py-1`}>
                <div
                  className="max-w-[74%] px-3 py-2"
                  style={{
                    background: msg.self ? "#D9FDD3" : "#FFFFFF",
                    borderRadius: msg.self ? "14px 3px 14px 14px" : "3px 14px 14px 14px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                  }}
                >
                  {!msg.self && (
                    <p className="text-[9px] font-semibold mb-0.5" style={{ color: "#1EA1F1" }}>{msg.from}</p>
                  )}
                  <p className="text-[11px] leading-snug" style={{ color: "#111B21" }}>{msg.text}</p>
                  <p className="text-[8px] text-right mt-0.5" style={{ color: "#667781" }}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 top-0 h-10 pointer-events-none" style={{ background: "linear-gradient(#E5DDD5, transparent)" }} />
          <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none" style={{ background: "linear-gradient(transparent, #E5DDD5)" }} />
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full" style={{ width: 100, height: 4, background: "rgba(0,0,0,0.2)" }} />
      </div>
    </div>
  );
}

export default function ProblemSection() {
  const titleRef = useRef<HTMLDivElement>(null);
  const inView = useInView(titleRef, { once: true, margin: "-80px" });

  return (
    <section className="py-20 overflow-hidden" style={{ background: "var(--background)" }}>
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
            WhatsApp, c&apos;est un flux où tout passe — et où tout se perd.
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
