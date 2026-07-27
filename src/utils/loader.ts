import type { Loader, LoaderContext } from "astro/loaders";
import qs from "qs";
import {
  buildEntryRenderedContent,
  type StrapiMarkdownOptions,
} from "./markdown";
import { fetchContent } from "./strapi";

export interface StrapiLoaderOptions {
  url: string;
  token?: string;
  headers?: Record<string, string>;
  /**
   * Custom name for the collection. Allows multiple collections from the same endpoint.
   */
  collectionName?: string;
  /**
   * Custom function to generate ID from item data.
   * Default: uses documentId field.
   */
  idGenerator?: (data: Record<string, unknown>) => string;
  /**
   * Locale configuration:
   * - undefined: no locale parameter (default behavior)
   * - string: single locale (e.g., 'en')
   * - string[]: multiple locales (e.g., ['en', 'de']) - returns structure like { 'en': items, 'de': items }
   */
  locale?: string | string[];
  /**
   * Opt-in Markdown / HTML body rendering via Astro's Content Layer.
   * When set, entries get `rendered` (and usually `body`) so `render()` / `<Content />` work
   * with the project's markdown config. When omitted, behavior is unchanged.
   */
  markdown?: StrapiMarkdownOptions;
}

type StoreHelpers = {
  store: LoaderContext["store"];
  logger: LoaderContext["logger"];
  parseData: LoaderContext["parseData"];
  generateDigest: LoaderContext["generateDigest"];
  renderMarkdown?: LoaderContext["renderMarkdown"];
  idGenerator?: (data: Record<string, unknown>) => string;
  markdown?: StrapiMarkdownOptions;
  collectionName: string;
};

export function strapiLoader(
  contentType: string,
  options: StrapiLoaderOptions,
  query: Record<string, unknown> = {},
) {
  return ({
    name: options.collectionName || "strapi-loader",
    load: async (context: LoaderContext): Promise<void> => {
      const { store, logger, parseData, generateDigest, renderMarkdown } =
        context;
      const collectionName = options.collectionName || contentType;

      logger.info(`[${collectionName}] Loading data from Strapi...`);
      const { url, token, idGenerator, locale, headers, markdown } = options;

      store.clear();

      const storeHelpers: StoreHelpers = {
        store,
        logger,
        parseData,
        generateDigest,
        renderMarkdown,
        idGenerator,
        markdown,
        collectionName,
      };

      // Determine which locales to fetch
      const localesToFetch: string[] | undefined = locale
        ? Array.isArray(locale)
          ? locale
          : [locale]
        : undefined;

      // If no locales specified, fetch with the original query
      if (!localesToFetch) {
        await fetchAndStoreData(
          { url, token, contentType, query, headers },
          storeHelpers,
        );
      } else {
        // Fetch data for each locale separately
        const localeDataMap: Record<string, any> = {};

        for (const loc of localesToFetch) {
          const localeQuery = { ...query, locale: loc };
          const response = await fetchContent({
            url,
            token,
            contentType,
            queryParams: qs.stringify(localeQuery),
            headers,
          });

          if (response.data && response.data.length > 0) {
            localeDataMap[loc] = response.data;
          } else if (response.data && !Array.isArray(response.data)) {
            localeDataMap[loc] = response.data;
          }
        }

        if (Object.keys(localeDataMap).length === 0) {
          logger.info(`[${collectionName}] No data found in Strapi`);
          return;
        }

        // Store data with locale structure
        await storeLocaleData(localeDataMap, storeHelpers);
      }

      logger.info(`[${collectionName}] Loading data from Strapi... DONE`);
    },
  }) satisfies Loader;
}

async function storeParsedEntry(
  item: Record<string, unknown>,
  itemId: string,
  helpers: StoreHelpers,
): Promise<void> {
  const {
    store,
    parseData,
    generateDigest,
    renderMarkdown,
    markdown,
  } = helpers;

  const data = await parseData({
    id: itemId,
    data: item,
  });

  const { body, rendered } = await buildEntryRenderedContent(
    data as Record<string, unknown>,
    markdown,
    renderMarkdown,
  );

  const digest = generateDigest(
    rendered
      ? { ...(data as Record<string, unknown>), __renderedHtml: rendered.html }
      : (data as Record<string, unknown>),
  );

  store.set({
    id: itemId,
    data,
    digest,
    ...(body !== undefined ? { body } : {}),
    ...(rendered !== undefined ? { rendered } : {}),
  });
}

async function fetchAndStoreData(
  fetchOptions: {
    url: string;
    token?: string;
    contentType: string;
    query: Record<string, unknown>;
    headers?: Record<string, string>;
  },
  storeHelpers: StoreHelpers,
): Promise<void> {
  const { url, token, contentType, query, headers } = fetchOptions;
  const { logger, idGenerator, collectionName } = storeHelpers;

  const response = await fetchContent({
    url,
    token,
    contentType,
    queryParams: query ? qs.stringify(query) : undefined,
    headers,
  });

  if (response.data.length === 0) {
    logger.info(`[${collectionName}] No data found in Strapi`);
    return;
  }

  const getItemId = (item: Record<string, unknown>): string => {
    if (idGenerator) {
      return idGenerator(item);
    }
    return item.documentId as string;
  };

  if (Array.isArray(response.data)) {
    await Promise.all(
      response.data.map(async (item: Record<string, unknown>) => {
        await storeParsedEntry(item, getItemId(item), storeHelpers);
      }),
    );
  } else {
    await storeParsedEntry(
      response.data,
      getItemId(response.data),
      storeHelpers,
    );
  }
}

async function storeLocaleData(
  localeDataMap: Record<string, any>,
  storeHelpers: StoreHelpers,
): Promise<void> {
  const { idGenerator } = storeHelpers;

  const getItemId = (item: Record<string, unknown>, locale: string): string => {
    if (idGenerator) {
      return `${locale}:${idGenerator(item)}`;
    }
    return `${locale}:${item.documentId as string}`;
  };

  for (const [locale, data] of Object.entries(localeDataMap)) {
    if (Array.isArray(data)) {
      await Promise.all(
        data.map(async (item: Record<string, unknown>) => {
          await storeParsedEntry(
            { ...item, _locale: locale },
            getItemId(item, locale),
            storeHelpers,
          );
        }),
      );
    } else {
      await storeParsedEntry(
        { ...data, _locale: locale },
        getItemId(data, locale),
        storeHelpers,
      );
    }
  }
}
