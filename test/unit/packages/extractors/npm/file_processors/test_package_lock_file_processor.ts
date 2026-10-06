import {PackageLockFileProcessor} from 'src/packages/extractors/npm/file_processors/package_lock_file_processor';
import {LATEST_VERSION, PackageType} from 'src/packages/types';

describe('PackageLockFileProcessor', () => {
  let processor: PackageLockFileProcessor;

  beforeEach(() => {
    processor = new PackageLockFileProcessor();
  });

  const parse = async (lock: unknown) =>
    await processor['parseEntries'](
      await processor['parseRawData'](JSON.stringify(lock)),
    );

  const npm = (name: string, version: string) => ({
    name,
    version,
    type: PackageType.NPM,
  });

  it('should list direct dependencies with installed versions (v2/v3)', async () => {
    const result = await parse({
      name: 'my-app',
      lockfileVersion: 3,
      packages: {
        '': {
          name: 'my-app',
          dependencies: {express: '^4.17.1', 'my-lodash': 'npm:lodash@^4'},
          devDependencies: {'@types/node': '^20.0.0'},
          optionalDependencies: {fsevents: '^2.3.2'},
        },
        'node_modules/express': {version: '4.18.2'},
        'node_modules/body-parser': {version: '1.20.1'},
        'node_modules/my-lodash': {name: 'lodash', version: '4.17.21'},
        'node_modules/@types/node': {version: '20.8.10', dev: true},
        'node_modules/express/node_modules/debug': {version: '2.6.9'},
      },
    });
    expect(result).toEqual([
      npm('express', '4.18.2'),
      npm('lodash', '4.17.21'),
      npm('@types/node', '20.8.10'),
      // Not installed, e.g. an optional dependency for another platform
      npm('fsevents', LATEST_VERSION),
    ]);
  });

  it('should skip linked workspace packages', async () => {
    const result = await parse({
      lockfileVersion: 3,
      packages: {
        '': {dependencies: {'local-lib': '*', chalk: '^5.0.0'}},
        'node_modules/local-lib': {resolved: 'packages/local-lib', link: true},
        'node_modules/chalk': {version: '5.3.0'},
      },
    });
    expect(result).toEqual([npm('chalk', '5.3.0')]);
  });

  it('should list top-level packages of version 1 lock files', async () => {
    const result = await parse({
      lockfileVersion: 1,
      dependencies: {
        express: {version: '4.17.1'},
        'my-lodash': {version: 'npm:lodash@4.17.21'},
        'from-git': {version: 'git+https://github.com/user/repo.git#abc123'},
      },
    });
    expect(result).toEqual([
      npm('express', '4.17.1'),
      npm('lodash', '4.17.21'),
      npm('from-git', LATEST_VERSION),
    ]);
  });

  it('should handle an empty lock file', async () => {
    expect(await parse({lockfileVersion: 3})).toEqual([]);
  });
});
