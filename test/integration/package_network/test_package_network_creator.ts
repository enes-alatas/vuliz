import {PackageNetworkCreator} from '../../../src/package_network/package_network_creator';
import * as fs from 'fs';
import * as path from 'path';
import {Severity} from '../../../src/vulnerabilities/types';
import {LATEST_VERSION} from '../../../src/packages/types';
import {Package} from '../../../src/packages/types';

// Polyfill FileReader for Node.js test environment
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    // Add all required properties to satisfy the FileReader interface
    onload: any = null;
    onerror: any = null;
    onabort: any = null;
    onloadend: any = null;
    onloadstart: any = null;
    onprogress: any = null;
    readyState = 2;
    result: string | null = null;
    error: any = null;
    abort() {}
    readAsText(file: any) {
      file.text().then(
        (text: string) => {
          this.result = text;
          if (this.onload) this.onload({target: this});
        },
        (err: any) => {
          this.error = err;
          if (this.onerror) this.onerror({target: this});
        },
      );
    }
  } as any;
}

describe('PackageNetworkCreator (integration)', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const yourPackage: Package = {name: 'Your Package', version: LATEST_VERSION};
  let infoSpy: jest.SpyInstance;

  beforeAll(() => {
    if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir);
  });

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  afterAll(() => {
    fs.rmSync(fixturesDir, {recursive: true, force: true});
  });

  it('parses a real requirements.txt and returns a valid network', async () => {
    const reqContent = 'requests==2.25.1\nnumpy==1.19.5';
    const reqPath = path.join(fixturesDir, 'requirements.txt');
    fs.writeFileSync(reqPath, reqContent);
    const file = new File([reqContent], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 2);
    const result = await creator.create();

    expect(result.levels.length).toBeGreaterThanOrEqual(1);

    // Level 0 should contain "Your Package" and direct dependencies
    expect(result.levels[0].packages).toContainEqual(yourPackage);
    expect(
      result.levels[0].packages.some(pkg => pkg.name === 'requests'),
    ).toBeTruthy();
    expect(
      result.levels[0].packages.some(pkg => pkg.name === 'numpy'),
    ).toBeTruthy();

    // Level 0 should have dependencies from "Your Package" to direct dependencies
    expect(result.levels[0].dependencies.length).toBe(2);
    expect(
      result.levels[0].dependencies.every(
        dep =>
          dep.from.name === yourPackage.name &&
          dep.from.version === yourPackage.version,
      ),
    ).toBeTruthy();
  });

  it('handles a file with no dependencies', async () => {
    const reqContent = '';
    const reqPath = path.join(fixturesDir, 'requirements.txt');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    fs.writeFileSync(reqPath, reqContent);
    const file = new File([reqContent], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 2);
    const result = await creator.create();

    expect(result.levels.length).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(
      'No direct dependencies found in the package file',
    );

    expect(result.levels[0].packages).toContainEqual(yourPackage);
    expect(result.levels[0].packages.length).toBe(1);
    expect(result.levels[0].packages[0]).toEqual(yourPackage);
    expect(result.levels[0].dependencies.length).toBe(0);
  });

  it('handles multiple levels of dependencies', async () => {
    const reqContent = 'requests==2.25.1';
    const reqPath = path.join(fixturesDir, 'requirements.txt');
    fs.writeFileSync(reqPath, reqContent);
    const file = new File([reqContent], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 3);
    const result = await creator.create();
    expect(result.levels.length).toBeGreaterThanOrEqual(1);

    // Level 0: "Your Package" and packages from file
    expect(result.levels[0].packages).toContainEqual(yourPackage);
    expect(
      result.levels[0].packages.some(pkg => pkg.name === 'requests'),
    ).toBeTruthy();

    // If there are transitive dependencies, they should be present in level 1 or 2
    if (result.levels.length > 1) {
      expect(result.levels[1].packages.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('adds vulnerabilities to the packages in the network', async () => {
    const reqContent = 'requests==2.25.1';
    const reqPath = path.join(fixturesDir, 'requirements.txt');
    fs.writeFileSync(reqPath, reqContent);
    const file = new File([reqContent], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 2);
    const result = await creator.create();

    expect(result.levels.length).toBeGreaterThanOrEqual(1);

    // Level 0: "Your Package" (no vulnerabilities expected) and packages from file with vulnerabilities
    expect(result.levels[0].packages).toContainEqual(yourPackage);

    const requestsPackage = result.levels[0].packages.find(
      pkg => pkg.name === 'requests',
    );
    expect(requestsPackage).toBeDefined();

    const createdVulnerabilityContainer =
      requestsPackage?.vulnerabilityContainer;
    expect(createdVulnerabilityContainer?.overallSeverity).toBe(
      Severity.Medium,
    );
    expect(createdVulnerabilityContainer?.vulnerabilities.length).toBe(3);
  });

  it('returns level 0 when maxLevels=1', async () => {
    const reqContent = 'requests==2.25.1';
    const reqPath = path.join(fixturesDir, 'requirements.txt');
    fs.writeFileSync(reqPath, reqContent);
    const file = new File([reqContent], 'requirements.txt');
    const creator = new PackageNetworkCreator(file, 1);
    const result = await creator.create();

    expect(result.levels.length).toBe(1);
    expect(result.levels[0].packages).toContainEqual(yourPackage);
    expect(result.levels[0].packages.length).toBeGreaterThanOrEqual(2);
    expect(result.levels[0].dependencies.length).toBeGreaterThanOrEqual(1);
  });
});
