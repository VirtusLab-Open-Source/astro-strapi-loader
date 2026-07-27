import {
  buildEntryRenderedContent,
  createHtmlRenderedContent,
  getValueByPath,
  resolveMarkdownSource,
  type StrapiMarkdownOptions,
} from "../markdown";

describe("markdown helpers", () => {
  describe("getValueByPath", () => {
    it("reads nested dot paths", () => {
      const data = { seo: { description: "hello" }, title: "t" };
      expect(getValueByPath(data, "seo.description")).toBe("hello");
      expect(getValueByPath(data, "title")).toBe("t");
    });

    it("returns undefined for missing paths", () => {
      expect(getValueByPath({}, "a.b")).toBeUndefined();
      expect(getValueByPath({ a: 1 }, "a.b")).toBeUndefined();
    });
  });

  describe("resolveMarkdownSource", () => {
    it("uses field path", async () => {
      const source = await resolveMarkdownSource(
        { content: "# Hi" },
        { field: "content" },
      );
      expect(source).toBe("# Hi");
    });

    it("prefers getMarkdown over field", async () => {
      const source = await resolveMarkdownSource(
        { content: "# from-field", body: "# from-body" },
        {
          field: "content",
          getMarkdown: (data) => data.body as string,
        },
      );
      expect(source).toBe("# from-body");
    });

    it("supports async getMarkdown", async () => {
      const source = await resolveMarkdownSource(
        { content: "x" },
        {
          getMarkdown: async (data) => `async:${data.content}`,
        },
      );
      expect(source).toBe("async:x");
    });

    it("skips empty / non-string values", async () => {
      expect(
        await resolveMarkdownSource({ content: "   " }, { field: "content" }),
      ).toBeUndefined();
      expect(
        await resolveMarkdownSource({ content: 123 }, { field: "content" }),
      ).toBeUndefined();
      expect(
        await resolveMarkdownSource(
          { content: "x" },
          { getMarkdown: () => null },
        ),
      ).toBeUndefined();
    });
  });

  describe("createHtmlRenderedContent", () => {
    it("builds rendered payload", () => {
      expect(createHtmlRenderedContent("<p>Hi</p>")).toEqual({
        html: "<p>Hi</p>",
      });
      expect(
        createHtmlRenderedContent("<p>Hi</p>", { frontmatter: { a: 1 } }),
      ).toEqual({
        html: "<p>Hi</p>",
        metadata: { frontmatter: { a: 1 } },
      });
    });
  });

  describe("buildEntryRenderedContent", () => {
    const renderMarkdown = jest.fn(async (content: string) => ({
      html: `<p>${content}</p>`,
      metadata: { headings: [] },
    }));

    beforeEach(() => {
      renderMarkdown.mockClear();
    });

    it("returns empty object when markdown option is omitted", async () => {
      await expect(
        buildEntryRenderedContent({ content: "# x" }, undefined, renderMarkdown),
      ).resolves.toEqual({});
      expect(renderMarkdown).not.toHaveBeenCalled();
    });

    it("renders markdown via renderMarkdown and includes body by default", async () => {
      const result = await buildEntryRenderedContent(
        { content: "# Hello" },
        { field: "content" },
        renderMarkdown,
      );
      expect(renderMarkdown).toHaveBeenCalledWith("# Hello");
      expect(result).toEqual({
        body: "# Hello",
        rendered: { html: "<p># Hello</p>", metadata: { headings: [] } },
      });
    });

    it("can omit body", async () => {
      const result = await buildEntryRenderedContent(
        { content: "# Hello" },
        { field: "content", includeBody: false },
        renderMarkdown,
      );
      expect(result.body).toBeUndefined();
      expect(result.rendered).toBeDefined();
    });

    it("passes HTML through without calling renderMarkdown", async () => {
      const result = await buildEntryRenderedContent(
        { html: "<strong>x</strong>" },
        { field: "html", format: "html" },
        renderMarkdown,
      );
      expect(renderMarkdown).not.toHaveBeenCalled();
      expect(result).toEqual({
        body: "<strong>x</strong>",
        rendered: { html: "<strong>x</strong>" },
      });
    });

    it("uses getMarkdown for composed sources", async () => {
      const options: StrapiMarkdownOptions = {
        getMarkdown: (data) =>
          [`# ${data.title}`, data.content].filter(Boolean).join("\n\n"),
      };
      const result = await buildEntryRenderedContent(
        { title: "Post", content: "Body" },
        options,
        renderMarkdown,
      );
      expect(renderMarkdown).toHaveBeenCalledWith("# Post\n\nBody");
      expect(result.body).toBe("# Post\n\nBody");
    });
  });
});
