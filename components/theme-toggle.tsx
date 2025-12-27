'use client';

import { Switch } from '@/components/ui/switch';
import { useUIStore } from '@/lib/store/ui-store';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  const isDark = theme === 'dark';

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch
        checked={isDark}
        onCheckedChange={handleToggle}
        aria-label="Toggle dark mode"
      />
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

