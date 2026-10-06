import {AbstractFileProcessor} from '../../file_processor';
import {LATEST_VERSION, Package, PackageType} from '../../../types';

/** An entry of the "packages" section of a lock file (v2 and v3) */
interface LockPackage {
  name?: string;
  version?: string;
  link?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

/** The parts of package-lock.json and npm-shrinkwrap.json that are used */
interface PackageLock {
  packages?: Record<string, LockPackage>;
  dependencies?: Record<string, {version?: string}>;
}

/**
 * Processes npm package-lock.json and npm-shrinkwrap.json files
 *
 * For lock files of version 2 and 3 (npm 7 and later), the direct
 * dependencies of the project are listed with their installed versions.
 * Version 1 lock files do not tell direct dependencies apart, so all
 * top-level packages are listed instead.
 */
export class PackageLockFileProcessor extends AbstractFileProcessor {
  /**
   * Parses lock file content
   */
  protected async parseRawData(fileContent: string): Promise<unknown> {
    return JSON.parse(fileContent);
  }

  /**
   * Extracts the dependencies from the parsed lock file
   */
  protected async parseEntries(rawData: unknown): Promise<Package[]> {
    const lock = rawData as PackageLock;
    if (lock.packages?.['']) {
      return this.parseDirectDependencies(lock.packages);
    }
    return this.parseTopLevelDependencies(lock.dependencies ?? {});
  }

  /**
   * Lists the root project's dependencies with their installed versions
   */
  private parseDirectDependencies(
    packages: Record<string, LockPackage>,
  ): Package[] {
    const root = packages[''];
    const names = new Set([
      ...Object.keys(root.dependencies ?? {}),
      ...Object.keys(root.devDependencies ?? {}),
      ...Object.keys(root.optionalDependencies ?? {}),
    ]);

    const result: Package[] = [];
    for (const name of names) {
      const installed = packages[`node_modules/${name}`];
      // Linked packages are local (e.g. workspaces), not from the registry
      if (installed?.link) continue;
      result.push({
        // Aliased packages record their real name
        name: installed?.name ?? name,
        version: PackageLockFileProcessor.cleanVersion(installed?.version),
        type: PackageType.NPM,
      });
    }
    return result;
  }

  /**
   * Lists the top-level packages of a version 1 lock file
   */
  private parseTopLevelDependencies(
    dependencies: Record<string, {version?: string}>,
  ): Package[] {
    return Object.entries(dependencies).map(([name, entry]) => {
      // Aliases are recorded as "npm:real-name@version"
      const alias = entry.version?.match(/^npm:(@?[^@]+)@(.+)$/);
      return {
        name: alias ? alias[1] : name,
        version: PackageLockFileProcessor.cleanVersion(
          alias ? alias[2] : entry.version,
        ),
        type: PackageType.NPM,
      };
    });
  }

  /**
   * Returns the version, or LATEST_VERSION if it is missing or not a
   * version (e.g. a git URL)
   */
  private static cleanVersion(version: string | undefined): string {
    return version && /^\d+\.\d+\.\d+/.test(version) ? version : LATEST_VERSION;
  }
}
