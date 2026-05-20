"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { BookOpen, LayoutDashboard, User, ArrowLeftRight, Trophy, Check, Star, TrendingUp } from "lucide-react";

const views = [
  { id: "protocols", label: "Protocoles", icon: BookOpen },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "employee", label: "Fiche employé", icon: User },
  { id: "handover", label: "Passation", icon: ArrowLeftRight },
  { id: "challenge", label: "Challenge", icon: Trophy },
];

function ProtocolsView() {
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Protocoles actifs</h3>
        <span className="font-mono text-[9px] px-2 py-0.5 rounded" style={{ background: "rgba(6,182,212,0.1)", color: "var(--accent)" }}>12 actifs</span>
      </div>
      {[
        { cat: "OUVERTURE", title: "Procédure d'ouverture standard", read: "15/15", done: true },
        { cat: "HYGIÈNE", title: "Nettoyage et désinfection", read: "13/15", done: false },
        { cat: "MENU", title: "Carte d'été v3.2", read: "8/15", done: false },
        { cat: "SERVICE", title: "Gestion VIP & événements", read: "15/15", done: true },
      ].map(({ cat, title, read, done }) => (
        <div key={title} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <div className="flex-1">
            <span className="font-mono text-[8px] px-1.5 py-0.5 rounded mr-2" style={{ background: done?"rgba(16,185,129,0.1)":"rgba(6,182,212,0.1)", color: done?"var(--success)":"var(--accent)" }}>{cat}</span>
            <p className="text-[10px] mt-1" style={{ color: "var(--foreground-muted)" }}>{title}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px]" style={{ color: done?"var(--success)":"var(--foreground-dim)" }}>{read}</p>
            <p className="text-[8px]" style={{ color: "var(--foreground-dim)" }}>ont lu</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardView() {
  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Présence", value: "94%", icon: TrendingUp, color: "var(--success)" },
          { label: "Score équipe", value: "87/100", icon: Trophy, color: "var(--accent)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-3 rounded-xl" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={11} style={{ color }} />
              <p className="font-mono text-[8px]" style={{ color: "var(--foreground-dim)" }}>{label}</p>
            </div>
            <p className="text-xl font-semibold" style={{ color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-xl" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <p className="font-mono text-[8px] mb-2" style={{ color: "var(--foreground-dim)" }}>Engagement · 7 derniers jours</p>
        <div className="flex items-end gap-1" style={{ height: 48 }}>
          {[40,55,48,72,60,85,78].map((h,i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i===6?"var(--accent)":"rgba(6,182,212,0.2)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmployeeView() {
  return (
    <div className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold" style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "var(--accent)" }}>JM</div>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Julie Moreau</p>
          <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Cheffe de rang · 2 ans 4 mois</p>
        </div>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["Fidèle de la maison","Top serveuse Q1","Expert vins"].map(b => (
          <span key={b} className="font-mono text-[8px] px-2 py-0.5 rounded" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "var(--accent)" }}>{b}</span>
        ))}
      </div>
      <div className="p-3 rounded-lg mb-3" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
        <div className="flex gap-0.5 mb-1">
          {[1,2,3,4,5].map(i=><Star key={i} size={8} style={{ color:"#F59E0B", fill:"#F59E0B" }} />)}
        </div>
        <p className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>&ldquo;Julie a été formidable, très professionnelle.&rdquo;</p>
        <p className="font-mono text-[8px] mt-1" style={{ color: "var(--foreground-dim)" }}>Marie D. · Google · il y a 2j</p>
      </div>
      <div className="space-y-1">
        {["Carte des vins","Encaissement","Allergènes"].map(s => (
          <div key={s} className="flex items-center gap-2">
            <Check size={9} style={{ color:"var(--success)" }} />
            <p className="text-[9px]" style={{ color:"var(--foreground-muted)" }}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HandoverView() {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Passation de service</p>
          <p className="font-mono text-[9px]" style={{ color: "var(--foreground-dim)" }}>Karim → Julie · 15h00</p>
        </div>
        <span className="font-mono text-[8px] px-2 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)" }}>Transmis</span>
      </div>
      {[
        { label: "Stocks", value: "Bar à réapprovisionner ce soir" },
        { label: "VIP", value: "Table 6, anniversaire M. Dupont" },
        { label: "Notes", value: "Friteuse H2 en maintenance demain" },
      ].map(({ label, value }) => (
        <div key={label} className="mb-3 p-3 rounded-lg" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <p className="font-mono text-[8px] mb-1" style={{ color: "var(--foreground-dim)" }}>{label.toUpperCase()}</p>
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function ChallengeView() {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Challenge en cours</p>
          <p className="font-mono text-[9px]" style={{ color: "var(--foreground-dim)" }}>3 avis Google / jour · 3j restants</p>
        </div>
        <Trophy size={14} style={{ color: "var(--accent)" }} />
      </div>
      <div className="h-1.5 rounded-full mb-4" style={{ background: "var(--background-elev)" }}>
        <div className="h-full rounded-full" style={{ width: "68%", background: "var(--accent)" }} />
      </div>
      <div className="space-y-2">
        {[
          { init: "JM", name: "Julie M.", pts: 47, rank: 1 },
          { init: "RK", name: "Rayan K.", pts: 38, rank: 2 },
          { init: "YO", name: "Yasmine O.", pts: 31, rank: 3 },
        ].map(({ init, name, pts, rank }) => (
          <div key={init} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "var(--background-elev)", border: rank===1?"1px solid rgba(6,182,212,0.25)":"1px solid var(--border)" }}>
            <span className="font-mono text-[9px] w-4" style={{ color: rank===1?"var(--accent)":"var(--foreground-dim)" }}>#{rank}</span>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-semibold" style={{ background: rank===1?"rgba(6,182,212,0.15)":"var(--background-soft)", color: rank===1?"var(--accent)":"var(--foreground-dim)" }}>{init}</div>
            <span className="flex-1 text-[10px]" style={{ color: "var(--foreground-muted)" }}>{name}</span>
            <span className="font-mono text-[9px]" style={{ color: rank===1?"var(--accent)":"var(--foreground-dim)" }}>{pts}pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const viewComponents = [ProtocolsView, DashboardView, EmployeeView, HandoverView, ChallengeView];

export default function ShowcaseSection() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const titleRef = useRef<HTMLDivElement>(null);
  const inView = useInView(titleRef, { once: true, margin: "-80px" });

  const DURATION = 5000;

  const goTo = useCallback((i: number) => {
    setActive(i);
    setProgress(0);
    setPaused(true);
    clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setPaused(false), 10000);
  }, []);

  useEffect(() => {
    if (paused) return;
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / DURATION, 1);
      setProgress(p);
      if (p < 1) { raf = requestAnimationFrame(frame); }
      else { setActive(a => (a + 1) % views.length); setProgress(0); }
    };
    let raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, paused]);

  const CurrentView = viewComponents[active];

  return (
    <section className="py-28" style={{ background: "var(--background-soft)" }}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--foreground-dim)" }}>
            Aperçus
          </p>
          <h2
            className="font-semibold tracking-tight leading-tight mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.04em", color: "var(--foreground)" }}
          >
            Tout ce qu&apos;il vous faut, rien de plus.
          </h2>
        </motion.div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
          {/* Mock app bar */}
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex gap-1.5">{["var(--danger)","var(--warning)","var(--success)"].map((c,i)=><div key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />)}</div>
            <span className="font-mono text-[9px] ml-2" style={{ color: "var(--foreground-dim)" }}>carafe.app</span>
          </div>

          {/* View area — fixed height prevents layout shift on tab switch */}
          <div className="relative" style={{ height: 360, overflow: "hidden" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <CurrentView />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Tabs */}
          <div style={{ borderTop: "1px solid var(--border)", padding: "12px 20px" }}>
            <div className="flex items-center gap-1 flex-wrap">
              {views.map(({ id, label, icon: Icon }, i) => (
                <button
                  key={id}
                  onClick={() => goTo(i)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all duration-150"
                  style={{
                    background: i===active?"rgba(6,182,212,0.1)":"transparent",
                    color: i===active?"var(--accent)":"var(--foreground-dim)",
                    border: i===active?"1px solid rgba(6,182,212,0.25)":"1px solid transparent",
                  }}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-0.5 rounded-full" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-none"
                style={{ width: `${progress * 100}%`, background: "var(--accent)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
