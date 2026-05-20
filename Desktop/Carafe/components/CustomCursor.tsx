"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouchDevice || prefersReduced) return;

    setMounted(true);
    document.body.style.cursor = "none";

    const pos = { x: -100, y: -100 };
    const cur = { x: -100, y: -100 };
    let hovering = false;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const el = e.target as HTMLElement;
      hovering = !!el.closest("a, button, [role='button'], label, input, select, textarea");
    };

    const tick = () => {
      cur.x += (pos.x - cur.x) * 0.18;
      cur.y += (pos.y - cur.y) * 0.18;
      if (dotRef.current) {
        const size = hovering ? 24 : 12;
        dotRef.current.style.transform = `translate(${cur.x - size / 2}px, ${cur.y - size / 2}px)`;
        dotRef.current.style.width = `${size}px`;
        dotRef.current.style.height = `${size}px`;
        dotRef.current.style.background = hovering ? "transparent" : "rgba(6,182,212,0.85)";
        dotRef.current.style.border = hovering ? "1.5px solid rgba(6,182,212,0.85)" : "none";
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      document.body.style.cursor = "";
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
      style={{ willChange: "transform", transition: "width 150ms, height 150ms, background 150ms, border 150ms" }}
    />
  );
}
