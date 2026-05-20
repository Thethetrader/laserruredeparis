"use client";

import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";
import { CarafeAvatar } from "@/components/ui/custom/CarafeAvatar";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import type { Profile, EstablishmentWithRole } from "@/lib/types/database";

interface TopBarProps {
  profile: Profile;
  establishment: EstablishmentWithRole;
  establishments: EstablishmentWithRole[];
}

export function TopBar({ profile, establishment, establishments }: TopBarProps) {
  return (
    <header
      className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4"
      style={{
        height: 56,
        background: "var(--background)",
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      {/* Left: brand + establishment */}
      <div className="flex items-center gap-3">
        <MonoLabel size="xs" color="var(--accent)">[ C ]</MonoLabel>

        {establishments.length > 1 ? (
          <Link
            href="/establishment/switch"
            className="flex items-center gap-1"
            style={{ color: "var(--foreground-muted)" }}
          >
            <span className="text-[13px] font-medium truncate max-w-[140px]">{establishment.name}</span>
            <ChevronDown size={12} style={{ color: "var(--foreground-dim)" }} />
          </Link>
        ) : (
          <span className="text-[13px] font-medium" style={{ color: "var(--foreground-muted)" }}>
            {establishment.name}
          </span>
        )}
      </div>

      {/* Right: notifications + avatar */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center justify-center"
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--radius-base)",
            color: "var(--foreground-dim)",
          }}
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={1.5} />
        </button>

        <Link href="/account">
          <CarafeAvatar
            firstName={profile.first_name}
            lastName={profile.last_name}
            avatarUrl={profile.avatar_url}
            size={32}
          />
        </Link>
      </div>
    </header>
  );
}
