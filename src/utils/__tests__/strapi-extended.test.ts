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

    it("powinien utworzyć kolekcję z niestandardową nazwą", () => {
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

    it("powinien utworzyć kolekcję z niestandardowym generatorem ID", () => {
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

    it("powinien utworzyć kolekcję z pojedynczą locale", () => {
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

    it("powinien utworzyć kolekcję z wieloma locale", () => {
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

    it("powinien utworzyć kolekcję ze wszystkimi opcjami", () => {
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

    it("powinien utworzyć kolekcję bez dodatkowych opcji (kompatybilność wsteczna)", () => {
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
    it("powinien akceptować konfigurację z wszystkimi nowymi polami", () => {
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

    it("powinien akceptować konfigurację z pojedynczą locale jako string", () => {
      const collection: import("../strapi").StrapiCollection = {
        name: "pages",
        locale: "en",
      };

      expect(collection.locale).toBe("en");
    });

    it("powinien akceptować minimalną konfigurację (kompatybilność wsteczna)", () => {
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
    it("powinien pozwolić na utworzenie wielu kolekcji z tego samego endpointu", () => {
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

    it("powinien pozwolić na różne generatory ID dla różnych kolekcji", () => {
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
    it("powinien przekazać locale do loadera", () => {
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

    it("powinien przekazać tablicę locales do loadera", () => {
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

  describe("Integration Example Scenarios", () => {
    it("scenariusz: wielojęzyczny blog z niestandardowymi slugami", () => {
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

    it("scenariusz: jedna kolekcja dla wielu języków", () => {
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

    it("scenariusz: kategorie z niestandardowym ID na podstawie ścieżki", () => {
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

