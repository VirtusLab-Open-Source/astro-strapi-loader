export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiContentType {
  apiID: string;
  uid: string;
  plugin?: string;
  schema: {
    uid: string;
    kind: 'singleType' | 'collectionType';
    collectionName: string;
    singularName: string;
    pluralName: string;
    displayName: string;
    description?: string;
    draftAndPublish: boolean;
    pluginOptions: Record<string, unknown>;
    visible: boolean;
    attributes: Record<string, StrapiAttribute>;
    info?: {
      singularName: string;
      pluralName: string;
      displayName: string;
    };
  }
}

export interface StrapiAttribute {
  type: string;
  required?: boolean;
  unique?: boolean;
  configurable?: boolean;
  writable?: boolean;
  visible?: boolean;
  private?: boolean;
  default?: any;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  regex?: string;
  enum?: string[];
  component?: string;
  repeatable?: boolean;
  target?: string;
  targetAttribute?: string;
  relation?: string;
  relationType?: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  relationTarget?: string;
  relationTargetAttribute?: string;
  relationTargetField?: string;
  relationTargetModel?: string;
  relationTargetModelField?: string;
  relationTargetModelFieldType?: string;
  relationTargetModelFieldRequired?: boolean;
  relationTargetModelFieldUnique?: boolean;
  relationTargetModelFieldConfigurable?: boolean;
  relationTargetModelFieldWritable?: boolean;
  relationTargetModelFieldVisible?: boolean;
  relationTargetModelFieldPrivate?: boolean;
  relationTargetModelFieldDefault?: any;
  relationTargetModelFieldMinLength?: number;
  relationTargetModelFieldMaxLength?: number;
  relationTargetModelFieldMin?: number;
  relationTargetModelFieldMax?: number;
  relationTargetModelFieldRegex?: string;
  relationTargetModelFieldEnum?: string[];
  relationTargetModelFieldComponent?: string;
  relationTargetModelFieldRepeatable?: boolean;
  relationTargetModelFieldTarget?: string;
  relationTargetModelFieldTargetAttribute?: string;
  relationTargetModelFieldRelation?: string;
  relationTargetModelFieldRelationType?: string;
  relationTargetModelFieldRelationTarget?: string;
  relationTargetModelFieldRelationTargetAttribute?: string;
  relationTargetModelFieldRelationTargetField?: string;
  relationTargetModelFieldRelationTargetModel?: string;
  relationTargetModelFieldRelationTargetModelField?: string;
  relationTargetModelFieldRelationTargetModelFieldType?: string;
  relationTargetModelFieldRelationTargetModelFieldRequired?: boolean;
  relationTargetModelFieldRelationTargetModelFieldUnique?: boolean;
  relationTargetModelFieldRelationTargetModelFieldConfigurable?: boolean;
  relationTargetModelFieldRelationTargetModelFieldWritable?: boolean;
  relationTargetModelFieldRelationTargetModelFieldVisible?: boolean;
  relationTargetModelFieldRelationTargetModelFieldPrivate?: boolean;
  relationTargetModelFieldRelationTargetModelFieldDefault?: any;
  relationTargetModelFieldRelationTargetModelFieldMinLength?: number;
  relationTargetModelFieldRelationTargetModelFieldMaxLength?: number;
  relationTargetModelFieldRelationTargetModelFieldMin?: number;
  relationTargetModelFieldRelationTargetModelFieldMax?: number;
  relationTargetModelFieldRelationTargetModelFieldRegex?: string;
  relationTargetModelFieldRelationTargetModelFieldEnum?: string[];
  relationTargetModelFieldRelationTargetModelFieldComponent?: string;
  relationTargetModelFieldRelationTargetModelFieldRepeatable?: boolean;
  relationTargetModelFieldRelationTargetModelFieldTarget?: string;
  relationTargetModelFieldRelationTargetModelFieldTargetAttribute?: string;
  targetField?: string;
} 