import eslint from '@eslint/js'
import tsEslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import eslintPluginImport from 'eslint-plugin-import'
import eslintPluginJest from 'eslint-plugin-jest'
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  {
    ignores: [
      '*.d.ts',
      '.circleci/config.yml',
      '.github/dependabot.yml',
      '.mergify/config.yml',
      '_.log',
      '_.lock',
      '*.tgz',
      '.gitignore',
      '.eslintignore',
      '.prettierignore',
      '**/node_modules',
      '**/coverage',
      '**/dist',
      'examples/*/Input.*',
      '**/dist',
    ],
  },
  eslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.es2022,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 2022,
      },
    },
    settings: {
      'import/resolver': {
        typescript: true,
      },
      'import/core-modules': [
        'vue',
        '@vue/compiler-core',
        '@vue/compiler-dom',
        '@vue/compiler-sfc',
        '@vue/shared',
      ],
    },
    plugins: {
      import: eslintPluginImport,
      jest: eslintPluginJest,
    },
  },
  ...tsEslint.config(
    { ignores: ['*.d.ts', '**/coverage', '**/dist'] },
    {
      extends: [
        eslint.configs.recommended,
        ...tsEslint.configs.recommended,
        ...eslintPluginVue.configs['flat/recommended'],
      ],
      files: ['**/*.{ts,vue}'],
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        globals: globals.browser,
        parserOptions: {
          parser: tsEslint.parser,
        },
      },
      rules: {
        'vue/prefer-import-from-vue': 'off',
        'line-comment-position': 'error',
        'newline-before-return': 'error',
        'no-underscore-dangle': 'off',
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
        'no-param-reassign': [
          'error',
          {
            ignorePropertyModificationsFor: ['descriptor'],
            props: true,
          },
        ],
        'prefer-destructuring': 'off',
        'import/extensions': 'off',
        'import/newline-after-import': ['error', { count: 1 }],
        'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
        'import/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: [
              '__mocks__/*',
              '**/*.spec.ts',
              '.*.config.js',
              '.*.config.cjs',
              '.*.config.ts',
              '*.config.js',
              '*.config.cjs',
              '*.config.ts',
              '.*rc.js',
              '.*rc.cjs',
              'eslint.config.mjs',
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
        'no-undef': 'off',
        'no-shadow': 'off',
        'no-use-before-define': 'off',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-shadow': 'error',
        '@typescript-eslint/no-use-before-define': 'error',
        'arrow-body-style': 'off',
        'class-methods-use-this': 'off',
        'prefer-arrow-callback': 'off',
        quotes: ['error', 'single', { allowTemplateLiterals: false, avoidEscape: true }],
      },
    },
  ),
  {
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    files: ['__mocks__/*'],
    languageOptions: {
      globals: globals.jest,
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    files: ['jest.setup.ts'],
    languageOptions: {
      globals: globals.jest,
    },
    rules: {
      'jest/no-export': 'off',
    },
  },
  {
    files: ['examples/**/Input*'],
    rules: {
      'no-console': 'off',
      'no-debugger': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
  {
    files: ['examples/**/transformation.cjs'],
    rules: {
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-param-reassign': 'off',
    },
  },
  prettier,
]
