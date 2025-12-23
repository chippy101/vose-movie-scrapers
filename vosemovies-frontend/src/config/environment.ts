/**
 * Environment Configuration
 *
 * This file contains hardcoded configuration for production builds.
 * For development, values from .env will override these defaults.
 */

import Constants from 'expo-constants';

// PRODUCTION CONFIGURATION - Change these values before building APK
// This is the fallback when .env variables aren't available in production builds
const PRODUCTION_CONFIG = {
  BACKEND_URL: 'https://vose-movie-scrapers.onrender.com',  // PRODUCTION RENDER API
  TMDB_API_KEY: '0cd89e13a33c9f826727e1e8484fcb2b',
};

/**
 * Get backend URL - prioritizes .env in dev, falls back to hardcoded production config
 */
export function getBackendUrl(): string {
  // Try environment variables first (works in dev/Expo Go)
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

  // Try Expo config extra (sometimes works in production)
  const configUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;

  // Use first available, fallback to production config
  const url = envUrl || configUrl || PRODUCTION_CONFIG.BACKEND_URL;

  console.log('[Environment] Backend URL sources:');
  console.log('  process.env:', envUrl || 'not set');
  console.log('  Constants.extra:', configUrl || 'not set');
  console.log('  Production config:', PRODUCTION_CONFIG.BACKEND_URL);
  console.log('  → Using:', url);

  return url;
}

/**
 * Get TMDB API key
 */
export function getTMDBApiKey(): string {
  const envKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;
  const configKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_TMDB_API_KEY;

  return envKey || configKey || PRODUCTION_CONFIG.TMDB_API_KEY;
}

export const Environment = {
  getBackendUrl,
  getTMDBApiKey,
  isProduction: !__DEV__,
  isDevelopment: __DEV__,
};
