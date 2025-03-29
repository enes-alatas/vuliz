import {AbstractFileProcessor} from '../../file_processor';
import {LATEST_VERSION, Package} from '../../../types';

/**
 * Processes Python requirements.txt package files
 */
export class RequirementsFileProcessor extends AbstractFileProcessor {
  /**
   * Parses raw data from requirements.txt content
   * Filters out comments and empty lines
   */
  protected async parseRawData(fileContent: string): Promise<string[]> {
    const parsedLines: string[] = [];
    const rawLines = fileContent.split(/\r?\n/);
    for (const line of rawLines) {
      const trimmed = line.trim();
      // Skip empty lines and comments (lines starting with "#")
      if (!trimmed || trimmed.startsWith('#')) continue;
      parsedLines.push(trimmed);
    }
    return parsedLines;
  }

  /**
   * Extracts package entries from parsed requirements.txt lines
   */
  protected async parseEntries(rawData: unknown): Promise<Package[]> {
    const lines = rawData as string[];
    const packages: Package[] = [];
    for (const rawLine of lines) {
      try {
        const packageEntry =
          RequirementsFileProcessor.parsePackageEntry(rawLine);
        packages.push(packageEntry);
      } catch (error) {
        console.error(`Failed to parse entry "${rawLine}": ${error}`);
        // Skip invalid entries to continue processing the rest
      }
    }
    return packages;
  }

  /**
   * Parses a single line from requirements.txt into a Package object
   * Handles various version specifier formats (==, >=, <=, etc.)
   *
   * @param rawEntry A line from requirements.txt (e.g., "django==3.2.10")
   * @returns A Package object with name and version
   * @throws Error if the entry cannot be parsed
   */
  static parsePackageEntry(rawEntry: string): Package {
    // Handle version specifiers in requirements.txt format
    // Matches package names and version specifiers like:
    // - package==1.0.0
    // - package>=1.0.0
    // - package[extra]==1.0.0
    const versionPattern =
      /^([a-zA-Z0-9_.-]+)(?:\[[^\]]+\])? *((?:==|!=|>=?|<=?|~=|\^)[^;#\s]*)?/;
    const match = rawEntry.match(versionPattern);

    if (!match || !match[1]) {
      throw new Error(`Invalid package format: ${rawEntry}`);
    }

    return {
      name: RequirementsFileProcessor.cleanPackageName(match[1]),
      version: RequirementsFileProcessor.cleanVersion(match[2] || ''),
    };
  }

  /**
   * Normalizes the package name from requirements.txt by converting
   * it to lowercase.
   *
   * @param nameEntry A name entry from requirements.txt (e.g., "Django")
   * @returns The normalized package name in lowercase
   */
  private static cleanPackageName(nameEntry: string): string {
    return nameEntry.toLowerCase();
  }

  /**
   * Extracts and cleans the version from a requirements.txt entry.
   *
   * @param versionEntry The version entry from requirements.txt (e.g., "==3.2.10")
   * @returns The cleaned version string
   */
  private static cleanVersion(versionEntry: string): string {
    return (
      versionEntry.replace(/^(===|~=|==|!=|>=|<=|>|<|=)/, '') || LATEST_VERSION
    );
  }
}
