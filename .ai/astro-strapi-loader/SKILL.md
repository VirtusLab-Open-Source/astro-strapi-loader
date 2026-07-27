---
name: astro-strapi-loader
description: >-
  Use @sensinum/astro-strapi-loader with Astro Content Layer: build Strapi REST query objects
  (object and object-array populate per REST parameters), let qs.stringify serialize—never
  inline query strings. Composable query fragments, dynamic zone "on", locale strategies,
  generateCollections,   getCollection / getEntry. Strapi 5, Astro 6 or 7.
---

# Astro Strapi Loader — agent skill

## Scope

- **Package:** `@sensinum/astro-strapi-loader` (peer `astro` `^6 || ^7`, Strapi 5).
- **Goal:** Load Strapi at build time into Astro content collections with correct `populate` graphs, dynamic zones, and i18n.

## Install and base wiring

1. Install `@sensinum/astro-strapi-loader` (with peer `zod` / `astro` per your project).
2. In `src/content.config.ts`, `await generateCollections(config, definitions)` and spread the returned record into `collections` (or merge multiple calls—see below).
3. **Env:** `STRAPI_URL`, `STRAPI_TOKEN` when the API is protected.
4. **Token:** Must allow **Content API** reads and **Content-Type Builder** `GET` content types (schema source for generated Zod).

## Configuration object (`generateCollections` first argument)

| Field | Notes |
|--------|--------|
| `url` | Strapi base URL; no `/api` suffix (package requests `/api/...`). |
| `token` | Optional Bearer. |
| `strict` | Optional; stricter Zod from schema builder. |
| `headers` | Optional extra request headers. |

## Defining entries (second argument)

Each item is one **Strapi collection** → one Astro `defineCollection`, keyed by `collectionName` or the Strapi type name.

| Field | Purpose |
|--------|-----------|
| `name` | API id / route segment (e.g. `homepage`, `case-studies`). |
| `query` | REST object: `populate`, `filters`, `sort`, `fields`, `pagination`. |
| `collectionName` | Astro collection key when reusing the same `name` (e.g. per-locale splits). |
| `locale` | `string` or `string[]` — see **Multilingual**. |
| `idGenerator` | `(data) => string` — else `documentId`. |

**Shorthand:** `['homepage', 'layout']` means default `query` for those types.

**Merging several `generateCollections` results:** the function returns a flat object of collection configs. You can `await` it once with a long definition list, or call it in a **loop** (e.g. one definition at a time) and **spread** into a single object: `strapiCollections = { ...strapiCollections, ...result }`. The loop pattern helps **isolate failures** (log per def, continue) when some endpoints error at build time.

## Organizing large `query` values

Techniques that keep `content.config.ts` maintainable:

1. **Shared fragments** — small `const` objects (e.g. `heroPopulate`, `seoPopulate`) and **compose** the final `query` with spread so hero/SEO stay consistent across page types.
2. **One dynamic zone map** — a single `const` shaped as `{ [dzFieldName]: { on: { 'component.api.id': { populate: ... } } } }`, then spread into `populate` (e.g. `populate: { hero, seo, ...dynamicZoneFragment }`). Add or trim components in **one** place.
3. **Dot-path `populate` arrays** — for flat but wide graphs, `populate: ['a', 'a.b', 'a.b.c']` next to nested objects in the same `populate` where needed.
4. **Central query module** — move exported `const` query objects to e.g. `src/globals/queries.ts` (or `lib/strapi-queries.ts`) and **import** them into `content.config.ts`. The **same** object can be passed to the loader and, for runtime fetches, stringified with `qs`—one source of truth.
5. **Single types + collection types** — list single-type and collection-type defs separately, then build a **combined** `collectionDefs` (e.g. each entry `{ name, query, collectionName?, locale? }`) before looping `generateCollections`.

## Building `query` objects (Strapi REST)

Author **data**, not URLs. Aligned with [REST API parameters](https://docs.strapi.io/cms/api/rest/parameters): `filters`, `locale`, `status`, `populate`, `fields`, `sort`, `pagination`. Bracket encoding in the query string is produced by **`qs`** from that object.

### Object form (deep `populate`)

Nested objects for relations, components, and dynamic zones, e.g. `populate: { seo: { populate: ['ogImage'] } }`.

### Object–array (mixed) `populate`

[Parameters](https://docs.strapi.io/cms/api/rest/parameters) allow `populate` as string or object. **Array of dot-paths** is useful for flatter trees:

```ts
populate: ['logo', 'seo', 'seo.ogImage', 'customer.logo_light']
```

You may mix a path array and nested `on` / objects under one `populate`.

### Other parameters

- `sort`: string or string array.
- `fields`: array of names.
- `filters`: object — [Filters](https://docs.strapi.io/cms/api/rest/filters).
- `pagination`: `{ page, pageSize }` or as per current Strapi docs.

### Anti-patterns

- Hand-built `?a=b&...` strings, template literals, or manual bracket segments.
- Using `URLSearchParams` for deep nested `populate`.
- Pre-stringifying inside `content.config.ts` (the loader should receive a **plain object**).

### Manual HTTP

```ts
import qs from "qs";

const queryParams = qs.stringify(
  { populate: { /* ... */ }, locale: "en" },
  { encodeValuesOnly: true }
);
```

**Do not** use `JSON.stringify` on the whole query in place of `qs` for the URL.

### Serialization boundary

- **Loader:** pass one `query` object; `strapiLoader` uses `qs.stringify` internally.
- **Raw `fetch` / `fetchContent`:** build the same object, then `qs.stringify(..., { encodeValuesOnly: true })`.

## Dynamic zone with `on`

The dynamic zone field (e.g. `sections`, `blocks`) is populated with **`on`**: only listed **component API ids** (as in the Content-Type Builder) are expanded, each with its own `populate`.

```ts
{
  blocks: {
    on: {
      "blocks.rich_text": { populate: { body: true, cta: true } },
      "blocks.media_row": { populate: { items: { populate: ["media"] } } },
    },
  },
}
```

Place that under the top-level `populate` next to `hero`, `seo`, etc. Deep trees inside `on` (nested components, media) use the same rules as any other `populate` object.

## Collection types vs single types

- **Collection:** `data` is an **array** — one content entry per item in the store.
- **Single type:** `data` is a **single object** — one entry in the store.

The same `StrapiCollection` shape applies; routing is defined by the content type in Strapi.

## Multilingual / `locale`

- **`locale: 'en'` (single):** one request; Strapi returns that language.
- **Same Strapi type → multiple Astro collections:** repeat the entry with the same `name`, different `locale` and different **`collectionName`** (e.g. `pages-pl`, `pages-en`) so `getCollection('pages-pl')` and `getCollection('pages-en')` are separate.
- **`locale: ['en', 'de', 'pl']`:** the loader fetches per locale, stores ids as **`locale:documentId`**, adds **`_locale`** on each item’s data. Pairs well with `idGenerator` when public ids are slugs: `en:about-us`.
- The loader merges `locale` into the request query; you still model **`locale` in the object**, not as a raw query string.

## Using data in Astro

- `getCollection('key')` — all entries; filter on `data._locale` for multi-locale single collection.
- `getEntry('key', 'locale:documentId' | 'locale:slug')` when using prefixed ids.
- **Runtime** Strapi calls: `fetchContent` with **`qs.stringify`’d** params, ideally reusing the **same** query object as build time.

### Native Markdown (`render()` / `<Content />`)

Opt-in via `markdown` on the collection / `strapiLoader` options (omit = unchanged behavior):

- `field`: dot-path to a markdown string
- `getMarkdown`: custom extractor (wins over `field`)
- `format: "html"` for already-rendered HTML; default `"markdown"` uses Astro `renderMarkdown()`
- Helpers: `getValueByPath`, `resolveMarkdownSource`, `createHtmlRenderedContent`, `buildEntryRenderedContent`

Not for Strapi Blocks JSON — only string Markdown/HTML fields.

## Troubleshooting

- **Empty or partial data:** `populate` depth, wrong `locale`, draft/unpublished, or `filters` too strict.
- **400 on REST:** compare object shape to [parameters](https://docs.strapi.io/cms/api/rest/parameters) and actual serialization via `qs`.
- **Build schema errors:** `STRAPI_URL` / token cannot reach Content-Type Builder or list content types.
