"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, Clock, Trophy, MessageSquare, Settings, ChevronDown, CalendarCheck2, CalendarRange, ClipboardList, Sparkles } from "lucide-react";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import type { EstablishmentWithRole } from "@/lib/types/database";

const adminNav = [
  { href: "/dashboard",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks",              icon: ClipboardList,   label: "Tâches" },
  { href: "/protocols",          icon: BookOpen,        label: "Protocoles" },
  { href: "/customer-feedback",  icon: MessageSquare,   label: "Retours clients" },
  { href: "/challenges",         icon: Trophy,          label: "Challenges" },
  { href: "/team",               icon: Users,           label: "Équipe" },
  { href: "/delays",             icon: Clock,           label: "Retards" },
  { href: "/planning",           icon: Sparkles,        label: "Planning IA" },
  { href: "/shifts",             icon: CalendarRange,   label: "Shifts" },
  { href: "/schedule",           icon: CalendarCheck2,  label: "RDV" },
];

interface SidebarProps {
  establishment: EstablishmentWithRole;
  establishments: EstablishmentWithRole[];
}

export function Sidebar({ establishment, establishments }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40"
      style={{ width: 240, background: "var(--background)", borderRight: "1px solid var(--border-soft)" }}
    >
      {/* Header */}
      <div className="px-4 py-5" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Karaf" style={{ height: 44, width: "auto", marginBottom: 12 }} />

        {/* Establishment selector */}
        {establishments.length > 1 ? (
          <Link
            href="/establishment/switch"
            className="flex items-center justify-between w-full px-2.5 py-2 rounded-base transition-colors"
            style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
          >
            <span className="text-[13px] font-medium truncate" style={{ color: "var(--foreground)" }}>
              {establishment.name}
            </span>
            <ChevronDown size={12} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />
          </Link>
        ) : (
          <div className="px-2.5 py-2 rounded-base" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <span className="text-[13px] font-medium truncate block" style={{ color: "var(--foreground)" }}>
              {establishment.name}
            </span>
            <MonoLabel size="xs">{establishment.role}</MonoLabel>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {adminNav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-2.5 py-2 rounded-base text-[13px] transition-colors"
              style={{
                background: active ? "rgba(6,182,212,0.08)" : "transparent",
                color: active ? "var(--accent)" : "var(--foreground-dim)",
                border: active ? "1px solid rgba(6,182,212,0.15)" : "1px solid transparent",
              }}
            >
              <Icon size={14} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      {(establishment.role === "owner" || establishment.role === "manager") && (
        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
          <Link
            href="/establishment/settings"
            className="flex items-center gap-3 px-2.5 py-2 rounded-base text-[13px] transition-colors"
            style={{ color: "var(--foreground-dim)" }}
          >
            <Settings size={14} strokeWidth={1.5} />
            Paramètres
          </Link>
        </div>
      )}
    </aside>
  );
}
