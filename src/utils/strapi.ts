import { defineCollection } from "astro:content";
import type { CollectionConfig } from "astro/content/config";
import { z } from "astro/zod";

import type { StrapiComponent, StrapiContentType, StrapiResponse } from "../types/strapi";
import { StrapiSchemaGenerator } from "./schema";
import { strapiLoader } from "./loader";

export interface StrapiRequestOptions {
  url: string;
  token?: string;
  path: string;
  queryParams?: string;
  headers?: Record<string, string>;
}

export interface StrapiCollectionsGeneratorOptions
  extends Omit<StrapiRequestOptions, "path"> {
    strict?: boolean;
}

export interface StrapiCollection {
  name: string;
  query?: Record<string, any>;
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

async function strapiRequest<T>(options: StrapiRequestOptions): Promise<T> {
  const { url, token, path, headers: extraHeaders = {} } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${url}/api/${path}`, {
    headers,
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from Strapi: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchContentTypes(
  options: Omit<StrapiRequestOptions, "path">,
): Promise<Array<StrapiContentType>> {
  const contentTypes = await strapiRequest<
    StrapiResponse<Array<StrapiContentType>>
  >({
    ...options,
    path: "content-type-builder/content-types",
  });
  return contentTypes.data.filter((contentType) => !contentType.plugin);
}

export async function fetchComponents(
  options: Omit<StrapiRequestOptions, "path">,
): Promise<Array<StrapiComponent>> {
  const components = await strapiRequest<
    StrapiResponse<Array<StrapiComponent>>
  >({
    ...options,
    path: "content-type-builder/components",
  });
  return components.data;
}

export async function fetchContent(
  options: Omit<StrapiRequestOptions, "path"> & { contentType: string },
): Promise<any> {
  const { url, token, contentType, queryParams, headers } = options;
  const path = `${contentType}${queryParams ? `/?${queryParams}` : ""}`;
  return strapiRequest({
    url,
    token,
    path,
    headers,
  });
}

export async function generateStrapiSchema(
  options: Omit<StrapiCollectionsGeneratorOptions, "path">,
): Promise<Record<string, z.ZodObject<any>>> {
  const { url, token, strict } = options;

  const contentTypes = await fetchContentTypes({ url, token });
  const components = await fetchComponents({ url, token });
  const schemaGenerator = new StrapiSchemaGenerator(contentTypes, components, strict);
  return schemaGenerator.generateAllSchemas();
}

export function generateCollection(
  contentType: string,
  schema: z.ZodObject<any>,
  options: StrapiCollectionsGeneratorOptions,
  collectionConfig: Partial<StrapiCollection> = {},
): CollectionConfig<any> {
  const { query = {}, collectionName, idGenerator, locale } = collectionConfig;
  const loaderOptions = {
    ...options,
    collectionName,
    idGenerator,
    locale,
  };
  return defineCollection({
    loader: strapiLoader(contentType, loaderOptions, query),
    schema,
  });
}

export async function generateCollections(
  options: StrapiCollectionsGeneratorOptions,
  reqCollections: Array<StrapiCollection | string> = [],
): Promise<Record<string, CollectionConfig<any>>> {
  const schema = await generateStrapiSchema(options);
  const allCollections = Object.keys(schema);
  const demandedCollections =
    reqCollections.length > 0
      ? allCollections.filter((collection) =>
          reqCollections
            .map((reqCollection) =>
              typeof reqCollection === "string"
                ? reqCollection
                : reqCollection.name,
            )
            .includes(collection),
        )
      : allCollections;
  const collections = demandedCollections.reduce(
    (acc, collection: string) => {
      const reqCollection = reqCollections.find((rc) =>
        typeof rc === "string" ? rc === collection : rc.name === collection,
      ) as StrapiCollection | undefined;

      const collectionConfig: Partial<StrapiCollection> =
        typeof reqCollection === "string" ? {} : reqCollection || {};

      const collectionKey = collectionConfig.collectionName || collection;

      return {
        ...acc,
        [collectionKey]: generateCollection(
          collection,
          schema[collection],
          options,
          collectionConfig,
        ),
      };
    },
    {} as Record<string, CollectionConfig<any>>,
  );
  return collections;
}
