module.exports = {
  env: {
    es2022: true,
    node: true,
  },

  root: true,

  parserOptions: {
    ecmaVersion: 2022,
    parser: '@typescript-eslint/parser',
  },

  extends: [
    'eslint:recommended',
    'airbnb-base',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'prettier',
    'plugin:yml/prettier',
  ],

  settings: {
    'import/resolver': {
      typescript: true,
    },
  },

  rules: {
    'global-require': 'off',
    'no-console': 'warn',
    'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
  },

  overrides: [
    {
      files: 'src/**',
      env: {
        es2022: true,
        browser: true,
      },
      rules: {
        'global-require': 'error',
        'no-restricted-syntax': 'error',
      },
    },
  ],
}
