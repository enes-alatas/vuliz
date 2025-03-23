import {RequirementsFileProcessor} from 'src/packages/extractors/python/file_processors/requirements_file_processor';

describe('RequirementsFileProcessor', () => {
  let processor: RequirementsFileProcessor;

  beforeEach(() => {
    processor = new RequirementsFileProcessor();
  });

  // Helper to access protected/private methods for testing
  const parseRawData = async (content: string) =>
    await processor['parseRawData'](content);
  const parseEntries = async (rawData: string[]) =>
    await processor['parseEntries'](rawData);
  const parsePackageEntry = (line: string) =>
    RequirementsFileProcessor.parsePackageEntry(line);

  describe('parseRawData()', () => {
    it('should skip empty lines and comments', async () => {
      const content = `
        # This is a comment

        flask
        django==3.2
          numpy>=1.19.0
      `;
      const result = await parseRawData(content);
      expect(result).toEqual(['flask', 'django==3.2', 'numpy>=1.19.0']);
    });

    it('should handle empty input', async () => {
      const result = await parseRawData('');
      expect(result).toEqual([]);
    });

    it('should trim whitespace from lines', async () => {
      const result = await parseRawData('  requests==2.25.1  \n\tpandas\t');
      expect(result).toEqual(['requests==2.25.1', 'pandas']);
    });
  });

  describe('parseEntries()', () => {
    it('should convert valid lines to Package array', async () => {
      const rawData = [
        'flask',
        'django==3.2',
        'numpy>=1.19.0',
        'requests[security]==2.25.1',
      ];
      const result = await parseEntries(rawData);
      expect(result).toEqual([
        {name: 'flask', version: '*'},
        {name: 'django', version: '3.2'},
        {name: 'numpy', version: '1.19.0'},
        {name: 'requests', version: '2.25.1'},
      ]);
    });

    it('should parse packages from lines with inline comments', async () => {
      const rawData = [
        'flask # inline comment ==123',
        'django==3.2 # inline comment',
        'numpy>=1.19.0 # inline comment 2',
        'requests[security]==2.25.1 # inline comment>2123',
      ];
      const result = await parseEntries(rawData);
      expect(result).toEqual([
        {name: 'flask', version: '*'},
        {name: 'django', version: '3.2'},
        {name: 'numpy', version: '1.19.0'},
        {name: 'requests', version: '2.25.1'},
      ]);
    });

    it('should return empty array for empty input', async () => {
      const result = await parseEntries([]);
      expect(result).toEqual([]);
    });
  });

  // --- Tests for `parsePackageEntry()` ---
  describe('parsePackageEntry()', () => {
    it('should handle basic package entries', () => {
      expect(parsePackageEntry('flask')).toEqual({
        name: 'flask',
        version: '*',
      });

      expect(parsePackageEntry('Django==3.2')).toEqual({
        name: 'django',
        version: '3.2',
      });
    });

    it('should strip version specifiers (==, >=, ~=, etc.)', () => {
      expect(parsePackageEntry('numpy>=1.19.0')).toEqual({
        name: 'numpy',
        version: '1.19.0',
      });

      expect(parsePackageEntry('requests~=2.25.0')).toEqual({
        name: 'requests',
        version: '2.25.0',
      });

      expect(parsePackageEntry('package!=1.0.0')).toEqual({
        name: 'package',
        version: '1.0.0',
      });
    });

    it('should handle package names with extras (e.g., "package[extra]")', () => {
      // Extras are ignored by the regex's first capture group
      // TODO: support for extracting "extra" packages
      expect(parsePackageEntry('requests[security]==2.25.1')).toEqual({
        name: 'requests',
        version: '2.25.1',
      });
    });

    it('should lowercase package names', () => {
      expect(parsePackageEntry('PyYAML==5.4.1')).toEqual({
        name: 'pyyaml',
        version: '5.4.1',
      });
    });

    it('should default version to "*" if not specified', () => {
      expect(parsePackageEntry('pandas')).toEqual({
        name: 'pandas',
        version: '*',
      });
    });

    it('should handle malformed entries gracefully', () => {
      // Edge case: Version specifier with no version number
      expect(parsePackageEntry('package==')).toEqual({
        name: 'package',
        version: '*',
      });
    });
  });
});
