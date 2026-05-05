import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('rs-theme', newTheme);
      }
      return { theme: newTheme };
    }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('rs-theme', theme);
    }
    set({ theme });
  },
}));

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('rs-theme') as 'light' | 'dark';
  if (saved) {
    useThemeStore.getState().setTheme(saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    useThemeStore.getState().setTheme('dark');
  }
}
