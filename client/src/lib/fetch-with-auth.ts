/**
 * Utility for making authenticated API requests
 * This provides a wrapper around fetch that automatically includes the auth token
 * and handles common error scenarios
 */

import { STORAGE_KEYS } from '@/constants/config';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Get the authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

/**
 * Check if user is authenticated (has a token)
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Set the authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

/**
 * Remove the authentication token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
}

/**
 * Fetch with authentication token
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with the fetch response
 */
export async function fetchWithAuth(url: string, options: FetchOptions = {}): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;
  
  // Create headers object if it doesn't exist
  const headers = new Headers(fetchOptions.headers || {});
  
  // Add auth token if available and not explicitly skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  
  // Ensure Accept header is set
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  
  // Add Content-Type header for POST/PUT/PATCH requests if not set and body is an object
  if (
    ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method || '') && 
    !headers.has('Content-Type') &&
    fetchOptions.body &&
    typeof fetchOptions.body === 'object'
  ) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Make the request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });
  
  // Handle unauthorized responses (redirect to login)
  if (response.status === 401) {
    // Remove token as it's invalid or expired
    removeAuthToken();
    
    // Redirect to login page if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Store the current URL to redirect back after login
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/auth' && currentPath !== '/login') {
        sessionStorage.setItem('redirect_after_login', currentPath);
      }
      
      // Redirect to login page
      window.location.href = '/auth';
    }
  }
  
  return response;
}

/**
 * Helper to handle API responses and extract data or errors
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Try to parse error as JSON
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || `Error: ${response.status}`);
    } catch (e) {
      // If parsing fails, just throw status
      if (e instanceof Error) {
        throw e;
      }
      throw new Error(`Error: ${response.status}`);
    }
  }
  
  // Return parsed JSON data
  return response.json();
} 