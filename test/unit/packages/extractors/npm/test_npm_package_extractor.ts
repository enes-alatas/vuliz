import {NpmPackageExtractor} from 'src/packages/extractors/npm/npm_package_extractor';
import {
  PackageJsonFileProcessor,
  PackageLockFileProcessor,
} from 'src/packages/extractors/npm/file_processors';

describe('NpmPackageExtractor', () => {
  const extractor = new NpmPackageExtractor();
  const getFileProcessor = (fileName: string) =>
    extractor['getFileProcessor'](fileName);

  it.each(['package.json', 'frontend-package.json', 'PACKAGE.JSON'])(
    'should use the package.json processor for %s',
    fileName => {
      expect(getFileProcessor(fileName)).toBeInstanceOf(
        PackageJsonFileProcessor,
      );
    },
  );

  it.each(['package-lock.json', 'npm-shrinkwrap.json'])(
    'should use the lock file processor for %s',
    fileName => {
      expect(getFileProcessor(fileName)).toBeInstanceOf(
        PackageLockFileProcessor,
      );
    },
  );

  it('should throw for other files', () => {
    expect(() => getFileProcessor('yarn.lock')).toThrow(
      'Unknown npm "packages file" type: yarn.lock',
    );
  });

  it('should pass the file to the matching processor', async () => {
    const spy = jest
      .spyOn(PackageLockFileProcessor.prototype, 'parsePackages')
      .mockResolvedValue([]);
    const file = {name: 'package-lock.json'} as File;
    await extractor.extractFromFile(file);
    expect(spy).toHaveBeenCalledWith(file);
    spy.mockRestore();
  });
});
