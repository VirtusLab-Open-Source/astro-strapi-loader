import { LoaderContext } from "astro/loaders";
import { strapiLoader } from "../loader";
import { fetchContent } from "../strapi";

// Mock fetchContent
jest.mock("../strapi", () => ({
  fetchContent: jest.fn(),
}));

describe("strapiLoader", () => {
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
  });

  it("powinien poprawnie załadować pojedynczy element", async () => {
    const mockData = {
      documentId: "1",
      title: "Test Title",
    };

    (fetchContent as jest.Mock).mockResolvedValueOnce({
      data: mockData,
    });
    const loader = strapiLoader("test-content", options);
    await loader.load(mockContext as unknown as LoaderContext);

    expect(fetchContent).toHaveBeenCalledWith({
      url: options.url,
      token: options.token,
      contentType: "test-content",
      queryParams: "",
    });

    expect(mockContext.store.clear).toHaveBeenCalled();
    expect(mockContext.parseData).toHaveBeenCalledWith({
      id: "1",
      data: mockData,
    });
    expect(mockContext.store.set).toHaveBeenCalledWith({
      id: "1",
      data: mockData,
      digest: "test-digest",
    });
  });

  it("powinien poprawnie załadować tablicę elementów", async () => {
    const mockData = [
      { documentId: "1", title: "Test Title 1" },
      { documentId: "2", title: "Test Title 2" },
    ];

    (fetchContent as jest.Mock).mockResolvedValueOnce({
      data: mockData,
    });

    const loader = strapiLoader("test-content", options);
    await loader.load(mockContext as unknown as LoaderContext);

    expect(mockContext.store.clear).toHaveBeenCalled();
    expect(mockContext.parseData).toHaveBeenCalledTimes(2);
    expect(mockContext.store.set).toHaveBeenCalledTimes(2);
  });

  it("powinien obsłużyć pustą odpowiedź", async () => {
    (fetchContent as jest.Mock).mockResolvedValueOnce({
      data: [],
    });

    const loader = strapiLoader("test-content", options);
    await loader.load(mockContext as unknown as LoaderContext);

    expect(mockContext.store.clear).toHaveBeenCalled();
    expect(mockContext.parseData).not.toHaveBeenCalled();
    expect(mockContext.store.set).not.toHaveBeenCalled();
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      "[test-content] No data found in Strapi",
    );
  });

  it("powinien obsłużyć błędy podczas ładowania", async () => {
    const error = new Error("Network error");
    (fetchContent as jest.Mock).mockRejectedValueOnce(error);

    const loader = strapiLoader("test-content", options);
    await expect(loader.load(mockContext as unknown as LoaderContext)).rejects.toThrow(
      "Network error",
    );
  });
});
