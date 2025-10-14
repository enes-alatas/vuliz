import {NotificationType} from './types';
import {
  NOTIFICATION_IDS,
  NOTIFICATION_CLASSES,
  NOTIFICATION_ANIMATION,
} from './constants';

/**
 * Notification system for displaying messages to users
 * Provides a professional alternative to browser alerts with support for
 * different message types and customizable display duration
 */
export class NotificationSystem {
  private container: HTMLElement | null;
  private content: HTMLElement | null;
  private currentTimeout: NodeJS.Timeout | null = null;
  private hideTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.container = document.getElementById(NOTIFICATION_IDS.CONTAINER);
    this.content = document.getElementById(NOTIFICATION_IDS.CONTENT);

    // Validate required DOM elements
    if (!this.container || !this.content) {
      console.error('NotificationSystem: Required DOM elements not found');
    }
  }

  /**
   * Show a notification message
   * @param message - The message to display
   * @param type - The type of notification (info, warning, error, success)
   * @param duration - How long to show the notification (ms, 0 = permanent)
   */
  show(
    message: string,
    type: NotificationType = NotificationType.INFO,
    duration: number = NOTIFICATION_ANIMATION.DEFAULT_DURATION,
  ): void {
    // Validate inputs
    if (!message || typeof message !== 'string') {
      console.error('NotificationSystem: Invalid message provided');
      return;
    }

    if (!this.isValidNotificationType(type)) {
      console.warn(
        'NotificationSystem: Invalid type provided, defaulting to info',
      );
      type = NotificationType.INFO;
    }

    // Clear any existing notification
    this.hide();

    // Clear any pending hide timeout to prevent content clearing
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Set the message and type
    if (this.content) {
      this.content.innerHTML = `
        <p class="${NOTIFICATION_CLASSES.MESSAGE}">${this.escapeHtml(message)}</p>
      `;

      // Remove existing type classes and add new one
      this.content.className = NOTIFICATION_CLASSES.CONTENT;
      this.content.classList.add(type);

      // Show the notification
      requestAnimationFrame(() => {
        this.content?.classList.add(NOTIFICATION_CLASSES.SHOW);
      });
    }

    // Auto-hide after duration (if not permanent)
    if (duration > 0) {
      this.currentTimeout = setTimeout(() => {
        this.hide();
      }, duration);
    }
  }

  /**
   * Hide the current notification
   */
  hide(): void {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.content?.classList.remove(NOTIFICATION_CLASSES.SHOW);

    // Remove content after animation completes
    this.hideTimeout = setTimeout(() => {
      if (this.content) {
        this.content.innerHTML = '';
        this.content.className = NOTIFICATION_CLASSES.CONTENT;
      }
      this.hideTimeout = null;
    }, NOTIFICATION_ANIMATION.HIDE_DELAY);
  }

  /**
   * Show an info notification
   * @param message - The message to display
   * @param duration - How long to show (ms, 0 = permanent)
   */
  info(
    message: string,
    duration: number = NOTIFICATION_ANIMATION.INFO_DURATION,
  ): void {
    this.show(message, NotificationType.INFO, duration);
  }

  /**
   * Show a warning notification
   * @param message - The message to display
   * @param duration - How long to show (ms, 0 = permanent)
   */
  warning(
    message: string,
    duration: number = NOTIFICATION_ANIMATION.WARNING_DURATION,
  ): void {
    this.show(message, NotificationType.WARNING, duration);
  }

  /**
   * Show an error notification
   * @param message - The message to display
   * @param duration - How long to show (ms, 0 = permanent)
   */
  error(
    message: string,
    duration: number = NOTIFICATION_ANIMATION.ERROR_DURATION,
  ): void {
    this.show(message, NotificationType.ERROR, duration);
  }

  /**
   * Show a success notification
   * @param message - The message to display
   * @param duration - How long to show (ms, 0 = permanent)
   */
  success(
    message: string,
    duration: number = NOTIFICATION_ANIMATION.SUCCESS_DURATION,
  ): void {
    this.show(message, NotificationType.SUCCESS, duration);
  }

  /**
   * Escape HTML characters to prevent XSS
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Validate if the provided type is a valid notification type
   * @param type - The type to validate
   * @returns True if valid, false otherwise
   */
  private isValidNotificationType(
    type: NotificationType,
  ): type is NotificationType {
    return [
      NotificationType.INFO,
      NotificationType.WARNING,
      NotificationType.ERROR,
      NotificationType.SUCCESS,
    ].includes(type);
  }
}
