import { z } from "zod";
import type { StrapiContentType, StrapiAttribute } from "../types/strapi";

export class StrapiSchemaGenerator {
  private contentTypes: Array<StrapiContentType> = [];
  private strict: boolean = false;

  constructor(contentTypes: Array<StrapiContentType>, strict: boolean = false) {
    this.contentTypes = contentTypes;
    this.strict = strict;
  }

  private generateAttributeSchema(attribute: StrapiAttribute): z.ZodType<unknown> {
    const ref = this;
    switch (attribute.type) {
      case "string":
        let schema = z.string();
        if (attribute.required) schema = schema.min(1);
        if (attribute.minLength) schema = schema.min(attribute.minLength);
        if (attribute.maxLength) schema = schema.max(attribute.maxLength);
        if (attribute.regex) schema = schema.regex(new RegExp(attribute.regex));
        return schema;

      case "text":
      case "richtext":
        return z.string();

      case "email":
        return z.string().email();

      case "password":
        return z.string();

      case "integer":
        let intSchema = z.number().int();
        if (attribute.required) intSchema = intSchema.min(1);
        if (attribute.min) intSchema = intSchema.min(attribute.min);
        if (attribute.max) intSchema = intSchema.max(attribute.max);
        return intSchema;

      case "biginteger":
      case "float":
      case "decimal":
        let numberSchema = z.number();
        if (attribute.required) numberSchema = numberSchema.min(0);
        if (attribute.min) numberSchema = numberSchema.min(attribute.min);
        if (attribute.max) numberSchema = numberSchema.max(attribute.max);
        return numberSchema;

      case "boolean":
        return z.boolean();

      case "date":
      case "datetime":
        return z.string();

      case "time":
        return z.string();

      case "timestamp":
        return z.number();

      case "json":
        return z.any();

      case "enumeration":
        if (!attribute.enum)
          throw new Error("Enumeration type requires enum values");
        return z.enum(attribute.enum as [string, ...string[]]).nullable();

      case "media":
        return z.object({
          name: z.string(),
          alternativeText: z.string().optional().nullable(),
          caption: z.string().optional().nullable(),
          width: z.number().optional(),
          height: z.number().optional(),
          formats: z.any().nullable(),
          hash: z.string(),
          ext: z.string().optional(),
          mime: z.string(),
          size: z.number(),
          url: z.string(),
          previewUrl: z.string().optional().nullable(),
          provider: z.string(),
          createdAt: z.string(),
          updatedAt: z.string(),
        });
      case "relation":
        if (!attribute.relation)
          throw new Error("Relation type requires relation target");
        const targetType = ref.contentTypes.find(
          (contentType) => contentType.apiID === attribute.relationTargetModel,
        );
        if (!targetType)
          throw new Error(`Target type ${attribute.relation} not found`);

        const relationSchema = ref.generateContentTypeSchema(targetType.schema);

        switch (attribute.relation) {
          case "oneToOne":
          case "manyToOne":
            return z.object({
              data: relationSchema.nullable(),
            });
          case "oneToMany":
          case "manyToMany":
            return z.object({
              data: z.array(relationSchema),
            });
          default:
            throw new Error(
              `Unsupported relation type: ${attribute.relationType}`,
            );
        }

      case "component":
        if (!attribute.component)
          throw new Error("Component type requires component name");
        // TODO: Implement component schema generation
        return z.any();

      case "dynamiczone":
        // TODO: Implement dynamiczone schema generation
        return z.any();

      default:
        return z.any();
    }
  }

  private generateContentTypeSchema(
    contentTypeSchema: StrapiContentType["schema"],
  ): z.ZodObject<any> {
    const ref = this;
    const shape: Record<string, z.ZodTypeAny> = Object.entries(
      contentTypeSchema.attributes,
    ).reduce(
      (acc, [key, attribute]) => {
        try {
          const schema = ref.generateAttributeSchema(attribute);
          return {
            ...acc,
            [key]:
              ref.strict && attribute.required
                ? schema
                : schema.nullable().optional(),
          };
        } catch (error) {
          console.error("Error generating attribute schema", error);
          return acc;
        }
      },
      {
        id: z.number().optional(),
        documentId: z.string().optional(),
        createdAt: z.string().datetime().optional(),
        updatedAt: z.string().datetime().optional(),
      },
    );

    return z.object(shape);
  }

  public generateSchema(contentTypeName: string): z.ZodObject<any> {
    const contentType = this.contentTypes.find(
      (contentType) => contentType.apiID === contentTypeName,
    );
    if (!contentType) {
      throw new Error(`Content type ${contentTypeName} not found`);
    }

    return this.generateContentTypeSchema(contentType.schema);
  }

  public generateAllSchemas(): Record<string, z.ZodObject<any>> {
    const ref = this;
    const schemas: Record<string, z.ZodObject<any>> = {};

    ref.contentTypes.forEach((contentType) => {
      const { schema } = contentType;
      const { singularName, pluralName, kind } = schema;
      const collectionName =
        kind === "collectionType" ? pluralName : singularName;
      schemas[collectionName] = ref.generateContentTypeSchema(schema);
    });

    return schemas;
  }
}
