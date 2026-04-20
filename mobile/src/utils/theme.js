// Age-adaptive theme definitions matching the web app
const childTheme = {
  colors: {
    primary: '#FF6B9D',
    primaryDark: '#C44FE2',
    secondary: '#43E97B',
    secondaryDark: '#38F9D7',
    accent: '#FFD93D',
    success: '#43E97B',
    warning: '#f39c12',
    danger: '#e74c3c',

    textPrimary: '#2D1B69',
    textSecondary: '#6B5B95',
    textMuted: '#A393C9',
    textWhite: '#fff',

    bgPrimary: '#FFF5F9',
    bgSecondary: '#F5F0FF',
    bgCard: '#fff',
    bgOverlay: 'rgba(0,0,0,0.4)',

    border: '#F0E0F0',
    borderLight: 'rgba(196, 79, 226, 0.1)',

    tabBar: '#fff',
    tabBarBorder: 'rgba(196, 79, 226, 0.15)',

    cardShadow: 'rgba(196, 79, 226, 0.15)',
  },
  fonts: {
    regular: { fontWeight: '400' },
    semiBold: { fontWeight: '600' },
    bold: { fontWeight: '700' },
    extraBold: { fontWeight: '800' },
    sizeBase: 17,
    sizeSmall: 14,
    sizeLarge: 20,
    sizeTitle: 30,
    sizeArabic: 30,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 18,
    lg: 26,
    xl: 34,
    xxl: 50,
  },
  borderRadius: {
    sm: 14,
    md: 20,
    lg: 28,
    xl: 30,
    round: 999,
  },
  animation: { speed: 400 },
};

const teenTheme = {
  colors: {
    primary: '#667eea',
    primaryDark: '#764ba2',
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

const adultTheme = {
  colors: {
    primary: '#2c3e50',
    primaryDark: '#1a252f',
    secondary: '#4A90E2',
    secondaryDark: '#357ABD',
    accent: '#D4AF37',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',

    textPrimary: '#1a1a2e',
    textSecondary: '#555',
    textMuted: '#888',
    textWhite: '#fff',

    bgPrimary: '#f8f9fa',
    bgSecondary: '#e9ecef',
    bgCard: '#fff',
    bgOverlay: 'rgba(0,0,0,0.5)',

    border: '#D5D5D5',
    borderLight: 'rgba(0,0,0,0.06)',

    tabBar: '#fff',
    tabBarBorder: 'rgba(0,0,0,0.1)',

    cardShadow: 'rgba(0, 0, 0, 0.08)',
  },
  fonts: {
    regular: { fontWeight: '400' },
    semiBold: { fontWeight: '600' },
    bold: { fontWeight: '700' },
    extraBold: { fontWeight: '800' },
    sizeBase: 15,
    sizeSmall: 13,
    sizeLarge: 17,
    sizeTitle: 26,
    sizeArabic: 24,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 22,
    xl: 28,
    xxl: 44,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 12,
    round: 999,
  },
  animation: { speed: 200 },
};

export const themes = { child: childTheme, teen: teenTheme, adult: adultTheme };

// Backward-compat defaults (teen)
export const colors = teenTheme.colors;
export const fonts = teenTheme.fonts;
export const spacing = teenTheme.spacing;
export const borderRadius = teenTheme.borderRadius;
