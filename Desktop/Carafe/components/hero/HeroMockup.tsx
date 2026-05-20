"use client";

import { useState, useEffect } from "react";
import { Home, BookOpen, Clock, Trophy, Users, Settings, Check } from "lucide-react";

function LiveTimestamp() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-[9px]" style={{ color: "var(--foreground-dim)" }}>Mis à jour · {time}</span>;
}

function ReadCounter() {
  const [count, setCount] = useState(12);
  useEffect(() => {
    const id = setInterval(() => {
      setCount(n => {
        if (n >= 15) { setTimeout(() => setCount(12), 2000); return 15; }
        return n + 1;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1">
        {["JM","RK","YO","SL"].map((init, i) => (
          <div key={init} className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-semibold border"
            style={{ background: i < count-11 ? "rgba(6,182,212,0.2)" : "var(--background-elev)", borderColor: i < count-11 ? "var(--accent)" : "var(--border)", color: i < count-11 ? "var(--accent)" : "var(--foreground-dim)", zIndex: 4-i }}>
            {init}
          </div>
        ))}
      </div>
      <span className="font-mono text-[9px]" style={{ color: "var(--foreground-dim)" }}>
        <span style={{ color: "var(--accent)" }}>Posté il y a 2 jours · Vu en permanence par {count} personnes</span>
      </span>
    </div>
  );
}

function GhostCursor() {
  const [phase, setPhase] = useState<"idle"|"moving"|"clicking">("idle");
  const [pos, setPos] = useState({ x: 40, y: 60 });

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const cycle = () => {
      setPhase("moving");
      setPos({ x: 60, y: 178 });
      t = setTimeout(() => {
        setPhase("clicking");
        t = setTimeout(() => {
          setPhase("idle");
          setPos({ x: 40, y: 60 });
          t = setTimeout(cycle, 10000);
        }, 600);
      }, 1600);
    };
    t = setTimeout(cycle, 5000);
    return () => clearTimeout(t);
  }, []);

  if (phase === "idle") return null;
  return (
    <div className="absolute pointer-events-none z-20 transition-all" style={{ left: pos.x, top: pos.y, transform: phase==="clicking"?"scale(0.9)":"scale(1)", transitionDuration: phase==="moving"?"1500ms":"100ms", transitionTimingFunction:"cubic-bezier(0.16,1,0.3,1)" }}>
      <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
        <path d="M1 1L1 13L4.5 10L7 16L8.5 15.5L6 9.5L10 9.5L1 1Z" fill="var(--foreground)" stroke="var(--background)" strokeWidth="0.5"/>
      </svg>
    </div>
  );
}

const sidebarItems = [
  { icon: Home }, { icon: BookOpen, active: true }, { icon: Clock }, { icon: Trophy }, { icon: Users }, { icon: Settings },
];

export default function HeroMockup() {
  return (
    <div className="relative" style={{ width: 420, maxWidth: "100%", transform: "perspective(2000px) rotateY(-8deg) rotateX(2deg)" }}>
      <div className="absolute inset-0 rounded-2xl glow-cyan" style={{ transform: "scale(1.06)", filter: "blur(28px)", background: "rgba(6,182,212,0.07)", zIndex: -1 }} />

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: "rgba(6,182,212,0.15)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.3)" }}>C</div>
            <div>
              <p className="text-[10px] font-semibold leading-none" style={{ color: "var(--foreground)" }}>Le Comptoir des Halles</p>
              <LiveTimestamp />
            </div>
          </div>
          <span className="font-mono text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)" }}>ONLINE</span>
        </div>

        <div className="flex" style={{ height: 320 }}>
          {/* Sidebar */}
          <div className="flex flex-col items-center gap-1 py-3 px-2" style={{ background: "var(--background)", borderRight: "1px solid var(--border)", width: 44 }}>
            {sidebarItems.map(({ icon: Icon, active }, i) => (
              <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: active ? "rgba(6,182,212,0.12)" : "transparent", border: active ? "1px solid rgba(6,182,212,0.25)" : "1px solid transparent", color: active ? "var(--accent)" : "var(--foreground-dim)" }}>
                <Icon size={13} strokeWidth={active ? 2 : 1.5} />
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 p-4 overflow-hidden relative">
            <GhostCursor />
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)" }}>MENU</span>
                <h3 className="text-[11px] font-semibold mt-1 leading-snug" style={{ color: "var(--foreground)" }}>Nouvelle carte d&apos;été · v3</h3>
              </div>
              <span className="font-mono text-[8px]" style={{ color: "var(--foreground-dim)" }}>v3.2</span>
            </div>
            <div className="space-y-1.5 mb-3">
              {[["100%",0.14],["88%",0.1],["94%",0.12],["72%",0.08]].map(([w,o], i) => (
                <div key={i} className="rounded" style={{ height: 5, width: w as string, background: `rgba(250,250,250,${o})` }} />
              ))}
            </div>
            <div className="rounded-lg p-2.5 mb-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
              <p className="font-mono text-[8px] mb-1.5" style={{ color: "var(--foreground-dim)" }}>Entrées saisonnières</p>
              <div className="space-y-1">
                {["Gazpacho · 9€","Burrata & figues · 14€","Carpaccio de magret · 16€"].map(item => (
                  <div key={item} className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full" style={{ background: "var(--accent)" }} />
                    <p className="text-[8px]" style={{ color: "var(--foreground-muted)" }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between mb-2"><ReadCounter /></div>
              <button className="w-full py-1.5 rounded-lg text-[9px] font-semibold flex items-center justify-center gap-1" style={{ background: "var(--accent)", color: "#09090B" }}>
                <Check size={9} strokeWidth={2.5} /> J&apos;ai lu et compris
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
