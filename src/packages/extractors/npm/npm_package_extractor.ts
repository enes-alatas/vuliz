import {FileProcessor, PackageExtractor} from '../types';
import {
  PackageJsonFileProcessor,
  PackageLockFileProcessor,
} from './file_processors';
import {Package} from '../../types';

/**
 * Extracts npm packages from package files using appropriate file processors.
 */
export class NpmPackageExtractor implements PackageExtractor {
  // Maps a keyword from the file name to a corresponding processor class.
  // Lock files are checked first, as their names also contain "package".
  fileProcessorMap: Record<string, {new (): FileProcessor}> = {
    'package-lock': PackageLockFileProcessor,
    shrinkwrap: PackageLockFileProcessor,
    package: PackageJsonFileProcessor,
  };

  /**
   * Extracts packages from the provided file.
   * @param packagesFile - The file containing package definitions.
   * @returns A promise resolving to an array of Package objects.
   */
  async extractFromFile(packagesFile: File): Promise<Package[]> {
    const fileProcessor = this.getFileProcessor(packagesFile.name);
    return await fileProcessor.parsePackages(packagesFile);
  }

  /**
   * Determines the appropriate file processor based on the file name.
   * @param fileName - The name of the file.
   * @returns An instance of a FileProcessor.
   * @throws Error if no matching file processor is found.
   */
  private getFileProcessor(fileName: string): FileProcessor {
    for (const fileType in this.fileProcessorMap) {
      if (fileName.toLowerCase().includes(fileType)) {
        return new this.fileProcessorMap[fileType]();
      }
    }
    throw new Error(`Unknown npm "packages file" type: ${fileName}`);
  }
}
