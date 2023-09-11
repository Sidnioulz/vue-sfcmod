/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '.*': [
      'ts-jest',
      {
        diagnostics: false,
        useESM: true,
      },
    ],
  },
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'index.ts',
    '**/bin/vue-sfcmod.ts',
    '**/src/**/*.ts',
    '!**/dist/**',
    '!**/node_modules/**',
    '!**/__fixtures__/**',
    '!**/__tests__/**',
    '!**/src/types/*.ts',
  ],
  coverageDirectory: '<rootDir>/coverage/',
  coverageProvider: 'v8',
  coverageReporters: ['lcov', 'text'],
  moduleNameMapper: {
    '^~/(.*)': '<rootDir>/src/$1.ts',
  },
}
