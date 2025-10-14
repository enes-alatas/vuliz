/**
 * Constants for Vis Network components
 */

/**
 * DOM element IDs used by the network engine
 */
export const NETWORK_IDS = {
  CONTAINER: 'network',
} as const;

/**
 * Network configuration constants
 */
export const NETWORK_CONFIG = {
  BATCH_SIZE: 10,
  NODE_BATCH_SIZE: 20,
  BASE_RADIUS: 100,
  JITTER_AMOUNT: 20,
  CENTER_NODE_SIZE: 8,
  DEFAULT_NODE_SIZE: 4,
} as const;

/**
 * Color constants for network visualization
 */
export const NETWORK_COLORS = {
  SEVERITY: {
    LOW: '#FFC107',
    MEDIUM: '#FF9800',
    HIGH: '#F44336',
    CRITICAL: '#B71C1C',
    UNKNOWN: '#848484',
  },
  CENTER: '#4CAF50',
  DEFAULT: '#848484',
} as const;

/**
 * Network layout constants
 */
export const NETWORK_LAYOUT = {
  CENTER_NODE_ID: 'Your Package@*',
  ANIMATION_DURATION: 1000,
  FOCUS_SCALE: 0.6,
  ANIMATION_EASING: 'easeInOutQuad',
} as const;
