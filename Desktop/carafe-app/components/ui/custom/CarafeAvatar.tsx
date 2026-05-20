import Image from "next/image";

const GRADIENT_PAIRS = [
  ["#06B6D4", "#0891B2"],
  ["#8B5CF6", "#6D28D9"],
  ["#F59E0B", "#D97706"],
  ["#10B981", "#059669"],
  ["#EF4444", "#DC2626"],
  ["#EC4899", "#DB2777"],
];

function getGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const f = firstName?.[0]?.toUpperCase() ?? "";
  const l = lastName?.[0]?.toUpperCase() ?? "";
  return f + l || "?";
}

interface CarafeAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

export function CarafeAvatar({ firstName, lastName, avatarUrl, size = 36, className }: CarafeAvatarProps) {
  const initials = getInitials(firstName, lastName);
  const [from, to] = getGradient(initials);
  const fontSize = Math.max(9, Math.floor(size * 0.35));

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={`${firstName} ${lastName}`}
        width={size}
        height={size}
        className={className}
        style={{ borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontSize,
        fontWeight: 600,
        color: "#fff",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {initials}
    </span>
  );
}
