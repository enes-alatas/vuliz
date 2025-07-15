/**
 * Error thrown when there's a failure processing a file
 */
export class FileProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileProcessingError';
  }
}

/**
 * Error thrown when an unsupported file type is encountered
 */
export class UnsupportedFileTypeError extends Error {
  constructor(fileName: string) {
    super(`Unsupported file type: ${fileName}`);
    this.name = 'UnsupportedFileTypeError';
  }
}
