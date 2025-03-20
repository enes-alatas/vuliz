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
 * Represents the type of a package, such as NPM, PYPI.
 */
export enum PackageType {
  NPM = 'npm',
  PYPI = 'pypi',
}

/** Constant representing the latest version of a package */
export const LATEST_VERSION = '*';
