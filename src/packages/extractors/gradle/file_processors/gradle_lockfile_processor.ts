import {AbstractFileProcessor} from '../../file_processor';
import {Package, PackageType} from '../../../types';

/**
 * Processes Gradle dependency lock files (gradle.lockfile)
 *
 * Each entry has the form `group:artifact:version=configuration,...`
 * and pins the exact resolved version, including transitive dependencies.
 */
export class GradleLockfileProcessor extends AbstractFileProcessor {
  /**
   * Parses raw data from gradle.lockfile content
   * Filters out comments, empty lines and the `empty=` entry
   */
  protected async parseRawData(fileContent: string): Promise<string[]> {
    const parsedLines: string[] = [];
    for (const line of fileContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('empty=')) {
        continue;
      }
      parsedLines.push(trimmed);
    }
    return parsedLines;
  }

  /**
   * Extracts package entries from parsed gradle.lockfile lines
   */
  protected async parseEntries(rawData: unknown): Promise<Package[]> {
    const lines = rawData as string[];
    const packages: Package[] = [];
    for (const line of lines) {
      const coordinates = line.split('=')[0].split(':');
      if (coordinates.length < 3 || coordinates.some(part => !part)) {
        console.error(`Failed to parse lockfile entry "${line}"`);
        continue;
      }
      const [group, artifact, version] = coordinates;
      packages.push({
        name: `${group}:${artifact}`,
        version,
        type: PackageType.MAVEN,
      });
    }
    return packages;
  }
}
