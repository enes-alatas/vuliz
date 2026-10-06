import {PackageJsonFileProcessor} from 'src/packages/extractors/npm/file_processors/package_json_file_processor';
import {LATEST_VERSION, PackageType} from 'src/packages/types';

describe('PackageJsonFileProcessor', () => {
  let processor: PackageJsonFileProcessor;

  beforeEach(() => {
    processor = new PackageJsonFileProcessor();
  });

  const parse = async (content: string) =>
    await processor['parseEntries'](await processor['parseRawData'](content));

  const npm = (name: string, version: string) => ({
    name,
    version,
    type: PackageType.NPM,
  });

  it('should list dependencies, devDependencies and optionalDependencies', async () => {
    const result = await parse(
      JSON.stringify({
        name: 'my-app',
        version: '1.0.0',
        dependencies: {express: '^4.17.1', '@babel/core': '~7.22.5'},
        devDependencies: {jest: '29.7.0'},
        optionalDependencies: {fsevents: '>=2.3.2'},
        peerDependencies: {react: '^18.0.0'},
      }),
    );
    expect(result).toEqual([
      npm('express', '4.17.1'),
      npm('@babel/core', '7.22.5'),
      npm('jest', '29.7.0'),
      npm('fsevents', '2.3.2'),
    ]);
  });

  it('should resolve npm aliases to the real package', async () => {
    const result = await parse(
      JSON.stringify({
        dependencies: {
          'my-lodash': 'npm:lodash@^4.17.20',
          'scoped-alias': 'npm:@types/node@20.1.0',
        },
      }),
    );
    expect(result).toEqual([
      npm('lodash', '4.17.20'),
      npm('@types/node', '20.1.0'),
    ]);
  });

  it('should handle a package.json without dependencies', async () => {
    expect(await parse('{"name": "empty"}')).toEqual([]);
  });

  it('should fail on invalid JSON', async () => {
    await expect(parse('{not json')).rejects.toThrow();
  });

  describe('lowerBound()', () => {
    it.each([
      ['1.2.3', '1.2.3'],
      ['^1.2.3', '1.2.3'],
      ['~1.2.3', '1.2.3'],
      ['>=1.2.3 <2.0.0', '1.2.3'],
      ['>= 1.2.3', '1.2.3'],
      ['=1.2.3', '1.2.3'],
      ['v1.2.3', '1.2.3'],
      ['1.2', '1.2.0'],
      ['1', '1.0.0'],
      ['1.x', '1.0.0'],
      ['1.2.*', '1.2.0'],
      ['^2.0.0-beta.1', '2.0.0-beta.1'],
      ['1.0.0 - 2.0.0', '1.0.0'],
      ['^1.0.0 || ^2.0.0', '1.0.0'],
    ])('should return the lower bound of %s', (range, expected) => {
      expect(PackageJsonFileProcessor.lowerBound(range)).toBe(expected);
    });

    it.each([
      '',
      '*',
      'x',
      'latest',
      'next',
      '<2.0.0',
      '<=2.0.0',
      'file:../local',
      'link:../local',
      'workspace:*',
      'git+https://github.com/user/repo.git',
      'github:user/repo',
      'user/repo',
      'https://example.com/package.tgz',
    ])('should return the latest version for "%s"', range => {
      expect(PackageJsonFileProcessor.lowerBound(range)).toBe(LATEST_VERSION);
    });
  });
});
