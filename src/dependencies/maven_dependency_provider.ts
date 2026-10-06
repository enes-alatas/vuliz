import {PackageType} from '../packages/types';
import {DepsDevDependencyProvider} from './deps_dev_dependency_provider';

/**
 * Implements dependency extraction for Maven packages
 *
 * Uses the deps.dev API, which resolves dependency graphs the way Maven
 * does (properties, parent POMs, BOMs, scopes). Maven Central itself does
 * not allow cross-origin requests, so it cannot be read from the browser.
 */
export class MavenDependencyProvider extends DepsDevDependencyProvider {
  constructor() {
    super('maven', PackageType.MAVEN);
  }
}
