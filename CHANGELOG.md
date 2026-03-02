# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0-beta.1] - 2025-11-28

### Added

- **Custom ID Generator** - Added `idGenerator` option to `StrapiLoaderOptions` allowing custom ID generation from item data instead of using Strapi's `documentId` (#17)
- **Multiple Collections from Same Endpoint** - Added `collectionName` option to create multiple collections from the same Strapi content type with different configurations (#18)
- **Locale Support** - Added `locale` option supporting both single locale (string) and multiple locales (array) for i18n implementations (#19)
  - Single locale: Fetch content for one specific language
  - Multiple locales: Fetch all specified languages with locale-prefixed IDs
  - Automatic `_locale` field added to stored items
- Comprehensive test suite with 27 new tests covering all new features

### Changed

- `StrapiLoaderOptions` interface extended with new optional fields: `collectionName`, `idGenerator`, and `locale`
- `StrapiCollection` interface extended to support new loader options
- `generateCollection` function updated to pass new options to loader

### Fixed

- N/A

### Breaking Changes

- None - fully backward compatible with existing implementations

## [1.0.x] - 2024-XX-XX

### Initial Release

- Basic Strapi loader functionality
- Automatic data loading from Strapi Content API
- Query, filtering and population capabilities
- Authorization token support
- Astro collections system integration
- TypeScript typing support

