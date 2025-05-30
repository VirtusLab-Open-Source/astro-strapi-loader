import { StrapiSchemaGenerator } from '../schema';
import type { StrapiContentType } from '../../types/strapi';

describe('StrapiSchemaGenerator', () => {
  const mockContentType: StrapiContentType = {
    apiID: 'article',
    uid: 'api::article.article',
    plugin: undefined,
    schema: {
      uid: 'api::article.article',
      kind: 'collectionType',
      collectionName: 'articles',
      singularName: 'article',
      pluralName: 'articles',
      displayName: 'Article',
      draftAndPublish: true,
      pluginOptions: {},
      visible: true,
      attributes: {
        title: {
          type: 'string',
          required: true
        },
        content: {
          type: 'richtext'
        },
        slug: {
          type: 'uid',
          targetField: 'title'
        }
      }
    }
  };

  let generator: StrapiSchemaGenerator;

  beforeEach(() => {
    generator = new StrapiSchemaGenerator([mockContentType]);
  });

  describe('generateSchema', () => {
    it('should generate schema for valid content type', () => {
      const schema = generator.generateSchema('article');
      expect(schema).toBeDefined();
      expect(schema.shape).toHaveProperty('title');
      expect(schema.shape).toHaveProperty('content');
      expect(schema.shape).toHaveProperty('slug');
    });

    it('should throw error for non-existent content type', () => {
      expect(() => {
        generator.generateSchema('non-existent');
      }).toThrow('Content type non-existent not found');
    });
  });

  describe('generateAllSchemas', () => {
    it('should generate schemas for all content types', () => {
      const schemas = generator.generateAllSchemas();
      expect(schemas).toHaveProperty('article');
      expect(schemas['article'].shape).toHaveProperty('title');
    });
  });
}); 