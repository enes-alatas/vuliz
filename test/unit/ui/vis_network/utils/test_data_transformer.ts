import {
  DataTransformer,
  NetworkDataValidationError,
} from 'src/ui/vis_network/utils/data_transformer';
import {Package, PackageType} from 'src/packages/types';

describe('DataTransformer', () => {
  const transformer = new DataTransformer();

  it.each(Object.values(PackageType))(
    'should accept packages of type %s',
    type => {
      const pkg: Package = {name: 'org.example:lib', version: '1.0', type};
      expect(transformer.transformPackagesToNodes([pkg], 1)).toHaveLength(1);
    },
  );

  it('should accept packages without a type', () => {
    const pkg: Package = {name: 'Your Package', version: '*'};
    expect(transformer.transformPackagesToNodes([pkg], 0)).toHaveLength(1);
  });

  it('should reject unknown package types', () => {
    const pkg = {
      name: 'foo',
      version: '1.0',
      type: 'cargo',
    } as unknown as Package;
    expect(() => transformer.transformPackagesToNodes([pkg], 1)).toThrow(
      NetworkDataValidationError,
    );
    expect(() => transformer.transformPackagesToNodes([pkg], 1)).toThrow(
      'Package type must be one of: npm, pypi, maven',
    );
  });
});
