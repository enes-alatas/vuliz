import {GradleLockfileProcessor} from 'src/packages/extractors/gradle/file_processors/gradle_lockfile_processor';
import {PackageType} from 'src/packages/types';

describe('GradleLockfileProcessor', () => {
  let processor: GradleLockfileProcessor;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    processor = new GradleLockfileProcessor();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  const parse = async (content: string) =>
    await processor['parseEntries'](await processor['parseRawData'](content));

  it('should parse locked dependencies and skip comments and empty=', async () => {
    const result = await parse(
      [
        '# This is a Gradle generated file for dependency locking.',
        '# Manual edits can break the build and are not advised.',
        '# This file is expected to be part of source control.',
        'com.google.guava:failureaccess:1.0.1=compileClasspath,runtimeClasspath',
        'com.google.guava:guava:31.1-jre=compileClasspath,runtimeClasspath',
        '',
        'empty=annotationProcessor',
      ].join('\r\n'),
    );
    expect(result).toEqual([
      {
        name: 'com.google.guava:failureaccess',
        version: '1.0.1',
        type: PackageType.MAVEN,
      },
      {
        name: 'com.google.guava:guava',
        version: '31.1-jre',
        type: PackageType.MAVEN,
      },
    ]);
  });

  it('should skip malformed entries', async () => {
    const result = await parse('not-a-coordinate=x\norg.example:a:1.0=x');
    expect(result).toEqual([
      {name: 'org.example:a', version: '1.0', type: PackageType.MAVEN},
    ]);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
