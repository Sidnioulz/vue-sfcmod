module.exports = {
  env: {
    es2022: true,
    jest: true,
    node: true,
  },

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
    'import/core-modules': ['vue', '@vue/compiler-core', '@vue/compiler-dom', '@vue/compiler-sfc'],
  },

  rules: {
    'line-comment-position': 'error',
    'newline-before-return': 'error',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-param-reassign': [
      'error',
      {
        ignorePropertyModificationsFor: ['descriptor'],
        props: true,
      },
    ],
    'prefer-destructuring': 'error',
    'import/extensions': 'off',
    'import/newline-after-import': ['error', { count: 1 }],
    'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '.*.config.js',
          '.*.config.cjs',
          '.*.config.ts',
          '*.config.js',
          '*.config.cjs',
          '*.config.ts',
          '.*rc.js',
          '.*rc.cjs',
        ],
        packageDir: ['.'],
      },
    ],
    'import/order': [
      'error',
      {
        alphabetize: { order: 'asc' },
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      },
    ],
    'import/prefer-default-export': 'off',
    'jest/no-disabled-tests': 'error',
    'jest/no-focused-tests': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    /* Let TS handle these rules. */
    'no-undef': 'off',
    'no-shadow': 'off',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-use-before-define': 'error',
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',
    quotes: ['error', 'single', { allowTemplateLiterals: false, avoidEscape: true }],
  },

  overrides: [
    {
      files: ['**/*.cjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['examples/Input*'],
      rules: {
        'no-console': 'off',
        'no-debugger': 'off',
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
}
