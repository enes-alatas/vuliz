const globals = require('globals');
const ignores = require('./eslint.ignores.js');

module.exports = [
  {ignores},
  ...require('gts'),
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {project: './tsconfig.test.json'},
    },
    rules: {
      // Existing code uses `any` in several places; warn until it is typed.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['*.js'],
    languageOptions: {globals: globals.node},
  },
  {
    files: ['webpack.config.js'],
    rules: {
      'n/no-unpublished-require': 'off',
    },
  },
];
