interface EmptyStateProps {
  message: string;
  sub?: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, sub, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}
      >
        <span style={{ fontSize: 18, color: "var(--foreground-dim)" }}>·</span>
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground-muted)" }}>{message}</p>
      {sub && <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
