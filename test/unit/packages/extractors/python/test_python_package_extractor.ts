jest.mock(
  'src/packages/extractors/python/file_processors/requirements_file_processor',
);
jest.mock('src/packages/extractors/python/file_processors/pip_file_processor');

import {PythonPackageExtractor} from 'src/packages/extractors/python/python_package_extractor';
import {RequirementsFileProcessor} from 'src/packages/extractors/python/file_processors/requirements_file_processor';
import {PipFileProcessor} from 'src/packages/extractors/python/file_processors/pip_file_processor';
import {Package} from 'src/packages/types';

describe('PythonPackageExtractor', () => {
  let extractor: PythonPackageExtractor;
  const mockPackages: Package[] = [
    {name: 'flask', version: '2.0.0'},
    {name: 'django', version: '3.2.1'},
  ];

  beforeEach(() => {
    // Setup mocks for file processors
    (RequirementsFileProcessor as unknown as jest.Mock).mockImplementation(
      () => ({
        parsePackages: jest.fn().mockReturnValue(mockPackages),
      }),
    );
    (PipFileProcessor as unknown as jest.Mock).mockImplementation(() => ({
      parsePackages: jest.fn().mockReturnValue(mockPackages),
    }));
    extractor = new PythonPackageExtractor();
    jest.clearAllMocks();
  });

  describe('Smoke', () => {
    it('should throw unknown file error for unknown files', async () => {
      const unknownFileName = 'unknown.txt';
      const mockUnknownFile = {name: unknownFileName} as File;
      await expect(extractor.extractFromFile(mockUnknownFile)).rejects.toThrow(
        `Unknown Python "packages file" type: ${unknownFileName}`,
      );
    });

    it('should use RequirementsFileProcessor', async () => {
      const mockFile = {name: 'requirements.txt'} as File;
      const result = await extractor.extractFromFile(mockFile);
      expect(RequirementsFileProcessor).toHaveBeenCalled();
      expect(result).toEqual(mockPackages);
    });

    it('should use PipFileProcessor', async () => {
      const mockFile = {name: 'Pipfile'} as File;
      const result = await extractor.extractFromFile(mockFile);
      expect(PipFileProcessor).toHaveBeenCalled();
      expect(result).toEqual(mockPackages);
    });
  });
});
