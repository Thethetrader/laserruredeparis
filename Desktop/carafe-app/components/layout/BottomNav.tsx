"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Users, Clock, Trophy, MessageSquare,
  Settings, CalendarDays, ClipboardList, CalendarRange, Wallet, Sparkles
} from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

const managerNav = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks",                  icon: ClipboardList,   label: "Tâches" },
  { href: "/protocols",              icon: BookOpen,        label: "Protocoles" },
  { href: "/customer-feedback",      icon: MessageSquare,   label: "Clients" },
  { href: "/challenges",             icon: Trophy,          label: "Challenges" },
  { href: "/team",                   icon: Users,           label: "Équipe" },
  { href: "/delays",                 icon: Clock,           label: "Retards" },
  { href: "/schedule",               icon: CalendarDays,    label: "Vote RDV" },
  { href: "/shifts",                 icon: Wallet,          label: "Mes Shifts" },
  { href: "/shifts/team",            icon: CalendarRange,   label: "Shifts" },
  { href: "/planning",               icon: Sparkles,        label: "Planning" },
  { href: "/establishment/settings", icon: Settings,        label: "Réglages" },
];

const employeeNav = [
  { href: "/dashboard",          icon: LayoutDashboard, label: "Accueil" },
  { href: "/tasks",              icon: ClipboardList,   label: "Tâches" },
  { href: "/protocols",          icon: BookOpen,        label: "Protocoles" },
  { href: "/customer-feedback",  icon: MessageSquare,   label: "Clients" },
  { href: "/shifts",             icon: Wallet,          label: "Shifts" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [devRole] = useDevRole();

  const isEmployee = DEV_MODE ? devRole === "employee" : false;
  const nav = isEmployee ? employeeNav : managerNav;
  const isScrollable = nav.length > 5;

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40"
      style={{
        background: "var(--background)",
        borderTop: "1px solid var(--border-soft)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className={isScrollable ? "flex overflow-x-auto scrollbar-hide" : "flex"}
        style={{ scrollSnapType: isScrollable ? "x mandatory" : undefined }}
      >
        {nav.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" &&
              href !== "/establishment/settings" &&
              pathname.startsWith(href) &&
              !(href === "/shifts" && pathname.startsWith("/shifts/team")));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => { try { navigator?.vibrate?.(8); } catch (_) {} }}
              className={`flex flex-col items-center justify-center gap-1 transition-colors flex-shrink-0 ${isScrollable ? "" : "flex-1"}`}
              style={{
                height: 60,
                minWidth: isScrollable ? 64 : undefined,
                color: active ? "var(--accent)" : "var(--foreground-dim)",
                scrollSnapAlign: "start",
              }}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[9px] font-medium text-center leading-tight" style={{ letterSpacing: "0.02em" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
