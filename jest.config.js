export default {
    testEnvironment: 'node',
    transform: {},
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
    ],
    coverageDirectory: 'coverage',
    verbose: true,
    maxWorkers: 1, // Run tests sequentially to avoid database race conditions
    forceExit: true, // Force exit after tests complete
    detectOpenHandles: true, // Detect open handles that prevent Jest from exiting
    testTimeout: 30000, // Increase timeout for database operations
};

