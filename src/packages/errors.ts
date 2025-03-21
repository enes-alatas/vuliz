/**
 * Error thrown when there's a failure processing a file
 */
export class FileProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileProcessingError';
  }
}
