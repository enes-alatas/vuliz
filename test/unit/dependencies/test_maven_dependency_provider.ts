import {MavenDependencyProvider} from 'src/dependencies/maven_dependency_provider';
import {LATEST_VERSION, Package, PackageType} from 'src/packages/types';

describe('MavenDependencyProvider', () => {
  let provider: MavenDependencyProvider;
  let fetchMock: jest.Mock;
  const originalFetch = global.fetch;

  const maven = (name: string, version: string): Package => ({
    name,
    version,
    type: PackageType.MAVEN,
  });

  const node = (
    name: string,
    version: string,
    relation: 'SELF' | 'DIRECT' | 'INDIRECT',
  ) => ({versionKey: {system: 'MAVEN', name, version}, relation});

  const jsonResponse = (body: unknown, ok = true) =>
    ({ok, status: ok ? 200 : 404, json: async () => body}) as Response;

  beforeEach(() => {
    provider = new MavenDependencyProvider();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should return the direct dependencies from deps.dev', async () => {
    const guava = maven('com.google.guava:guava', '31.1-jre');
    fetchMock.mockResolvedValue(
      jsonResponse({
        nodes: [
          node('com.google.guava:guava', '31.1-jre', 'SELF'),
          node('com.google.guava:failureaccess', '1.0.1', 'DIRECT'),
          node('com.google.code.findbugs:jsr305', '3.0.2', 'DIRECT'),
          node('org.example:transitive', '2.0', 'INDIRECT'),
        ],
        edges: [],
      }),
    );

    const dependencies = await provider.extractDependencies(guava);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deps.dev/v3/systems/maven/packages/com.google.guava%3Aguava/versions/31.1-jre:dependencies',
    );
    expect(dependencies).toEqual([
      {from: guava, to: maven('com.google.guava:failureaccess', '1.0.1')},
      {from: guava, to: maven('com.google.code.findbugs:jsr305', '3.0.2')},
    ]);
  });

  it('should return no dependencies without an exact version', async () => {
    const result = await provider.extractDependencies(
      maven('org.example:app', LATEST_VERSION),
    );
    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return no dependencies for unknown packages', async () => {
    fetchMock.mockResolvedValue(jsonResponse({error: 'not found'}, false));
    const result = await provider.extractDependencies(
      maven('org.example:missing', '1.0'),
    );
    expect(result).toEqual([]);
  });

  it('should return no dependencies when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const result = await provider.extractDependencies(
      maven('org.example:app', '1.0'),
    );
    expect(result).toEqual([]);
  });

  it('should return no dependencies for an invalid response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    } as unknown as Response);
    const result = await provider.extractDependencies(
      maven('org.example:app', '1.0'),
    );
    expect(result).toEqual([]);
  });

  it('should handle a graph without nodes', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    const result = await provider.extractDependencies(
      maven('org.example:app', '1.0'),
    );
    expect(result).toEqual([]);
  });
});
