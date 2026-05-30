"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const messages = [
  { from: "Karim", text: "Rappel : mise en place midi terminée à 11h30 max. La semaine dernière on a eu du retard 3 fois", time: "08:02", self: false },
  { from: "Vous", text: "👍 Compris", time: "08:05", self: true },
  { from: "Sofia", text: "ok chef", time: "08:06", self: false },
  { from: "Karim", text: "📎 Protocole_mise_en_place_salle_v3.pdf", time: "08:07", self: false },
  { from: "Karim", text: "Lisez le protocole SVP c'est important pour le service", time: "08:07", self: false },
  { from: "Marc", text: "c'est le même que la semaine dernière ?", time: "09:14", self: false },
  { from: "Rayan", text: "je serai en retard demain, train annulé", time: "10:32", self: false },
  { from: "Karim", text: "🔴 Encore ?? C'est la 3ème fois ce mois", time: "10:34", self: false },
  { from: "Vous", text: "La table 6 a laissé un avis négatif hier soir. On en parle en briefing", time: "11:01", self: true },
  { from: "Julie", text: "c'est qui qui a fait la fermeture hier ? le frigo était ouvert ce matin", time: "07:45", self: false },
  { from: "Karim", text: "😤😤", time: "07:46", self: false },
  { from: "Vous", text: "Rappel procédure HACCP temperatures frigos : entre 2° et 4°. Vérifiez matin et soir", time: "07:50", self: true },
  { from: "Marc", text: "👍", time: "07:52", self: false },
  { from: "Sofia", text: "reçu", time: "07:53", self: false },
  { from: "Rayan", text: "la nouvelle carte est dispo ?", time: "13:22", self: false },
  { from: "Vous", text: "📎 carte_ete_2025_FINAL_v2_corrigée.pdf", time: "13:25", self: true },
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
        {/* Header */}
        <div style={{ background: "#1F2C34", padding: "22px 10px 8px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* Group photo */}
          <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#2a3942" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ma.png" alt="Ma!" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.style.background = "#128C7E"; (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:9px;font-weight:700;color:#fff">M!</span>'; }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#E9EDEF" }}>Ma!</p>
            <p style={{ margin: 0, fontSize: 8, color: "#8696A0" }}>12 membres</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              animation: "scroll-msgs 24s linear infinite",
              paddingTop: 8,
            }}
          >
            {[...messages, ...messages].map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.self ? "flex-end" : "flex-start", padding: "2px 8px" }}>
                <div
                  style={{
                    maxWidth: "78%",
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
