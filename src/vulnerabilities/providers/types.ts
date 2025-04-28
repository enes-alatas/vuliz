import {Package} from 'src/packages/types';
import {PackageType} from 'src/packages/types';

/**
 * Interface for vulnerability data providers
 */
export interface VulnerabilityProvider {
  packageType: PackageType;
  addVulnerabilities(packages: Package[]): Promise<Package[]>;
}
