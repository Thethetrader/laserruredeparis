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

        {/* Preview desktop — frame navigateur */}
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
              boxShadow: "0 24px 80px rgba(0,0,0,0.1)",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: "#ffffff", borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "#EF4444", opacity: 0.7 }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#F59E0B", opacity: 0.7 }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#10B981", opacity: 0.7 }} />
              </div>
              <div
                className="flex-1 mx-4 px-3 py-1 rounded text-[11px] font-mono text-center"
                style={{ background: "#f5f5f0", color: "var(--foreground-dim)", border: "1px solid var(--border)" }}
              >
                app.karaf.fr
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/karaf-app-demo-desktop.gif"
              alt="Aperçu de l'application Karaf"
              className="w-full block"
              style={{ aspectRatio: "1404/840" }}
            />
          </div>
        </motion.div>

        {/* Preview mobile — iPhone frame, GIF PWA centré */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="flex justify-center md:hidden"
        >
          {/* iPhone body */}
          <div className="relative" style={{ width: 280, height: 580 }}>
            <div
              className="absolute inset-0 rounded-[44px]"
              style={{ background: "#1C1C1E", boxShadow: "0 0 0 1px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.08), 0 32px 64px rgba(0,0,0,0.22)" }}
            />
            {/* Side buttons */}
            <div className="absolute rounded-r-sm" style={{ left: -3, top: 120, width: 3, height: 32, background: "#3A3A3C" }} />
            <div className="absolute rounded-r-sm" style={{ left: -3, top: 164, width: 3, height: 52, background: "#3A3A3C" }} />
            <div className="absolute rounded-r-sm" style={{ left: -3, top: 228, width: 3, height: 52, background: "#3A3A3C" }} />
            <div className="absolute rounded-l-sm" style={{ right: -3, top: 164, width: 3, height: 76, background: "#3A3A3C" }} />
            {/* Screen */}
            <div
              className="absolute overflow-hidden rounded-[36px]"
              style={{ inset: 10 }}
            >
              {/* Dynamic Island */}
              <div
                className="absolute z-20 rounded-full"
                style={{ top: 12, left: "50%", transform: "translateX(-50%)", width: 108, height: 30, background: "#000" }}
              />
              {/* GIF centré — rempli en hauteur, crop gauche/droite */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/karaf-pwa-mobile.gif"
                alt="Aperçu Karaf PWA"
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  height: "100%",
                  width: "auto",
                  maxWidth: "none",
                }}
              />
              {/* Home indicator */}
              <div
                className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full z-10"
                style={{ width: 100, height: 4, background: "rgba(255,255,255,0.3)" }}
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
