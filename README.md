<div align="center" style="max-width: 10rem; margin: 0 auto">
  <img style="width: 150px; height: auto;" src="https://www.sensinum.com/img/open-source/strapi-astro-blocks/logo.png" alt="Logo - Strapi Astro Loader" />
</div>
<div align="center">
  <h1>Astro Strapi Loader</h1>
  <p>Integration of Astro with Strapi CMS that enables easy data loading from Strapi Content API</p>
  <a href="https://www.npmjs.org/package/@sensinum/astro-strapi-loader">
    <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/VirtusLab-Open-Source/astro-strapi-loader?label=npm&logo=npm">
  </a>
  <a href="https://www.npmjs.org/package/@sensinum/astro-strapi-loader">
    <img src="https://img.shields.io/npm/dm/%40sensinum%2Fastro-strapi-loader.svg" alt="Monthly download on NPM" />
  </a>
  <a href="https://circleci.com/gh/VirtusLab-Open-Source/astro-strapi-loader">
    <img src="https://circleci.com/gh/VirtusLab-Open-Source/astro-strapi-loader.svg?style=shield" alt="CircleCI" />
  </a>
  <a href="https://codecov.io/gh/VirtusLab-Open-Source/astro-strapi-loader">
    <img src="https://codecov.io/gh/VirtusLab-Open-Source/astro-strapi-loader/coverage.svg?branch=main" alt="codecov.io" />
  </a>
</div>

---

## 📋 Table of Contents

* [📋 Requirements](#-requirements)
* [📦 Installation](#-installation)
* [🚀 Features](#-features)
* [🤖 AI-native support](#-ai-native-support)
* [🖥️ Usage](#-usage)
* [⚙️ Configuration](#-configuration)
* [🔧 Development](#-development)
* [🤝 Contributing](#-contributing)
* [📄 License](#-license)

## 📋 Requirements

* Astro ^5.0.0
* Strapi ^5.0.0

## 📦 Installation

```bash
npm install @sensinum/astro-strapi-loader
# or
yarn add @sensinum/astro-strapi-loader
```

## 🚀 Features

* Easy integration with Astro and Strapi
* Automatic data loading from Strapi API
* Query, filtering and population capabilities - [Strapi 5 Documentation](https://docs.strapi.io/cms/api/rest/parameters)
* Authorization token support
* Astro collections system integration
* TypeScript typing
* **🆕 Custom ID generation** - Generate collection IDs from custom fields (e.g., slugs)
* **🆕 Multiple collections** - Create multiple collections from same endpoint
* **🆕 i18n support** - Built-in locale support for multilingual content

## 🤖 AI-native support

This repository includes **optional, model-agnostic guidance** for coding agents and AI-assisted workflows (Strapi REST `query` objects, `populate` / dynamic zones, `locale`, `qs` serialization, and Astro Collections usage).

| Location | Purpose |
|----------|---------|
| [`.ai/AGENTS.md`](.ai/AGENTS.md) | Short **agent instructions**—non-negotiables and pointers to the skill. |
| [`.ai/astro-strapi-loader/SKILL.md`](.ai/astro-strapi-loader/SKILL.md) | Full **skill** (YAML frontmatter + markdown); copy or adapt for your global or project skills directory. |
| [`.cursor/rules/astro-strapi-loader.mdc`](.cursor/rules/astro-strapi-loader.mdc) | **Cursor rules** for files such as `content.config.ts` (`.mdc` with optional globs). |

You can reuse or fork these files in **downstream projects** that consume `@sensinum/astro-strapi-loader` so assistants stay aligned with Strapi 5 REST parameters and this package’s behavior. The published npm package contains only `dist/`; AI assets live **in the GitHub tree** alongside the source.

## 🖥️ Usage

1. Add the integration to your `src/content.config.ts`:

```ts
import { generateCollections } from '@sensinum/astro-strapi-loader';

let strapiCollections: any = {};

try {
  strapiCollections = await generateCollections({
    url: import.meta.env.STRAPI_URL,
    token: import.meta.env.STRAPI_TOKEN,
    headers: {
      // ...
    },
  }, [{ // leave empty [] to fetch all the collections based on default Strapi settings
    name: "homepage",
    query: {
      populate: { seo: true },
    },
  }, {
    name: "layout",
    query: {
      populate: { header: true, footer: true },
    },
  }, 'simple-collection-name']); // Can also pass just strings
} catch (error) {
  console.error(error);
}

export const collections = {
    ...strapiCollections,
};
```

> **✅ Backward Compatible:** Existing code works without any changes!

2. Use in your Astro component:

```jsx
---
import { getCollection } from 'astro:content';
import { fetchContent } from '@sensinum/astro-strapi-loader';

// Basic usage with Astro Collections
const myCollection = await getCollection('my-collection');

// Basic usage with direct Strapi Content API fetch
const myCollection = await fetchContent({
  url: import.meta.env.STRAPI_URL,
  token: import.meta.env.STRAPI_TOKEN,
  contentType: 'my-collection',
  queryParams: {
    populate: {
      // ...
    },
    filters: {
      // ...
    },
    sort: ['publishedAt:desc'],
  },
});
---

<div>
  { myCollection.map(item => (
    <article>
      <h2>{item.title}</h2>
      <p>{item.description}</p>
    </article>
  )) }
</div>
```

## ⚙️ Configuration

### Integration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `url` | `string` | Yes | Strapi API URL |
| `token` | `string` | No | Strapi API access token |
| `collectionName` | `string` | No | Custom collection name (for multiple collections from same endpoint) |
| `idGenerator` | `function` | No | Custom function to generate IDs from item data |
| `locale` | `string \| string[]` | No | Single locale or array of locales for i18n support |
| `headers` | `Record<string, string>` | No | Additional headers for API request |

> **⚠️ Note:** The token must have **read access** to both the **Content API** and the **Content-Type Builder API** *(ONLY to the "Get Content Types" endpoint)*.

### Mixing 1.0.x and 1.1.0+

You can mix old (simple) and new (extended) format in a single `generateCollections` call:

```typescript
strapiCollections = await generateCollections({
  url: import.meta.env.STRAPI_URL,
  token: import.meta.env.STRAPI_TOKEN,
}, [
  // ✅ Old format - works as before
  {
    name: "homepage",
    query: { populate: { seo: true } }
  },
  {
    name: "layout",
    query: { populate: { header: true, footer: true } }
  },

  // ✅ 1.1.0+ - with locale support
  {
    name: "pages",
    collectionName: "pagesEN",
    locale: "en",
    query: { sort: ['publishedAt:desc'] }
  },
  {
    name: "pages",  // Same endpoint, different config!
    collectionName: "pagesDE",
    locale: "de",
    query: { sort: ['publishedAt:desc'] }
  },

  // ✅ 1.1.0+ - with custom ID
  {
    name: "blog-posts",
    idGenerator: (data) => data.slug as string,
    query: { filters: { published: true } }
  },

  // ✅ 1.1.0+ - combining all features
  {
    name: "articles",
    collectionName: "articlesMultilang",
    locale: ["en", "de", "fr"],
    idGenerator: (data) => data.slug as string
  }
]);

// Result collections:
// - homepage (old format)
// - layout (old format)
// - pagesEN (1.1.0+)
// - pagesDE (1.1.0+)
// - blog-posts (1.1.0+)
// - articlesMultilang (1.1.0+)
```

### Advanced Usage Examples

#### Custom ID Generation

Use slugs or custom fields as collection IDs instead of Strapi's `documentId`:

**Option A:** Using `generateCollections`:

```typescript
strapiCollections = await generateCollections({
  url: import.meta.env.STRAPI_URL,
  token: import.meta.env.STRAPI_TOKEN,
}, [{
  name: "pages",
  idGenerator: (data) => data.slug as string,
  query: { populate: { seo: true } }
}]);

// Now you can use: getEntry('pages', 'about-us')
```

**Option B:** Using `strapiLoader` directly:

```typescript
import { strapiLoader } from '@sensinum/astro-strapi-loader';
import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  loader: strapiLoader('pages', {
    url: import.meta.env.STRAPI_URL,
    token: import.meta.env.STRAPI_TOKEN,
    idGenerator: (data) => data.slug as string
  }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    content: z.string()
  })
});
```

#### Multiple Collections from Same Endpoint

**Option A:** Using `generateCollections` (recommended for multiple collections):

```typescript
strapiCollections = await generateCollections({
  url: import.meta.env.STRAPI_URL,
  token: import.meta.env.STRAPI_TOKEN,
}, [{
  name: "pages",
  collectionName: "pagesEN",
  locale: "en",
  query: { sort: ['publishedAt:desc'] }
}, {
  name: "pages",  // Same endpoint!
  collectionName: "pagesDE",
  locale: "de",
  query: { sort: ['publishedAt:desc'] }
}]);

// Now you have both 'pagesEN' and 'pagesDE' collections
```

**Option B:** Using `strapiLoader` directly:

```typescript
const pagesEN = defineCollection({
  loader: strapiLoader('pages', {
    url: import.meta.env.STRAPI_URL,
    token: import.meta.env.STRAPI_TOKEN,
    collectionName: 'pagesEN',
    locale: 'en'
  }),
  schema: pageSchema
});

const pagesDE = defineCollection({
  loader: strapiLoader('pages', {
    url: import.meta.env.STRAPI_URL,
    token: import.meta.env.STRAPI_TOKEN,
    collectionName: 'pagesDE',
    locale: 'de'
  }),
  schema: pageSchema
});

export const collections = { pagesEN, pagesDE };
```

#### Multiple Locales in Single Collection

Fetch all language versions in one collection:

```typescript
const pagesMultilang = defineCollection({
  loader: strapiLoader('pages', {
    url: import.meta.env.STRAPI_URL,
    token: import.meta.env.STRAPI_TOKEN,
    locale: ['en', 'de', 'fr'] // Array of locales
  }),
  schema: z.object({
    title: z.string(),
    content: z.string(),
    _locale: z.string() // Automatically added by loader
  })
});

// Access by locale-prefixed ID
const page = await getEntry('pagesMultilang', 'en:documentId');

// Or filter by locale
const allPages = await getCollection('pagesMultilang');
const enPages = allPages.filter(p => p.data._locale === 'en');
```

#### Combining All Features

```typescript
const blogMultilang = defineCollection({
  loader: strapiLoader('blog-posts', {
    url: import.meta.env.STRAPI_URL,
    token: import.meta.env.STRAPI_TOKEN,
    collectionName: 'blogAllLanguages',
    locale: ['en', 'de', 'fr'],
    idGenerator: (data) => data.slug as string
  }, {
    sort: ['publishedAt:desc'],
    filters: { status: { $eq: 'published' } }
  }),
  schema: blogSchema
});

// Access: getEntry('blogAllLanguages', 'en:my-post-slug')
```

### Query Options

| Option | Type | Description | Documentation |
|--------|------|-------------|---------------|
| `filters` | `object` | Strapi Query Builder filters | [open](https://docs.strapi.io/cms/api/rest/filters) |
| `populate` | `object / string[]` | Populating & selecting relations | [open](https://docs.strapi.io/cms/api/rest/populate-select#population) |
| `fields` | `string[]` | Selecting fields | [open](https://docs.strapi.io/cms/api/rest/populate-select#field-selection) |
| `sort` | `string[]` | Result sorting | [open](https://docs.strapi.io/cms/api/rest/sort-pagination#sorting) |
| `pagination` | `object` | Result pagination | [open](https://docs.strapi.io/cms/api/rest/sort-pagination#pagination) |

## 🔧 Development

1. Clone the repository
2. Install dependencies:
```bash
yarn
```
3. Run development mode:
```bash
yarn dev
```
4. Check types:
```bash
yarn check
```

## 🤝 Contributing

We welcome contributions to this project! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to:
* Follow the existing code style
* Write tests for new features
* Update documentation as needed
* Keep your PR focused and concise

## 📄 License

Copyright © [Sensinum](https://sensinum.com) &amp; [VirtusLab](https://virtuslab.com)

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
