"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, Clock, MessageSquare } from "lucide-react";

const mobileNav = [
  { href: "/dashboard",         icon: LayoutDashboard, label: "Dashboard" },
  { href: "/protocols",         icon: BookOpen,        label: "Protocoles" },
  { href: "/customer-feedback", icon: MessageSquare,   label: "Clients" },
  { href: "/team",              icon: Users,           label: "Équipe" },
  { href: "/delays",            icon: Clock,           label: "Retards" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch"
      style={{
        height: 60,
        background: "var(--background)",
        borderTop: "1px solid var(--border-soft)",
      }}
    >
      {mobileNav.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            style={{ color: active ? "var(--accent)" : "var(--foreground-dim)" }}
          >
            <Icon size={18} strokeWidth={active ? 2 : 1.5} />
            <span className="text-[10px] font-medium" style={{ letterSpacing: "0.02em" }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
