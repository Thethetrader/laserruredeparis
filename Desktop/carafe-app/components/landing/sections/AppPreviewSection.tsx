"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function AppPreviewSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-20 overflow-hidden" style={{ background: "var(--background)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
            [ APERÇU ]
          </p>
          <h2
            className="font-semibold tracking-tight leading-tight"
            style={{ fontSize: "clamp(24px, 3.5vw, 40px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
          >
            L&apos;app. Telle qu&apos;elle est.
          </h2>
        </motion.div>

        {/* Desktop preview — GIF dans un frame navigateur */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="hidden md:block mb-10"
        >
          <div
            className="rounded-xl overflow-hidden mx-auto"
            style={{
              maxWidth: 1000,
              border: "1px solid var(--border)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
            }}
          >
            {/* Barre navigateur */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: "var(--background-elev)", borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "#EF4444", opacity: 0.7 }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#F59E0B", opacity: 0.7 }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#10B981", opacity: 0.7 }} />
              </div>
              <div
                className="flex-1 mx-4 px-3 py-1 rounded text-[11px] font-mono text-center"
                style={{ background: "var(--background)", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}
              >
                app.karaf.fr
              </div>
            </div>
            {/* GIF */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/karaf-app-demo-desktop.gif"
              alt="Aperçu de l'application Karaf"
              className="w-full block"
              style={{ aspectRatio: "1404/840" }}
            />
          </div>
        </motion.div>

        {/* Mobile preview — iframe PWA scalée */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="flex justify-center md:hidden"
          style={{ overflow: "hidden" }}
        >
          {/* Frame téléphone — taille visible après scale */}
          <div
            className="relative rounded-[36px] flex-shrink-0"
            style={{
              width: 242,
              height: 440,
              border: "8px solid var(--background-elev)",
              boxShadow: "0 0 0 1px var(--border), 0 32px 64px rgba(0,0,0,0.5)",
              overflow: "hidden",
              isolation: "isolate",
            }}
          >
            {/* Notch */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 z-10 rounded-b-xl"
              style={{ width: 60, height: 16, background: "var(--background-elev)" }}
            />
            {/* Conteneur scale — clip strict */}
            <div style={{ width: 390, height: 720, transform: "scale(0.62)", transformOrigin: "top left", overflow: "hidden", pointerEvents: "none" }}>
              <iframe
                src="https://karaf.fr/dashboard"
                title="Aperçu Karaf PWA"
                scrolling="no"
                className="block border-0"
                style={{ width: 390, height: 720, overflow: "hidden" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Caption */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center font-mono text-[11px] mt-8"
          style={{ color: "var(--foreground-dim)" }}
        >
          Dashboard · Tâches · Protocoles · Retours clients · Challenges
        </motion.p>
      </div>
    </section>
  );
}
