import {JsonMap} from '@iarna/toml';
import {parseToml} from 'src/utils/file_parsers';
import {AbstractFileProcessor} from '../../file_processor';
import {Package, LATEST_VERSION, PackageType} from '../../../types';

/**
 * Processes Python Pipfiles
 */
export class PipFileProcessor extends AbstractFileProcessor {
  /**
   * Parses raw data from Pipfile content
   */
  protected async parseRawData(fileContent: string): Promise<JsonMap> {
    return parseToml(fileContent);
  }

  /**
   * Extracts package entries from parsed Pipfile data
   */
  protected async parseEntries(rawData: unknown): Promise<Package[]> {
    const data = rawData as JsonMap;
    const packageSections = ['packages', 'dev-packages'];
    const packages: Package[] = [];

    for (const section of packageSections) {
      const rawPackages = data[section] as Record<string, unknown>;
      if (!rawPackages) continue;

      for (const [rawName, rawVersion] of Object.entries(rawPackages)) {
        const pkg = this.parsePackageEntry(rawName, rawVersion);
        packages.push(pkg);
      }
    }
    return packages;
  }

  /**
   * Parses an individual package entry
   */
  private parsePackageEntry(rawName: string, rawVersion: unknown): Package {
    const name = PipFileProcessor.cleanPackageName(rawName);
    try {
      const version = this.extractVersion(rawVersion);
      return {name, version, type: PackageType.PYPI};
    } catch (error) {
      console.error(`Error parsing package entry for ${rawName}: ${error}`);
      return {name, version: LATEST_VERSION, type: PackageType.PYPI};
    }
  }

  /**
   * Extracts the version from raw version data
   */
  private extractVersion(rawVersion: unknown): string {
    if (
      typeof rawVersion === 'object' &&
      rawVersion !== null &&
      'version' in rawVersion
    ) {
      const versionObj = rawVersion as {version: string};
      return PipFileProcessor.cleanVersion(versionObj.version);
    } else if (typeof rawVersion === 'string') {
      return PipFileProcessor.cleanVersion(rawVersion);
    } else {
      throw new Error('Unexpected version format in Pipfile');
    }
  }

  /**
   * Identifies if a package is a direct Git reference
   */
  private static isGitPackageRef(packageName: string): boolean {
    return packageName.startsWith('git+') || packageName.startsWith('https://');
  }

  /**
   * Cleans a package name by removing version constraints, extras, etc.
   */
  private static cleanPackageName(packageName: string): string {
    if (PipFileProcessor.isGitPackageRef(packageName)) {
      return 'Unknown Git Package';
    }
    return packageName
      .toLowerCase()
      .split(';')[0] // Remove environment markers
      .split('@')[0] // Remove version constraints
      .split('[')[0] // Remove extras
      .trim();
  }

  /**
   * Extracts the actual version number from a version string
   */
  private static cleanVersion(versionString: string): string {
    const match = versionString.match(/(\d+(\.\d+)?(\.\d+)?[a-zA-Z0-9]*)/);
    return match ? match[0] : LATEST_VERSION;
  }
}
