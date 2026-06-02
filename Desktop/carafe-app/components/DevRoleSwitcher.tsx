"use client";
import { useDevRole } from "@/hooks/useDevRole";

// v2 production-safe
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

export function DevRoleSwitcher() {
  const [devRole, setDevRole] = useDevRole();

  if (!DEV_MODE) return null;

  const isEmployee = devRole === "employee";

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg"
      style={{ background: "var(--background-elev)", border: "1px solid var(--border-strong)" }}
    >
      <span className="text-[10px] font-mono uppercase tracking-widest mr-1" style={{ color: "var(--foreground-dim)" }}>DEV</span>
      <button
        onClick={() => setDevRole("owner")}
        className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all"
        style={!isEmployee
          ? { background: "var(--accent)", color: "#09090B" }
          : { color: "var(--foreground-dim)" }}
      >
        Manager
      </button>
      <button
        onClick={() => setDevRole("employee")}
        className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all"
        style={isEmployee
          ? { background: "#8B5CF6", color: "#fff" }
          : { color: "var(--foreground-dim)" }}
      >
        Serveur
      </button>
    </div>
  );
}
