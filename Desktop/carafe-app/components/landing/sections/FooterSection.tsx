"use client";

import { X, Globe, ExternalLink } from "lucide-react";

const columns = [
  { title: "Produit", links: [{ label: "Fonctionnalités", href: "#features" }, { label: "Tarifs", href: "#pricing" }, { label: "FAQ", href: "#faq" }, { label: "Roadmap", href: "#" }] },
  { title: "Entreprise", links: [{ label: "À propos", href: "#" }, { label: "Blog", href: "#" }, { label: "Contact", href: "/contact" }] },
  { title: "Légal", links: [{ label: "Mentions légales", href: "/mentions-legales" }, { label: "CGU", href: "/cgu" }, { label: "Confidentialité", href: "/confidentialite" }, { label: "RGPD", href: "/confidentialite" }] },
];

const socials = [
  { icon: X, label: "X / Twitter", href: "#" },
  { icon: Globe, label: "Instagram", href: "#" },
  { icon: ExternalLink, label: "LinkedIn", href: "#" },
];

export default function FooterSection() {
  return (
    <footer style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/FONDCLAIRLOGO.png"
                alt="Karaf"
                style={{ height: 44, width: "auto", mixBlendMode: "multiply" }}
              />
            </div>
            <p className="font-mono text-[11px] mb-1" style={{ color: "var(--foreground-dim)" }}>Tout coule. Rien ne se perd.</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)", maxWidth: "20ch" }}>
              L&apos;app de communication pro pour la restauration.
            </p>
          </div>

          {columns.map(({ title, links }) => (
            <div key={title}>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>{title}</p>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm transition-colors duration-150"
                      style={{ color: "var(--foreground-muted)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--foreground-muted)")}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="font-mono text-[11px]" style={{ color: "var(--foreground-dim)" }}>
              &copy; 2026 Karaf. Fait en France avec attention.
            </p>
            <p className="font-mono text-[10px]" style={{ color: "var(--foreground-dim)", opacity: 0.6 }}>
              build 0.1.0 · deployed minutes ago
            </p>
          </div>
          <div className="flex items-center gap-4">
            {socials.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="transition-colors duration-150"
                style={{ color: "var(--foreground-dim)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground-muted)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--foreground-dim)")}
              >
                <Icon size={15} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
