import {GradlePackageExtractor} from 'src/packages/extractors/gradle/gradle_package_extractor';
import {
  GradleBuildFileProcessor,
  GradleLockfileProcessor,
} from 'src/packages/extractors/gradle/file_processors';

describe('GradlePackageExtractor', () => {
  const extractor = new GradlePackageExtractor();
  const getFileProcessor = (fileName: string) =>
    extractor['getFileProcessor'](fileName);

  it.each(['build.gradle', 'build.gradle.kts', 'app.gradle', 'BUILD.GRADLE'])(
    'should use the build file processor for %s',
    fileName => {
      expect(getFileProcessor(fileName)).toBeInstanceOf(
        GradleBuildFileProcessor,
      );
    },
  );

  it.each(['gradle.lockfile', 'buildscript-gradle.lockfile'])(
    'should use the lockfile processor for %s',
    fileName => {
      expect(getFileProcessor(fileName)).toBeInstanceOf(
        GradleLockfileProcessor,
      );
    },
  );

  it('should throw for other files', () => {
    expect(() => getFileProcessor('gradle.properties')).toThrow(
      'Unknown Gradle "packages file" type: gradle.properties',
    );
  });

  it('should pass the file to the matching processor', async () => {
    const spy = jest
      .spyOn(GradleBuildFileProcessor.prototype, 'parsePackages')
      .mockResolvedValue([]);
    const file = {name: 'build.gradle'} as File;
    await extractor.extractFromFile(file);
    expect(spy).toHaveBeenCalledWith(file);
    spy.mockRestore();
  });
});
