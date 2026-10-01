import {MavenDependencyProvider} from 'src/dependencies/maven_dependency_provider';
import {Package, PackageType} from 'src/packages/types';

/**
 * Integration tests for MavenDependencyProvider
 *
 * These tests use the real deps.dev API.
 */
describe('MavenDependencyProvider Integration', () => {
  const provider = new MavenDependencyProvider();

  const targetsOf = async (pkg: Package) =>
    (await provider.extractDependencies(pkg)).map(
      d => `${d.to.name}@${d.to.version}`,
    );

  it('should extract the direct dependencies of a package', async () => {
    const targets = await targetsOf({
      name: 'com.google.guava:guava',
      version: '31.1-jre',
      type: PackageType.MAVEN,
    });

    expect(targets).toEqual(
      expect.arrayContaining([
        'com.google.guava:failureaccess@1.0.1',
        'com.google.code.findbugs:jsr305@3.0.2',
        'org.checkerframework:checker-qual@3.12.0',
      ]),
    );
  }, 30000);

  it('should resolve versions managed by a BOM', async () => {
    // jackson-databind gets these versions through jackson-bom
    const targets = await targetsOf({
      name: 'com.fasterxml.jackson.core:jackson-databind',
      version: '2.15.2',
      type: PackageType.MAVEN,
    });

    expect(targets).toEqual(
      expect.arrayContaining([
        'com.fasterxml.jackson.core:jackson-annotations@2.15.2',
        'com.fasterxml.jackson.core:jackson-core@2.15.2',
      ]),
    );
  }, 30000);

  it('should allow browsers to call the API from other origins', async () => {
    // Vuliz calls deps.dev from the browser, which needs CORS
    const response = await fetch(
      'https://api.deps.dev/v3/systems/maven/packages/com.google.guava%3Aguava/versions/31.1-jre:dependencies',
      {headers: {Origin: 'https://vuliz.alatas.dev'}},
    );

    expect(response.ok).toBe(true);
    expect(response.headers.get('access-control-allow-origin')).toMatch(
      /^(\*|https:\/\/vuliz\.alatas\.dev)$/,
    );
  }, 30000);
});
