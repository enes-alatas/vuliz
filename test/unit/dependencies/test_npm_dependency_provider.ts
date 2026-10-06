import {NpmDependencyProvider} from 'src/dependencies/npm_dependency_provider';
import {Package, PackageType} from 'src/packages/types';

describe('NpmDependencyProvider', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should query the npm system and return npm packages', async () => {
    const pkg: Package = {
      name: '@babel/core',
      version: '7.22.5',
      type: PackageType.NPM,
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        nodes: [
          {
            versionKey: {name: '@babel/core', version: '7.22.5'},
            relation: 'SELF',
          },
          {versionKey: {name: 'debug', version: '4.3.4'}, relation: 'DIRECT'},
        ],
      }),
    } as Response);

    const dependencies = await new NpmDependencyProvider().extractDependencies(
      pkg,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deps.dev/v3/systems/npm/packages/%40babel%2Fcore/versions/7.22.5:dependencies',
    );
    expect(dependencies).toEqual([
      {from: pkg, to: {name: 'debug', version: '4.3.4', type: PackageType.NPM}},
    ]);
  });
});
