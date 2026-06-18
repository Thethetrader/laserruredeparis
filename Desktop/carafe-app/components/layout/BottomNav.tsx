"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, BookOpen, ClipboardList, Users, Settings,
  CalendarDays, Clock, Trophy, CalendarCheck2, Zap, MessageSquare,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types/database";

type NavItem = { href: string; icon: LucideIcon; label: string; exact?: boolean };

const teamSubNav: NavItem[] = [
  { href: "/team",        icon: Users,          label: "Équipe" },
  { href: "/planning",    icon: Zap,            label: "Planning IA" },
  { href: "/shifts/team", icon: CalendarDays,   label: "Calendrier" },
  { href: "/delays",      icon: Clock,          label: "Retards" },
  { href: "/challenges",  icon: Trophy,         label: "Challenges" },
  { href: "/schedule",    icon: CalendarCheck2, label: "RDV" },
];

const teamRoutes = teamSubNav.map(i => i.href);

const employeeNav: NavItem[] = [
  { href: "/dashboard",         icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/customer-feedback", icon: MessageSquare,   label: "Retours" },
  { href: "/protocols",         icon: BookOpen,        label: "Protocoles" },
  { href: "/me/tasks",          icon: ClipboardList,   label: "Tâches" },
  { href: "/shifts",            icon: CalendarDays,    label: "Mes shifts", exact: true },
  { href: "/delays",            icon: Clock,           label: "Retards" },
  { href: "/challenges",        icon: Trophy,          label: "Challenges" },
  { href: "/scoring",           icon: Zap,             label: "Mon Score" },
  { href: "/schedule",          icon: CalendarCheck2,  label: "RDV" },
];

interface BottomNavProps { role: UserRole }

function NavTab({
  href, icon: Icon, label, pathname, exact,
}: { href: string; icon: LucideIcon; label: string; pathname: string; exact?: boolean }) {
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
      style={{ height: 60, color: active ? "var(--accent)" : "var(--foreground-dim)" }}
    >
      <Icon size={18} strokeWidth={active ? 2 : 1.5} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const [teamOpen, setTeamOpen] = useState(false);

  useEffect(() => { setTeamOpen(false); }, [pathname]);

  if (role === "employee") {
    return (
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch overflow-x-auto"
        style={{
          background: "var(--background)",
          borderTop: "1px solid var(--border-soft)",
          paddingBottom: "env(safe-area-inset-bottom)",
          scrollbarWidth: "none",
        }}
      >
        {employeeNav.map(({ href, icon: Icon, label, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 flex-shrink-0 transition-colors"
              style={{ minWidth: 64, height: 60, color: active ? "var(--accent)" : "var(--foreground-dim)" }}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[9px] font-medium text-center leading-tight px-1">{label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  const teamActive = teamRoutes.some(r => pathname === r || pathname.startsWith(r + "/"));

  return (
    <>
      {teamOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => setTeamOpen(false)}
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
        />
      )}

      {teamOpen && (
        <div
          className="lg:hidden fixed inset-x-4 z-50 rounded-2xl p-3"
          style={{
            bottom: "calc(64px + env(safe-area-inset-bottom))",
            background: "var(--background-elev)",
            border: "1px solid var(--border)",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.18)",
          }}
        >
          <div className="grid grid-cols-3 gap-2">
            {teamSubNav.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors"
                  style={{
                    background: active ? "var(--accent-bg)" : "var(--background-soft)",
                    color: active ? "var(--accent)" : "var(--foreground)",
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                  <span className="text-[11px] font-medium text-center leading-tight">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch"
        style={{
          background: "var(--background)",
          borderTop: "1px solid var(--border-soft)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <NavTab href="/protocols"              icon={BookOpen}        label="Protocoles" pathname={pathname} />
        <NavTab href="/tasks"                  icon={ClipboardList}   label="Tâches"     pathname={pathname} />
        <NavTab href="/dashboard"              icon={LayoutDashboard} label="Accueil"    pathname={pathname} exact />

        <button
          onClick={() => setTeamOpen(o => !o)}
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
          style={{ height: 60, color: (teamActive || teamOpen) ? "var(--accent)" : "var(--foreground-dim)" }}
        >
          <Users size={18} strokeWidth={(teamActive || teamOpen) ? 2 : 1.5} />
          <span className="text-[10px] font-medium">Team</span>
        </button>

        <NavTab href="/establishment/settings" icon={Settings}        label="Paramètres" pathname={pathname} />
      </nav>
    </>
  );
}
