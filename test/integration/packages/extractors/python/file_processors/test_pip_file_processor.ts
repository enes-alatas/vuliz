import {PipFileProcessor} from 'src/packages/extractors/python/file_processors/pip_file_processor';
import {PackageType, LATEST_VERSION} from 'src/packages/types';

// Mock the AbstractFileProcessor to avoid file system dependencies
jest.mock('src/packages/extractors/file_processor', () => {
  const original = jest.requireActual('src/packages/extractors/file_processor');
  return {
    ...original,
    AbstractFileProcessor: class extends original.AbstractFileProcessor {
      readFile(file: File): Promise<string> {
        return Promise.resolve((file as any)._content || '');
      }
    },
  };
});

describe('PipFileProcessor Integration', () => {
  let processor: PipFileProcessor;

  beforeEach(() => {
    processor = new PipFileProcessor();
  });

  // Helper to create a mock File with content
  const createMockFile = (content: string, name = 'Pipfile'): File => {
    const mockFile = {
      name,
      _content: content,
    } as unknown as File;
    return mockFile;
  };

  async function processPipfile(content: string, filename = 'Pipfile') {
    const mockFile = createMockFile(content, filename);
    return await processor.parsePackages(mockFile);
  }

  it('should parse a basic Pipfile with standard dependencies', async () => {
    const pipfileContent = `
[packages]
flask = "==2.0.0"
requests = ">=2.27.0"
django = "*"

[dev-packages]
pytest = ">=7.0.0"
black = "22.3.0"
    `;

    const packages = await processPipfile(pipfileContent);

    expect(packages).toHaveLength(5);
    expect(packages).toEqual(
      expect.arrayContaining([
        {name: 'flask', version: '2.0.0', type: PackageType.PYPI},
        {name: 'requests', version: '2.27.0', type: PackageType.PYPI},
        {name: 'django', version: LATEST_VERSION, type: PackageType.PYPI},
        {name: 'pytest', version: '7.0.0', type: PackageType.PYPI},
        {name: 'black', version: '22.3.0', type: PackageType.PYPI},
      ]),
    );
  });

  it('should parse a Pipfile with complex dependency specifications', async () => {
    const pipfileContent = `
[packages]
Django = {version = ">=4.0.0"}
"django-filter" = "22.1"
psycopg2 = {version = ">=2.7,<3", extras = ["binary"]}
"package-with-extras[security,ui]" = "~=1.5.0"

[dev-packages]
mypy = {version = "*"}
coverage = {version = ">=6.0.0"}
"flake8" = "*"
    `;

    const packages = await processPipfile(pipfileContent);

    expect(packages.length).toBeGreaterThanOrEqual(7);
    expect(packages).toEqual(
      expect.arrayContaining([
        {name: 'django', version: '4.0.0', type: PackageType.PYPI},
        {name: 'django-filter', version: '22.1', type: PackageType.PYPI},
        {name: 'psycopg2', version: '2.7', type: PackageType.PYPI},
        {name: 'package-with-extras', version: '1.5.0', type: PackageType.PYPI},
        {name: 'mypy', version: LATEST_VERSION, type: PackageType.PYPI},
        {name: 'coverage', version: '6.0.0', type: PackageType.PYPI},
        {name: 'flake8', version: LATEST_VERSION, type: PackageType.PYPI},
      ]),
    );
  });

  it('should set version to LATEST_VERSION when version can not be resolved', async () => {
    const pipfileContent = `
[packages]
git-package = {git = "https://github.com/user/repo.git", ref = "master"}
    `;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const packages = await processPipfile(pipfileContent);

    expect(errorSpy).toHaveBeenCalledWith(
      'Error parsing package entry for git-package: Error: Unexpected version format in Pipfile',
    );
    expect(packages.length).toBeGreaterThanOrEqual(1);
    expect(packages).toEqual(
      expect.arrayContaining([
        {name: 'git-package', version: LATEST_VERSION, type: PackageType.PYPI},
      ]),
    );
  });

  it('should handle malformed Pipfile content gracefully', async () => {
    const invalidPipfileContent = `
[packages
flask = "==2.0.0"
    `;

    await expect(processPipfile(invalidPipfileContent)).rejects.toThrow();
  });
});
