/**
 * Compatible with Astro Content Layer `DataEntry.rendered` /
 * `LoaderContext.renderMarkdown()` return value.
 */
export interface StrapiRenderedContent {
  html: string;
  metadata?: {
    imagePaths?: Array<string>;
    headings?: Array<{ depth: number; slug: string; text: string }>;
    frontmatter?: Record<string, any>;
    [key: string]: unknown;
  };
}

/**
 * Options for rendering a Strapi markdown (or HTML) field through Astro's
 * Content Layer so `render()` / `<Content />` work with the project's markdown config.
 *
 * Opt-in only — when omitted, the loader stores entries exactly as before.
 */
export interface StrapiMarkdownOptions {
  /**
   * Dot-path to a string field on the Strapi entry (e.g. `"content"`, `"seo.description"`).
   * Used when {@link getMarkdown} is not provided.
   */
  field?: string;
  /**
   * Custom extractor for the markdown (or HTML) source. Takes precedence over {@link field}.
   * Return `null` / `undefined` to skip rendering for that entry.
   */
  getMarkdown?: (
    data: Record<string, unknown>,
  ) =>
    | string
    | null
    | undefined
    | Promise<string | null | undefined>;
  /**
   * When `true` (default), also store the raw source on `entry.body`.
   */
  includeBody?: boolean;
  /**
   * How to treat the resolved source:
   * - `"markdown"` (default): run Astro `renderMarkdown()` (inherits `astro.config` markdown settings).
   * - `"html"`: pass through as already-rendered HTML (e.g. CKEditor output) without markdown processing.
   */
  format?: "markdown" | "html";
}

/**
 * Read a nested value from an object using a dot-separated path.
 */
export function getValueByPath(
  data: Record<string, unknown>,
  path: string,
): unknown {
  if (!path) {
    return undefined;
  }
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined || typeof acc !== "object") {
      return undefined;
    }
    return (acc as Record<string, unknown>)[key];
  }, data);
}

/**
 * Resolve the markdown/HTML source string for an entry from {@link StrapiMarkdownOptions}.
 * Returns `undefined` when there is nothing to render (keeps base loader flow unchanged).
 */
export async function resolveMarkdownSource(
  data: Record<string, unknown>,
  options: StrapiMarkdownOptions,
): Promise<string | undefined> {
  if (options.getMarkdown) {
    const value = await options.getMarkdown(data);
    return normalizeSource(value);
  }

  if (options.field) {
    return normalizeSource(getValueByPath(data, options.field));
  }

  return undefined;
}

function normalizeSource(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  // Preserve original string for rendering (only reject empty/whitespace-only).
  if (value.trim().length === 0) {
    return undefined;
  }
  return value;
}

/**
 * Build a rendered-content object from an HTML string for `store.set({ rendered })`.
 * Use with `format: "html"` or when you already have HTML from Strapi.
 */
export function createHtmlRenderedContent(
  html: string,
  metadata?: StrapiRenderedContent["metadata"],
): StrapiRenderedContent {
  return metadata ? { html, metadata } : { html };
}

export type RenderMarkdownFn = (
  content: string,
  options?: { fileURL?: URL },
) => Promise<StrapiRenderedContent>;

/**
 * Resolve source + produce `body` / `rendered` for a content entry.
 * Returns empty fields when markdown options are absent or the source is empty.
 */
export async function buildEntryRenderedContent(
  data: Record<string, unknown>,
  markdown: StrapiMarkdownOptions | undefined,
  renderMarkdown: RenderMarkdownFn | undefined,
): Promise<{ body?: string; rendered?: StrapiRenderedContent }> {
  if (!markdown) {
    return {};
  }

  const source = await resolveMarkdownSource(data, markdown);
  if (source === undefined) {
    return {};
  }

  const includeBody = markdown.includeBody !== false;
  const format = markdown.format ?? "markdown";

  let rendered: StrapiRenderedContent | undefined;

  if (format === "html") {
    rendered = createHtmlRenderedContent(source);
  } else if (renderMarkdown) {
    rendered = await renderMarkdown(source);
  }

  return {
    ...(includeBody ? { body: source } : {}),
    ...(rendered ? { rendered } : {}),
  };
}
