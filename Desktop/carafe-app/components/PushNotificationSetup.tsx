'use client';
import { useState, useEffect } from 'react';

export function PushNotificationSetup({ establishmentId }: { establishmentId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') setStatus('granted');
    if (Notification.permission === 'denied') setStatus('denied');
  }, []);

  const subscribe = async () => {
    setStatus('loading');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), establishmentId }),
      });
      setStatus('granted');
    } catch {
      setStatus('denied');
    }
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
        color: '#09090B',
        opacity: status === 'loading' ? 0.6 : 1,
      }}
    >
      {status === 'loading' ? 'Activation…' : '🔔 Activer les notifications'}
    </button>
  );
}
