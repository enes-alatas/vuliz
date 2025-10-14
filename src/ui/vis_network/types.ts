import {NetworkOptions} from './utils/types';

/**
 * Network node data structure
 */
export interface NetworkNode {
  id: string;
  title: string;
  level: number;
  color?: string;
  isCenter?: boolean;
  size?: number;
  fixed?: boolean;
  x?: number;
  y?: number;
}

/**
 * Network edge data structure
 */
export interface NetworkEdge {
  id: string;
  from: string;
  level: number;
  to: string;
  color?: string;
}

/**
 * Vis.js DataSet interface for type safety
 */
export interface VisDataSet<T> {
  add(data: T[]): void;
  clear(): void;
  get(id?: string): T | T[];
  update(data: T[]): void;
}

/**
 * Vis.js Network interface for type safety
 */
export interface VisNetwork {
  focus(nodeId: string, options?: {scale?: number; animation?: any}): void;
  fit(): void;
}

/**
 * Vis.js library interface for type safety
 */
export interface VisLibrary {
  DataSet: new <T>() => VisDataSet<T>;
  Network: new (
    container: HTMLElement,
    data: any,
    options: NetworkOptions,
  ) => VisNetwork;
}

/**
 * Animation configuration for network focus
 */
export interface FocusAnimationOptions {
  duration: number;
  easingFunction: string;
}

/**
 * Focus options for network node focusing
 */
export interface FocusOptions {
  scale: number;
  animation: FocusAnimationOptions;
}
