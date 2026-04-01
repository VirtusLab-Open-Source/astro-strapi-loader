import { z } from "zod";
import type { StrapiComponent, StrapiContentType, StrapiAttribute } from "../types/strapi";

export class StrapiSchemaGenerator {
  private contentTypes: Array<StrapiContentType> = [];
  private components: Array<StrapiComponent> = [];
  private strict: boolean = false;
  private processingUids = new Set<string>();

  constructor(contentTypes: Array<StrapiContentType>, components: Array<StrapiComponent>, strict: boolean = false) {
    this.contentTypes = contentTypes;
    this.components = components;
    this.strict = strict;
  }

  private generateAttributeSchema(
    attribute: StrapiAttribute,
    pupulatedRelations: Array<string> = [],
  ): z.ZodType<unknown> | null {
    const ref = this;
    let schema;
    switch (attribute.type) {
      case "string":
        schema = z.string();
        if (attribute.required) schema = schema.min(1);
        if (attribute.minLength) schema = schema.min(attribute.minLength);
        if (attribute.maxLength) schema = schema.max(attribute.maxLength);
        if (attribute.regex) schema = schema.regex(new RegExp(attribute.regex));
        break;
      case "text":
      case "richtext":
        schema = z.string();
        break;
      case "email":
        schema = z.string().email();
        break;
      case "password":
        schema = z.string();
        break;
      case "integer":
        let intSchema = z.number().int();
        if (attribute.required) intSchema = intSchema.min(1);
        if (attribute.min) intSchema = intSchema.min(attribute.min);
        if (attribute.max) intSchema = intSchema.max(attribute.max);
        schema = intSchema;
        break;
      case "biginteger":
      case "float":
      case "decimal":
        schema = attribute.required
          ? z.union([z.number(), z.string()])
          : z.union([z.number(), z.string()]).nullable().optional();
        break;
      case "boolean":
        schema = z.boolean();
        break;
      case "date":
      case "datetime":
        schema = z.string();
        break;
      case "time":
        schema = z.string();
        break;
      case "timestamp":
        schema = z.number();
        break;
      case "json":
        schema = z.any();
        break;
      case "enumeration":
        if (!attribute.enum)
          throw new Error("Enumeration type requires enum values");
        schema = z.enum(attribute.enum as [string, ...string[]]).nullable();
        break;
      case "media":
        const mediaSchema = z.object({
          name: z.string(),
          alternativeText: z.string().optional().nullable(),
          caption: z.string().optional().nullable(),
          width: z.number().optional().nullable(),
          height: z.number().optional().nullable(),
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
        schema = attribute.multiple ? z.array(mediaSchema) : mediaSchema;
        break;
      case "relation":
        if (!attribute.relation)
          throw new Error("Relation type requires relation target");
        const targetType = ref.contentTypes.find(
          (contentType) =>
            contentType.apiID === attribute.target ||
            contentType.uid === attribute.target,
        );

        if (!targetType)
          throw new Error(`Target type ${attribute.relation} not found`);

        if (attribute.targetAttribute && pupulatedRelations.includes(attribute.targetAttribute)) {
          return null;
        }

        const relationSchema = ref.generateContentTypeSchema(
          targetType.schema,
          attribute.targetAttribute ? [...pupulatedRelations, attribute.targetAttribute] : pupulatedRelations,
        );

        switch (attribute.relation) {
          case "oneToOne":
          case "manyToOne":
            schema = relationSchema;
            break;
          case "oneToMany":
          case "manyToMany":
            schema = z.array(relationSchema);
            break;
          default:
            throw new Error(
              `Unsupported relation type: ${attribute.relationType}`,
            );
        }
        break;
      case "component":
        if (!attribute.component)
          throw new Error("Component type requires component name");
        const component = this.components.find(
          (component) => component.uid === attribute.component,
        );
        if (!component)
          throw new Error(`Component ${attribute.component} not found`);

        if (attribute.repeatable) {
          schema = z.array(this.generateComponentSchema(component.schema));
        } else {
          schema = this.generateComponentSchema(component.schema);
        }
        break;
      case "dynamiczone":
        // TODO: Implement dynamiczone schema generation
        schema = z.any();
        break;
      default:
        schema = z.any();
        break;
    }
    if (attribute.conditions && (attribute.type !== "media")) {
      schema = schema.nullable().optional();
    }
    return schema;
  }

  private generateContentTypeSchema(
    contentTypeSchema: StrapiContentType["schema"],
    pupulatedRelations?: Array<string>,
  ): z.ZodObject<any> {
    const uid = contentTypeSchema.uid;

    if (this.processingUids.has(uid)) {
      return z.object({
        id: z.number().optional(),
        documentId: z.string().optional(),
      });
    }

    this.processingUids.add(uid);

    try {
      const ref = this;
      const shape: Record<string, z.ZodTypeAny> = Object.entries(
        contentTypeSchema.attributes,
      ).reduce(
        (acc, [key, attribute]) => {
          try {
            const schema = ref.generateAttributeSchema(attribute, pupulatedRelations);
            if (schema) {
              return {
                ...acc,
                [key]:
                  ref.strict && attribute.required && !attribute.conditions
                    ? schema
                    : schema.nullable().optional(),
              };
            }
            return acc;
          } catch (error) {
            console.warn("Error generating attribute schema", error);
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
    } finally {
      this.processingUids.delete(uid);
    }
  }

  private generateComponentSchema(componentSchema: StrapiComponent["schema"]): z.ZodObject<any> {
    const ref = this;
    const shape: Record<string, z.ZodTypeAny> = Object.entries(componentSchema.attributes).reduce((acc, [key, attribute]) => {
      const schema = ref.generateAttributeSchema(attribute);
      return { ...acc, [key]: ref.strict && attribute.required && !attribute.conditions ? schema : schema?.nullable().optional() };
    }, {});

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
