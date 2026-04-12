import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { themes } from '../utils/theme';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'iqra_theme_mode';

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState('light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const saved = await SecureStore.getItemAsync(STORAGE_KEY);
      if (saved && themes[saved]) {
        setThemeModeState(saved);
      }
    } catch {
      // Default to light
    } finally {
      setLoaded(true);
    }
  };

  const setThemeMode = async (mode) => {
    if (!themes[mode]) return;
    setThemeModeState(mode);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, mode);
    } catch {
      // Storage not available
    }
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const theme = themes[themeMode];

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        toggleTheme,
        theme,
        loaded,
        isDark: themeMode === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
