"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, BookOpen, ClipboardList, Users, Settings,
  CalendarDays, Clock, Trophy, CalendarCheck2, Zap, MessageSquare,
  Layers, User, Calendar, type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types/database";

type NavItem = { href: string; icon: LucideIcon; label: string; exact?: boolean };

/* ── Manager popups ── */
const opsSubNav: NavItem[] = [
  { href: "/protocols", icon: BookOpen,     label: "Protocoles" },
  { href: "/tasks",     icon: ClipboardList, label: "Tâches" },
];
const opsRoutes = opsSubNav.map(i => i.href);

const teamSubNav: NavItem[] = [
  { href: "/team",        icon: Users,          label: "Équipe" },
  { href: "/planning",    icon: Zap,            label: "Planning IA" },
  { href: "/shifts/team", icon: CalendarDays,   label: "Calendrier" },
  { href: "/shifts",      icon: CalendarDays,   label: "Mes shifts", exact: true },
  { href: "/delays",      icon: Clock,          label: "Retards" },
  { href: "/challenges",  icon: Trophy,         label: "Challenges" },
  { href: "/schedule",    icon: CalendarCheck2, label: "RDV" },
];
const teamRoutes = teamSubNav.map(i => i.href);

/* ── Employee popups ── */
const empOpsSubNav: NavItem[] = [
  { href: "/protocols", icon: BookOpen,     label: "Protocoles" },
  { href: "/me/tasks",  icon: ClipboardList, label: "Mes tâches" },
];
const empOpsRoutes = empOpsSubNav.map(i => i.href);

const empShiftsSubNav: NavItem[] = [
  { href: "/shifts",      icon: CalendarDays,   label: "Mes shifts", exact: true },
  { href: "/dispo",       icon: Calendar,       label: "Disponibilités" },
  { href: "/delays",      icon: Clock,          label: "Retards" },
  { href: "/challenges",  icon: Trophy,         label: "Challenges" },
  { href: "/scoring",     icon: Zap,            label: "Mon Score" },
  { href: "/schedule",    icon: CalendarCheck2, label: "RDV" },
];
const empShiftsRoutes = empShiftsSubNav.map(i => i.href);

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

function HomeTab({ pathname }: { pathname: string }) {
  const dashActive = pathname === "/dashboard";
  return (
    <Link
      href="/dashboard"
      className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
      style={{ height: 60 }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: dashActive ? "var(--accent)" : "var(--background-elev)",
        border: dashActive ? "none" : "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: dashActive ? "0 0 14px rgba(6,182,212,0.35)" : "none",
        transition: "all 0.2s",
      }}>
        <LayoutDashboard size={17} strokeWidth={dashActive ? 2 : 1.5}
          color={dashActive ? "var(--background)" : "var(--foreground-dim)"} />
      </div>
      <span className="text-[10px] font-medium" style={{ color: dashActive ? "var(--accent)" : "var(--foreground-dim)" }}>Accueil</span>
    </Link>
  );
}

function PopupGrid({ items, pathname, onClose }: {
  items: NavItem[]; pathname: string; onClose: () => void;
}) {
  return (
    <div
      className="lg:hidden fixed inset-x-4 z-50 rounded-2xl p-3"
      style={{
        bottom: "calc(64px + env(safe-area-inset-bottom))",
        background: "var(--background-elev)",
        border: "1px solid var(--border)",
        boxShadow: "0 -4px 32px rgba(0,0,0,0.18)",
      }}
    >
      <div className={`grid gap-2 ${items.length === 2 ? "grid-cols-2" : "grid-cols-3 [&>*:last-child:nth-child(3n+1)]:col-start-2"}`}>
        {items.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
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
  );
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const [opsOpen, setOpsOpen]         = useState(false);
  const [teamOpen, setTeamOpen]       = useState(false);
  const [empOpsOpen, setEmpOpsOpen]   = useState(false);
  const [shiftsOpen, setShiftsOpen]   = useState(false);

  useEffect(() => {
    setOpsOpen(false);
    setTeamOpen(false);
    setEmpOpsOpen(false);
    setShiftsOpen(false);
  }, [pathname]);

  /* ── Employee nav ── */
  if (role === "employee") {
    const empOpsActive    = empOpsRoutes.some(r => pathname === r || pathname.startsWith(r + "/"));
    const empShiftsActive = empShiftsRoutes.some(r => pathname === r || pathname.startsWith(r + "/"));
    const anyOpen = empOpsOpen || shiftsOpen;

    return (
      <>
        {anyOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40"
            onClick={() => { setEmpOpsOpen(false); setShiftsOpen(false); }}
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
          />
        )}

        {empOpsOpen && (
          <PopupGrid items={empOpsSubNav} pathname={pathname} onClose={() => setEmpOpsOpen(false)} />
        )}

        {shiftsOpen && (
          <PopupGrid items={empShiftsSubNav} pathname={pathname} onClose={() => setShiftsOpen(false)} />
        )}

        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch"
          style={{
            background: "var(--background)",
            borderTop: "1px solid var(--border-soft)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <NavTab href="/customer-feedback" icon={MessageSquare} label="Feed" pathname={pathname} />

          <button
            onClick={() => { setEmpOpsOpen(o => !o); setShiftsOpen(false); }}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            style={{ height: 60, color: (empOpsActive || empOpsOpen) ? "var(--accent)" : "var(--foreground-dim)" }}
          >
            <Layers size={18} strokeWidth={(empOpsActive || empOpsOpen) ? 2 : 1.5} />
            <span className="text-[10px] font-medium">Ops</span>
          </button>

          <HomeTab pathname={pathname} />

          <button
            onClick={() => { setShiftsOpen(o => !o); setEmpOpsOpen(false); }}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            style={{ height: 60, color: (empShiftsActive || shiftsOpen) ? "var(--accent)" : "var(--foreground-dim)" }}
          >
            <CalendarDays size={18} strokeWidth={(empShiftsActive || shiftsOpen) ? 2 : 1.5} />
            <span className="text-[10px] font-medium">Shifts</span>
          </button>

          <NavTab href="/account" icon={User} label="Compte" pathname={pathname} />
        </nav>
      </>
    );
  }

  /* ── Manager / Owner nav ── */
  const opsActive  = opsRoutes.some(r => pathname === r || pathname.startsWith(r + "/"));
  const teamActive = teamRoutes.some(r => pathname === r || pathname.startsWith(r + "/"));
  const anyOpen    = opsOpen || teamOpen;

  return (
    <>
      {anyOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => { setOpsOpen(false); setTeamOpen(false); }}
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
        />
      )}

      {opsOpen && (
        <PopupGrid items={opsSubNav} pathname={pathname} onClose={() => setOpsOpen(false)} />
      )}

      {teamOpen && (
        <PopupGrid items={teamSubNav} pathname={pathname} onClose={() => setTeamOpen(false)} />
      )}

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch"
        style={{
          background: "var(--background)",
          borderTop: "1px solid var(--border-soft)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <NavTab href="/customer-feedback" icon={MessageSquare} label="Feed" pathname={pathname} />

        <button
          onClick={() => { setOpsOpen(o => !o); setTeamOpen(false); }}
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
          style={{ height: 60, color: (opsActive || opsOpen) ? "var(--accent)" : "var(--foreground-dim)" }}
        >
          <Layers size={18} strokeWidth={(opsActive || opsOpen) ? 2 : 1.5} />
          <span className="text-[10px] font-medium">Ops</span>
        </button>

        <HomeTab pathname={pathname} />

        <button
          onClick={() => { setTeamOpen(o => !o); setOpsOpen(false); }}
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
          style={{ height: 60, color: (teamActive || teamOpen) ? "var(--accent)" : "var(--foreground-dim)" }}
        >
          <Users size={18} strokeWidth={(teamActive || teamOpen) ? 2 : 1.5} />
          <span className="text-[10px] font-medium">Team</span>
        </button>

        <NavTab href="/establishment/settings" icon={Settings} label="Paramètres" pathname={pathname} />
      </nav>
    </>
  );
}
