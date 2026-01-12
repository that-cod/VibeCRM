import { anthropic, CLAUDE_MODEL, DEFAULT_MAX_TOKENS } from "../ai/claude";
import type { ProjectPlan, CodeFile, ArchitectureSpec } from "./schemas";
import { CODE_GENERATOR_SYSTEM_PROMPT, createProjectPlanPrompt } from "./prompts";
import {
  generateTypesTemplate, generateColumnsTemplate, generateListTemplate,
  generateCreateTemplate, generateEditTemplate, generateShowTemplate,
  generateHookTemplate, generateListPageTemplate, generateCreatePageTemplate,
  generateShowPageTemplate, generateEditPageTemplate,
} from "./templates";

export interface GenerateCodeResult {
  success: boolean;
  projectPlan?: ProjectPlan;
  codeFiles?: CodeFile[];
  error?: string;
  message?: string;
}

export async function generateCodeFromPrompt(prompt: string): Promise<GenerateCodeResult> {
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: CODE_GENERATOR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: createProjectPlanPrompt(prompt) }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return { success: false, error: "Unexpected response type" };
    }

    let responseText = content.text.trim();
    responseText = responseText.replace(/^```json\s*/i, "").replace(/\s*```$/, "");

    let parsed: ArchitectureSpec;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      return { success: false, error: "Failed to parse JSON response" };
    }

    if (!parsed.project_plan) {
      return { success: false, error: "Missing project_plan" };
    }

    if (!parsed.code_files || parsed.code_files.length === 0) {
      parsed.code_files = generateCodeFilesFromPlan(parsed.project_plan);
    }

    return {
      success: true,
      projectPlan: parsed.project_plan,
      codeFiles: parsed.code_files,
      message: `Generated ${parsed.project_plan.resources.length} resources with ${parsed.code_files.length} files`,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

function generateCodeFilesFromPlan(plan: ProjectPlan): CodeFile[] {
  const files: CodeFile[] = [];

  for (const resource of plan.resources) {
    files.push({
      path: `components/${resource.name}/${resource.name}.types.ts`,
      content: generateTypesTemplate(resource),
      file_type: "ts",
      component_type: "type",
      resource: resource.name,
      description: `TypeScript interfaces for ${resource.singular_label}`,
    });

    files.push({
      path: `components/${resource.name}/columns.tsx`,
      content: generateColumnsTemplate(resource),
      file_type: "tsx",
      component_type: "component",
      resource: resource.name,
      description: `Table columns for ${resource.plural_label}`,
    });

    files.push({
      path: `components/${resource.name}/${resource.name}-list.tsx`,
      content: generateListTemplate(resource),
      file_type: "tsx",
      component_type: "component",
      resource: resource.name,
      description: `List view for ${resource.plural_label}`,
    });

    files.push({
      path: `components/${resource.name}/${resource.name}-create.tsx`,
      content: generateCreateTemplate(resource),
      file_type: "tsx",
      component_type: "component",
      resource: resource.name,
      description: `Create form for ${resource.singular_label}`,
    });

    files.push({
      path: `components/${resource.name}/${resource.name}-edit.tsx`,
      content: generateEditTemplate(resource),
      file_type: "tsx",
      component_type: "component",
      resource: resource.name,
      description: `Edit form for ${resource.singular_label}`,
    });

    files.push({
      path: `components/${resource.name}/${resource.name}-show.tsx`,
      content: generateShowTemplate(resource),
      file_type: "tsx",
      component_type: "component",
      resource: resource.name,
      description: `Detail view for ${resource.singular_label}`,
    });

    files.push({
      path: `lib/hooks/use${capitalize(resource.name)}.ts`,
      content: generateHookTemplate(resource),
      file_type: "ts",
      component_type: "hook",
      resource: resource.name,
      description: `Custom hook for ${resource.singular_label}`,
    });

    files.push({
      path: `app/${resource.plural_name}/page.tsx`,
      content: generateListPageTemplate(resource),
      file_type: "tsx",
      component_type: "page",
      resource: resource.name,
      description: `List page for ${resource.plural_label}`,
    });

    files.push({
      path: `app/${resource.plural_name}/create/page.tsx`,
      content: generateCreatePageTemplate(resource),
      file_type: "tsx",
      component_type: "page",
      resource: resource.name,
      description: `Create page for ${resource.singular_label}`,
    });

    files.push({
      path: `app/${resource.plural_name}/[id]/page.tsx`,
      content: generateShowPageTemplate(resource),
      file_type: "tsx",
      component_type: "page",
      resource: resource.name,
      description: `Detail page for ${resource.singular_label}`,
    });

    files.push({
      path: `app/${resource.plural_name}/[id]/edit/page.tsx`,
      content: generateEditPageTemplate(resource),
      file_type: "tsx",
      component_type: "page",
      resource: resource.name,
      description: `Edit page for ${resource.singular_label}`,
    });
  }

  return files;
}

export function generateDatabaseSchema(plan: ProjectPlan): string {
  const tables: string[] = [];

  for (const resource of plan.resources) {
    const columns = ['id UUID PRIMARY KEY DEFAULT gen_random_uuid()', 'user_id UUID NOT NULL REFERENCES auth.users(id)', 'created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL', 'updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL'];

    for (const field of resource.fields) {
      if (["id", "user_id", "created_at", "updated_at"].includes(field.name)) continue;
      const colType = mapFieldToPostgresType(field);
      const nullStr = field.required ? "NOT NULL" : "NULL";
      columns.push(`${field.name} ${colType} ${nullStr}`);
    }

    for (const rel of resource.relationships || []) {
      columns.push(`${rel.foreign_key_column} UUID REFERENCES ${rel.related_resource}(id) ON DELETE SET NULL`);
    }

    const sql = `CREATE TABLE ${resource.plural_name} (\n  ${columns.join(",\n  ")}\n);\n\nALTER TABLE ${resource.plural_name} ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY "${resource.plural_name}_user_isolation" ON ${resource.plural_name}\n  FOR ALL TO authenticated\n  USING (user_id = auth.uid())\n  WITH CHECK (user_id = auth.uid());\n\nCREATE INDEX idx_${resource.plural_name}_user_id ON ${resource.plural_name}(user_id);\nCREATE INDEX idx_${resource.plural_name}_created_at ON ${resource.plural_name}(created_at DESC);`;
    
    tables.push(sql);
  }

  return tables.join("\n\n");
}

export function generateDependencies(plan: ProjectPlan): string[] {
  return [
    "@refinedev/core@^4.0.0",
    "@refinedev/react-router-v6@^4.0.0",
    "@refinedev/supabase@^5.0.0",
    "@supabase/supabase-js@^2.0.0",
    "react-hook-form@^7.0.0",
    "zod@^3.0.0",
    "@hookform/resolvers@^3.0.0",
    "lucide-react@^0.400.0",
    "date-fns@^3.0.0",
    "@tanstack/react-table@^8.0.0",
  ];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function mapFieldToPostgresType(field: any): string {
  switch (field.type) {
    case "text": case "email": case "url": case "phone": case "textarea": case "select": case "status":
      return "TEXT";
    case "number": case "currency":
      return "NUMERIC";
    case "boolean":
      return "BOOLEAN";
    case "date":
      return "DATE";
    default:
      return "TEXT";
  }
}
