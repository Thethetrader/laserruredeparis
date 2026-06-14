"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, Clock, Trophy, MessageSquare, MessageCircle, Settings, ChevronDown, CalendarCheck2, CalendarRange, CalendarDays, ClipboardList, Sparkles, Zap, type LucideIcon } from "lucide-react";

type NavItem = { href: string; icon: LucideIcon; label: string; exact?: boolean };
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { LiveAvatar } from "@/components/layout/LiveAvatar";
import type { EstablishmentWithRole, Profile } from "@/lib/types/database";

const managerNav: NavItem[] = [
  { href: "/dashboard",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/customer-feedback",  icon: MessageSquare,   label: "Retours clients" },
  { href: "/protocols",          icon: BookOpen,        label: "Protocoles" },
  { href: "/tasks",              icon: ClipboardList,   label: "Tâches" },
  { href: "/team",               icon: Users,           label: "Équipe" },
  { href: "/planning",           icon: Sparkles,        label: "Planning IA" },
  { href: "/shifts/team",        icon: CalendarDays,    label: "Shifts Staff" },
  { href: "/shifts",             icon: CalendarRange,   label: "Mes shifts", exact: true },
  { href: "/chat",               icon: MessageCircle,   label: "Chat équipe" },
  { href: "/delays",             icon: Clock,           label: "Retards" },
  { href: "/challenges",         icon: Trophy,          label: "Challenges" },
  { href: "/schedule",           icon: CalendarCheck2,  label: "RDV" },
];

const employeeNav: NavItem[] = [
  { href: "/dashboard",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/customer-feedback",  icon: MessageSquare,   label: "Retours clients" },
  { href: "/protocols",          icon: BookOpen,        label: "Protocoles" },
  { href: "/me/tasks",           icon: ClipboardList,   label: "Tâches" },
  { href: "/shifts",             icon: CalendarRange,   label: "Mes shifts", exact: true },
  { href: "/chat",               icon: MessageCircle,   label: "Chat équipe" },
  { href: "/delays",             icon: Clock,           label: "Retards" },
  { href: "/challenges",         icon: Trophy,          label: "Challenges" },
  { href: "/scoring",            icon: Zap,             label: "Mon Score" },
  { href: "/schedule",           icon: CalendarCheck2,  label: "RDV" },
];

interface SidebarProps {
  profile: Profile;
  establishment: EstablishmentWithRole;
  establishments: EstablishmentWithRole[];
}

export function Sidebar({ profile, establishment, establishments }: SidebarProps) {
  const pathname = usePathname();
  const nav = establishment.role === "employee" ? employeeNav : managerNav;

  return (
    <aside
      className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40"
      style={{ width: 240, background: "var(--background)", borderRight: "1px solid var(--border-soft)" }}
    >
      {/* Header */}
      <div className="px-4 py-5" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <Link href="/account" className="flex items-center gap-3 mb-3">
          <LiveAvatar
            firstName={profile.first_name}
            lastName={profile.last_name}
            serverAvatarUrl={profile.avatar_url}
            size={40}
          />
          <span className="text-[13px] font-medium truncate" style={{ color: "var(--foreground-muted)" }}>
            {profile.first_name} {profile.last_name}
          </span>
        </Link>

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
        {nav.map(({ href, icon: Icon, label, exact }) => {
          const active = pathname === href || (!exact && href !== "/dashboard" && pathname.startsWith(href));
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
