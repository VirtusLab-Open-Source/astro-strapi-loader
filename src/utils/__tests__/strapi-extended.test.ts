import { generateCollection } from "../strapi";
import { strapiLoader } from "../loader";
import { z } from "zod";

jest.mock("../loader");
jest.mock("astro:content", () => ({
  defineCollection: jest.fn((config: any) => config),
}));

describe("Strapi Extended Features", () => {
  const mockOptions = {
    url: "http://test-strapi.com",
    token: "test-token",
  };

  const mockStrapiLoader = strapiLoader as jest.MockedFunction<typeof strapiLoader>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStrapiLoader.mockImplementation((contentType: string, options: any, _query?: any) => ({
      name: options.collectionName || "strapi-loader",
      load: jest.fn(),
    }));
  });

  describe("generateCollection with Extended Options", () => {
    const testSchema = z.object({
      documentId: z.string(),
      title: z.string(),
    });

    it("should create collection with custom name", () => {
      const collection = generateCollection(
        "pages",
        testSchema,
        mockOptions,
        { collectionName: "pagesEN" }
      );

      expect(collection).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ collectionName: "pagesEN" }),
        {}
      );
    });

    it("should create collection with custom ID generator", () => {
      const idGenerator = (data: Record<string, unknown>) => data.slug as string;
      const collection = generateCollection(
        "pages",
        testSchema,
        mockOptions,
        { idGenerator }
      );

      expect(collection).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ idGenerator }),
        {}
      );
    });

    it("should create collection with single locale", () => {
      const collection = generateCollection(
        "pages",
        testSchema,
        mockOptions,
        { locale: "en" }
      );

      expect(collection).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ locale: "en" }),
        {}
      );
    });

    it("should create collection with multiple locales", () => {
      const collection = generateCollection(
        "pages",
        testSchema,
        mockOptions,
        { locale: ["en", "de"] }
      );

      expect(collection).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ locale: ["en", "de"] }),
        {}
      );
    });

    it("should create collection with all options", () => {
      const idGenerator = (data: Record<string, unknown>) => data.slug as string;
      const collection = generateCollection(
        "pages",
        testSchema,
        mockOptions,
        {
          collectionName: "pagesMultilang",
          idGenerator,
          locale: ["en", "de"],
          query: { filters: { published: true } },
        }
      );

      expect(collection).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({
          collectionName: "pagesMultilang",
          idGenerator,
          locale: ["en", "de"],
        }),
        { filters: { published: true } }
      );
    });

    it("should create collection without additional options (backward compatible)", () => {
      const collection = generateCollection(
        "pages",
        testSchema,
        mockOptions
      );

      expect(collection).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ url: mockOptions.url }),
        {}
      );
    });
  });

  describe("StrapiCollection Interface", () => {
    it("should accept old format (backward compatibility)", () => {
      // Old format still works
      const collection: import("../strapi").StrapiCollection = {
        name: "homepage",
        query: { 
          populate: { seo: true },
          filters: { published: true }
        },
      };

      expect(collection.name).toBe("homepage");
      expect(collection.query).toEqual({ 
        populate: { seo: true },
        filters: { published: true }
      });
      expect(collection.collectionName).toBeUndefined();
      expect(collection.idGenerator).toBeUndefined();
      expect(collection.locale).toBeUndefined();
    });

    it("should accept configuration with all new fields", () => {
      const idGenerator = (data: Record<string, unknown>) => data.slug as string;
      
      const collection: import("../strapi").StrapiCollection = {
        name: "pages",
        query: { filters: { published: true } },
        collectionName: "pagesEN",
        idGenerator,
        locale: ["en", "de"],
      };

      expect(collection.name).toBe("pages");
      expect(collection.collectionName).toBe("pagesEN");
      expect(collection.locale).toEqual(["en", "de"]);
      expect(collection.idGenerator).toBe(idGenerator);
    });

    it("should accept configuration with single locale as string", () => {
      const collection: import("../strapi").StrapiCollection = {
        name: "pages",
        locale: "en",
      };

      expect(collection.locale).toBe("en");
    });

    it("should accept minimal configuration (backward compatible)", () => {
      const collection: import("../strapi").StrapiCollection = {
        name: "pages",
      };

      expect(collection.name).toBe("pages");
      expect(collection.query).toBeUndefined();
      expect(collection.collectionName).toBeUndefined();
      expect(collection.idGenerator).toBeUndefined();
      expect(collection.locale).toBeUndefined();
    });
  });

  describe("Multiple Collections from Same Endpoint", () => {
    it("should allow creating multiple collections from same endpoint", () => {
      const testSchema = z.object({
        documentId: z.string(),
        title: z.string(),
      });

      const collectionEN = generateCollection(
        "pages",
        testSchema,
        mockOptions,
        {
          collectionName: "pagesEN",
          locale: "en",
        }
      );

      const collectionDE = generateCollection(
        "pages",
        testSchema,
        mockOptions,
        {
          collectionName: "pagesDE",
          locale: "de",
        }
      );

      expect(collectionEN).toBeDefined();
      expect(collectionDE).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ collectionName: "pagesEN", locale: "en" }),
        {}
      );
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ collectionName: "pagesDE", locale: "de" }),
        {}
      );
    });

    it("should allow different ID generators for different collections", () => {
      const testSchema = z.object({
        documentId: z.string(),
        slug: z.string(),
        title: z.string(),
      });

      const idGeneratorSlug = (data: Record<string, unknown>) => data.slug as string;
      const idGeneratorId = (data: Record<string, unknown>) => data.documentId as string;

      const collection1 = generateCollection(
        "pages",
        testSchema,
        mockOptions,
        {
          collectionName: "pagesBySlug",
          idGenerator: idGeneratorSlug,
        }
      );

      const collection2 = generateCollection(
        "pages",
        testSchema,
        mockOptions,
        {
          collectionName: "pagesById",
          idGenerator: idGeneratorId,
        }
      );

      expect(collection1).toBeDefined();
      expect(collection2).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ collectionName: "pagesBySlug", idGenerator: idGeneratorSlug }),
        {}
      );
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ collectionName: "pagesById", idGenerator: idGeneratorId }),
        {}
      );
    });
  });

  describe("Locale Query Parameter Handling", () => {
    it("should pass locale to loader", () => {
      const testSchema = z.object({
        documentId: z.string(),
        title: z.string(),
      });

      const collection = generateCollection(
        "pages",
        testSchema,
        mockOptions,
        {
          locale: "en",
          query: { filters: { published: true } },
        }
      );

      expect(collection).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ locale: "en" }),
        { filters: { published: true } }
      );
    });

    it("should pass array of locales to loader", () => {
      const testSchema = z.object({
        documentId: z.string(),
        title: z.string(),
      });

      const collection = generateCollection(
        "pages",
        testSchema,
        mockOptions,
        {
          locale: ["en", "de", "fr"],
        }
      );

      expect(collection).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ locale: ["en", "de", "fr"] }),
        {}
      );
    });
  });

  describe("Backward Compatibility with generateCollections", () => {
    it("should work with classic array of objects format", () => {
      const testSchema = z.object({
        documentId: z.string(),
        title: z.string(),
      });

      // Simulate old usage pattern
      const homepageQuery = { populate: { seo: true } };
      const layoutQuery = { populate: { header: true, footer: true } };

      const homepage = generateCollection(
        "homepage",
        testSchema,
        mockOptions,
        { name: "homepage", query: homepageQuery }
      );

      const layout = generateCollection(
        "layout",
        testSchema,
        mockOptions,
        { name: "layout", query: layoutQuery }
      );

      expect(homepage).toBeDefined();
      expect(layout).toBeDefined();
      
      // Verify queries are passed correctly
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "homepage",
        expect.objectContaining({ url: mockOptions.url }),
        homepageQuery
      );
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "layout",
        expect.objectContaining({ url: mockOptions.url }),
        layoutQuery
      );
    });

    it("should allow mixing old and new format in single call", () => {
      const testSchema = z.object({
        documentId: z.string(),
        title: z.string(),
        slug: z.string().optional(),
      });

      const idGenerator = (data: Record<string, unknown>) => data.slug as string;

      // Mix old and new formats
      const collections = [
        // Old format - just name and query
        generateCollection(
          "homepage",
          testSchema,
          mockOptions,
          { name: "homepage", query: { populate: { seo: true } } }
        ),
        // New format with locale
        generateCollection(
          "pages",
          testSchema,
          mockOptions,
          { 
            name: "pages", 
            collectionName: "pagesEN",
            locale: "en",
            query: { sort: ['publishedAt:desc'] }
          }
        ),
        // New format with custom ID
        generateCollection(
          "blog-posts",
          testSchema,
          mockOptions,
          { 
            name: "blog-posts",
            idGenerator,
            query: { filters: { published: true } }
          }
        ),
        // New format with all features
        generateCollection(
          "articles",
          testSchema,
          mockOptions,
          { 
            name: "articles",
            collectionName: "articlesDE",
            locale: ["de", "fr"],
            idGenerator,
          }
        ),
      ];

      // All should be defined
      expect(collections[0]).toBeDefined(); // homepage - old format
      expect(collections[1]).toBeDefined(); // pagesEN - new with locale
      expect(collections[2]).toBeDefined(); // blog-posts - new with idGenerator
      expect(collections[3]).toBeDefined(); // articlesDE - new with all

      // Verify each was called correctly
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "homepage",
        expect.objectContaining({ url: mockOptions.url }),
        { populate: { seo: true } }
      );

      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ 
          collectionName: "pagesEN",
          locale: "en"
        }),
        { sort: ['publishedAt:desc'] }
      );

      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "blog-posts",
        expect.objectContaining({ idGenerator }),
        { filters: { published: true } }
      );

      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "articles",
        expect.objectContaining({ 
          collectionName: "articlesDE",
          locale: ["de", "fr"],
          idGenerator
        }),
        {}
      );
    });
  });

  describe("Integration Example Scenarios", () => {
    it("scenario: multilingual blog with custom slugs", () => {
      const testSchema = z.object({
        documentId: z.string(),
        slug: z.string(),
        title: z.string(),
      });

      const idGenerator = (data: Record<string, unknown>) => data.slug as string;

      const blogEN = generateCollection(
        "blog-posts",
        testSchema,
        mockOptions,
        {
          collectionName: "blogEN",
          locale: "en",
          idGenerator,
          query: { sort: ["publishedAt:desc"] },
        }
      );

      const blogDE = generateCollection(
        "blog-posts",
        testSchema,
        mockOptions,
        {
          collectionName: "blogDE",
          locale: "de",
          idGenerator,
          query: { sort: ["publishedAt:desc"] },
        }
      );

      expect(blogEN).toBeDefined();
      expect(blogDE).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "blog-posts",
        expect.objectContaining({ collectionName: "blogEN", locale: "en" }),
        { sort: ["publishedAt:desc"] }
      );
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "blog-posts",
        expect.objectContaining({ collectionName: "blogDE", locale: "de" }),
        { sort: ["publishedAt:desc"] }
      );
    });

    it("scenario: single collection for multiple languages", () => {
      const testSchema = z.object({
        documentId: z.string(),
        slug: z.string(),
        title: z.string(),
      });

      const idGenerator = (data: Record<string, unknown>) => data.slug as string;

      const pagesMultilang = generateCollection(
        "pages",
        testSchema,
        mockOptions,
        {
          collectionName: "pagesAll",
          locale: ["en", "de", "fr"],
          idGenerator,
        }
      );

      expect(pagesMultilang).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({ 
          collectionName: "pagesAll", 
          locale: ["en", "de", "fr"],
          idGenerator
        }),
        {}
      );
    });

    it("scenario: categories with custom ID based on path", () => {
      const testSchema = z.object({
        documentId: z.string(),
        category: z.string(),
        slug: z.string(),
        title: z.string(),
      });

      const idGenerator = (data: Record<string, unknown>) =>
        `${data.category}/${data.slug}`;

      const posts = generateCollection(
        "posts",
        testSchema,
        mockOptions,
        {
          idGenerator,
          query: { populate: "*" },
        }
      );

      expect(posts).toBeDefined();
      expect(mockStrapiLoader).toHaveBeenCalledWith(
        "posts",
        expect.objectContaining({ idGenerator }),
        { populate: "*" }
      );
    });
  });
});

