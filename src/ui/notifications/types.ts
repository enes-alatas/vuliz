/**
 * Notification types supported by the system
 */
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

/**
 * Configuration options for notifications
 */
export interface NotificationOptions {
  /** The message to display */
  message: string;
  /** The type of notification */
  type?: NotificationType;
  /** How long to show the notification in milliseconds (0 = permanent) */
  duration?: number;
}
