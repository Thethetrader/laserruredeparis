'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function PwaRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone && pathname === '/') {
      router.replace('/dashboard');
    }
  }, [pathname, router]);

  return null;
}
