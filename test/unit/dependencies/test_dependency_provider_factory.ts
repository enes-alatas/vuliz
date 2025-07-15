import {
  extractDependencies,
  DependencyProviderFactory,
} from 'src/dependencies/dependency_provider_factory';
import {PythonDependencyProvider} from 'src/dependencies/python_dependency_provider';
import {Package} from 'src/packages/types';
import {Dependency} from 'src/dependencies/types';
import {
  DependencyProviderNotFoundError,
  PackageTypeUnknownError,
} from 'src/dependencies/errors';

jest.mock('src/dependencies/python_dependency_provider');

describe('extractDependencies (DependencyProviderFactory)', () => {
  const mockPackages: Package[] = [
    {name: 'flask', version: '2.0.0', type: 'pypi' as any},
    {name: 'django', version: '3.2.1', type: 'pypi' as any},
  ];

  const mockDependencies = new Set<Dependency>([
    {from: mockPackages[0], to: {name: 'werkzeug', version: '2.0.0'}},
    {from: mockPackages[1], to: {name: 'sqlparse', version: '0.4.1'}},
  ]);

  const MockedPythonDependencyProvider = jest.mocked(PythonDependencyProvider);

  beforeEach(() => {
    jest.clearAllMocks();
    MockedPythonDependencyProvider.mockImplementation(
      () =>
        ({
          extractDependencies: jest.fn().mockResolvedValue(mockDependencies),
        }) as any,
    );
  });

  it('should extract dependencies from a list of packages', async () => {
    const result = await extractDependencies(mockPackages);
    expect(PythonDependencyProvider).toHaveBeenCalled();
    expect(result).toEqual(mockDependencies);
  });

  it('should call extractDependencies for each package', async () => {
    const mockProvider = {
      extractDependencies: jest.fn().mockResolvedValue(mockDependencies),
    };
    MockedPythonDependencyProvider.mockImplementation(
      () => mockProvider as any,
    );

    await extractDependencies(mockPackages);

    expect(mockProvider.extractDependencies).toHaveBeenCalledTimes(
      mockPackages.length,
    );
    expect(mockProvider.extractDependencies).toHaveBeenCalledWith(
      mockPackages[0],
    );
    expect(mockProvider.extractDependencies).toHaveBeenCalledWith(
      mockPackages[1],
    );
  });

  it('should combine dependencies from all packages', async () => {
    const depsArray = Array.from(mockDependencies);
    const mockProvider = {
      extractDependencies: jest
        .fn()
        .mockResolvedValueOnce([depsArray[0]])
        .mockResolvedValueOnce([depsArray[1]]),
    };
    MockedPythonDependencyProvider.mockImplementation(
      () => mockProvider as any,
    );

    const result = await extractDependencies(mockPackages);

    expect(result).toEqual(mockDependencies);
  });

  it('should handle empty package list', async () => {
    const result = await extractDependencies([]);
    expect(PythonDependencyProvider).toHaveBeenCalledTimes(0);
    expect(result.size).toBe(0);
  });

  it('should handle single package', async () => {
    const singlePackage = [mockPackages[0]];
    const result = await extractDependencies(singlePackage);
    expect(PythonDependencyProvider).toHaveBeenCalled();
    expect(result).toEqual(mockDependencies);
  });

  it('should throw DependencyProviderNotFoundError for unknown package type', () => {
    const unknownTypePackage: Package = {
      name: 'foo',
      version: '1.0.0',
      type: 'unknown' as any,
    };
    expect(() =>
      DependencyProviderFactory.getProvider(unknownTypePackage),
    ).toThrow(DependencyProviderNotFoundError);
    expect(() =>
      DependencyProviderFactory.getProvider(unknownTypePackage),
    ).toThrow('No dependency provider registered for package type: unknown');
  });

  it('should throw PackageTypeUnknownError if package type is missing', () => {
    const noTypePackage: Package = {name: 'bar', version: '1.0.0'};
    expect(() => DependencyProviderFactory.getProvider(noTypePackage)).toThrow(
      PackageTypeUnknownError,
    );
    expect(() => DependencyProviderFactory.getProvider(noTypePackage)).toThrow(
      'Package type unknown for package: bar',
    );
  });
});
