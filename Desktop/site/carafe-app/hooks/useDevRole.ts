"use client";
import { useState, useEffect } from "react";

const DEV_MODE = false;
const KEY = "carafe_dev_role";
const EVENT = "carafe_dev_role_change";

export type DevRole = "owner" | "employee";

export function useDevRole(): [DevRole, (r: DevRole) => void] {
  const [devRole, setDevRoleState] = useState<DevRole>("owner");

  useEffect(() => {
    if (!DEV_MODE) return;
    const stored = localStorage.getItem(KEY) as DevRole | null;
    if (stored) setDevRoleState(stored);

    const handler = (e: Event) => setDevRoleState((e as CustomEvent<DevRole>).detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const setDevRole = (r: DevRole) => {
    localStorage.setItem(KEY, r);
    setDevRoleState(r);
    window.dispatchEvent(new CustomEvent<DevRole>(EVENT, { detail: r }));
  };

  return [devRole, setDevRole];
}
