/**
 * WeatherXM-inspired theme for Popcorn Pal
 * Dark blue-gray with solid cards matching WeatherXM design
 */

export const theme = {
  // Background colors
  background: {
    primary: '#1A1F2E',
    secondary: '#252A3F',
    gradient: ['#1A1F2E', '#252A3F', '#1E2333'],
  },

  // Card colors (solid, matching WeatherXM)
  card: {
    background: '#3C4A64',
    backgroundDark: '#2F3B50',
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#A8B2C8',
    muted: '#7A8295',
    accent: '#6B9FFF',
  },

  // Brand colors
  brand: {
    primary: '#6B9FFF', // Blue accent
    secondary: '#7B8CDE', // Purple-blue accent
    vose: '#00D9FF', // Cyan for VOSE badge
    error: '#FF5252',
    success: '#4CAF50',
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  // Border radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 999,
  },

  // Typography
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
  },

  // Shadows (for iOS)
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;
