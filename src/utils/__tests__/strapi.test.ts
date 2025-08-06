import { fetchContentTypes, fetchContent, fetchComponents, generateStrapiSchema } from "../strapi";

// Mock fetch
global.fetch = jest.fn();

describe("Strapi Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchContentTypes", () => {
    it("should fetch content types successfully", async () => {
      const mockResponse = {
        data: [
          {
            apiID: "article",
            uid: "api::article.article",
            kind: "collectionType",
            collectionName: "articles",
            singularName: "article",
            pluralName: "articles",
            displayName: "Article",
            draftAndPublish: true,
            pluginOptions: {},
            visible: true,
            attributes: {},
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchContentTypes({
        url: "http://localhost:1337",
        token: "test-token",
      });

      expect(result).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:1337/api/content-type-builder/content-types",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          method: "GET",
        },
      );
    });

    it("should throw error on failed request", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      await expect(
        fetchContentTypes({
          url: "http://localhost:1337",
        }),
      ).rejects.toThrow("Failed to fetch from Strapi: Not Found");
    });
  });

  describe("fetchContent", () => {
    it("should fetch content successfully", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            documentId: "1",
            createdAt: "2021-01-01",
            updatedAt: "2021-01-01",
            title: "Test Article",
            content: "Test Content",
            slug: "test-article",
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchContent({
        url: "http://localhost:1337",
        contentType: "articles",
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:1337/api/articles",
        {
          headers: {
            "Content-Type": "application/json",
          },
          method: "GET",
        },
      );
    });

    it("should throw error on failed request", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      await expect(
        fetchContent({
          url: "http://localhost:1337",
          contentType: "articles",
        }),
      ).rejects.toThrow("Failed to fetch from Strapi: Not Found");
    });
  });

  describe("fetchComponents", () => {
    it("should fetch components successfully", async () => {
      const mockResponse = {
        data: [
          {
            uid: "layout.hero",
            category: "layout",
            apiId: "hero",
            schema: {
              displayName: "Hero",
              description: "Hero section component",
              icon: "star",
              collectionName: "components_layout_heroes",
              attributes: {
                title: {
                  type: "string",
                  required: true,
                },
                description: {
                  type: "text",
                  required: false,
                },
              },
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchComponents({
        url: "http://localhost:1337",
        token: "test-token",
      });

      expect(result).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:1337/api/content-type-builder/components",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          method: "GET",
        },
      );
    });

    it("should throw error on failed request", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized",
      });

      await expect(
        fetchComponents({
          url: "http://localhost:1337",
          token: "invalid-token",
        }),
      ).rejects.toThrow("Failed to fetch from Strapi: Unauthorized");
    });
  });

  describe("generateStrapiSchema", () => {
    it("should generate schema with content types and components", async () => {
      const mockContentTypesResponse = {
        data: [
          {
            apiID: "article",
            uid: "api::article.article",
            plugin: undefined,
            schema: {
              uid: "api::article.article",
              kind: "collectionType",
              collectionName: "articles",
              singularName: "article",
              pluralName: "articles",
              displayName: "Article",
              draftAndPublish: true,
              pluginOptions: {},
              visible: true,
              attributes: {
                title: {
                  type: "string",
                  required: true,
                },
                hero: {
                  type: "component",
                  repeatable: false,
                  component: "layout.hero",
                },
              },
            },
          },
        ],
      };

      const mockComponentsResponse = {
        data: [
          {
            uid: "layout.hero",
            category: "layout",
            apiId: "hero",
            schema: {
              displayName: "Hero",
              description: "Hero section component",
              icon: "star",
              collectionName: "components_layout_heroes",
              attributes: {
                title: {
                  type: "string",
                  required: true,
                },
              },
            },
          },
        ],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockContentTypesResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockComponentsResponse),
        });

      const result = await generateStrapiSchema({
        url: "http://localhost:1337",
        token: "test-token",
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("articles");
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        "http://localhost:1337/api/content-type-builder/content-types",
        expect.any(Object),
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "http://localhost:1337/api/content-type-builder/components",
        expect.any(Object),
      );
    });

    it("should handle errors when fetching content types", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Server Error",
      });

      await expect(
        generateStrapiSchema({
          url: "http://localhost:1337",
          token: "test-token",
        }),
      ).rejects.toThrow("Failed to fetch from Strapi: Server Error");
    });

    it("should handle errors when fetching components", async () => {
      const mockContentTypesResponse = {
        data: [],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockContentTypesResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: "Server Error",
        });

      await expect(
        generateStrapiSchema({
          url: "http://localhost:1337",
          token: "test-token",
        }),
      ).rejects.toThrow("Failed to fetch from Strapi: Server Error");
    });
  });
});
