import {Package, PackageType} from 'src/packages/types';
import {Dependency, DependencyProvider} from './types';
import {PythonDependencyProvider} from './python_dependency_provider';
import {
  DependencyProviderNotFoundError,
  PackageTypeUnknownError,
} from './errors';

/**
 * Registry mapping package types to their dependency provider constructors.
 * Extend this registry to support more package ecosystems.
 */
const providerRegistry: Partial<
  Record<PackageType, new () => DependencyProvider>
> = {
  [PackageType.PYPI]: PythonDependencyProvider,
  // [PackageType.NPM]: JavaScriptDependencyProvider,
  // [PackageType.MAVEN]: JavaDependencyProvider,
};

/**
 * Factory for creating dependency providers based on package type.
 */
export class DependencyProviderFactory {
  /**
   * Gets the appropriate dependency provider for a given package.
   * @param pkg The package to extract dependencies from.
   * @returns An instance of the appropriate dependency provider.
   * @throws {DependencyProviderNotFoundError} If the package type is not supported.
   */
  static getProvider(pkg: Package): DependencyProvider {
    const packageType = this.getPackageType(pkg);
    const ProviderClass = providerRegistry[packageType];
    if (ProviderClass) {
      return new ProviderClass();
    }
    throw new DependencyProviderNotFoundError(packageType);
  }

  private static getPackageType(pkg: Package): PackageType {
    if (pkg.type) {
      return pkg.type;
    }
    throw new PackageTypeUnknownError(pkg.name);
  }
}

/**
 * Extracts dependencies from a list of packages using the appropriate provider.
 * Assumes all packages are of the same type.
 * @param packages The packages to extract dependencies from.
 * @returns Promise resolving to a set of unique dependencies.
 */
export async function extractDependencies(
  packages: Package[],
): Promise<Set<Dependency>> {
  if (packages.length === 0) return new Set();
  const dependencyProvider = DependencyProviderFactory.getProvider(packages[0]);
  const dependencySet = new Set<Dependency>();
  for (const pkg of packages) {
    const pkgDependencies = await dependencyProvider.extractDependencies(pkg);
    for (const dep of pkgDependencies) {
      dependencySet.add(dep);
    }
  }
  return dependencySet;
}
