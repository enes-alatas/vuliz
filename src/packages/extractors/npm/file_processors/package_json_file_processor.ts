import {AbstractFileProcessor} from '../../file_processor';
import {LATEST_VERSION, Package, PackageType} from '../../../types';

/** Sections of package.json that list dependencies */
const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
];

/** Matches a full or partial version, e.g. "1.2.3", "1.2", "1.x" */
const VERSION_PATTERN =
  /^(\d+)(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/**
 * Processes npm package.json files
 *
 * package.json lists version ranges rather than exact versions. As for
 * Python requirements, the lower bound of the range is used, e.g. "1.2.3"
 * for "^1.2.3". Use package-lock.json for the exact installed versions.
 */
export class PackageJsonFileProcessor extends AbstractFileProcessor {
  /**
   * Parses package.json content
   */
  protected async parseRawData(fileContent: string): Promise<unknown> {
    return JSON.parse(fileContent);
  }

  /**
   * Extracts the dependencies from the parsed package.json
   */
  protected async parseEntries(rawData: unknown): Promise<Package[]> {
    const data = rawData as Record<string, unknown>;
    const packages: Package[] = [];

    for (const section of DEPENDENCY_SECTIONS) {
      const dependencies = data[section];
      if (!dependencies || typeof dependencies !== 'object') continue;

      for (const [name, spec] of Object.entries(dependencies)) {
        packages.push(
          PackageJsonFileProcessor.parsePackageEntry(name, String(spec)),
        );
      }
    }
    return packages;
  }

  /**
   * Parses a dependency entry, resolving npm aliases
   * ("alias": "npm:real-name@^1.0.0") to the real package
   */
  static parsePackageEntry(name: string, spec: string): Package {
    const alias = spec.trim().match(/^npm:(@?[^@]+)(?:@(.*))?$/);
    if (alias) {
      return {
        name: alias[1],
        version: PackageJsonFileProcessor.lowerBound(alias[2] ?? ''),
        type: PackageType.NPM,
      };
    }
    return {
      name,
      version: PackageJsonFileProcessor.lowerBound(spec),
      type: PackageType.NPM,
    };
  }

  /**
   * Returns the lowest version allowed by a version range, or
   * LATEST_VERSION for tags, URLs, local paths and ranges without a
   * lower bound
   */
  static lowerBound(range: string): string {
    // Only the first of several alternative ranges ("a || b") is used
    const firstRange = range
      .split('||')[0]
      .trim()
      .replace(/([<>=~^]+)\s+/g, '$1');
    // Hyphen ranges ("1.0.0 - 2.0.0") start at their first version
    const firstComparator = firstRange.split(/\s+-\s+|\s+/)[0] ?? '';

    const operator = firstComparator.match(/^(?:[~^]|[<>]=?|=)?/)![0];
    if (operator.startsWith('<')) {
      return LATEST_VERSION;
    }
    const version = firstComparator.slice(operator.length).replace(/^v/, '');

    const match = version.match(VERSION_PATTERN);
    if (!match) {
      return LATEST_VERSION;
    }
    const [, major, minor, patch, prerelease] = match;
    const part = (value: string | undefined) =>
      value === undefined || /[xX*]/.test(value) ? '0' : value;
    return `${major}.${part(minor)}.${part(patch)}${prerelease ?? ''}`;
  }
}
