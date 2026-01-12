import { z } from "zod";

export const FieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
}).optional();

export const SelectOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const FieldSchema = z.object({
  name: z.string(),
  type: z.enum(["text", "number", "date", "boolean", "email", "url", "phone", "textarea", "select", "currency", "status"]),
  required: z.boolean().default(false),
  display_name: z.string(),
  default_value: z.string().optional(),
  select_options: z.array(SelectOptionSchema).optional(),
  validation: FieldValidationSchema.optional(),
  filterable: z.boolean().default(true).optional(),
  sortable: z.boolean().default(true).optional(),
});

export type Field = z.infer<typeof FieldSchema>;
export type SelectOption = z.infer<typeof SelectOptionSchema>;

export const RelationshipSchema = z.object({
  name: z.string(),
  type: z.enum(["belongsTo", "hasMany", "hasOne", "manyToMany"]),
  related_resource: z.string(),
  foreign_key_column: z.string(),
  through_table: z.string().optional(),
});

export const ResourceSchema = z.object({
  name: z.string(),
  plural_name: z.string(),
  singular_label: z.string(),
  plural_label: z.string(),
  icon: z.string(),
  description: z.string(),
  color: z.string().default("blue"),
  fields: z.array(FieldSchema),
  relationships: z.array(RelationshipSchema).optional(),
  route: z.string(),
});

export type Resource = z.infer<typeof ResourceSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;

export const ProjectThemeSchema = z.object({
  primary_color: z.string().default("blue"),
  accent_color: z.string().default("green"),
}).optional();

export const ProjectPlanSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string().default("1.0.0"),
  resources: z.array(ResourceSchema),
  theme: ProjectThemeSchema.optional(),
});

export type ProjectPlan = z.infer<typeof ProjectPlanSchema>;

export const CodeFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  file_type: z.enum(["tsx", "ts", "css", "json", "md", "env"]),
  component_type: z.enum(["page", "component", "hook", "type", "config", "util", "style", "data"]),
  resource: z.string().optional(),
  description: z.string(),
});

export type CodeFile = z.infer<typeof CodeFileSchema>;

export const DependencySchema = z.object({
  name: z.string(),
  version: z.string(),
});

export const ArchitectureSpecSchema = z.object({
  project_plan: ProjectPlanSchema,
  code_files: z.array(CodeFileSchema),
  dependencies: z.array(DependencySchema).optional(),
});

export type ArchitectureSpec = z.infer<typeof ArchitectureSpecSchema>;
export type Dependency = z.infer<typeof DependencySchema>;
