/**
 * Application color constants
 * Centralized color definitions to avoid color literals
 */

export const colors = {
  // Primary colors
  primary: '#2196F3',
  primaryDark: '#1976D2',
  
  // Status colors
  success: '#4CAF50',
  error: '#FF5722',
  warning: '#FF9800',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#ccc',
  lightGray: '#F5F5F5',
  darkGray: '#333',
  mediumGray: '#666',
  borderGray: '#eee',
  textGray: '#999',
  
  // Background colors
  background: '#f5f5f5',
  cardBackground: '#fff',
  
  // Special colors
  blue: '#0000FF',
  transparent: 'transparent',
} as const;

export type ColorName = keyof typeof colors;
