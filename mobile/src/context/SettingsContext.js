import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const SettingsContext = createContext();

const DEFAULTS = {
  mushafLayout: 'translation',
  showTranslation: true,
  showArabicVerse: true,
  showTransliteration: false,
  showWordByWord: false,
  tajweedEnabled: false,
  translationSource: 'en.sahih',
  arabicFontSize: 26,
  selectedReciter: 'alafasy',
  gamificationEnabled: true,
  wordHighlightEnabled: true,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync('iqra_settings');
        if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
      } catch {
        // Use defaults
      }
      setLoaded(true);
    })();
  }, []);

  const updateSettings = async (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    try {
      await SecureStore.setItemAsync('iqra_settings', JSON.stringify(next));
    } catch {
      // Storage not available
    }
  };

  return (
    <SettingsContext.Provider value={{ ...settings, updateSettings, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
