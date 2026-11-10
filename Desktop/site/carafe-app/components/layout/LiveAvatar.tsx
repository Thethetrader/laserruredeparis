"use client";

import { useState, useEffect } from "react";
import { KarafAvatar } from "@/components/ui/custom/KarafAvatar";

interface Props {
  firstName: string | null;
  lastName: string | null;
  serverAvatarUrl: string | null;
  size: number;
}

export function LiveAvatar({ firstName, lastName, serverAvatarUrl, size }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(serverAvatarUrl);

  useEffect(() => {
    const stored = localStorage.getItem("karaf-avatar-url");
    if (stored) setAvatarUrl(stored);

    const onUpdate = (e: CustomEvent) => setAvatarUrl(e.detail as string);
    window.addEventListener("karaf-avatar-updated", onUpdate as EventListener);
    return () => window.removeEventListener("karaf-avatar-updated", onUpdate as EventListener);
  }, []);

  // Sync if server provides a newer URL (after hard reload)
  useEffect(() => {
    if (serverAvatarUrl) setAvatarUrl(serverAvatarUrl);
  }, [serverAvatarUrl]);

  return <KarafAvatar firstName={firstName} lastName={lastName} avatarUrl={avatarUrl} size={size} />;
}
