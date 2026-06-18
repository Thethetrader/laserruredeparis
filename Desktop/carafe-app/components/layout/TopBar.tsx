"use client";

import Link from "next/link";
import { ChevronDown, MessageCircle } from "lucide-react";
import { LiveAvatar } from "@/components/layout/LiveAvatar";
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
          <LiveAvatar
            firstName={profile.first_name}
            lastName={profile.last_name}
            serverAvatarUrl={profile.avatar_url}
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

      {/* Right: chat bubble */}
      <Link
        href="/chat"
        className="flex items-center justify-center rounded-full flex-shrink-0 transition-opacity active:opacity-70"
        style={{
          width: 36,
          height: 36,
          background: "var(--accent)",
          boxShadow: "0 0 12px rgba(6,182,212,0.35)",
        }}
      >
        <MessageCircle size={17} strokeWidth={2} color="var(--background)" />
      </Link>
    </header>
  );
}
