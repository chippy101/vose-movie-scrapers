// Get API key from environment variable (Expo automatically injects EXPO_PUBLIC_* variables)
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

// Validate that API key is configured
if (!TMDB_API_KEY) {
  console.error(
    '❌ TMDB API key is not configured!\n' +
    'Create a .env file in the project root with:\n' +
    'EXPO_PUBLIC_TMDB_API_KEY=your_api_key_here\n' +
    'See .env.example for instructions.'
  );
}

export const TMDB_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  API_KEY: TMDB_API_KEY || '', // Fallback to empty string to prevent crashes
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  POSTER_SIZE: 'w500',
  BACKDROP_SIZE: 'w1280',
  PROFILE_SIZE: 'w185',
  LANGUAGE: 'en-US',
  REGION: 'ES', // Spain region for VOSE context
  GENRE_MAPPING: {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
  } as const,
};

export const getImageUrl = (path: string, size: string = TMDB_CONFIG.POSTER_SIZE): string => {
  if (!path) return '';
  return `${TMDB_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
};

export const getPosterUrl = (path: string): string => {
  return getImageUrl(path, TMDB_CONFIG.POSTER_SIZE);
};

export const getBackdropUrl = (path: string): string => {
  return getImageUrl(path, TMDB_CONFIG.BACKDROP_SIZE);
};

export const getProfileUrl = (path: string): string => {
  return getImageUrl(path, TMDB_CONFIG.PROFILE_SIZE);
};