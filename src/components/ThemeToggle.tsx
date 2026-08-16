import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return 'light';
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      title={theme === 'dark' ? '切换到亮色' : '切换到暗色'}
      aria-label={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
    >
      {theme === 'dark' ? <Sun aria-hidden="true" size={18} strokeWidth={1.8} /> : <Moon aria-hidden="true" size={18} strokeWidth={1.8} />}
    </button>
  );
}
