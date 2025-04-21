import {Package} from '../packages/types';

/**
 * Represents a dependency relationship between two packages.
 */
export interface Dependency {
  from: Package;
  to: Package;
}

/**
 * Interface for providers that extract dependencies of the given package
 */
export interface DependencyProvider {
  /**
   * Extracts all dependencies for a given package
   *
   * @param pkg The package to analyze for dependencies
   * @returns A promise that resolves to an array of dependencies
   */
  extractDependencies(pkg: Package): Promise<Dependency[]>;
}
