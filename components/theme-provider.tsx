'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/lib/store/ui-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((state) => state.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    useUIStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, mounted]);

  return <>{children}</>;
}

