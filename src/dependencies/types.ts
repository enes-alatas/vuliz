import {Package} from '../packages/types';

/**
 * Represents a dependency relationship between two packages.
 */
export interface Dependency {
  from: Package;
  to: Package;
}
