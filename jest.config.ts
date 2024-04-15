import type { Config } from 'jest'

const config = {
  testEnvironment: 'node',
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  testMatch: ['<rootDir>/src/test/ts/*.(test).ts'],
  moduleNameMapper: {
    '@main/(.*)': '<rootDir>/src/main/ts/$1',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/main/ts/**/*.ts',
    '!src/main/ts/**/*.d.ts',
  ],
} satisfies Config
export default config
