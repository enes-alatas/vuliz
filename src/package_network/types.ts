import {Dependency} from '../dependencies/types';
import {Package} from '../packages/types';

export interface PackageNetworkLevel {
  packages: Package[];
  dependencies: Dependency[];
}

export interface PackageNetwork {
  levels: PackageNetworkLevel[];
}
