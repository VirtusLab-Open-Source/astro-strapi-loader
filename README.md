# Astro Strapi Loader

Integracja Astro z CMS Strapi, która umożliwia łatwe ładowanie danych z API Strapi.

## Instalacja

```bash
npm install astro-strapi-loader
# lub
yarn add astro-strapi-loader
```

## Użycie

1. Dodaj integrację do pliku `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import strapiLoader from 'astro-strapi-loader';

export default defineConfig({
  integrations: [
    strapiLoader({
      apiUrl: 'http://localhost:1337/api',
      token: 'your-strapi-token' // opcjonalnie
    })
  ]
});
```

2. Użyj w komponencie Astro:

```astro
---
import { getStrapiData } from 'astro-strapi-loader';

const data = await getStrapiData('articles');
---

<div>
  {data.map(article => (
    <article>
      <h2>{article.attributes.title}</h2>
      <p>{article.attributes.description}</p>
    </article>
  ))}
</div>
```

## Konfiguracja

### Opcje

- `apiUrl` (wymagane): URL do API Strapi
- `token` (opcjonalne): Token dostępu do API Strapi

## Licencja

MIT 