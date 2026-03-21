import React, { createContext, useContext, useEffect } from 'react';
import { useUser } from './UserContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme definitions for each age group.
 * Child: colorful, playful, larger targets, rounded everything
 * Teen: modern, vibrant, energetic
 * Adult: clean, minimal, professional
 */
const themes = {
  child: {
    '--primary-gradient': 'linear-gradient(135deg, #FF6B9D 0%, #C44FE2 100%)',
    '--primary-color': '#FF6B9D',
    '--primary-dark': '#C44FE2',
    '--secondary-gradient': 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)',
    '--secondary-color': '#43E97B',
    '--accent-color': '#FFD93D',
    '--bg-gradient': 'linear-gradient(135deg, #FFF5F7 0%, #F0E6FF 50%, #E6F9FF 100%)',
    '--card-bg': '#FFFFFF',
    '--card-shadow': '0 12px 40px rgba(196, 79, 226, 0.15)',
    '--card-radius': '28px',
    '--btn-radius': '30px',
    '--nav-bg': 'rgba(255, 255, 255, 0.95)',
    '--nav-shadow': '0 4px 20px rgba(196, 79, 226, 0.12)',
    '--text-primary': '#2D1B69',
    '--text-secondary': '#6B5B8D',
    '--text-muted': '#9B8DB5',
    '--error-color': '#FF6B6B',
    '--success-color': '#43E97B',
    '--font-size-base': '1.1rem',
    '--font-size-heading': '1.8rem',
    '--font-size-arabic': '2.8rem',
    '--btn-padding': '16px 32px',
    '--animation-speed': '0.4s',
    '--hover-lift': '-4px',
  },
  teen: {
    '--primary-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '--primary-color': '#667eea',
    '--primary-dark': '#764ba2',
    '--secondary-gradient': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '--secondary-color': '#f093fb',
    '--accent-color': '#4facfe',
    '--bg-gradient': 'linear-gradient(135deg, #f5f7fa 0%, #ede7f6 100%)',
    '--card-bg': '#FFFFFF',
    '--card-shadow': '0 10px 35px rgba(102, 126, 234, 0.12)',
    '--card-radius': '22px',
    '--btn-radius': '25px',
    '--nav-bg': 'rgba(255, 255, 255, 0.96)',
    '--nav-shadow': '0 4px 18px rgba(102, 126, 234, 0.1)',
    '--text-primary': '#2c3e50',
    '--text-secondary': '#555',
    '--text-muted': '#888',
    '--error-color': '#f5576c',
    '--success-color': '#38ef7d',
    '--font-size-base': '1rem',
    '--font-size-heading': '1.6rem',
    '--font-size-arabic': '2.4rem',
    '--btn-padding': '14px 28px',
    '--animation-speed': '0.3s',
    '--hover-lift': '-3px',
  },
  adult: {
    '--primary-gradient': 'linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)',
    '--primary-color': '#2c3e50',
    '--primary-dark': '#1a252f',
    '--secondary-gradient': 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
    '--secondary-color': '#4A90E2',
    '--accent-color': '#D4AF37',
    '--bg-gradient': 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    '--card-bg': '#FFFFFF',
    '--card-shadow': '0 8px 30px rgba(0, 0, 0, 0.08)',
    '--card-radius': '16px',
    '--btn-radius': '12px',
    '--nav-bg': 'rgba(255, 255, 255, 0.98)',
    '--nav-shadow': '0 2px 12px rgba(0, 0, 0, 0.06)',
    '--text-primary': '#1a1a2e',
    '--text-secondary': '#555',
    '--text-muted': '#888',
    '--error-color': '#DC3545',
    '--success-color': '#28A745',
    '--font-size-base': '1rem',
    '--font-size-heading': '1.5rem',
    '--font-size-arabic': '2.2rem',
    '--btn-padding': '12px 24px',
    '--animation-speed': '0.2s',
    '--hover-lift': '-2px',
  },
};

// Default to teen if no age group set (good middle ground)
const DEFAULT_THEME = 'teen';

export const ThemeProvider = ({ children }) => {
  const { user } = useUser();
  const ageGroup = user?.age_group || DEFAULT_THEME;
  const theme = themes[ageGroup] || themes[DEFAULT_THEME];

  // Apply CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Set a data attribute for CSS selectors that need it
    root.setAttribute('data-theme', ageGroup);

    return () => {
      // Cleanup on unmount
      Object.keys(theme).forEach((property) => {
        root.style.removeProperty(property);
      });
      root.removeAttribute('data-theme');
    };
  }, [ageGroup, theme]);

  return (
    <ThemeContext.Provider value={{
      ageGroup,
      theme,
      isChild: ageGroup === 'child',
      isTeen: ageGroup === 'teen',
      isAdult: ageGroup === 'adult',
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
