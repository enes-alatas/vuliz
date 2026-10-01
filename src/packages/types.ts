import {VulnerabilityContainer} from 'src/vulnerabilities/types';

/**
 * Represents a package with its metadata and vulnerabilities
 */
export interface Package {
  name: string;
  type?: PackageType;
  version: string;
  vulnerabilityContainer?: VulnerabilityContainer;
}

/**
 * Represents the type of a package, such as NPM, PYPI, MAVEN.
 *
 * Maven package names use the `group:artifact` form.
 */
export enum PackageType {
  NPM = 'npm',
  PYPI = 'pypi',
  MAVEN = 'maven',
}

/** Constant representing the latest version of a package */
export const LATEST_VERSION = '*';
