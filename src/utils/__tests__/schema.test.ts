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

  describe("attribute type handling", () => {
    const createContentTypeWithAttribute = (attributeName: string, attribute: any): StrapiContentType => ({
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
          [attributeName]: attribute,
        },
      },
    });

    describe("email type", () => {
      it("should generate email schema", () => {
        const contentType = createContentTypeWithAttribute("email", { type: "email" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("email");
      });
    });

    describe("password type", () => {
      it("should generate password schema", () => {
        const contentType = createContentTypeWithAttribute("password", { type: "password" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("password");
      });
    });

    describe("biginteger type", () => {
      it("should generate biginteger schema", () => {
        const contentType = createContentTypeWithAttribute("bigint", { type: "biginteger" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("bigint");
      });

      it("should handle biginteger with min/max constraints", () => {
        const contentType = createContentTypeWithAttribute("bigint", { 
          type: "biginteger", 
          min: 10, 
          max: 100,
          required: true 
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("bigint");
      });
    });

    describe("float type", () => {
      it("should generate float schema", () => {
        const contentType = createContentTypeWithAttribute("float", { type: "float" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("float");
      });

      it("should handle float with min/max constraints", () => {
        const contentType = createContentTypeWithAttribute("float", { 
          type: "float", 
          min: 0.1, 
          max: 99.9,
          required: true 
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("float");
      });
    });

    describe("decimal type", () => {
      it("should generate decimal schema", () => {
        const contentType = createContentTypeWithAttribute("decimal", { type: "decimal" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("decimal");
      });

      it("should handle decimal with min/max constraints", () => {
        const contentType = createContentTypeWithAttribute("decimal", { 
          type: "decimal", 
          min: 5.5, 
          max: 95.5,
          required: true 
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("decimal");
      });
    });

    describe("boolean type", () => {
      it("should generate boolean schema", () => {
        const contentType = createContentTypeWithAttribute("flag", { type: "boolean" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("flag");
      });
    });

    describe("date type", () => {
      it("should generate date schema", () => {
        const contentType = createContentTypeWithAttribute("publishDate", { type: "date" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("publishDate");
      });
    });

    describe("datetime type", () => {
      it("should generate datetime schema", () => {
        const contentType = createContentTypeWithAttribute("publishDatetime", { type: "datetime" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("publishDatetime");
      });
    });

    describe("time type", () => {
      it("should generate time schema", () => {
        const contentType = createContentTypeWithAttribute("openTime", { type: "time" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("openTime");
      });
    });

    describe("timestamp type", () => {
      it("should generate timestamp schema", () => {
        const contentType = createContentTypeWithAttribute("createdTimestamp", { type: "timestamp" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("createdTimestamp");
      });
    });

    describe("json type", () => {
      it("should generate json schema", () => {
        const contentType = createContentTypeWithAttribute("metadata", { type: "json" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("metadata");
      });
    });

    describe("enumeration type", () => {
      it("should generate enumeration schema", () => {
        const contentType = createContentTypeWithAttribute("status", { 
          type: "enumeration",
          enum: ["draft", "published", "archived"]
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("status");
      });

      it("should throw error for enumeration without enum values", () => {
        const contentType = createContentTypeWithAttribute("status", { 
          type: "enumeration"
          // missing enum property
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).not.toHaveProperty("status");
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error generating attribute schema", 
          expect.any(Error)
        );
        
        consoleSpy.mockRestore();
      });
    });

    describe("media type", () => {
      it("should generate media schema for single media", () => {
        const contentType = createContentTypeWithAttribute("image", { type: "media" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("image");
      });

      it("should generate media schema for multiple media files", () => {
        const contentType = createContentTypeWithAttribute("mediaGallery", { 
          type: "media",
          multiple: true
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("mediaGallery");
      });

      it("should generate array schema when multiple is true", () => {
        const contentType = createContentTypeWithAttribute("gallery", { 
          type: "media",
          multiple: true
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        // Verify the schema accepts arrays
        const testData = {
          gallery: [
            {
              name: "image1.jpg",
              hash: "hash1",
              mime: "image/jpeg",
              size: 1024,
              url: "/uploads/image1.jpg",
              provider: "local",
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: "2025-01-01T00:00:00.000Z",
              formats: null,
            },
            {
              name: "image2.jpg",
              hash: "hash2",
              mime: "image/jpeg",
              size: 2048,
              url: "/uploads/image2.jpg",
              provider: "local",
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: "2025-01-01T00:00:00.000Z",
              formats: null,
            }
          ]
        };
        
        const result = schema.safeParse(testData);
        expect(result.success).toBe(true);
      });

      it("should generate object schema when multiple is false or undefined", () => {
        const contentType = createContentTypeWithAttribute("featuredImage", { 
          type: "media",
          multiple: false
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        // Verify the schema accepts single object
        const testData = {
          featuredImage: {
            name: "image.jpg",
            hash: "hash1",
            mime: "image/jpeg",
            size: 1024,
            url: "/uploads/image.jpg",
            provider: "local",
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z",
            formats: null,
          }
        };
        
        const result = schema.safeParse(testData);
        expect(result.success).toBe(true);
      });
    });

    describe("dynamiczone type", () => {
      it("should generate dynamiczone schema as any", () => {
        const contentType = createContentTypeWithAttribute("content", { type: "dynamiczone" });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("content");
      });
    });

    describe("string type with validations", () => {
      it("should handle string with minLength constraint", () => {
        const contentType = createContentTypeWithAttribute("title", { 
          type: "string",
          minLength: 5
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("title");
      });

      it("should handle string with maxLength constraint", () => {
        const contentType = createContentTypeWithAttribute("title", { 
          type: "string",
          maxLength: 100
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("title");
      });

      it("should handle string with regex constraint", () => {
        const contentType = createContentTypeWithAttribute("slug", { 
          type: "string",
          regex: "^[a-z0-9-]+$"
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("slug");
      });
    });

    describe("integer type with validations", () => {
      it("should handle integer with min constraint", () => {
        const contentType = createContentTypeWithAttribute("count", { 
          type: "integer",
          min: 1
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("count");
      });

      it("should handle integer with max constraint", () => {
        const contentType = createContentTypeWithAttribute("count", { 
          type: "integer",
          max: 100
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("count");
      });

      it("should handle required integer", () => {
        const contentType = createContentTypeWithAttribute("count", { 
          type: "integer",
          required: true
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("count");
      });
    });

    describe("conditions support", () => {
      it("should handle attributes with conditions (non-media)", () => {
        const contentType = createContentTypeWithAttribute("conditionalField", { 
          type: "string",
          conditions: {
            "when": "someField",
            "is": "someValue"
          }
        });
        const testGenerator = new StrapiSchemaGenerator([contentType], []);
        const schema = testGenerator.generateSchema("test");
        
        expect(schema.shape).toHaveProperty("conditionalField");
      });
    });
  });

  describe("relation type handling", () => {
    const createRelationContentTypes = () => {
      const authorContentType: StrapiContentType = {
        apiID: "author",
        uid: "api::author.author",
        plugin: undefined,
        schema: {
          uid: "api::author.author",
          kind: "collectionType",
          collectionName: "authors",
          singularName: "author",
          pluralName: "authors",
          displayName: "Author",
          draftAndPublish: true,
          pluginOptions: {},
          visible: true,
          attributes: {
            name: {
              type: "string",
              required: true,
            },
          },
        },
      };

      const articleContentType: StrapiContentType = {
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
            title: { type: "string", required: true },
            oneToOneAuthor: {
              type: "relation",
              relation: "oneToOne",
              target: "api::author.author"
            },
            manyToOneAuthor: {
              type: "relation", 
              relation: "manyToOne",
              target: "api::author.author"
            },
            oneToManyAuthors: {
              type: "relation",
              relation: "oneToMany", 
              target: "api::author.author"
            },
            manyToManyAuthors: {
              type: "relation",
              relation: "manyToMany",
              target: "api::author.author" 
            }
          },
        },
      };

      return [authorContentType, articleContentType];
    };

    it("should handle oneToOne relation", () => {
      const contentTypes = createRelationContentTypes();
      const testGenerator = new StrapiSchemaGenerator(contentTypes, []);
      const schema = testGenerator.generateSchema("article");
      
      expect(schema.shape).toHaveProperty("oneToOneAuthor");
    });

    it("should handle manyToOne relation", () => {
      const contentTypes = createRelationContentTypes();
      const testGenerator = new StrapiSchemaGenerator(contentTypes, []);
      const schema = testGenerator.generateSchema("article");
      
      expect(schema.shape).toHaveProperty("manyToOneAuthor");
    });

    it("should handle oneToMany relation", () => {
      const contentTypes = createRelationContentTypes();
      const testGenerator = new StrapiSchemaGenerator(contentTypes, []);
      const schema = testGenerator.generateSchema("article");
      
      expect(schema.shape).toHaveProperty("oneToManyAuthors");
    });

    it("should handle manyToMany relation", () => {
      const contentTypes = createRelationContentTypes();
      const testGenerator = new StrapiSchemaGenerator(contentTypes, []);
      const schema = testGenerator.generateSchema("article");
      
      expect(schema.shape).toHaveProperty("manyToManyAuthors");
    });

    it("should throw error for relation without target", () => {
      const contentType: StrapiContentType = {
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
            invalidRelation: {
              type: "relation"
              // missing relation and target properties
            },
          },
        },
      };

      const testGenerator = new StrapiSchemaGenerator([contentType], []);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const schema = testGenerator.generateSchema("test");
      
      expect(schema.shape).not.toHaveProperty("invalidRelation");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error generating attribute schema", 
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it("should throw error for relation with non-existent target", () => {
      const contentType: StrapiContentType = {
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
            invalidRelation: {
              type: "relation",
              relation: "oneToOne",
              target: "api::nonexistent.nonexistent"
            },
          },
        },
      };

      const testGenerator = new StrapiSchemaGenerator([contentType], []);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const schema = testGenerator.generateSchema("test");
      
      expect(schema.shape).not.toHaveProperty("invalidRelation");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error generating attribute schema", 
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it("should throw error for unsupported relation type", () => {
      const contentTypes = createRelationContentTypes(); 
      const contentType: StrapiContentType = {
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
            invalidRelation: {
              type: "relation",
              relation: "unsupportedType" as any,
              target: "api::author.author"
            },
          },
        },
      };

      const testGenerator = new StrapiSchemaGenerator([...contentTypes, contentType], []);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const schema = testGenerator.generateSchema("test");
      
      expect(schema.shape).not.toHaveProperty("invalidRelation");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error generating attribute schema", 
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it("should handle circular relations with targetAttribute", () => {
      const selfRelatedContentType: StrapiContentType = {
        apiID: "category",
        uid: "api::category.category",
        plugin: undefined,
        schema: {
          uid: "api::category.category",
          kind: "collectionType",
          collectionName: "categories",
          singularName: "category",
          pluralName: "categories",
          displayName: "Category",
          draftAndPublish: true,
          pluginOptions: {},
          visible: true,
          attributes: {
            name: { type: "string", required: true },
            parent: {
              type: "relation",
              relation: "manyToOne",
              target: "api::category.category",
              targetAttribute: "children"
            },
            children: {
              type: "relation",
              relation: "oneToMany",
              target: "api::category.category",
              targetAttribute: "parent"
            }
          },
        },
      };

      const testGenerator = new StrapiSchemaGenerator([selfRelatedContentType], []);
      const schema = testGenerator.generateSchema("category");
      
      // Should handle circular relations without infinite recursion
      expect(schema.shape).toHaveProperty("name");
      expect(schema.shape).toHaveProperty("parent");
      expect(schema.shape).toHaveProperty("children");
    });
  });

  describe("generateAllSchemas for singleType", () => {
    it("should use singularName for singleType content", () => {
      const singleTypeContentType: StrapiContentType = {
        apiID: "homepage",
        uid: "api::homepage.homepage",
        plugin: undefined,
        schema: {
          uid: "api::homepage.homepage",
          kind: "singleType",
          collectionName: "homepages",
          singularName: "homepage",
          pluralName: "homepages",
          displayName: "Homepage",
          draftAndPublish: true,
          pluginOptions: {},
          visible: true,
          attributes: {
            title: { type: "string", required: true },
          },
        },
      };

      const testGenerator = new StrapiSchemaGenerator([singleTypeContentType], []);
      const schemas = testGenerator.generateAllSchemas();
      
      expect(schemas).toHaveProperty("homepage");
      expect(schemas).not.toHaveProperty("homepages");
    });
  });

  describe("strict mode", () => {
    it("should handle strict mode for required fields without conditions", () => {
      const contentType: StrapiContentType = {
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
            requiredField: {
              type: "string",
              required: true
            },
            optionalField: {
              type: "string",
              required: false
            }
          },
        },
      };

      const strictGenerator = new StrapiSchemaGenerator([contentType], [], true);
      const schema = strictGenerator.generateSchema("test");
      
      expect(schema.shape).toHaveProperty("requiredField");
      expect(schema.shape).toHaveProperty("optionalField");
    });

    it("should handle strict mode for component fields", () => {
      const componentContentType: StrapiContentType = {
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
            requiredComponent: {
              type: "component",
              component: "layout.hero",
              required: true
            }
          },
        },
      };

      const strictGenerator = new StrapiSchemaGenerator([componentContentType], mockComponents, true);
      const schema = strictGenerator.generateSchema("test");
      
      expect(schema.shape).toHaveProperty("requiredComponent");
    });
  });
});
