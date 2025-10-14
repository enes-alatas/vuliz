import {NetworkOptions} from './types';
import {NETWORK_CONFIG, NETWORK_COLORS} from '../constants';

/**
 * Builder utility for creating vis.js network configuration options
 *
 * Provides a centralized way to build network configuration objects
 * with consistent styling and interaction settings.
 */
export class NetworkOptionsBuilder {
  /**
   * Builds the complete network configuration options
   * @returns Network configuration options object
   */
  static build(): NetworkOptions {
    return {
      nodes: {
        shape: 'dot',
        color: NETWORK_COLORS.DEFAULT,
        size: NETWORK_CONFIG.DEFAULT_NODE_SIZE,
        font: {size: 4},
      },
      edges: {
        arrows: {to: {enabled: true, scaleFactor: 0.2}},
        color: NETWORK_COLORS.DEFAULT,
        width: 0.15,
        smooth: {type: 'continuous'},
      },
      interaction: {
        hideEdgesOnDrag: true,
        tooltipDelay: 200,
        hover: true,
        dragNodes: false,
        dragView: true,
        zoomView: true,
      },
      physics: {enabled: false},
      layout: {hierarchical: false},
    };
  }
}
