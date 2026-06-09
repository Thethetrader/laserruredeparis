"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { label: "Le produit", href: "#features" },
  { label: "Tarifs", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

function KarafLogo() {
  return (
    <a href="#" className="flex items-center focus:outline-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Karaf" style={{ height: 56, width: "auto" }} />
    </a>
  );
}

function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="relative text-sm group"
      style={{ color: "var(--foreground-muted)" }}
      onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
      onMouseLeave={e => (e.currentTarget.style.color = "var(--foreground-muted)")}
    >
      {label}
      <span
        className="absolute -bottom-0.5 left-1/2 h-px transition-all duration-200"
        style={{
          background: "var(--accent)",
          width: "0%",
          transform: "translateX(-50%)",
        }}
        ref={el => {
          if (!el) return;
          const a = el.closest("a")!;
          a.addEventListener("mouseenter", () => { el.style.width = "100%"; });
          a.addEventListener("mouseleave", () => { el.style.width = "0%"; });
        }}
      />
    </a>
  );
}

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 h-16 flex items-center transition-all duration-300"
        style={{
          backgroundColor: scrolled ? "rgba(250,250,247,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border-soft)" : "1px solid transparent",
        }}
      >
        <div className="w-full mx-auto px-6 md:px-12 lg:px-20 flex items-center justify-between" style={{ maxWidth: 1240 }}>
          <KarafLogo />

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(l => <NavLink key={l.href} {...l} />)}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a
              href="/login"
              className="text-sm px-3 py-1.5 transition-colors duration-150 group flex items-center gap-1"
              style={{ color: "var(--foreground-muted)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--foreground-muted)")}
            >
              Se connecter <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5">→</span>
            </a>
            <a
              href="/signup"
              className="btn-shine text-sm font-medium px-4 py-2 rounded-md flex items-center gap-1.5 group active:scale-[0.98] transition-transform duration-100"
              style={{ background: "var(--accent)", color: "#fafaf7" }}
            >
              Commencer
              <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>

          <button
            className="md:hidden p-2 transition-colors"
            style={{ color: "var(--foreground-muted)" }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 flex flex-col pt-24 px-8"
            style={{ backgroundColor: "var(--background-soft)" }}
          >
            <nav className="flex flex-col gap-8">
              {navLinks.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="text-3xl font-semibold tracking-tight"
                  style={{ color: "var(--foreground)" }}
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-12 flex flex-col gap-4">
              <a href="/login" className="text-base" style={{ color: "var(--foreground-muted)" }}>Se connecter →</a>
              <a
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="font-medium px-6 py-3 rounded-md text-center text-sm"
                style={{ background: "var(--accent)", color: "#fafaf7" }}
              >
                Commencer
              </a>
            </div>
            <p className="mt-auto mb-8 font-mono text-[11px]" style={{ color: "var(--foreground-dim)" }}>v0.1 · BETA</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
