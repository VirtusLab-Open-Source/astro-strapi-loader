import type { Loader, LoaderContext } from "astro/loaders";
import qs from "qs";
import { fetchContent } from "./strapi";

export interface StrapiLoaderOptions {
  url: string;
  token?: string;
}

export function strapiLoader(
  contentType: string,
  options: StrapiLoaderOptions,
  query: Record<string, unknown> = {},
): Loader {
  return {
    name: "strapi-loader",
    load: async (context: LoaderContext): Promise<void> => {
      const { store, logger, parseData, generateDigest } = context;

      logger.info(`[${contentType}] Loading data from Strapi`);
      const { url, token } = options;
      const response = await fetchContent({
        url,
        token,
        contentType,
        queryParams: query ? qs.stringify(query) : undefined,
      });
      store.clear();

      if (response.data.length === 0) {
        logger.info(`[${contentType}] No data found in Strapi`);
        return;
      }

      if (Array.isArray(response.data)) {
        await Promise.all(
          response.data.map(async (item: Record<string, unknown>) => {
            const data = await parseData({
              id: item.documentId as string,
              data: item,
            });
            const digest = generateDigest(data);
            store.set({ id: data.documentId as string, data, digest });
          }),
        );
      } else {
        const data = await parseData({
          id: response.data.documentId as string,
          data: response.data,
        });
        const digest = generateDigest(data);
        store.set({ id: data.documentId as string, data, digest });
      }
      logger.info(`[${contentType}] Data loaded from Strapi`);
    },
  };
}
