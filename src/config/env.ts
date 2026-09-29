/**
 * Environment configuration loaded from .env with rock-solid defaults
 */
declare const process: {
  env: Record<string, string | undefined>;
};

export const ENV = {
  TMDB_API_KEY:
    (typeof process !== 'undefined' && process.env?.VITE_TMDB_API_KEY) ||
    '61e2290429798c561450eb56b26de19b',
  TMDB_BASE_URL:
    (typeof process !== 'undefined' && process.env?.VITE_TMDB_BASE_URL) ||
    'https://api.themoviedb.org/3',
  TMDB_IMAGE_BASE_URL:
    (typeof process !== 'undefined' && process.env?.VITE_TMDB_IMAGE_BASE_URL) ||
    'https://image.tmdb.org/t/p',
  TRAILER_API_BASE_URL:
    (typeof process !== 'undefined' && process.env?.VITE_TRAILER_API_BASE_URL) ||
    'https://api.bingr.one/api/trailer/imdb',
};
