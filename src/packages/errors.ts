/**
 * Error thrown when there's a failure processing a file
 */
export class FileProcessingError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'FileProcessingError';
  }
}
