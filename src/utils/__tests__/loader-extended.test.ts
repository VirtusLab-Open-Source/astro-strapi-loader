import { LoaderContext } from "astro/loaders";
import { strapiLoader } from "../loader";
import { fetchContent } from "../strapi";

// Mock fetchContent
jest.mock("../strapi", () => ({
  fetchContent: jest.fn(),
}));

describe("strapiLoader - Extended Features", () => {
  const mockContext = {
    store: {
      clear: jest.fn(),
      set: jest.fn(),
    },
    logger: {
      info: jest.fn(),
    },
    parseData: jest.fn(({ data }) => Promise.resolve(data)),
    generateDigest: jest.fn(() => "test-digest"),
    meta: {},
  };

  const options = {
    url: "http://test-strapi.com",
    token: "test-token",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchContent as jest.Mock).mockReset();
    mockContext.store.clear.mockClear();
    mockContext.store.set.mockClear();
    mockContext.logger.info.mockClear();
    mockContext.parseData.mockClear();
    mockContext.generateDigest.mockClear();
  });

  describe("Custom ID Generator", () => {
    it("should use custom ID generator", async () => {
      const mockData = [
        { documentId: "1", slug: "test-slug-1", title: "Test Title 1" },
        { documentId: "2", slug: "test-slug-2", title: "Test Title 2" },
      ];

      (fetchContent as jest.Mock).mockResolvedValueOnce({
        data: mockData,
      });

      const idGenerator = (data: Record<string, unknown>) => data.slug as string;
      const loader = strapiLoader("test-content", { ...options, idGenerator });
      await loader.load(mockContext as unknown as LoaderContext);

      expect(mockContext.store.set).toHaveBeenCalledWith({
        id: "test-slug-1",
        data: mockData[0],
        digest: "test-digest",
      });
      expect(mockContext.store.set).toHaveBeenCalledWith({
        id: "test-slug-2",
        data: mockData[1],
        digest: "test-digest",
      });
    });

    it("should use complex ID generator", async () => {
      const mockData = [
        { documentId: "1", category: "blog", slug: "post-1" },
      ];

      (fetchContent as jest.Mock).mockResolvedValueOnce({
        data: mockData,
      });

      const idGenerator = (data: Record<string, unknown>) => 
        `${data.category}/${data.slug}`;
      const loader = strapiLoader("test-content", { ...options, idGenerator });
      await loader.load(mockContext as unknown as LoaderContext);

      expect(mockContext.store.set).toHaveBeenCalledWith({
        id: "blog/post-1",
        data: mockData[0],
        digest: "test-digest",
      });
    });

    it("should work for single item with custom ID", async () => {
      const mockData = {
        documentId: "1",
        slug: "single-page",
        title: "Single Page",
      };

      (fetchContent as jest.Mock).mockResolvedValueOnce({
        data: mockData,
      });

      const idGenerator = (data: Record<string, unknown>) => data.slug as string;
      const loader = strapiLoader("test-content", { ...options, idGenerator });
      await loader.load(mockContext as unknown as LoaderContext);

      expect(mockContext.store.set).toHaveBeenCalledWith({
        id: "single-page",
        data: mockData,
        digest: "test-digest",
      });
    });
  });

  describe("Custom Collection Name", () => {
    it("should use custom collection name", async () => {
      const mockData = [
        { documentId: "1", title: "Test Title 1" },
      ];

      (fetchContent as jest.Mock).mockResolvedValueOnce({
        data: mockData,
      });

      const loader = strapiLoader("pages", { 
        ...options, 
        collectionName: "pagesEN" 
      });
      
      expect(loader.name).toBe("pagesEN");
      await loader.load(mockContext as unknown as LoaderContext);

      expect(mockContext.logger.info).toHaveBeenCalledWith(
        "[pagesEN] Loading data from Strapi..."
      );
    });

    it("should use default name when collectionName is not provided", async () => {
      const mockData = [
        { documentId: "1", title: "Test Title 1" },
      ];

      (fetchContent as jest.Mock).mockResolvedValueOnce({
        data: mockData,
      });

      const loader = strapiLoader("pages", options);
      
      expect(loader.name).toBe("strapi-loader");
    });
  });

  describe("Locale Support", () => {
    it("should handle single locale", async () => {
      const mockData = [
        { documentId: "en-1", title: "English Title", locale: "en" },
        { documentId: "en-2", title: "English Title 2", locale: "en" },
      ];

      (fetchContent as jest.Mock).mockResolvedValueOnce({
        data: mockData,
      });

      const loader = strapiLoader("pagesLocale", { 
        ...options, 
        locale: "en" 
      });
      await loader.load(mockContext as unknown as LoaderContext);

      expect(fetchContent).toHaveBeenCalledWith({
        url: options.url,
        token: options.token,
        contentType: "pagesLocale",
        queryParams: "locale=en",
      });

      // With locale, we store items with locale-prefixed IDs
      expect(mockContext.store.set).toHaveBeenCalledTimes(2);
      const setCalls = (mockContext.store.set as jest.Mock).mock.calls;
      expect(setCalls[0][0]).toMatchObject({
        id: "en:en-1",
        data: expect.objectContaining({ documentId: "en-1", _locale: "en" }),
        digest: "test-digest",
      });
      expect(setCalls[1][0]).toMatchObject({
        id: "en:en-2",
        data: expect.objectContaining({ documentId: "en-2", _locale: "en" }),
        digest: "test-digest",
      });
    });

    it("should handle multiple locales", async () => {
      const mockDataEN = [
        { documentId: "doc1", title: "English Title", locale: "en" },
      ];
      const mockDataDE = [
        { documentId: "doc1", title: "German Title", locale: "de" },
      ];

      (fetchContent as jest.Mock)
        .mockResolvedValueOnce({ data: mockDataEN })
        .mockResolvedValueOnce({ data: mockDataDE });

      const loader = strapiLoader("pages", { 
        ...options, 
        locale: ["en", "de"] 
      });
      await loader.load(mockContext as unknown as LoaderContext);

      expect(fetchContent).toHaveBeenCalledTimes(2);
      expect(fetchContent).toHaveBeenCalledWith({
        url: options.url,
        token: options.token,
        contentType: "pages",
        queryParams: "locale=en",
      });
      expect(fetchContent).toHaveBeenCalledWith({
        url: options.url,
        token: options.token,
        contentType: "pages",
        queryParams: "locale=de",
      });

      expect(mockContext.store.set).toHaveBeenCalledTimes(2);
      const setCalls = (mockContext.store.set as jest.Mock).mock.calls;
      expect(setCalls[0][0]).toMatchObject({
        id: "en:doc1",
        data: expect.objectContaining({ documentId: "doc1", _locale: "en" }),
        digest: "test-digest",
      });
      expect(setCalls[1][0]).toMatchObject({
        id: "de:doc1",
        data: expect.objectContaining({ documentId: "doc1", _locale: "de" }),
        digest: "test-digest",
      });
    });

    it("should handle multiple locales with empty response for one", async () => {
      const mockDataEN = [
        { documentId: "doc2", title: "English Title", locale: "en" },
      ];

      (fetchContent as jest.Mock)
        .mockResolvedValueOnce({ data: mockDataEN })
        .mockResolvedValueOnce({ data: [] });

      const loader = strapiLoader("pages", { 
        ...options, 
        locale: ["en", "de"] 
      });
      await loader.load(mockContext as unknown as LoaderContext);

      expect(fetchContent).toHaveBeenCalledTimes(2);
      expect(mockContext.store.set).toHaveBeenCalledTimes(1);
      const setCalls = (mockContext.store.set as jest.Mock).mock.calls;
      expect(setCalls[0][0]).toMatchObject({
        id: "en:doc2",
        data: expect.objectContaining({ documentId: "doc2", _locale: "en" }),
        digest: "test-digest",
      });
    });

    it("should handle multiple locales for single type", async () => {
      const mockDataEN = { documentId: "home1", title: "English Title", locale: "en" };
      const mockDataDE = { documentId: "home1", title: "German Title", locale: "de" };

      (fetchContent as jest.Mock)
        .mockResolvedValueOnce({ data: mockDataEN })
        .mockResolvedValueOnce({ data: mockDataDE });

      const loader = strapiLoader("homepage", { 
        ...options, 
        locale: ["en", "de"] 
      });
      await loader.load(mockContext as unknown as LoaderContext);

      expect(mockContext.store.set).toHaveBeenCalledTimes(2);
      const setCalls = (mockContext.store.set as jest.Mock).mock.calls;
      expect(setCalls[0][0]).toMatchObject({
        id: "en:home1",
        data: expect.objectContaining({ documentId: "home1", _locale: "en" }),
        digest: "test-digest",
      });
      expect(setCalls[1][0]).toMatchObject({
        id: "de:home1",
        data: expect.objectContaining({ documentId: "home1", _locale: "de" }),
        digest: "test-digest",
      });
    });

    it("should handle situation when all locales are empty", async () => {
      (fetchContent as jest.Mock)
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] });

      const loader = strapiLoader("emptyPages", { 
        ...options, 
        locale: ["en", "de"] 
      });
      await loader.load(mockContext as unknown as LoaderContext);

      expect(mockContext.store.set).not.toHaveBeenCalled();
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        "[emptyPages] No data found in Strapi"
      );
    });

    it("should combine locale with other query parameters", async () => {
      const mockData = [
        { documentId: "pub1", title: "Published Title", locale: "en" },
      ];

      (fetchContent as jest.Mock).mockResolvedValueOnce({
        data: mockData,
      });

      const query = { 
        filters: { publishedAt: { $notNull: true } }
      };

      const loader = strapiLoader("publishedPages", { 
        ...options, 
        locale: "en" 
      }, query);
      await loader.load(mockContext as unknown as LoaderContext);

      expect(fetchContent).toHaveBeenCalledWith(
        expect.objectContaining({
          queryParams: expect.stringContaining("locale=en"),
        })
      );
    });
  });

  describe("Combined Features", () => {
    it("should work with custom ID, collection name and locale", async () => {
      const mockDataEN = [
        { documentId: "about-en", slug: "about", title: "About Us" },
      ];
      const mockDataDE = [
        { documentId: "about-de", slug: "uber-uns", title: "Über Uns" },
      ];

      (fetchContent as jest.Mock)
        .mockResolvedValueOnce({ data: mockDataEN })
        .mockResolvedValueOnce({ data: mockDataDE });

      const idGenerator = (data: Record<string, unknown>) => data.slug as string;
      const loader = strapiLoader("multiPages", { 
        ...options, 
        locale: ["en", "de"],
        collectionName: "pagesMultilang",
        idGenerator,
      });
      
      expect(loader.name).toBe("pagesMultilang");
      await loader.load(mockContext as unknown as LoaderContext);

      expect(mockContext.store.set).toHaveBeenCalledTimes(2);
      const setCalls = (mockContext.store.set as jest.Mock).mock.calls;
      expect(setCalls[0][0]).toMatchObject({
        id: "en:about",
        data: expect.objectContaining({ slug: "about", _locale: "en" }),
        digest: "test-digest",
      });
      expect(setCalls[1][0]).toMatchObject({
        id: "de:uber-uns",
        data: expect.objectContaining({ slug: "uber-uns", _locale: "de" }),
        digest: "test-digest",
      });
    });

    it("should work with custom ID and single locale", async () => {
      const mockData = [
        { documentId: "post-doc-1", slug: "post-1", title: "Post 1" },
      ];

      (fetchContent as jest.Mock).mockResolvedValueOnce({
        data: mockData,
      });

      const idGenerator = (data: Record<string, unknown>) => data.slug as string;
      const loader = strapiLoader("blogPosts", { 
        ...options, 
        locale: "en",
        idGenerator,
      });
      await loader.load(mockContext as unknown as LoaderContext);

      expect(mockContext.store.set).toHaveBeenCalledTimes(1);
      const setCalls = (mockContext.store.set as jest.Mock).mock.calls;
      expect(setCalls[0][0]).toMatchObject({
        id: "en:post-1",
        data: expect.objectContaining({ slug: "post-1", _locale: "en" }),
        digest: "test-digest",
      });
    });
  });

  describe("Backward Compatibility", () => {
    it("should work without new options (backward compatible)", async () => {
      const mockData = [
        { documentId: "bc-1", title: "Test Title 1" },
        { documentId: "bc-2", title: "Test Title 2" },
      ];

      (fetchContent as jest.Mock).mockResolvedValueOnce({
        data: mockData,
      });

      const loader = strapiLoader("backwardCompat", options);
      await loader.load(mockContext as unknown as LoaderContext);

      expect(mockContext.store.set).toHaveBeenCalledTimes(2);
      const setCalls = (mockContext.store.set as jest.Mock).mock.calls;
      expect(setCalls[0][0]).toMatchObject({
        id: "bc-1",
        data: expect.objectContaining({ documentId: "bc-1" }),
        digest: "test-digest",
      });
      expect(setCalls[1][0]).toMatchObject({
        id: "bc-2",
        data: expect.objectContaining({ documentId: "bc-2" }),
        digest: "test-digest",
      });
    });
  });
});

