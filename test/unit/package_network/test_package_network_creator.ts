import {PackageNetworkCreator} from '../../../src/package_network/package_network_creator';
import {
  Package,
  PackageType,
  LATEST_VERSION,
} from '../../../src/packages/types';
import {extractPackages} from '../../../src/packages/package_extractor_factory';
import {extractDependencies} from '../../../src/dependencies/dependency_provider_factory';
import {SonaTypeVulnerabilityProvider} from '../../../src/vulnerabilities/providers/sonatype_vulnerability_provider';

globalThis.File = class MockFile {
  constructor(public name: string) {}
} as any;

jest.mock('../../../src/packages/package_extractor_factory');
jest.mock('../../../src/dependencies/dependency_provider_factory');
jest.mock(
  '../../../src/vulnerabilities/providers/sonatype_vulnerability_provider',
);

describe('PackageNetworkCreator (unit)', () => {
  let infoSpy: jest.SpyInstance;

  const mockPkg: Package = {
    name: 'foo',
    version: '1.0.0',
    type: PackageType.PYPI,
  };
  const mockDep = {
    from: mockPkg,
    to: {name: 'bar', version: '2.0.0', type: PackageType.PYPI},
  };
  const yourPackage: Package = {
    name: 'Your Package',
    version: LATEST_VERSION,
  };

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  it('returns correct structure with "Your Package" and direct dependencies at level 0', async () => {
    (extractPackages as jest.Mock).mockResolvedValue([mockPkg]);
    (extractDependencies as jest.Mock).mockResolvedValue(new Set());
    (SonaTypeVulnerabilityProvider as any).mockImplementation(() => ({
      addVulnerabilities: async (pkgs: Package[]) => pkgs,
    }));
    const file = new File([''], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 2);
    const result = await creator.create();

    expect(result.levels.length).toBe(1);

    // Level 0 should contain "Your Package" and direct dependencies
    expect(result.levels[0].packages).toEqual([yourPackage, mockPkg]);
    expect(result.levels[0].dependencies).toEqual([
      {from: yourPackage, to: mockPkg},
    ]);
  });

  it('handles empty package extraction', async () => {
    (extractPackages as jest.Mock).mockResolvedValue([]);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const file = new File([''], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 2);
    const result = await creator.create();

    // Should have only level 0 with "Your Package"
    expect(result.levels.length).toBe(1);
    expect(result.levels[0].packages).toEqual([yourPackage]);
    expect(result.levels[0].dependencies).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      'No direct dependencies found in the package file',
    );
  });

  it('deduplicates packages and dependencies', async () => {
    (extractPackages as jest.Mock).mockResolvedValue([mockPkg, mockPkg]);
    (extractDependencies as jest.Mock).mockResolvedValue(new Set()); // No transitive dependencies
    (SonaTypeVulnerabilityProvider as any).mockImplementation(() => ({
      addVulnerabilities: async (pkgs: Package[]) => pkgs,
    }));
    const file = new File([''], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 2);
    const result = await creator.create();

    expect(result.levels.length).toBe(1);

    // Level 0: "Your Package" and deduplicated packages from file
    expect(result.levels[0].packages).toEqual([yourPackage, mockPkg]);
    expect(result.levels[0].dependencies.length).toBe(1);
    expect(result.levels[0].dependencies[0]).toEqual({
      from: yourPackage,
      to: mockPkg,
    });
  });

  it('returns only level 0 if maxLevels=1', async () => {
    (extractPackages as jest.Mock).mockResolvedValue([mockPkg]);
    const file = new File([''], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 1);
    const result = await creator.create();

    expect(result.levels.length).toBe(1);
    expect(result.levels[0].packages).toEqual([yourPackage, mockPkg]);
    expect(result.levels[0].dependencies).toEqual([
      {from: yourPackage, to: mockPkg},
    ]);
  });

  it('returns only level 0 if maxLevels=0', async () => {
    (extractPackages as jest.Mock).mockResolvedValue([mockPkg]);
    const file = new File([''], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 0);
    const result = await creator.create();
    // When maxLevels=0, the implementation still creates level 0 with "Your Package" and file packages
    expect(result.levels.length).toBe(1);
    expect(result.levels[0].packages).toEqual([yourPackage, mockPkg]);
    expect(result.levels[0].dependencies).toEqual([
      {from: yourPackage, to: mockPkg},
    ]);
  });

  it('handles multiple levels of dependencies correctly', async () => {
    const mockPkg2: Package = {
      name: 'bar',
      version: '2.0.0',
      type: PackageType.PYPI,
    };

    (extractPackages as jest.Mock).mockResolvedValue([mockPkg]);
    (extractDependencies as jest.Mock).mockResolvedValueOnce(
      new Set([mockDep]),
    ); // Call for level 1
    (SonaTypeVulnerabilityProvider as any).mockImplementation(() => ({
      addVulnerabilities: async (pkgs: Package[]) => pkgs,
    }));

    const file = new File([''], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 2);
    const result = await creator.create();

    expect(result.levels.length).toBe(2);

    // Level 0: "Your Package" and packages from file
    expect(result.levels[0].packages).toEqual([yourPackage, mockPkg]);
    expect(result.levels[0].dependencies).toEqual([
      {from: yourPackage, to: mockPkg},
    ]);

    // Level 1: transitive dependencies
    expect(result.levels[1].packages).toEqual([mockPkg2]);
    expect(result.levels[1].dependencies).toEqual([mockDep]);
  });

  it('stops processing when no more dependencies are found', async () => {
    (extractPackages as jest.Mock).mockResolvedValue([mockPkg]);
    (extractDependencies as jest.Mock).mockResolvedValue(new Set());
    (SonaTypeVulnerabilityProvider as any).mockImplementation(() => ({
      addVulnerabilities: async (pkgs: Package[]) => pkgs,
    }));
    const file = new File([''], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 5);
    const result = await creator.create();

    // Should only have level 0 since no transitive dependencies exist
    expect(result.levels.length).toBe(1);
    expect(result.levels[0].packages).toEqual([yourPackage, mockPkg]);
  });

  it('handles errors gracefully', async () => {
    (extractPackages as jest.Mock).mockRejectedValue(
      new Error('Extraction failed'),
    );

    const file = new File([''], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 2);

    await expect(creator.create()).rejects.toThrow(
      'Failed to create package network',
    );
  });
});
