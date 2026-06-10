"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type Tab = "iphone" | "android";

const IPHONE_STEPS = [
  <span key={0}>Ouvre <strong>app.joincarafe.com</strong> dans <strong>Safari</strong></span>,
  <span key={1}>Appuie sur le bouton <strong>Partager</strong> <span className="inline-block">📤</span> en bas de l&apos;écran</span>,
  <span key={2}>Fais défiler et appuie sur <strong>&ldquo;Sur l&apos;écran d&apos;accueil&rdquo;</strong></span>,
  <span key={3}>Appuie sur <strong>&ldquo;Ajouter&rdquo;</strong> en haut à droite</span>,
  <span key={4}>L&apos;app apparaît sur ton écran d&apos;accueil <strong>comme une vraie app</strong> 🎉</span>,
];

const ANDROID_STEPS = [
  <span key={0}>Ouvre <strong>app.joincarafe.com</strong> dans <strong>Chrome</strong></span>,
  <span key={1}>Appuie sur les <strong>⋮</strong> (3 points) en haut à droite</span>,
  <span key={2}>Appuie sur <strong>&ldquo;Installer l&apos;application&rdquo;</strong> ou <strong>&ldquo;Ajouter à l&apos;écran d&apos;accueil&rdquo;</strong></span>,
  <span key={3}>Confirme en appuyant sur <strong>&ldquo;Installer&rdquo;</strong></span>,
  <span key={4}>L&apos;app apparaît sur ton écran d&apos;accueil <strong>comme une vraie app</strong> 🎉</span>,
];

function InstallModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("iphone");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "var(--background-elev, #18181b)", border: "1px solid rgba(255,255,255,0.08)" }}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground, #fafafa)" }}>
              Installer Karaf
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-dim, #888)" }}>
              Ajoute l&apos;app sur ton écran d&apos;accueil — gratuit, sans App Store
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ background: "rgba(255,255,255,0.07)", color: "var(--foreground-dim, #888)" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 mb-4">
          <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {([["iphone", "🍎 iPhone"], ["android", "🤖 Android"]] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: tab === t ? "var(--accent, #06b6d4)" : "transparent",
                  color: tab === t ? "#09090b" : "var(--foreground-dim, #888)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.ol
              key={tab}
              initial={{ opacity: 0, x: tab === "iphone" ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {(tab === "iphone" ? IPHONE_STEPS : ANDROID_STEPS).map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span
                    className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "var(--accent, #06b6d4)", color: "#09090b" }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted, #aaa)" }}>
                    {step}
                  </span>
                </li>
              ))}
            </motion.ol>
          </AnimatePresence>

          <p className="mt-5 text-xs text-center" style={{ color: "var(--foreground-dim, #666)" }}>
            {tab === "iphone"
              ? "⚠️ Fonctionne uniquement depuis Safari (pas Chrome sur iPhone)"
              : "⚠️ Fonctionne depuis Chrome, Edge ou Samsung Internet"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

interface InstallPWAButtonProps {
  label?: string;
  subLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  showIcon?: boolean;
}

export default function InstallPWAButton({
  label = "Télécharger l'app",
  subLabel,
  className = "",
  style,
  showIcon = false,
}: InstallPWAButtonProps) {
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setOpen(true);
    }
  }

  return (
    <>
      <button onClick={handleClick} className={className} style={style}>
        {showIcon && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16l-4-4h3V4h2v8h3l-4 4z" />
            <path d="M4 20h16" />
          </svg>
        )}
        {subLabel ? (
          <span className="flex flex-col items-start">
            <span>{label}</span>
            <span className="text-[11px] font-normal opacity-50">{subLabel}</span>
          </span>
        ) : label}
      </button>

      <AnimatePresence>
        {open && <InstallModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
