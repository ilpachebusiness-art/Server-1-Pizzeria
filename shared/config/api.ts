// API Configuration - Centralized URL management
// This allows easy switching between localhost and production URLs

const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3001/api';
};

const getWebSocketUrl = (): string => {
  // Get base URL from API URL
  const apiUrl = getApiBaseUrl();
  
  // Convert http:// to ws:// and https:// to wss://
  if (apiUrl.startsWith('https://')) {
    const baseUrl = apiUrl.replace('/api', '').replace('https://', 'wss://');
    return `${baseUrl}/ws`;
  } else if (apiUrl.startsWith('http://')) {
    const baseUrl = apiUrl.replace('/api', '').replace('http://', 'ws://');
    return `${baseUrl}/ws`;
  }
  
  // Fallback
  return 'ws://localhost:3001/ws';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  WS_URL: getWebSocketUrl(),
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL.endsWith('/') 
    ? API_CONFIG.BASE_URL.slice(0, -1) 
    : API_CONFIG.BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};

// Helper function to get WebSocket URL
export const getWsUrl = (): string => {
  return API_CONFIG.WS_URL;
};

