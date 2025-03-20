import {Package} from '../types';

/**
 * Interface defining the contract for package extractors
 */
export interface PackageExtractor {
  /** Map of file extensions to their corresponding file processors */
  fileProcessorMap: Record<string, new () => FileProcessor>;

  /**
   * Extracts package information from a file
   * @param packageFile The file to extract packages from
   * @returns Promise resolving to an array of extracted packages
   * @throws {FileProcessingError} If there's an error processing the file
   */
  extractFromFile(packageFile: File): Promise<Package[]>;
}

/**
 * Interface defining the contract for file processors
 */
export interface FileProcessor {
  /**
   * Parses packages from a file
   * @param packagesFile The file to parse
   * @returns Promise resolving to an array of parsed packages
   * @throws {FileProcessingError} If there's an error processing the file
   */
  parsePackages(packagesFile: File): Promise<Package[]>;
}
