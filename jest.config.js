module.exports = {
  transform: {'^.+\\.ts?$': ['ts-jest', {tsconfig: 'tsconfig.test.json'}]},
  testEnvironment: 'node',
  testRegex: '/test/.*(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
};
