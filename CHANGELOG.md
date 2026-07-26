# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-07-26

### Added

- **Astro 7 support** — peer dependency range widened to `astro@^6.0.0 || ^7.0.0`; package development dependency bumped to Astro 7.

### Changed

- Dev dependency `qs` bumped to `^6.15.3`.
- `@astrojs/ts-plugin` bumped to `^1.10.10`.
- README requirements updated for Astro 6/7 and Node.js `>=22.12.0`.

## [1.2.2] - 2026-04-07

### Fixed

- Zod `z.object()` strips keys not present in the generated Content-Type Builder shape. Strapi REST responses with deep `populate` often include more fields than the static schema describes; `schema.parse()` was shrinking documents (often most of the payload). Added `.passthrough()` on content-type objects, component objects, media objects, and on the minimal cyclic-relation placeholder object so unknown keys from the API are preserved.

### Added

- Unit tests asserting passthrough behavior for extra top-level keys, nested component keys, media extras, and JSON payload size parity after parse.

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

