/**
 * Constants for the Notification System
 * Centralizes all DOM element IDs and CSS class names
 */

/**
 * DOM element IDs used by the notification system
 */
export const NOTIFICATION_IDS = {
  CONTAINER: 'notificationContainer',
  CONTENT: 'notificationContent',
} as const;

/**
 * CSS class names used by the notification system
 */
export const NOTIFICATION_CLASSES = {
  CONTAINER: 'notification-container',
  CONTENT: 'notification-content',
  MESSAGE: 'notification-message',
  CLOSE: 'notification-close',
  SHOW: 'show',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

/**
 * Animation durations in milliseconds
 */
export const NOTIFICATION_ANIMATION = {
  HIDE_DELAY: 300,
  DEFAULT_DURATION: 5000,
  INFO_DURATION: 5000,
  WARNING_DURATION: 7000,
  ERROR_DURATION: 0, // Permanent
  SUCCESS_DURATION: 4000,
} as const;
