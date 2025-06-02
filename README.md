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

## Table of Contents


## 📋 Table of Contents

* [Requirements](#-requirements)
* [Installation](#-installation)
* [Features](#-features)
* [Usage](#-usage)
* [Configuration](#-configuration)
* [Development](#-development)
* [Contributing](#-contributing)
* [License](#-license)

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

## 🖥️ Usage

1. Add the integration to your `src/content.config.ts`:

```ts
import { generateCollections } from '@sensinum/astro-strapi-loader';

let strapiCollections: any = {};

try {
  strapiCollections = await generateCollections({
    url: import.meta.env.STRAPI_URL,
    token: import.meta.env.STRAPI_TOKEN,
  }, [{ // leave empty [] to fetch all the collections based on default Strapi settings
    name: "my-collection",
    query: {
      populate: {
        // ...
      },
    },
  }, 'yet-another-collection']);
} catch (error) {
  console.error(error);
}

export const collections = {
    ...strapiCollections,
};
```

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

> **⚠️ Note:** The token must have **read access** to both the **Content API** and the **Content-Type Builder API** *(ONLY to the "Get Content Types" endpoint)*.

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