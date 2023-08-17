/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  transform: {
    '.*': [
      'ts-jest',
      {
        diagnostics: false,
      },
    ],
  },
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^~/(.*)': '<rootDir>/src/$1.ts',
  },
}
