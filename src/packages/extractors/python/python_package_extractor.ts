import {FileProcessor, PackageExtractor} from '../types';
import {PipFileProcessor} from './file_processors/pip_file_processor';
import {RequirementsFileProcessor} from './file_processors/requirements_file_processor';
import {Package} from '../../types';

/**
 * Extracts Python packages from package files using appropriate file processors.
 */
export class PythonPackageExtractor implements PackageExtractor {
  // Maps a keyword from the file name to a corresponding processor class.
  fileProcessorMap: Record<string, {new (): FileProcessor}> = {
    requirements: RequirementsFileProcessor,
    pipfile: PipFileProcessor,
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
    throw new Error(`Unknown Python "packages file" type: ${fileName}`);
  }
}
