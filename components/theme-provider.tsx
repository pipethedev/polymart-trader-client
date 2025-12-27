'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/lib/store/ui-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    useUIStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    root.classList.add('dark');
  }, [mounted]);

  return <>{children}</>;
}

