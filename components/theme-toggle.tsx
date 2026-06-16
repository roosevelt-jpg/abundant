'use client';

import { Moon, Sun } from 'lucide-react';
import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';

export const ThemeToggle = () => {
  const context = useContext(ThemeContext);

  // If context is not available, render a disabled version
  if (!context) {
    return (
      <button className="p-2 rounded-lg hover:bg-accent/20 transition-colors opacity-50 cursor-not-allowed">
        <Sun className="w-5 h-5 text-accent" />
      </button>
    );
  }

  const { theme, setTheme } = context;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-accent/20 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-accent" />
      ) : (
        <Moon className="w-5 h-5 text-accent" />
      )}
    </button>
  );
};
