/**
 * Application configuration constants
 *
 * Centralized configuration values used throughout the application
 * to ensure consistency and ease of maintenance.
 */
export const APP_CONFIG = {
  /** Maximum number of dependency levels to process in the network */
  MAX_NETWORK_LEVELS: 3,
  /** Delay in milliseconds for notification transitions */
  NOTIFICATION_DELAY_MS: 100,
  /** Value indicating a permanent notification (no auto-hide) */
  PERMANENT_NOTIFICATION: 0,
} as const;

/**
 * DOM element IDs used by the application
 */
export const APP_IDS = {
  FILE_INPUT: 'fileInput',
  INPUT_CONTAINER: 'inputContainer',
  UPLOAD_TEXT: 'uploadText',
} as const;

/**
 * CSS class names used by the application
 */
export const APP_CLASSES = {
  FILE_SELECTED: 'file-selected',
  TOP: 'top',
} as const;
