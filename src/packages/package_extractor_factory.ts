import {Package} from './types';
import {PackageExtractor} from './extractors/types';
import {PythonPackageExtractor} from './extractors/python/python_package_extractor';
import {UnsupportedFileTypeError} from './errors';

/**
 * Registry mapping file types to their extractor constructors.
 *
 * This may seem redundant since PackageExtractors have their own fileProcessorMap
 * with the same file names. However, TypeScript does not allow static properties
 * to be declared in interfaces, so this is used as a pragmatic solution for
 * extensibility.
 */
const extractorRegistry: Record<string, new () => PackageExtractor> = {
  requirements: PythonPackageExtractor,
  pipfile: PythonPackageExtractor,
  // Add more extractors here as needed:
  // package: JavaScriptPackageExtractor,
  // pom: JavaPackageExtractor,
};

/**
 * Factory class for creating package extractors based on file type
 */
class PackageExtractorFactory {
  /**
   * Gets the appropriate extractor for a given file
   * @param file The file to extract packages from
   * @returns An instance of the appropriate package extractor
   * @throws {UnsupportedFileTypeError} If the file type is not supported
   */
  static getExtractor(file: File): PackageExtractor {
    const fileName = file.name.toLowerCase();
    const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');

    // Use the registry to find a matching extractor
    const matchingKey = Object.keys(extractorRegistry).find(key =>
      fileNameWithoutExtension.includes(key),
    );

    if (matchingKey) {
      const ExtractorClass = extractorRegistry[matchingKey];
      return new ExtractorClass();
    } else {
      throw new UnsupportedFileTypeError(file.name);
    }
  }
}

/**
 * Extracts packages from a file
 * @param file The file to extract packages from
 * @returns Promise resolving to an array of extracted packages
 * @throws {UnsupportedFileTypeError} If the file type is not supported
 */
export async function extractPackages(file: File): Promise<Package[]> {
  const extractor = PackageExtractorFactory.getExtractor(file);
  return await extractor.extractFromFile(file);
}
