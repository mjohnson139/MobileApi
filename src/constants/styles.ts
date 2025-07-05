import { StyleSheet } from 'react-native';
import { colors } from './colors';

/**
 * Common styles used across the application
 * Centralized style definitions to avoid inline styles
 */

export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Card styles
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    margin: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Text styles
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 8,
  },
  
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 4,
  },
  
  bodyText: {
    fontSize: 14,
    color: colors.mediumGray,
    lineHeight: 20,
  },
  
  // Button styles
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  
  primaryButton: {
    backgroundColor: colors.primary,
  },
  
  successButton: {
    backgroundColor: colors.success,
  },
  
  errorButton: {
    backgroundColor: colors.error,
  },
  
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Status styles
  statusSuccess: {
    color: colors.success,
  },
  
  statusError: {
    color: colors.error,
  },
  
  // Border styles
  bottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGray,
  },
  
  // Input styles
  input: {
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 4,
    padding: 8,
    backgroundColor: colors.white,
  },
});
