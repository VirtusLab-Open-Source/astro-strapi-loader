import { fetchContentTypes, fetchContent } from "../strapi";

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
});
