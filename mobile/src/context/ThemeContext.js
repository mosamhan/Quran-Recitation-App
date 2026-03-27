import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { themes } from '../utils/theme';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'iqra_age_group';

export const ThemeProvider = ({ children }) => {
  const [ageGroup, setAgeGroupState] = useState('teen');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const saved = await SecureStore.getItemAsync(STORAGE_KEY);
      if (saved && themes[saved]) {
        setAgeGroupState(saved);
      }
    } catch {
      // Default to teen
    } finally {
      setLoaded(true);
    }
  };

  const setAgeGroup = async (group) => {
    if (!themes[group]) return;
    setAgeGroupState(group);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, group);
    } catch {
      // Storage not available
    }
  };

  const theme = themes[ageGroup];

  return (
    <ThemeContext.Provider
      value={{
        ageGroup,
        setAgeGroup,
        theme,
        loaded,
        isChild: ageGroup === 'child',
        isTeen: ageGroup === 'teen',
        isAdult: ageGroup === 'adult',
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
