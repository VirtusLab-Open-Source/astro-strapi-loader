/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^astro:content$': '<rootDir>/node_modules/astro/dist/content/index.d.ts',
    '^astro/loaders$': '<rootDir>/node_modules/astro/dist/loaders/index.d.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }]
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: ['/node_modules/(?!astro/).*'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
}; 