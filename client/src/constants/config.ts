/**
 * Global configuration constants for the application
 */

// Determine the API URL based on environment
let apiBaseUrl: string;

if (typeof window !== 'undefined') {
  // Client-side code
  const metaTag = document.querySelector('meta[name="api-base-url"]');
  if (metaTag && metaTag.getAttribute('content')) {
    apiBaseUrl = metaTag.getAttribute('content') || '';
  } else if (import.meta.env?.VITE_API_URL) {
    apiBaseUrl = import.meta.env.VITE_API_URL;
  } else {
    apiBaseUrl = window.location.origin;
  }
} else {
  // Server-side code (NextJS SSR)
  apiBaseUrl = process.env.VITE_API_URL || 'http://localhost:3001';
}

// Export constants
export const API_URL = apiBaseUrl;

// App name
export const APP_NAME = 'EdunexIA';

// Default pagination limits
export const DEFAULT_PAGE_SIZE = 10;

// Timeouts
export const API_TIMEOUT = 30000; // 30 seconds

// Supported languages
export const SUPPORTED_LANGUAGES = ['pt-BR', 'en-US'];

// Portal types
export const PORTAL_TYPES = {
  ADMIN: 'admin',
  STUDENT: 'aluno',
  PARTNER: 'partner',
  POLO: 'polo',
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  STUDENT: 'aluno',
  TEACHER: 'professor',
  POLO_MANAGER: 'polo_manager',
  PARTNER: 'partner',
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Redirect paths
export const REDIRECT_PATHS = {
  AFTER_LOGIN: '/dashboard',
  AFTER_LOGOUT: '/auth',
  UNAUTHORIZED: '/auth',
};

// File upload limits
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME_DISPLAY: 'DD/MM/YYYY HH:mm',
  DATETIME_API: 'YYYY-MM-DDTHH:mm:ss',
}; 