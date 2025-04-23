import {Dependency, DependencyProvider} from './types';
import {LATEST_VERSION, Package} from '../packages/types';
import {RequirementsFileProcessor} from '../packages/extractors/python/file_processors';

/**
 * Implements dependency extraction for Python packages
 *
 * Uses the PyPI JSON API to fetch package dependencies
 */
export class PythonDependencyProvider implements DependencyProvider {
  /**
   * Extracts all dependencies for a given Python package
   *
   * @param pkg The package to analyze for dependencies
   * @returns A promise that resolves to an array of dependencies
   */
  async extractDependencies(pkg: Package): Promise<Dependency[]> {
    const requiredPackages = await this.fetchRequiredPackages(pkg);
    return this.buildDependencies(pkg, requiredPackages);
  }

  /**
   * Builds dependency objects from a package and its dependencies
   *
   * @param sourcePackage The package that has dependencies
   * @param requiredPackages The packages that the source package depends on
   * @returns An array of dependency objects
   */
  private buildDependencies(
    sourcePackage: Package,
    requiredPackages: Package[],
  ): Dependency[] {
    const dependencies: Dependency[] = [];

    for (const requiredPackage of requiredPackages) {
      dependencies.push({
        from: sourcePackage,
        to: requiredPackage,
      });
    }

    return dependencies;
  }

  /**
   * Fetches required packages from the PyPI API
   *
   * @param pkg The package to fetch dependencies for
   * @returns A promise that resolves to an array of packages
   */
  private async fetchRequiredPackages(pkg: Package): Promise<Package[]> {
    let response: Response;

    try {
      const packageVersion =
        PythonDependencyProvider.getPackageVersionForAPI(pkg);
      const packageSource = packageVersion
        ? `${pkg.name}/${packageVersion}`
        : pkg.name;

      response = await fetch(`https://pypi.org/pypi/${packageSource}/json`);

      if (!response.ok) {
        console.warn(`Package not found on PyPI: ${pkg.name}`);
        return [];
      }
    } catch (error) {
      console.warn(`Error fetching package from PyPI: ${pkg.name}. ${error}`);
      return [];
    }

    try {
      interface PyPIResponse {
        info: {
          requires_dist?: string[];
        };
      }

      const data = (await response.json()) as PyPIResponse;
      const version = PythonDependencyProvider.getPackageVersionForAPI(pkg);

      // Get requirements or empty array if none exist
      const requirements =
        version && data.info.requires_dist ? data.info.requires_dist : [];

      return this.parseRequirements(requirements);
    } catch (error) {
      console.error(`Error parsing PyPI response for ${pkg.name}:`, error);
      return [];
    }
  }

  /**
   * Gets the package version for API requests
   *
   * @param pkg The package to get the version for
   * @returns The package version or null if using latest version
   */
  private static getPackageVersionForAPI(pkg: Package): string | null {
    if (pkg.version === LATEST_VERSION) {
      return null;
    }
    return pkg.version;
  }

  /**
   * Parses requirement strings into Package objects
   *
   * @param requirements Array of requirement strings from PyPI
   * @returns Array of Package objects
   */
  private parseRequirements(requirements: string[]): Package[] {
    const packages: Package[] = [];

    for (const requirement of requirements) {
      try {
        const pkg = RequirementsFileProcessor.parsePackageEntry(requirement);
        packages.push(pkg);
      } catch (error) {
        console.warn(`Failed to parse requirement: ${requirement}`, error);
        // Skip invalid entries to continue processing the rest
      }
    }
    return packages;
  }
}
