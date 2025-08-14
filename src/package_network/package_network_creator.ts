import {PackageNetwork, PackageNetworkLevel} from './types';
import {extractPackages} from '../packages/package_extractor_factory';
import {extractDependencies} from '../dependencies/dependency_provider_factory';
import {SonaTypeVulnerabilityProvider} from '../vulnerabilities/providers/sonatype_vulnerability_provider';
import {LATEST_VERSION, Package} from '../packages/types';
import {Dependency} from '../dependencies/types';
import {PackageNetworkCreationError} from './errors';

/**
 * Creates a hierarchical network of packages and their dependencies.
 *
 * This class analyzes package files to build a multi-level dependency graph,
 * where each level represents direct dependencies of packages from the previous level.
 * The network includes vulnerability information for each package.
 *
 * The network is built iteratively:
 * - Level 0: Root package (your package)
 * - Level 1: Direct dependencies from package file
 * - Level 2+: Transitive dependencies from previous levels
 */
export class PackageNetworkCreator {
  private readonly packageFile: File;
  private readonly maxLevels: number;
  private readonly processedDependencies: Set<string>;
  private readonly processedPackages: Map<string, Package>;
  private readonly vulnerabilityProvider: SonaTypeVulnerabilityProvider; // this is just for now, we can add more providers later and use a factory to create the provider

  constructor(packageFile: File, maxLevels = 3) {
    this.packageFile = packageFile;
    this.maxLevels = maxLevels;
    this.processedDependencies = new Set<string>();
    this.processedPackages = new Map<string, Package>();
    this.vulnerabilityProvider = new SonaTypeVulnerabilityProvider();
  }

  /**
   * Creates a package network from the provided package file.
   *
   * @returns A promise that resolves to a PackageNetwork containing levels of packages and dependencies
   * @throws {Error} If package extraction fails or vulnerability data cannot be retrieved
   */
  async create(): Promise<PackageNetwork> {
    const levels: PackageNetworkLevel[] = [];

    try {
      // Create root level (level 0) with your package
      const rootLevel = await this.createRootLevel();
      levels.push(rootLevel);

      // Process subsequent levels
      await this.processDependencyLevels(levels);

      return {levels};
    } catch (error) {
      throw new PackageNetworkCreationError(
        'Failed to create package network',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Creates the root level containing the user's package and its direct dependencies.
   *
   * @returns Promise resolving to the root package network level
   * @throws {PackageNetworkCreationError} When package extraction fails
   */
  private async createRootLevel(): Promise<PackageNetworkLevel> {
    const rootPackage: Package = {
      name: 'Your Package',
      version: LATEST_VERSION,
    };

    try {
      const directDependencies = await extractPackages(this.packageFile);
      const uniqueDirectDependencies =
        this.filterUniquePackages(directDependencies);

      if (uniqueDirectDependencies.length === 0) {
        console.warn('No direct dependencies found in the package file');
        return {
          packages: [rootPackage],
          dependencies: [],
        };
      }

      const dependenciesWithVulnerabilities = await this.addVulnerabilities(
        uniqueDirectDependencies,
      );
      const dependencies = this.createDependencies(
        rootPackage,
        uniqueDirectDependencies,
      );

      return {
        packages: [rootPackage, ...dependenciesWithVulnerabilities],
        dependencies,
      };
    } catch (error) {
      throw new PackageNetworkCreationError(
        'Failed to create root level',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Creates dependency relationships from root package to direct dependencies
   */
  private createDependencies(
    rootPackage: Package,
    packages: Package[],
  ): Dependency[] {
    return packages.map(pkg => ({
      from: rootPackage,
      to: pkg,
    }));
  }

  /**
   * Processes dependency levels iteratively until maxLevels is reached or no more dependencies exist.
   *
   * @param levels - The array of levels to populate with dependency data
   */
  private async processDependencyLevels(
    levels: PackageNetworkLevel[],
  ): Promise<void> {
    let currentLevelPackages = this.extractPackagesFromLevel(levels[0]);

    for (let levelIndex = 1; levelIndex < this.maxLevels; levelIndex++) {
      const dependencies =
        await this.extractUniqueDependencies(currentLevelPackages);

      if (dependencies.length === 0) {
        break;
      }

      const nextLevelPackages = this.collectNextLevelPackages(dependencies);
      const uniqueNextLevelPackages =
        this.filterUniquePackages(nextLevelPackages);

      if (uniqueNextLevelPackages.length === 0) {
        break;
      }

      const packagesWithVulnerabilities = await this.addVulnerabilities(
        uniqueNextLevelPackages,
      );

      levels.push({
        packages: packagesWithVulnerabilities,
        dependencies,
      });

      currentLevelPackages = uniqueNextLevelPackages;
      console.info(
        `Level ${levelIndex}: processed ${uniqueNextLevelPackages.length} packages`,
      );
    }
  }

  /**
   * Extracts packages from a network level, excluding the root package.
   *
   * @param level - The network level to extract packages from
   * @returns Array of packages excluding the root package
   */
  private extractPackagesFromLevel(level: PackageNetworkLevel): Package[] {
    return level.packages.filter(pkg => pkg.name !== 'Your Package');
  }

  /**
   * Filters out packages that have already been processed to avoid duplicates.
   *
   * @param packages - Array of packages to filter
   * @returns Array of unique packages that haven't been processed yet
   */
  private filterUniquePackages(packages: Package[]): Package[] {
    const uniquePackages: Package[] = [];

    for (const pkg of packages) {
      const packageKey = this.createPackageKey(pkg);
      if (!this.processedPackages.has(packageKey)) {
        this.processedPackages.set(packageKey, pkg);
        uniquePackages.push(pkg);
      }
    }

    return uniquePackages;
  }

  /**
   * Extracts dependencies and filters out already processed ones to avoid cycles.
   *
   * @param packages - Array of packages to extract dependencies from
   * @returns Promise resolving to array of unique dependencies
   */
  private async extractUniqueDependencies(
    packages: Package[],
  ): Promise<Dependency[]> {
    const allDependencies = await extractDependencies(packages);
    const uniqueDependencies: Dependency[] = [];

    for (const dependency of allDependencies) {
      const dependencyKey = this.createDependencyKey(dependency);
      if (!this.processedDependencies.has(dependencyKey)) {
        this.processedDependencies.add(dependencyKey);
        uniqueDependencies.push(dependency);
      }
    }

    return uniqueDependencies;
  }

  /**
   * Collects packages for the next level from dependencies.
   *
   * @param dependencies - Array of dependencies to extract packages from
   * @returns Array of unprocessed packages for the next level
   */
  private collectNextLevelPackages(dependencies: Dependency[]): Package[] {
    const nextLevelPackages: Package[] = [];

    for (const dependency of dependencies) {
      const packageKey = this.createPackageKey(dependency.to);
      if (!this.processedPackages.has(packageKey)) {
        nextLevelPackages.push(dependency.to);
      }
    }
    return nextLevelPackages;
  }

  /**
   * Creates a unique identifier for a package based on name and version.
   *
   * @param pkg - Package to create key for
   * @returns Unique string identifier for the package
   */
  private createPackageKey(pkg: Package): string {
    return `${pkg.name}@${pkg.version}`;
  }

  /**
   * Creates a unique identifier for a dependency relationship.
   *
   * @param dependency - Dependency to create key for
   * @returns Unique string identifier for the dependency relationship
   */
  private createDependencyKey(dependency: Dependency): string {
    const fromKey = this.createPackageKey(dependency.from);
    const toKey = this.createPackageKey(dependency.to);
    return `${fromKey}->${toKey}`;
  }

  /**
   * Enriches packages with vulnerability information.
   *
   * @param packages - Array of packages to enrich with vulnerability data
   * @returns Promise resolving to packages with vulnerability information
   */
  private async addVulnerabilities(packages: Package[]): Promise<Package[]> {
    return await this.vulnerabilityProvider.addVulnerabilities(packages);
  }
}
