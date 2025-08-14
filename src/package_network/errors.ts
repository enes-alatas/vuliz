/**
 * Error thrown when a package network creation fails
 */
export class PackageNetworkCreationError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'PackageNetworkCreationError';
  }
}
