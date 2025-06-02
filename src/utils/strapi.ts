import { z, defineCollection, CollectionConfig } from "astro:content";

import type { StrapiContentType, StrapiResponse } from "../types/strapi";
import { StrapiSchemaGenerator } from "./schema";
import { strapiLoader } from "./loader";

export interface StrapiRequestOptions {
  url: string;
  token?: string;
  path: string;
  queryParams?: string;
}

export interface StrapiCollectionsGeneratorOptions
  extends StrapiRequestOptions {
  strict?: boolean;
}

export interface StrapiCollection {
  name: string;
  query: Record<string, any>;
}

async function strapiRequest<T>(options: StrapiRequestOptions): Promise<T> {
  const { url, token, path } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
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

export async function fetchContent(
  options: Omit<StrapiRequestOptions, "path"> & { contentType: string },
): Promise<any> {
  const { url, token, contentType, queryParams } = options;
  const path = `${contentType}${queryParams ? `/?${queryParams}` : ""}`;
  return strapiRequest({
    url,
    token,
    path,
  });
}

export async function generateStrapiSchema(
  options: Omit<StrapiCollectionsGeneratorOptions, "path">,
): Promise<Record<string, z.ZodObject<any>>> {
  const { url, token, strict } = options;

  const contentTypes = await fetchContentTypes({ url, token });
  const schemaGenerator = new StrapiSchemaGenerator(contentTypes, strict);
  return schemaGenerator.generateAllSchemas();
}

export function generateCollection(
  contentType: string,
  schema: z.ZodObject<any>,
  options: StrapiCollectionsGeneratorOptions,
  query: Record<string, any> = {},
): CollectionConfig<any> {
  return defineCollection({
    loader: strapiLoader(contentType, options, query),
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
        typeof rc === "string" ? rc : rc.name === collection,
      ) as StrapiCollection | undefined;
      const query =
        typeof reqCollection === "string" ? {} : reqCollection?.query || {};
      return {
        ...acc,
        [collection]: generateCollection(
          collection,
          schema[collection],
          options,
          query,
        ),
      };
    },
    {} as Record<string, CollectionConfig<any>>,
  );
  return collections;
}
