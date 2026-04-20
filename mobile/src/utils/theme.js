// Light theme – based on the IQRA brand palette (logo blues/purples)
const lightTheme = {
  colors: {
    primary: '#6B6B6B',
    primaryDark: '#4A4A4A',
    secondary: '#f093fb',
    secondaryDark: '#f5576c',
    accent: '#4facfe',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',

    textPrimary: '#2c3e50',
    textSecondary: '#666',
    textMuted: '#999',
    textWhite: '#fff',

    bgPrimary: '#f5f7fa',
    bgSecondary: '#EEF0F8',
    bgCard: '#fff',
    bgOverlay: 'rgba(0,0,0,0.5)',

    border: '#E0E0E0',
    borderLight: 'rgba(0,0,0,0.06)',

    tabBar: '#fff',
    tabBarBorder: 'rgba(0,0,0,0.08)',

    cardShadow: 'rgba(0, 0, 0, 0.1)',
  },
  fonts: {
    regular: { fontWeight: '400' },
    semiBold: { fontWeight: '600' },
    bold: { fontWeight: '700' },
    extraBold: { fontWeight: '800' },
    sizeBase: 16,
    sizeSmall: 13,
    sizeLarge: 18,
    sizeTitle: 28,
    sizeArabic: 26,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 10,
    md: 14,
    lg: 22,
    xl: 25,
    round: 999,
  },
  animation: { speed: 300 },
};

// Dark theme – sleek, modern dark UI
const darkTheme = {
  colors: {
    primary: '#8A8A8A',
    primaryDark: '#6B6B6B',
    secondary: '#f093fb',
    secondaryDark: '#f5576c',
    accent: '#4facfe',
    success: '#2ecc71',
    warning: '#f1c40f',
    danger: '#e74c3c',

    textPrimary: '#F0F0F5',
    textSecondary: '#A0A0B0',
    textMuted: '#6B6B80',
    textWhite: '#fff',

    bgPrimary: '#121218',
    bgSecondary: '#1C1C26',
    bgCard: '#1E1E2A',
    bgOverlay: 'rgba(0,0,0,0.7)',

    border: '#2E2E3E',
    borderLight: 'rgba(255,255,255,0.06)',

    tabBar: '#16161E',
    tabBarBorder: 'rgba(255,255,255,0.06)',

    cardShadow: 'rgba(0, 0, 0, 0.4)',
  },
  fonts: {
    regular: { fontWeight: '400' },
    semiBold: { fontWeight: '600' },
    bold: { fontWeight: '700' },
    extraBold: { fontWeight: '800' },
    sizeBase: 16,
    sizeSmall: 13,
    sizeLarge: 18,
    sizeTitle: 28,
    sizeArabic: 26,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 10,
    md: 14,
    lg: 22,
    xl: 25,
    round: 999,
  },
  animation: { speed: 300 },
};

export const themes = { light: lightTheme, dark: darkTheme };

// Default exports (light)
export const colors = lightTheme.colors;
export const fonts = lightTheme.fonts;
export const spacing = lightTheme.spacing;
export const borderRadius = lightTheme.borderRadius;
