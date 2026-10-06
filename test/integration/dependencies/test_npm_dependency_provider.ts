import {NpmDependencyProvider} from 'src/dependencies/npm_dependency_provider';
import {PackageType} from 'src/packages/types';

/**
 * Integration tests for NpmDependencyProvider
 *
 * These tests use the real deps.dev API.
 */
describe('NpmDependencyProvider Integration', () => {
  const provider = new NpmDependencyProvider();

  it('should extract the resolved direct dependencies of a package', async () => {
    const dependencies = await provider.extractDependencies({
      name: 'express',
      version: '4.18.2',
      type: PackageType.NPM,
    });
    const targets = dependencies.map(d => `${d.to.name}@${d.to.version}`);

    // express 4.18.2 pins these versions exactly
    expect(targets).toEqual(
      expect.arrayContaining(['body-parser@1.20.1', 'cookie@0.5.0']),
    );
    expect(dependencies.every(d => d.to.type === PackageType.NPM)).toBe(true);
  }, 30000);

  it('should handle scoped packages', async () => {
    const dependencies = await provider.extractDependencies({
      name: '@babel/core',
      version: '7.22.5',
      type: PackageType.NPM,
    });
    const names = dependencies.map(d => d.to.name);

    expect(names).toEqual(expect.arrayContaining(['@babel/parser', 'semver']));
  }, 30000);
});
