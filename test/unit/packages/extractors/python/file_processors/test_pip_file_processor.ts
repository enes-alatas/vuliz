import {PipFileProcessor} from 'src/packages/extractors/python/file_processors/pip_file_processor';
import {PackageType} from 'src/packages/types';
import {parseToml} from 'src/utils/file_parsers';
import {JsonMap} from '@iarna/toml';

// Mock the TOML parser and file processor dependencies
jest.mock('src/utils/file_parsers', () => ({
  parseToml: jest.fn().mockImplementation(() => ({})),
}));

describe('PipFileProcessor', () => {
  let processor: PipFileProcessor;
  const mockParseToml = parseToml as jest.MockedFunction<typeof parseToml>;

  beforeEach(() => {
    processor = new PipFileProcessor();
    jest.clearAllMocks();
  });

  // Test helpers for accessing protected methods
  const parseRawData = async (content: string) =>
    await (processor as any).parseRawData(content);
  const parseEntries = async (rawData: JsonMap) =>
    await (processor as any).parseEntries(rawData);
  const parsePackageEntry = (name: string, version: string) =>
    (processor as any).parsePackageEntry(name, version);

  describe('parseRawData()', () => {
    it('should parse valid TOML content', async () => {
      const mockToml = {packages: {flask: '==2.0.0'}} as JsonMap;
      mockParseToml.mockReturnValue(mockToml);

      const result = await parseRawData('valid toml content');
      expect(parseToml).toHaveBeenCalledWith('valid toml content');
      expect(result).toEqual(mockToml);
    });

    it('should throw error for invalid TOML', async () => {
      mockParseToml.mockImplementation(() => {
        throw new Error('Invalid TOML');
      });

      await expect(parseRawData('invalid content')).rejects.toThrow(
        'Invalid TOML',
      );
    });
  });

  describe('parseEntries()', () => {
    it('should process packages from both sections', async () => {
      const mockData = {
        packages: {
          flask: '==2.0.0',
          'django[security]': '3.2.1',
        },
        'dev-packages': {
          pytest: '*',
          'mypy@https://my.package/mypy-0.991.tar.gz': '0.991',
        },
      } as JsonMap;

      const result = await parseEntries(mockData);
      expect(result).toEqual([
        {name: 'flask', version: '2.0.0', type: PackageType.PYPI},
        {name: 'django', version: '3.2.1', type: PackageType.PYPI},
        {name: 'pytest', version: '*', type: PackageType.PYPI},
        {name: 'mypy', version: '0.991', type: PackageType.PYPI},
      ]);
    });

    it('should handle missing sections', async () => {
      const mockData = {other_section: {foo: 'bar'}};
      const result = await parseEntries(mockData);
      expect(result).toEqual([]);
    });

    it('should handle empty sections', async () => {
      const mockData = {packages: {}, 'dev-packages': []};
      const result = await parseEntries(mockData);
      expect(result).toEqual([]);
    });
  });

  describe('parsePackageEntry()', () => {
    it('should handle standard package entries', () => {
      expect(parsePackageEntry('flask', '==2.0.0')).toEqual({
        name: 'flask',
        version: '2.0.0',
        type: PackageType.PYPI,
      });
    });

    it('should handle packages with extras', () => {
      expect(parsePackageEntry('django[security]', '3.2.1')).toEqual({
        name: 'django',
        version: '3.2.1',
        type: PackageType.PYPI,
      });
    });

    it('should handle URL-based packages', () => {
      expect(
        parsePackageEntry('mypy@https://my.package/mypy-0.991.tar.gz', '0.991'),
      ).toEqual({
        name: 'mypy',
        version: '0.991',
        type: PackageType.PYPI,
      });
    });

    it('should lowercase package names', () => {
      expect(parsePackageEntry('PyYAML', '6.0')).toEqual({
        name: 'pyyaml',
        version: '6.0',
        type: PackageType.PYPI,
      });
    });

    it('should handle complex version specifiers', () => {
      expect(parsePackageEntry('package', '~=1.2.3')).toEqual({
        name: 'package',
        version: '1.2.3',
        type: PackageType.PYPI,
      });
    });

    it('should default to wildcard version', () => {
      expect(parsePackageEntry('pandas', '')).toEqual({
        name: 'pandas',
        version: '*',
        type: PackageType.PYPI,
      });
    });
  });
});
