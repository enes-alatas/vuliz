jest.mock('src/packages/extractors/python/file_processors', () => ({
  RequirementsFileProcessor: {
    parsePackageEntry: jest.fn(),
  },
}));

import {PythonDependencyProvider} from 'src/dependencies/python_dependency_provider';
import {Package, LATEST_VERSION} from 'src/packages/types';
import {RequirementsFileProcessor} from 'src/packages/extractors/python/file_processors';

// Mock global fetch
global.fetch = jest.fn();

describe('PythonDependencyProvider', () => {
  const mockPackage: Package = {name: 'test-package', version: '1.0.0'};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractDependencies', () => {
    it('should return dependencies built from required packages', async () => {
      const mockRequirements: Package[] = [
        {name: 'dep1', version: '2.0.0'},
        {name: 'dep2', version: '3.0.0'},
      ];

      const provider = new PythonDependencyProvider();
      (provider as any).fetchRequiredPackages = jest
        .fn()
        .mockResolvedValue(mockRequirements);
      const dependencies = await provider.extractDependencies(mockPackage);

      expect(dependencies).toEqual([
        {from: mockPackage, to: mockRequirements[0]},
        {from: mockPackage, to: mockRequirements[1]},
      ]);
      expect((provider as any).fetchRequiredPackages).toHaveBeenCalledWith(
        mockPackage,
      );
    });
  });

  describe('buildDependencies', () => {
    it('should map required packages to dependencies', () => {
      const provider = new PythonDependencyProvider();
      const requiredPackages: Package[] = [
        {name: 'dep1', version: '2.0.0'},
        {name: 'dep2', version: '3.0.0'},
      ];

      const dependencies = (provider as any).buildDependencies(
        mockPackage,
        requiredPackages,
      );

      expect(dependencies).toEqual([
        {from: mockPackage, to: requiredPackages[0]},
        {from: mockPackage, to: requiredPackages[1]},
      ]);
    });
  });

  describe('fetchRequiredPackages', () => {
    it('should fetch and parse package requirements', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          info: {
            requires_dist: ['dep1>=2.0.0', 'dep2'],
          },
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const mockParsedPackages = [
        {name: 'dep1', version: LATEST_VERSION},
        {name: 'dep2', version: LATEST_VERSION},
      ];

      (
        RequirementsFileProcessor.parsePackageEntry as jest.Mock
      ).mockImplementation((req: string) =>
        req.startsWith('dep1') ? mockParsedPackages[0] : mockParsedPackages[1],
      );

      const provider = new PythonDependencyProvider();
      const packages = await (provider as any).fetchRequiredPackages(
        mockPackage,
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://pypi.org/pypi/test-package/1.0.0/json',
      );
      expect(packages).toEqual(mockParsedPackages);
      expect(RequirementsFileProcessor.parsePackageEntry).toHaveBeenCalledTimes(
        2,
      );
    });

    it('should return empty array when package not found on PyPI', async () => {
      // Mock a 404 response
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const provider = new PythonDependencyProvider();
      const packages = await (provider as any).fetchRequiredPackages(
        mockPackage,
      );

      expect(warnSpy).toHaveBeenCalledWith(
        'Package not found on PyPI: test-package',
      );
      expect(packages).toEqual([]);
    });

    it('should return empty array when API call throws an error', async () => {
      // Mock a network error
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const provider = new PythonDependencyProvider();
      const packages = await (provider as any).fetchRequiredPackages(
        mockPackage,
      );

      expect(warnSpy).toHaveBeenCalledWith(
        'Error fetching package from PyPI: test-package. Error: Network error',
      );
      expect(packages).toEqual([]);
    });
  });

  describe('parseRequirements', () => {
    it('should parse each requirement into a Package', () => {
      const requirements = ['dep1>=2.0.0', 'dep2'];
      const mockParsed = [
        {name: 'dep1', version: LATEST_VERSION},
        {name: 'dep2', version: LATEST_VERSION},
      ];

      (
        RequirementsFileProcessor.parsePackageEntry as jest.Mock
      ).mockImplementation((req: string) =>
        req.startsWith('dep1') ? mockParsed[0] : mockParsed[1],
      );

      const provider = new PythonDependencyProvider();
      const packages = (provider as any).parseRequirements(requirements);

      expect(RequirementsFileProcessor.parsePackageEntry).toHaveBeenCalledTimes(
        2,
      );
      expect(packages).toEqual(mockParsed);
    });

    it('should skip invalid requirements and continue processing', () => {
      const requirements = ['valid-req', 'invalid-req'];

      (RequirementsFileProcessor.parsePackageEntry as jest.Mock)
        .mockImplementationOnce(() => ({name: 'valid', version: '1.0.0'}))
        .mockImplementationOnce(() => {
          throw new Error('Invalid format');
        });

      const provider = new PythonDependencyProvider();
      const packages = (provider as any).parseRequirements(requirements);

      expect(packages).toEqual([{name: 'valid', version: '1.0.0'}]);
      expect(RequirementsFileProcessor.parsePackageEntry).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  describe('getPackageVersionForAPI', () => {
    it('should return null for packages with LATEST_VERSION', () => {
      const pkg: Package = {name: 'test', version: LATEST_VERSION};
      const version = (PythonDependencyProvider as any).getPackageVersionForAPI(
        pkg,
      );

      expect(version).toBeNull();
    });

    it('should return the version for packages with specific version', () => {
      const pkg: Package = {name: 'test', version: '1.2.3'};
      const version = (PythonDependencyProvider as any).getPackageVersionForAPI(
        pkg,
      );

      expect(version).toBe('1.2.3');
    });
  });
});
