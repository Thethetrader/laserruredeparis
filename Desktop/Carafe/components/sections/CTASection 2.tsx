"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Une erreur est survenue.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMsg("Impossible de joindre le serveur. Réessayez.");
      setStatus("error");
    }
  }

  /* Split title words for stagger animation */
  const titleWords = "Prêt à remettre de l'ordre dans votre équipe ?".split(" ");

  return (
    <section
      id="cta"
      className="py-28 md:py-36"
      style={{
        background: "#111114",
        borderTop: "1px solid rgba(6,182,212,0.12)",
        borderBottom: "1px solid rgba(6,182,212,0.12)",
      }}
    >
      <div
        ref={ref}
        className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20 flex flex-col items-center text-center"
      >
        {/* Title — word-by-word stagger */}
        <h2 className="text-[34px] md:text-[48px] font-semibold tracking-[-0.03em] text-zinc-50 leading-tight mb-5 max-w-2xl">
          {titleWords.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                delay: i * 0.05,
              }}
              className="inline-block mr-[0.25em]"
            >
              {word}
            </motion.span>
          ))}
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="text-base md:text-lg text-zinc-400 leading-relaxed mb-10 max-w-xl"
        >
          Rejoignez la liste d&apos;attente. Soyez parmi les premiers restaurants à tester
          Carafe.
        </motion.p>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}
          className="w-full max-w-lg"
        >
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-3 py-6"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Check size={22} className="text-emerald-400" strokeWidth={2} />
              </div>
              <p className="text-base font-semibold text-zinc-50">Vous êtes dans la liste.</p>
              <p className="text-sm text-zinc-500">
                On vous contacte en priorité à l&apos;ouverture. Merci.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Visually hidden label */}
              <label htmlFor="waitlist-email" className="sr-only">
                Votre adresse email
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  id="waitlist-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="votre@email.com"
                  required
                  disabled={status === "loading"}
                  className="flex-1 px-4 py-3 rounded-md text-sm text-zinc-50 placeholder-zinc-600 border border-zinc-800 focus:border-cyan-500/50 focus:outline-none transition-colors duration-150 disabled:opacity-50"
                  style={{ background: "#09090B" }}
                  aria-describedby={status === "error" ? "waitlist-error" : undefined}
                />

                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  className="btn-shine flex items-center justify-center gap-2 bg-cyan-500 text-zinc-950 font-semibold px-6 py-3 rounded-md text-sm whitespace-nowrap active:scale-[0.98] transition-all duration-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <>
                      <span
                        className="w-3.5 h-3.5 rounded-full border-2 border-zinc-950/30 border-t-zinc-950 animate-spin"
                        aria-hidden="true"
                      />
                      Envoi...
                    </>
                  ) : (
                    <>
                      Je veux essayer
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>

              {status === "error" && errorMsg && (
                <p id="waitlist-error" className="mt-2 text-sm text-red-400 text-left">
                  {errorMsg}
                </p>
              )}
            </form>
          )}

          <p className="mt-4 text-xs font-mono text-zinc-600">
            Aucun spam. Promis. Désinscription en un clic.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
