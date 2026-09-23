/**
 * Centralized configuration for API and Socket URLs.
 * Dynamically handles 'localhost' vs Network IP access to ensure the system 
 * works on local networks without manual .env changes.
 */

const getBaseUrl = (envVar, defaultPort) => {
  let url = envVar || `http://localhost:${defaultPort}`;
  url = url.replace(/\/$/, ''); // Remove trailing slash

  const currentHost = window.location.hostname;
  const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

  // If we're accessing via IP/Network but config says localhost, sync it!
  if (!isLocalhost) {
    if (url.includes('localhost')) {
      url = url.replace('localhost', currentHost);
    } else if (url.includes('127.0.0.1')) {
      url = url.replace('127.0.0.1', currentHost);
    }
  }

  return url;
};

export const SOCKET_URL = getBaseUrl(import.meta.env.VITE_SOCKET_URL, '5000');
export const API_URL = getBaseUrl(import.meta.env.VITE_API_URL, '5000') + (import.meta.env.VITE_API_URL ? '' : '/api/v1');

// For voice recording and other secure-context-only features
export const IS_SECURE_CONTEXT = window.isSecureContext;
