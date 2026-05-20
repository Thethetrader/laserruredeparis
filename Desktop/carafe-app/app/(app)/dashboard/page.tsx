import { MonoLabel } from "@/components/ui/custom/MonoLabel";

export default function DashboardPage() {
  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="mb-8">
        <MonoLabel size="xs" className="mb-2 block">Dashboard</MonoLabel>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
          Bonjour.
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-dim)" }}>
          Voici ce qui se passe dans votre établissement.
        </p>
      </div>

      <div
        className="rounded-xl flex items-center justify-center"
        style={{
          height: 240,
          background: "var(--background-elev)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>
          Le dashboard arrive en Phase 2.
        </p>
      </div>
    </div>
  );
}
