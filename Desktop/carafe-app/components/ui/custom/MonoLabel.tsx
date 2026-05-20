import { cn } from "@/lib/utils";

interface MonoLabelProps {
  children: React.ReactNode;
  size?: "xs" | "sm";
  color?: string;
  className?: string;
}

export function MonoLabel({ children, size = "xs", color, className }: MonoLabelProps) {
  return (
    <span
      className={cn("mono uppercase tracking-widest", size === "xs" ? "text-[10px]" : "text-[12px]", className)}
      style={{ color: color ?? "var(--foreground-dim)" }}
    >
      {children}
    </span>
  );
}
