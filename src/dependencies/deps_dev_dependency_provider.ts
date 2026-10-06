import {Dependency, DependencyProvider} from './types';
import {LATEST_VERSION, Package, PackageType} from '../packages/types';

/**
 * Response of the deps.dev GetDependencies endpoint
 * (https://docs.deps.dev/api/v3/#getdependencies)
 */
interface DepsDevDependencyGraph {
  nodes?: {
    versionKey: {name: string; version: string};
    relation: 'SELF' | 'DIRECT' | 'INDIRECT';
  }[];
}

/**
 * Base class for dependency providers backed by the deps.dev API
 *
 * deps.dev resolves dependency graphs the way the package manager of each
 * ecosystem does, and allows cross-origin requests from the browser.
 * Only the direct dependencies of each package are taken from the graph;
 * the next levels are resolved by the package network creator.
 */
export abstract class DepsDevDependencyProvider implements DependencyProvider {
  private readonly apiBaseUrl: string;

  /**
   * @param system The deps.dev name of the package system, e.g. "maven"
   * @param packageType The type given to the dependencies that are found
   */
  protected constructor(
    private readonly system: string,
    private readonly packageType: PackageType,
  ) {
    this.apiBaseUrl = `https://api.deps.dev/v3/systems/${system}`;
  }

  /**
   * Extracts all dependencies for a given package
   *
   * @param pkg The package to analyze for dependencies
   * @returns A promise that resolves to an array of dependencies
   */
  async extractDependencies(pkg: Package): Promise<Dependency[]> {
    const requiredPackages = await this.fetchRequiredPackages(pkg);
    return requiredPackages.map(requiredPackage => ({
      from: pkg,
      to: requiredPackage,
    }));
  }

  /**
   * Fetches the direct dependencies of a package from deps.dev
   *
   * @param pkg The package to fetch dependencies for
   * @returns A promise that resolves to an array of packages
   */
  private async fetchRequiredPackages(pkg: Package): Promise<Package[]> {
    // Dependencies can only be resolved for an exact version
    if (pkg.version === LATEST_VERSION) {
      return [];
    }

    let response: Response;
    try {
      response = await fetch(
        `${this.apiBaseUrl}/packages/${encodeURIComponent(pkg.name)}` +
          `/versions/${encodeURIComponent(pkg.version)}:dependencies`,
      );
      if (!response.ok) {
        console.warn(`Package not found on deps.dev: ${pkg.name}`);
        return [];
      }
    } catch (error) {
      console.warn(
        `Error fetching package from deps.dev: ${pkg.name}. ${error}`,
      );
      return [];
    }

    try {
      const graph = (await response.json()) as DepsDevDependencyGraph;
      return (graph.nodes ?? [])
        .filter(node => node.relation === 'DIRECT')
        .map(node => ({
          name: node.versionKey.name,
          version: node.versionKey.version,
          type: this.packageType,
        }));
    } catch (error) {
      console.error(`Error parsing deps.dev response for ${pkg.name}:`, error);
      return [];
    }
  }
}
