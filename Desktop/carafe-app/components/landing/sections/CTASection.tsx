"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

const PLACEHOLDER = "votre@email.com";

function TypingInput({
  value,
  onChange,
  error,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  error: string;
  onSubmit: () => void;
}) {
  const [placeholder, setPlaceholder] = useState("");
  const [focused, setFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (focused) { setPlaceholder(PLACEHOLDER); return; }

    let i = 0;
    let erasing = false;

    const step = () => {
      if (!erasing) {
        if (i < PLACEHOLDER.length) {
          setPlaceholder(PLACEHOLDER.slice(0, ++i));
          typingRef.current = setTimeout(step, 80 + Math.random() * 30);
        } else {
          typingRef.current = setTimeout(() => { erasing = true; step(); }, 2000);
        }
      } else {
        if (i > 0) {
          setPlaceholder(PLACEHOLDER.slice(0, --i));
          typingRef.current = setTimeout(step, 40);
        } else {
          erasing = false;
          typingRef.current = setTimeout(step, 600);
        }
      }
    };

    step();
    return () => clearTimeout(typingRef.current);
  }, [focused]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-3">
      <label htmlFor="waitlist-email" className="sr-only">Votre adresse email</label>
      <input
        id="waitlist-email"
        type="email"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 text-sm rounded-md outline-none"
        style={{
          background: "var(--background)",
          border: error ? "1px solid var(--danger)" : "1px solid var(--border)",
          color: "var(--foreground)",
          borderRadius: 6,
          transition: "border-color 200ms",
        }}
        onFocus={e => {
          setFocused(true);
          e.currentTarget.style.borderColor = "var(--accent)";
        }}
        onBlur={e => {
          setFocused(false);
          e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--border)";
        }}
        onKeyDown={e => { if (e.key === "Enter") onSubmit(); }}
      />
      <button
        type="button"
        onClick={onSubmit}
        onMouseEnter={() => setBtnHovered(true)}
        onMouseLeave={() => setBtnHovered(false)}
        className="btn-shine flex items-center justify-center gap-2 font-medium px-6 py-3 text-sm rounded-md group active:scale-[0.97] transition-transform duration-100"
        style={{ background: "var(--accent)", color: "#09090B", borderRadius: 6, whiteSpace: "nowrap" }}
      >
        Je veux essayer
        <span style={{ display: "inline-block", transition: "transform 200ms", transform: btnHovered ? "rotate(-45deg)" : "none" }}>
          {btnHovered ? <ArrowUpRight size={14} /> : <ArrowRight size={14} />}
        </span>
      </button>
    </div>
  );
}

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Entrez une adresse email valide.");
      return;
    }
    setErrorMsg("");
    setStatus("loading");
    try {
      await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      id="cta"
      className="py-24"
      style={{
        background: "var(--background-soft)",
        borderTop: "1px solid rgba(6,182,212,0.12)",
        borderBottom: "1px solid rgba(6,182,212,0.12)",
      }}
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[640px] mx-auto text-center"
        >
          <h2
            className="font-semibold tracking-tight leading-tight mb-4"
            style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
          >
            Prêt à driver votre équipe autrement ?
          </h2>
          <p className="text-base mb-10" style={{ color: "var(--foreground-muted)" }}>
            Rejoignez les premiers restaurants à tester Karaf. Accès prioritaire à l&apos;ouverture.
          </p>

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
                <Check size={20} strokeWidth={2} style={{ color: "var(--success)" }} />
              </div>
              <p className="text-base font-medium" style={{ color: "var(--foreground)" }}>Vous êtes dans la liste !</p>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>On vous contactera en priorité à l&apos;ouverture.</p>
            </motion.div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} noValidate>
              {status !== "loading" ? (
                <TypingInput
                  value={email}
                  onChange={v => { setEmail(v); setErrorMsg(""); }}
                  error={errorMsg}
                  onSubmit={handleSubmit}
                />
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                  <div className="flex-1 px-4 py-3 rounded-md text-sm" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-dim)", borderRadius: 6 }}>
                    {email}
                  </div>
                  <button disabled className="btn-shine flex items-center justify-center gap-2 font-medium px-6 py-3 text-sm rounded-md opacity-60" style={{ background: "var(--accent)", color: "#09090B", borderRadius: 6, whiteSpace: "nowrap" }}>
                    Envoi...
                  </button>
                </div>
              )}
              {errorMsg && <p className="text-[12px] mb-2" style={{ color: "var(--danger)" }}>{errorMsg}</p>}
              {status === "error" && <p className="text-[12px] mb-2" style={{ color: "var(--danger)" }}>Une erreur est survenue. Réessayez.</p>}
              <p className="font-mono text-[11px]" style={{ color: "var(--foreground-dim)" }}>
                Aucun spam. Promis. Désinscription en un clic.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
