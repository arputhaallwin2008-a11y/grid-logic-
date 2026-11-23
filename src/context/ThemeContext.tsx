import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, ThemePalette, DEFAULT_THEME_ID } from '../constants/themes';

interface ThemeContextType {
  theme: ThemePalette;
  themeId: string;
  setThemeId: (id: string) => void;
  availableThemes: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem('gridlogic-theme') || DEFAULT_THEME_ID;
  });

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];

  useEffect(() => {
    localStorage.setItem('gridlogic-theme', theme.id);

    // Apply CSS variables to root element
    const root = document.documentElement;
    root.style.setProperty('--theme-bg-workspace', theme.bgWorkspace);
    root.style.setProperty('--theme-bg-toolbar', theme.bgToolbar);
    root.style.setProperty('--theme-bg-panel', theme.bgPanel);
    root.style.setProperty('--theme-bg-panel-subtle', theme.bgPanelSubtle);
    root.style.setProperty('--theme-bg-panel-hover', theme.bgPanelHover);
    root.style.setProperty('--theme-border-panel', theme.borderPanel);
    root.style.setProperty('--theme-border-subtle', theme.borderSubtle);
    root.style.setProperty('--theme-signal-high', theme.signalHigh);
    root.style.setProperty('--theme-signal-high-glow', theme.signalHighGlow);
    root.style.setProperty('--theme-signal-low', theme.signalLow);
    root.style.setProperty('--theme-signal-active', theme.signalActive);
    root.style.setProperty('--theme-clock', theme.clockColor);
    root.style.setProperty('--theme-accent', theme.accentColor);
    root.style.setProperty('--theme-text-primary', theme.textPrimary);
    root.style.setProperty('--theme-text-secondary', theme.textSecondary);
    root.style.setProperty('--theme-text-muted', theme.textMuted);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeId,
        setThemeId,
        availableThemes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
