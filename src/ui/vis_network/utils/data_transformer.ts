import {NetworkNode, NetworkEdge} from '../types';
import {Dependency} from 'src/dependencies/types';
import {Package} from 'src/packages/types';
import {ColorManager} from './color_manager';

/**
 * Custom error class for network data transformation errors
 */
export class NetworkDataValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'NetworkDataValidationError';
  }
}

/**
 * Utility class for transforming package and dependency data into network nodes and edges
 *
 * Handles the conversion of domain objects (Package, Dependency) into
 * network visualization objects (NetworkNode, NetworkEdge) with proper
 * ID generation, title formatting, and color assignment.
 */
export class DataTransformer {
  private readonly colorManager: ColorManager;

  constructor() {
    this.colorManager = new ColorManager();
  }

  /**
   * Transforms an array of packages into network nodes
   * @param packages - Array of packages to convert
   * @param level - Network level for the nodes
   * @returns Array of network nodes
   * @throws {NetworkDataValidationError} When input validation fails
   */
  transformPackagesToNodes(packages: Package[], level: number): NetworkNode[] {
    return packages.map((pkg: Package) =>
      this.createNodeFromPackage(pkg, level),
    );
  }

  /**
   * Transforms an array of dependencies into network edges
   * @param dependencies - Array of dependencies to convert
   * @param level - Network level for the edges
   * @returns Array of network edges
   */
  transformDependenciesToEdges(
    dependencies: Dependency[],
    level: number,
  ): NetworkEdge[] {
    return dependencies.map((dep: Dependency) =>
      this.createEdgeFromDependency(dep, level),
    );
  }

  /**
   * Creates a network node from a package object
   * @private
   * @param pkg - Package to convert
   * @param level - Network level
   * @returns Network node object
   */
  private createNodeFromPackage(pkg: Package, level: number): NetworkNode {
    this.validatePackage(pkg);

    return {
      id: this.generateNodeId(pkg),
      title: this.generateNodeTitle(pkg),
      level: level,
      color: this.colorManager.getColorForPackage(pkg),
    };
  }

  /**
   * Creates a network edge from a dependency object
   * @private
   * @param dep - Dependency to convert
   * @param level - Network level
   * @returns Network edge object
   */
  private createEdgeFromDependency(
    dep: Dependency,
    level: number,
  ): NetworkEdge {
    this.validateDependency(dep);

    return {
      id: this.generateEdgeId(dep),
      from: this.generateNodeId(dep.from),
      to: this.generateNodeId(dep.to),
      level: level,
      color: this.colorManager.getColorForPackage(dep.to),
    };
  }

  /**
   * Generates a unique node ID from package information
   * @private
   * @param pkg - Package object
   * @returns Unique node identifier
   */
  private generateNodeId(pkg: Package): string {
    return `${pkg.name}@${pkg.version}`;
  }

  /**
   * Generates a display title for a node
   * @private
   * @param pkg - Package object
   * @returns Formatted title string
   */
  private generateNodeTitle(pkg: Package): string {
    return `${pkg.name}\n${pkg.version}`;
  }

  /**
   * Generates a unique edge ID from dependency information
   * @private
   * @param dep - Dependency object
   * @returns Unique edge identifier
   */
  private generateEdgeId(dep: Dependency): string {
    return `${this.generateNodeId(dep.from)}->${this.generateNodeId(dep.to)}`;
  }

  /**
   * Validates a single package object
   * @private
   * @param pkg - Package object to validate
   * @throws {NetworkDataValidationError} When validation fails
   */
  private validatePackage(pkg: Package): void {
    if (!pkg) {
      throw new NetworkDataValidationError(
        'Package cannot be null or undefined',
        'package',
      );
    }

    if (typeof pkg.name !== 'string' || pkg.name.trim() === '') {
      throw new NetworkDataValidationError(
        'Package name must be a non-empty string',
        'package.name',
      );
    }

    if (typeof pkg.version !== 'string' || pkg.version.trim() === '') {
      throw new NetworkDataValidationError(
        'Package version must be a non-empty string',
        'package.version',
      );
    }

    // Validate package type if provided
    if (
      pkg.type !== undefined &&
      !Object.values(['npm', 'pypi']).includes(pkg.type)
    ) {
      throw new NetworkDataValidationError(
        'Package type must be either "npm" or "pypi"',
        'package.type',
      );
    }
  }

  /**
   * Validates a single dependency object
   * @private
   * @param dep - Dependency object to validate
   * @throws {NetworkDataValidationError} When validation fails
   */
  private validateDependency(dep: Dependency): void {
    if (!dep) {
      throw new NetworkDataValidationError(
        'Dependency cannot be null or undefined',
        'dependency',
      );
    }

    if (!dep.from) {
      throw new NetworkDataValidationError(
        'Dependency "from" package cannot be null or undefined',
        'dependency.from',
      );
    }

    if (!dep.to) {
      throw new NetworkDataValidationError(
        'Dependency "to" package cannot be null or undefined',
        'dependency.to',
      );
    }

    // Validate both packages in the dependency
    this.validatePackage(dep.from);
    this.validatePackage(dep.to);

    // Check for self-dependency
    if (dep.from.name === dep.to.name && dep.from.version === dep.to.version) {
      throw new NetworkDataValidationError(
        'Package cannot depend on itself',
        'dependency',
      );
    }
  }
}
