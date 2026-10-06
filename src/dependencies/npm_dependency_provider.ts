import {PackageType} from '../packages/types';
import {DepsDevDependencyProvider} from './deps_dev_dependency_provider';

/**
 * Implements dependency extraction for npm packages
 *
 * Uses the deps.dev API, which resolves version ranges and the dependency
 * graph the way npm does.
 */
export class NpmDependencyProvider extends DepsDevDependencyProvider {
  constructor() {
    super('npm', PackageType.NPM);
  }
}
