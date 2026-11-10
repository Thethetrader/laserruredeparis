'use client';
import { useState, useEffect } from 'react';

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

async function registerSub(establishmentId: string): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_KEY,
    });
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), establishmentId }),
    });
    return true;
  } catch {
    return false;
  }
}

export function PushNotificationSetup({ establishmentId }: { establishmentId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return;
    if (Notification.permission === 'denied') { setStatus('denied'); return; }
    if (Notification.permission === 'granted') {
      setStatus('granted');
      // Silently re-register subscription (updates endpoint if changed)
      registerSub(establishmentId);
    }
  }, [establishmentId]);

  const subscribe = async () => {
    setStatus('loading');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { setStatus('denied'); return; }
    const ok = await registerSub(establishmentId);
    setStatus(ok ? 'granted' : 'denied');
  };

  if (status === 'granted') return (
    <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>
      ✓ Notifications actives
    </span>
  );
  if (status === 'denied') return (
    <span className="text-xs font-mono" style={{ color: 'var(--foreground-dim)' }}>
      Notifications bloquées
    </span>
  );

  return (
    <button
      onClick={subscribe}
      disabled={status === 'loading'}
      className="text-xs px-3 py-1.5 rounded-md font-medium transition-opacity"
      style={{
        background: 'var(--accent)',
        color: 'var(--primary-foreground)',
        opacity: status === 'loading' ? 0.6 : 1,
      }}
    >
      {status === 'loading' ? 'Activation…' : '🔔 Activer les notifications'}
    </button>
  );
}

// Compact inline version for dashboard banner
export function PushNotificationBanner({ establishmentId }: { establishmentId: string }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return;
    if (Notification.permission === 'granted') {
      // Already granted — silently re-register and hide banner
      registerSub(establishmentId);
      return;
    }
    if (Notification.permission === 'default') setVisible(true);
  }, [establishmentId]);

  if (!visible) return null;

  const activate = async () => {
    setLoading(true);
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      await registerSub(establishmentId);
    }
    setVisible(false);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-4"
      style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}>
      <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>
        🔔 Active les notifications pour être alerté des nouveaux protocoles
      </p>
      <button
        onClick={activate}
        disabled={loading}
        className="flex-shrink-0 text-[11px] px-2.5 py-1.5 rounded-lg font-medium"
        style={{ background: "var(--accent)", color: "var(--primary-foreground)", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "…" : "Activer"}
      </button>
    </div>
  );
}
