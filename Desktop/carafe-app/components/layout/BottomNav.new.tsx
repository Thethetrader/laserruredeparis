"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, MessageSquare, Trophy, Zap, CalendarDays, ClipboardList } from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

const managerNav = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { href: "/scoring",    icon: Zap,             label: "Score" },
  { href: "/tasks",      icon: ClipboardList,   label: "Tâches" },
  { href: "/protocols",  icon: BookOpen,        label: "Protocoles" },
  { href: "/team",       icon: Users,           label: "Équipe" },
];

const employeeNav = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Accueil" },
  { href: "/scoring",     icon: Zap,             label: "Mon Score" },
  { href: "/me/tasks",    icon: ClipboardList,   label: "Tâches" },
  { href: "/protocols",   icon: BookOpen,        label: "Protocoles" },
  { href: "/customer-feedback", icon: MessageSquare, label: "Clients" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [devRole] = useDevRole();

  const isEmployee = DEV_MODE ? devRole === "employee" : false;
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
