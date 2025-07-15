import {extractPackages} from 'src/packages/package_extractor_factory';
import {PythonPackageExtractor} from 'src/packages/extractors/python/python_package_extractor';
import {PythonDependencyProvider} from 'src/dependencies/python_dependency_provider';
import {Package} from 'src/packages/types';
import {Dependency} from 'src/dependencies/types';
import {UnsupportedFileTypeError} from 'src/packages/errors';

// Mock the extractors and dependency providers
jest.mock('src/packages/extractors/python/python_package_extractor');
jest.mock('src/dependencies/python_dependency_provider');

describe('PackageExtractorFactory', () => {
  const mockPackages: Package[] = [
    {name: 'flask', version: '2.0.0'},
    {name: 'django', version: '3.2.1'},
  ];

  const mockDependencies: Dependency[] = [
    {from: mockPackages[0], to: {name: 'werkzeug', version: '2.0.0'}},
    {from: mockPackages[1], to: {name: 'sqlparse', version: '0.4.1'}},
  ];

  const MockedPythonPackageExtractor = jest.mocked(PythonPackageExtractor);
  const MockedPythonDependencyProvider = jest.mocked(PythonDependencyProvider);

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock for PythonPackageExtractor
    MockedPythonPackageExtractor.mockImplementation(
      () =>
        ({
          fileProcessorMap: {
            requirements: jest.fn(),
            pipfile: jest.fn(),
          },
          extractFromFile: jest.fn().mockResolvedValue(mockPackages),
        }) as any,
    );

    // Setup mock for PythonDependencyProvider
    MockedPythonDependencyProvider.mockImplementation(
      () =>
        ({
          extractDependencies: jest.fn().mockResolvedValue(mockDependencies),
        }) as any,
    );
  });

  describe('extractPackages', () => {
    describe('file type detection', () => {
      it('should extract packages from requirements.txt files', async () => {
        const mockFile = {name: 'requirements.txt'} as File;
        const result = await extractPackages(mockFile);

        expect(PythonPackageExtractor).toHaveBeenCalled();
        expect(result).toEqual(mockPackages);
      });

      it('should extract packages from Pipfile files', async () => {
        const mockFile = {name: 'Pipfile'} as File;
        const result = await extractPackages(mockFile);

        expect(PythonPackageExtractor).toHaveBeenCalled();
        expect(result).toEqual(mockPackages);
      });

      it('should extract packages from requirements.txt with different casing', async () => {
        const mockFile = {name: 'REQUIREMENTS.TXT'} as File;
        const result = await extractPackages(mockFile);

        expect(PythonPackageExtractor).toHaveBeenCalled();
        expect(result).toEqual(mockPackages);
      });

      it('should extract packages from files with requirements in the name', async () => {
        const mockFile = {name: 'my-requirements.txt'} as File;
        const result = await extractPackages(mockFile);

        expect(PythonPackageExtractor).toHaveBeenCalled();
        expect(result).toEqual(mockPackages);
      });

      it('should extract packages from files with pipfile in the name', async () => {
        const mockFile = {name: 'project-pipfile'} as File;
        const result = await extractPackages(mockFile);

        expect(PythonPackageExtractor).toHaveBeenCalled();
        expect(result).toEqual(mockPackages);
      });
    });

    describe('error handling', () => {
      it('should throw UnsupportedFileTypeError for unsupported file types', async () => {
        const mockFile = {name: 'package.json'} as File;

        await expect(extractPackages(mockFile)).rejects.toThrow(
          UnsupportedFileTypeError,
        );
        await expect(extractPackages(mockFile)).rejects.toThrow(
          'Unsupported file type: package.json',
        );
      });

      it('should throw UnsupportedFileTypeError for files with no extension', async () => {
        const mockFile = {name: 'unknown'} as File;

        await expect(extractPackages(mockFile)).rejects.toThrow(
          UnsupportedFileTypeError,
        );
        await expect(extractPackages(mockFile)).rejects.toThrow(
          'Unsupported file type: unknown',
        );
      });

      it('should throw UnsupportedFileTypeError for empty filename', async () => {
        const mockFile = {name: ''} as File;

        await expect(extractPackages(mockFile)).rejects.toThrow(
          UnsupportedFileTypeError,
        );
        await expect(extractPackages(mockFile)).rejects.toThrow(
          'Unsupported file type: ',
        );
      });
    });

    describe('extractor instantiation', () => {
      it('should create a new extractor instance for each call', async () => {
        const mockFile1 = {name: 'requirements.txt'} as File;
        const mockFile2 = {name: 'Pipfile'} as File;

        await extractPackages(mockFile1);
        await extractPackages(mockFile2);

        expect(PythonPackageExtractor).toHaveBeenCalledTimes(2);
      });

      it('should pass the file to the extractor', async () => {
        const mockFile = {name: 'requirements.txt'} as File;
        const mockExtractor = {
          extractFromFile: jest.fn().mockResolvedValue(mockPackages),
        };

        MockedPythonPackageExtractor.mockImplementation(
          () => mockExtractor as any,
        );

        await extractPackages(mockFile);

        expect(mockExtractor.extractFromFile).toHaveBeenCalledWith(mockFile);
      });
    });
  });

  describe('registry pattern', () => {
    it('should use the registry to determine file types', async () => {
      const mockFile = {name: 'requirements.txt'} as File;

      await extractPackages(mockFile);

      // Verify that the registry pattern is working by checking
      // that the correct extractor is instantiated
      expect(PythonPackageExtractor).toHaveBeenCalled();
    });

    it('should support multiple file types for the same extractor', async () => {
      const requirementsFile = {name: 'requirements.txt'} as File;
      const pipfileFile = {name: 'Pipfile'} as File;

      await extractPackages(requirementsFile);
      await extractPackages(pipfileFile);

      // Both should use the same extractor type
      expect(PythonPackageExtractor).toHaveBeenCalledTimes(2);
    });
  });
});
