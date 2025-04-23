import {PythonDependencyProvider} from '../../../src/dependencies/python_dependency_provider';
import {Package} from '../../../src/packages/types';

/**
 * Integration tests for PythonDependencyProvider
 *
 * These tests interact with the real PyPI API and test the complete
 * dependency resolution workflow.
 *
 * Note: These tests depend on the PyPI API being available and the
 * packages existing with the specified versions.
 */
describe('PythonDependencyProvider Integration', () => {
  const provider = new PythonDependencyProvider();

  describe('extractDependencies', () => {
    it('should extract dependencies for a simple package', async () => {
      // A package with a small number of dependencies that is unlikely to change
      const pkg: Package = {name: 'requests', version: '2.25.1'};
      const dependencies = await provider.extractDependencies(pkg);

      expect(dependencies).toBeDefined();
      expect(Array.isArray(dependencies)).toBe(true);
      const dependencyNames = dependencies.map(d => d.to.name);
      expect(dependencyNames).toContain('urllib3');
      expect(dependencyNames).toContain('certifi');
      dependencies.forEach(dependency => {
        expect(dependency).toHaveProperty('from');
        expect(dependency).toHaveProperty('to');
        expect(dependency.from).toEqual(pkg);
        expect(typeof dependency.to.name).toBe('string');
        expect(typeof dependency.to.version).toBe('string');
      });
    });

    it('should handle packages with no dependencies', async () => {
      // A package with no dependencies
      const pkg: Package = {name: 'six', version: '1.16.0'};
      const dependencies = await provider.extractDependencies(pkg);

      expect(dependencies).toEqual([]);
    });

    it('should return empty array for non-existent packages', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      // A package name that's extremely unlikely to exist
      const pkg: Package = {
        name: 'non-existent-package-12345',
        version: '1.0.0',
      };
      const dependencies = await provider.extractDependencies(pkg);

      expect(warnSpy).toHaveBeenCalledWith(
        'Package not found on PyPI: non-existent-package-12345',
      );
      expect(dependencies).toEqual([]);
    });

    it('should successfully process a complex package with many dependencies', async () => {
      // A package with many dependencies
      const pkg: Package = {name: 'django', version: '3.2.10'};
      const dependencies = await provider.extractDependencies(pkg);

      expect(dependencies).toBeDefined();
      expect(Array.isArray(dependencies)).toBe(true);
      expect(dependencies.length).toBeGreaterThan(0);
      const dependencyNames = dependencies.map(d => d.to.name);
      expect(dependencyNames).toContain('asgiref');
      expect(dependencyNames).toContain('sqlparse');
      dependencies.forEach(dependency => {
        expect(dependency.from).toEqual(pkg);
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid package version format', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const pkg: Package = {name: 'requests', version: 'not-a-valid-version'};
      const dependencies = await provider.extractDependencies(pkg);

      expect(warnSpy).toHaveBeenCalledWith(
        'Package not found on PyPI: requests',
      );
      expect(dependencies).toEqual([]);
    });
  });
});
