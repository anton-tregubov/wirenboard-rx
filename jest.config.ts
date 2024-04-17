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
    '^lodash-es$': 'lodash',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/main/ts/**/*.ts',
    '!src/main/ts/**/*.d.ts',
  ],
  setupFilesAfterEnv: ['jest-extended/all', './.jest/console.ts'],
  testTimeout: 20000,
} satisfies Config
export default config
