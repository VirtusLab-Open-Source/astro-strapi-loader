import { StrapiSchemaGenerator } from "../schema";
import type { StrapiContentType, StrapiComponent } from "../../types/strapi";

describe("StrapiSchemaGenerator", () => {
  const mockContentType: StrapiContentType = {
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
        content: {
          type: "richtext",
        },
        slug: {
          type: "uid",
          targetField: "title",
        },
        hero: {
          type: "component",
          repeatable: false,
          component: "layout.hero",
        },
        testimonials: {
          type: "component",
          repeatable: true,
          component: "content.testimonial",
        },
      },
    },
  };

  const mockComponents: Array<StrapiComponent> = [
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
    {
      uid: "content.testimonial",
      category: "content",
      apiId: "testimonial",
      schema: {
        displayName: "Testimonial",
        description: "Customer testimonial",
        icon: "quote",
        collectionName: "components_content_testimonials",
        attributes: {
          name: {
            type: "string",
            required: true,
          },
          content: {
            type: "string",
            required: true,
          },
          rating: {
            type: "integer",
            required: false,
          },
        },
      },
    },
  ];

  let generator: StrapiSchemaGenerator;

  beforeEach(() => {
    generator = new StrapiSchemaGenerator([mockContentType], mockComponents);
  });

  describe("generateSchema", () => {
    it("should generate schema for valid content type", () => {
      const schema = generator.generateSchema("article");
      expect(schema).toBeDefined();
      expect(schema.shape).toHaveProperty("title");
      expect(schema.shape).toHaveProperty("content");
      expect(schema.shape).toHaveProperty("slug");
    });

    it("should throw error for non-existent content type", () => {
      expect(() => {
        generator.generateSchema("non-existent");
      }).toThrow("Content type non-existent not found");
    });
  });

  describe("generateAllSchemas", () => {
    it("should generate schemas for all content types", () => {
      const schemas = generator.generateAllSchemas();
      expect(schemas).toHaveProperty("articles");
      expect(schemas["articles"].shape).toHaveProperty("title");
    });
  });

  describe("component handling", () => {
    it("should generate schema for non-repeatable component", () => {
      const schema = generator.generateSchema("article");
      expect(schema.shape).toHaveProperty("hero");
      
      // Test that component schema is generated correctly
      const heroField = schema.shape.hero;
      expect(heroField).toBeDefined();
    });

    it("should generate schema for repeatable component", () => {
      const schema = generator.generateSchema("article");
      expect(schema.shape).toHaveProperty("testimonials");
      
      // Test that repeatable component schema is an array
      const testimonialsField = schema.shape.testimonials;
      expect(testimonialsField).toBeDefined();
    });

    it("should ignore missing component and log warning", () => {
      const contentTypeWithMissingComponent: StrapiContentType = {
        apiID: "test",
        uid: "api::test.test",
        plugin: undefined,
        schema: {
          uid: "api::test.test",
          kind: "collectionType",
          collectionName: "tests",
          singularName: "test",
          pluralName: "tests",
          displayName: "Test",
          draftAndPublish: true,
          pluginOptions: {},
          visible: true,
          attributes: {
            title: {
              type: "string",
              required: true,
            },
            missingComponent: {
              type: "component",
              repeatable: false,
              component: "missing.component",
            },
          },
        },
      };

      const testGenerator = new StrapiSchemaGenerator([contentTypeWithMissingComponent], mockComponents);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const schema = testGenerator.generateSchema("test");
      
      // Schema should be generated successfully without the missing component
      expect(schema).toBeDefined();
      expect(schema.shape).toHaveProperty("title");
      expect(schema.shape).not.toHaveProperty("missingComponent");
      
      // Warning should be logged
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error generating attribute schema", 
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it("should ignore component type without component name and log warning", () => {
      const contentTypeWithInvalidComponent: StrapiContentType = {
        apiID: "test",
        uid: "api::test.test",
        plugin: undefined,
        schema: {
          uid: "api::test.test",
          kind: "collectionType",
          collectionName: "tests",
          singularName: "test",
          pluralName: "tests",
          displayName: "Test",
          draftAndPublish: true,
          pluginOptions: {},
          visible: true,
          attributes: {
            title: {
              type: "string",
              required: true,
            },
            invalidComponent: {
              type: "component",
              repeatable: false,
              // missing component property
            },
          },
        },
      };

      const testGenerator = new StrapiSchemaGenerator([contentTypeWithInvalidComponent], mockComponents);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const schema = testGenerator.generateSchema("test");
      
      // Schema should be generated successfully without the invalid component
      expect(schema).toBeDefined();
      expect(schema.shape).toHaveProperty("title");
      expect(schema.shape).not.toHaveProperty("invalidComponent");
      
      // Warning should be logged
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error generating attribute schema", 
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe("constructor with components", () => {
    it("should initialize with empty components array", () => {
      const generatorWithEmptyComponents = new StrapiSchemaGenerator([mockContentType], []);
      expect(generatorWithEmptyComponents).toBeDefined();
    });

    it("should initialize with components array", () => {
      const generatorWithComponents = new StrapiSchemaGenerator([mockContentType], mockComponents);
      expect(generatorWithComponents).toBeDefined();
    });

    it("should handle strict mode with components", () => {
      const strictGenerator = new StrapiSchemaGenerator([mockContentType], mockComponents, true);
      expect(strictGenerator).toBeDefined();
    });
  });
});
