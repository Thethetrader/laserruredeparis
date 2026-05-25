import { X, Globe, ExternalLink } from "lucide-react";

const columns = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
      { label: "Roadmap", href: "#" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { label: "À propos", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "CGU", href: "/cgu" },
      { label: "Politique de confidentialité", href: "/confidentialite" },
      { label: "RGPD", href: "#" },
    ],
  },
];

const socials = [
  { icon: X, label: "X / Twitter", href: "#" },
  { icon: Globe, label: "Instagram", href: "#" },
  { icon: ExternalLink, label: "LinkedIn", href: "#" },
];

export default function FooterSection() {
  return (
    <footer
      className="border-t border-zinc-800"
      style={{ background: "#09090B" }}
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20 py-16">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg
                width="20"
                height="24"
                viewBox="0 0 22 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M8 1.5H14" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M9.5 1.5V4.5" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12.5 1.5V4.5" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6.5 4.5H15.5L18 11H4L6.5 4.5Z" stroke="#06B6D4" strokeWidth="1.5" strokeLinejoin="round" />
                <path
                  d="M4 11C4 11 2 14 2 17.5C2 21 5.13401 24 11 24C16.866 24 20 21 20 17.5C20 14 18 11 18 11H4Z"
                  stroke="#06B6D4"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[16px] font-semibold text-zinc-50 tracking-tight">Karaf</span>
            </div>
            <p className="text-xs font-mono text-zinc-500 mb-1">Tout coule. Rien ne se perd.</p>
            <p className="text-sm text-zinc-600 leading-relaxed max-w-[20ch]">
              L&apos;app de communication pro pour la restauration.
            </p>
          </div>

          {/* Link columns */}
          {columns.map(({ title, links }) => (
            <div key={title}>
              <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">
                {title}
              </p>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors duration-150"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-zinc-800">
          <p className="text-xs font-mono text-zinc-600">
            &copy; 2026 Karaf. Fait en France avec attention.
          </p>

          <div className="flex items-center gap-4">
            {socials.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
              >
                <Icon size={16} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
