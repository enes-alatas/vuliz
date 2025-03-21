import {Package} from '../types';
import {FileProcessingError} from '../errors';
import {FileProcessor} from './types';

/**
 * Abstract base class for file processors implementing common functionality
 */
export abstract class AbstractFileProcessor implements FileProcessor {
  /**
   * Template method for parsing packages from a file
   * @param packagesFile The file to parse
   * @returns Promise resolving to an array of parsed packages
   * @throws {FileProcessingError} If there's an error processing the file
   */
  async parsePackages(packagesFile: File): Promise<Package[]> {
    try {
      const fileContent = await this.readFile(packagesFile);
      const rawData = await this.parseRawData(fileContent);
      return await this.parseEntries(rawData);
    } catch (error) {
      throw new FileProcessingError(
        `Failed to process file ${packagesFile.name}`,
      );
    }
  }

  /**
   * Parses raw data from file content
   * @param fileContent The content of the file
   * @returns Promise resolving to parsed raw data
   */
  protected abstract parseRawData(fileContent: string): Promise<unknown>;

  /**
   * Parses package entries from raw data
   * @param rawData The parsed raw data
   * @returns Promise resolving to an array of packages
   */
  protected abstract parseEntries(rawData: unknown): Promise<Package[]>;

  /**
   * Reads the content of a file
   * @param file The file to read
   * @returns Promise resolving to the file content
   * @throws {FileProcessingError} If there's an error reading the file
   */
  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new FileProcessingError('File content is not text'));
        } else {
          resolve(result);
        }
      };
      reader.onerror = () => {
        reject(new FileProcessingError(`Failed to read file: ${file.name}`));
      };
      reader.readAsText(file);
    });
  }
}
