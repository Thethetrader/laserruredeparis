"use client";

type Status = "online" | "busy" | "offline" | "warning";

const colors: Record<Status, string> = {
  online:  "var(--success)",
  busy:    "var(--warning)",
  offline: "var(--foreground-dim)",
  warning: "var(--danger)",
};

export function StatusDot({ status = "online", pulse = true }: { status?: Status; pulse?: boolean }) {
  const color = colors[status];
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: 8, height: 8 }}>
      {pulse && status !== "offline" && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: color,
            animation: "status-pulse 2s ease-out infinite",
          }}
        />
      )}
      <span
        className="relative rounded-full"
        style={{ width: 6, height: 6, background: color }}
      />
    </span>
  );
}
