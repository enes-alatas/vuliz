/**
 * Position update for nodes
 */
export interface PositionUpdate {
  id: string;
  x: number;
  y: number;
  fixed?: boolean;
}

/**
 * Network options for vis.js
 */
export interface NetworkOptions {
  nodes: {
    shape: string;
    color: string;
    size: number;
    font: {
      size: number;
    };
  };
  edges: {
    arrows: {
      to: {
        enabled: boolean;
        scaleFactor: number;
      };
    };
    color: string;
    width: number;
    smooth: {
      type: string;
    };
  };
  physics?: {
    enabled: boolean;
  };
  interaction?: {
    hideEdgesOnDrag: boolean;
    tooltipDelay: number;
    hover: boolean;
    dragNodes: boolean;
    dragView: boolean;
    zoomView: boolean;
  };
  layout?: {
    hierarchical: boolean;
  };
}
