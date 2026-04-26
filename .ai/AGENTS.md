# Agent instructions: Astro + Strapi Loader

This repository ships `@sensinum/astro-strapi-loader`. For full procedures and examples, use:

- [`.ai/astro-strapi-loader/SKILL.md`](astro-strapi-loader/SKILL.md)

## Non-negotiables

1. **Query shape (Strapi REST):** Build **`query` as plain JavaScript data** aligned with [REST API parameters](https://docs.strapi.io/cms/api/rest/parameters): nested **objects** for `populate`, `filters`, `pagination`, and where the API allows, **string or array** forms (`sort`, `fields`, `populate` as dot-path arrays *or* nested objects). The URL’s bracket encoding is produced by `qs`—**never** hand-written as a string in source.
2. **Serialization = `qs` only:** **`qs.stringify`** (loader uses it internally; manual HTTP uses `encodeValuesOnly: true`). **Anti-pattern:** inline query text (literals, `+`, manual `?key=`). **Do not** use `URLSearchParams` or `JSON.stringify` the whole query for Strapi’s nested trees.
3. **Dynamic zones:** `populate: { <fieldName>: { on: { '<api::componentName>': { populate: ... } } } } }`—only components listed in `on` are expanded; each can have its own `populate` depth.
4. **i18n:** Set `locale` on each Strapi collection definition; for several locales of the same type, use distinct **`collectionName`** (e.g. suffixed by locale) or a single collection with `locale: string[]` and `locale:documentId` ids. See the skill.
5. **Token:** Read access to the Content API and to Content-Type Builder **Get content types** (the loader materializes Zod schemas at build time).
6. **Structure at scale:** Reuse **named query fragments** (shared `hero`, `seo`, dynamic-zone objects) and **compose** with object spread; optional **dedicated module** for query objects kept in sync with any manual `fetchContent` (same object → `qs`).

## This repo

- Implementation: `src/utils/loader.ts`, `src/utils/strapi.ts` — public API: `src/index.ts`.

## Cursor

Rules under `.cursor/rules/` apply when editing `content.config.ts` and related Strapi integration code.
