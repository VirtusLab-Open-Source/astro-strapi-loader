import type { Loader, LoaderContext } from "astro/loaders";
import qs from "qs";
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
}

export function strapiLoader(
  contentType: string,
  options: StrapiLoaderOptions,
  query: Record<string, unknown> = {},
) {
  return ({
    name: options.collectionName || "strapi-loader",
    load: async (context: LoaderContext): Promise<void> => {
      const { store, logger, parseData, generateDigest } = context;
      const collectionName = options.collectionName || contentType;

      logger.info(`[${collectionName}] Loading data from Strapi...`);
      const { url, token, idGenerator, locale, headers } = options;

      store.clear();

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
          { store, logger, parseData, generateDigest, idGenerator, collectionName }
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
        await storeLocaleData(
          localeDataMap,
          { store, parseData, generateDigest, idGenerator }
        );
      }

      logger.info(`[${collectionName}] Loading data from Strapi... DONE`);
    },
  }) satisfies Loader;
}

async function fetchAndStoreData(
  fetchOptions: {
    url: string;
    token?: string;
    contentType: string;
    query: Record<string, unknown>;
    headers?: Record<string, string>;
  },
  storeOptions: {
    store: LoaderContext['store'];
    logger: LoaderContext['logger'];
    parseData: LoaderContext['parseData'];
    generateDigest: LoaderContext['generateDigest'];
    idGenerator?: (data: Record<string, unknown>) => string;
    collectionName: string;
  }
): Promise<void> {
  const { url, token, contentType, query, headers } = fetchOptions;
  const { store, logger, parseData, generateDigest, idGenerator, collectionName } = storeOptions;

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
        const itemId = getItemId(item);
        const data = await parseData({
          id: itemId,
          data: item,
        });
        const digest = generateDigest(data);
        store.set({ id: itemId, data, digest });
      }),
    );
  } else {
    const itemId = getItemId(response.data);
    const data = await parseData({
      id: itemId,
      data: response.data,
    });
    const digest = generateDigest(data);
    store.set({ id: itemId, data, digest });
  }
}

async function storeLocaleData(
  localeDataMap: Record<string, any>,
  storeOptions: {
    store: LoaderContext['store'];
    parseData: LoaderContext['parseData'];
    generateDigest: LoaderContext['generateDigest'];
    idGenerator?: (data: Record<string, unknown>) => string;
  }
): Promise<void> {
  const { store, parseData, generateDigest, idGenerator } = storeOptions;

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
          const itemId = getItemId(item, locale);
          const parsedData = await parseData({
            id: itemId,
            data: { ...item, _locale: locale },
          });
          const digest = generateDigest(parsedData);
          store.set({ id: itemId, data: parsedData, digest });
        }),
      );
    } else {
      const itemId = getItemId(data, locale);
      const parsedData = await parseData({
        id: itemId,
        data: { ...data, _locale: locale },
      });
      const digest = generateDigest(parsedData);
      store.set({ id: itemId, data: parsedData, digest });
    }
  }
}
