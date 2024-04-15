import type { Config } from 'jest'

const config = {
  testEnvironment: 'node',
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  testMatch: ['<rootDir>/src/test/ts/*.(test).ts'],
  moduleNameMapper: {
    '^@main$': '<rootDir>/src/main/ts',
    '^@main/(.*)$': '<rootDir>/src/main/ts/$1',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.mts',
    '!src/**/*.d.ts',
    '!src/**/*.d.mts',
  ],
} satisfies Config
export default config
