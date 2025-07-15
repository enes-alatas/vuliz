import {PackageType} from 'src/packages/types';

export class DependencyProviderNotFoundError extends Error {
  constructor(packageType: PackageType) {
    super(`No dependency provider registered for package type: ${packageType}`);
    this.name = 'DependencyProviderNotFoundError';
  }
}

export class PackageTypeUnknownError extends Error {
  constructor(packageName?: string) {
    super(
      `Package type unknown for package: ${packageName ?? '[unnamed package]'}`,
    );
    this.name = 'PackageTypeUnknownError';
  }
}
