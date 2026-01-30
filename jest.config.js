module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.js'],
    collectCoverageFrom: [
        '*.js',
        '!index.js',
        '!config.js',
        '!test*.js'
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/test/'
    ]
};
