"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Users, Clock, Trophy,
  MessageSquare, Settings, CalendarDays, ClipboardList, Zap
} from "lucide-react";
import type { UserRole } from "@/lib/types/database";

const managerNav = [
  { href: "/dashboard",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks",              icon: ClipboardList,   label: "Tâches" },
  { href: "/protocols",          icon: BookOpen,        label: "Protocoles" },
  { href: "/customer-feedback",  icon: MessageSquare,   label: "Clients" },
  { href: "/challenges",         icon: Trophy,          label: "Challenges" },
  { href: "/team",               icon: Users,           label: "Équipe" },
  { href: "/delays",             icon: Clock,           label: "Retards" },
  { href: "/schedule",           icon: CalendarDays,    label: "Vote RDV" },
  { href: "/shifts",             icon: CalendarDays,    label: "Shifts" },
  { href: "/establishment/settings", icon: Settings,    label: "Paramètres" },
];

const employeeNav = [
  { href: "/dashboard",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/me/tasks",           icon: ClipboardList,   label: "Tâches" },
  { href: "/scoring",            icon: Zap,             label: "Mon Score" },
  { href: "/protocols",          icon: BookOpen,        label: "Protocoles" },
  { href: "/customer-feedback",  icon: MessageSquare,   label: "Clients" },
  { href: "/challenges",         icon: Trophy,          label: "Challenges" },
  { href: "/team",               icon: Users,           label: "Équipe" },
  { href: "/delays",             icon: Clock,           label: "Retards" },
  { href: "/schedule",           icon: CalendarDays,    label: "Vote RDV" },
];

interface BottomNavProps {
  role: UserRole;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const nav = role === "employee" ? employeeNav : managerNav;

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch overflow-x-auto"
      style={{
        background: "var(--background)",
        borderTop: "1px solid var(--border-soft)",
        paddingBottom: "env(safe-area-inset-bottom)",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {nav.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-1 flex-shrink-0 transition-colors"
            style={{
              minWidth: 64,
              height: 60,
              color: active ? "var(--accent)" : "var(--foreground-dim)",
            }}
          >
            <Icon size={18} strokeWidth={active ? 2 : 1.5} />
            <span className="text-[9px] font-medium text-center leading-tight px-1" style={{ letterSpacing: "0.01em" }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
