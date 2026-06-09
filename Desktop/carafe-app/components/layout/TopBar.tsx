"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { KarafAvatar } from "@/components/ui/custom/KarafAvatar";
import type { Profile, EstablishmentWithRole } from "@/lib/types/database";

interface TopBarProps {
  profile: Profile;
  establishment: EstablishmentWithRole;
  establishments: EstablishmentWithRole[];
}

export function TopBar({ profile, establishment, establishments }: TopBarProps) {
  return (
    <header
      className="lg:hidden fixed top-0 inset-x-0 z-40 topbar-safe-height flex items-center justify-between px-4"
      style={{
        background: "var(--background)",
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      {/* Left: avatar + establishment */}
      <div className="flex items-center gap-3">
        <Link href="/account" className="flex-shrink-0">
          <KarafAvatar
            firstName={profile.first_name}
            lastName={profile.last_name}
            avatarUrl={profile.avatar_url}
            size={30}
          />
        </Link>

        {establishments.length > 1 ? (
          <Link
            href="/establishment/switch"
            className="flex items-center gap-1"
            style={{ color: "var(--foreground-muted)" }}
          >
            <span className="text-[13px] font-medium truncate max-w-[200px]">{establishment.name}</span>
            <ChevronDown size={12} style={{ color: "var(--foreground-dim)" }} />
          </Link>
        ) : (
          <span className="text-[13px] font-medium truncate max-w-[200px]" style={{ color: "var(--foreground-muted)" }}>
            {establishment.name}
          </span>
        )}
      </div>
    </header>
  );
}
