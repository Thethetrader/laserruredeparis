"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, MessageSquare, Trophy, Zap, ClipboardList, CalendarDays, Clock } from "lucide-react";
import type { UserRole } from "@/lib/types/database";

const managerNav = [
  { href: "/dashboard",         icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks",             icon: ClipboardList,   label: "Tâches" },
  { href: "/team",              icon: Users,           label: "Équipe" },
  { href: "/shifts",            icon: CalendarDays,    label: "Shifts" },
  { href: "/delays",            icon: Clock,           label: "Retards" },
];

const employeeNav = [
  { href: "/dashboard",         icon: LayoutDashboard, label: "Accueil" },
  { href: "/me/tasks",          icon: ClipboardList,   label: "Tâches" },
  { href: "/scoring",           icon: Zap,             label: "Mon Score" },
  { href: "/protocols",         icon: BookOpen,        label: "Protocoles" },
  { href: "/customer-feedback", icon: MessageSquare,   label: "Clients" },
  { href: "/challenges",        icon: Trophy,          label: "Défis" },
];

interface BottomNavProps {
  role: UserRole;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();

  const isEmployee = role === "employee";
  const nav = isEmployee ? employeeNav : managerNav;

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch"
      style={{
        background: "var(--background)",
        borderTop: "1px solid var(--border-soft)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {nav.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            style={{ height: 60, color: active ? "var(--accent)" : "var(--foreground-dim)" }}
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
