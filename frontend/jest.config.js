const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

module.exports = createJestConfig({
  testEnvironment: 'jsdom',
  setupFilesAfterEach: undefined,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css)$': '<rootDir>/src/__tests__/styleMock.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', 'styleMock.js'],
});