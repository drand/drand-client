module.exports = {
  preset: "ts-jest",
  testEnvironment: 'node',
  testTimeout: 30000,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
}
