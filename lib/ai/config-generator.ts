/**
 * AI Configuration Generator
 * Uses Claude API to match prompts to templates and customize configurations
 */

import Anthropic from '@anthropic-ai/sdk';
import type { BusinessContext, WorkspaceConfig, GenerateConfigResult } from '@/types/crm-config';
import type { TemplateConfig } from '@/types/crm-config';
import { templates, getAllTemplates } from '@/lib/templates';
import { nanoid } from 'nanoid';

// Initialize Claude client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder-key',
});

/**
 * Match user prompt to best template
 */
export async function matchToTemplate(
    prompt: string,
    context?: BusinessContext
): Promise<{ templateId: string; confidence: number; reasoning: string }> {
    const allTemplates = getAllTemplates();

    // Simple keyword matching for demo (in production, use Claude)
    const keywords: Record<string, string[]> = {
        'real-estate': ['property', 'real estate', 'listing', 'showing', 'buyer', 'seller', 'house', 'apartment'],
        'agency': ['agency', 'client', 'project', 'invoice', 'creative', 'design', 'marketing'],
        'retail': ['retail', 'customer', 'product', 'order', 'inventory', 'shop', 'store', 'ecommerce'],
    };

    const lowerPrompt = prompt.toLowerCase();
    let bestMatch = 'real-estate';
    let maxMatches = 0;

    for (const [templateId, templateKeywords] of Object.entries(keywords)) {
        const matches = templateKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            bestMatch = templateId;
        }
    }

    // If no matches, use industry from context or default
    if (maxMatches === 0 && context?.industry) {
        const industryMatch = allTemplates.find(
            t => t.industry.toLowerCase() === context.industry.toLowerCase()
        );
        if (industryMatch) {
            bestMatch = industryMatch.id;
        }
    }

    return {
        templateId: bestMatch,
        confidence: maxMatches > 0 ? 0.85 : 0.5,
        reasoning: `Matched based on keywords and industry context`,
    };
}

/**
 * Customize template using Claude API
 */
export async function customizeTemplate(
    baseTemplate: TemplateConfig,
    userPrompt: string,
    context?: BusinessContext
): Promise<WorkspaceConfig> {
    // For MVP, return the base template config with minimal customization
    // In production, this would call Claude API to customize fields, entities, etc.

    const workspaceId = nanoid();
    const workspaceName = context?.companyName || `${baseTemplate.name} Workspace`;

    // Convert template to workspace config
    const config: WorkspaceConfig = {
        id: workspaceId,
        name: workspaceName,
        industry: baseTemplate.industry,
        templateId: baseTemplate.id,

        // Convert template entities to workspace entities with IDs
        entities: Object.fromEntries(
            Object.entries(baseTemplate.entities).map(([slug, entityConfig]) => [
                slug,
                {
                    ...entityConfig,
                    id: nanoid(),
                },
            ])
        ),

        dashboard: {
            widgets: baseTemplate.dashboard.widgets.map(widget => ({
                ...widget,
                id: nanoid(),
            })),
        },

        settings: {
            dateFormat: 'MM/DD/YYYY',
            timeZone: 'America/New_York',
            currency: 'USD',
            language: 'en',
        },

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return config;
}

/**
 * Advanced customization using Claude API (placeholder for production)
 */
async function customizeWithClaude(
    baseConfig: WorkspaceConfig,
    userPrompt: string
): Promise<WorkspaceConfig> {
    try {
        const systemPrompt = `You are an expert CRM configuration assistant. Given a base CRM configuration and user requirements, customize the configuration to match their needs. Return ONLY valid JSON matching the WorkspaceConfig type.`;

        const userMessage = `Base configuration: ${JSON.stringify(baseConfig, null, 2)}

User requirements: ${userPrompt}

Please customize this configuration to match the user's needs. You can:
- Add or remove fields from entities
- Modify field types and validations
- Add new entities if needed
- Adjust dashboard widgets
- Change entity names and descriptions

Return the complete customized configuration as JSON.`;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            messages: [{ role: 'user', content: userMessage }],
            system: systemPrompt,
        });

        const content = message.content[0];
        if (content.type === 'text') {
            // Parse JSON from response
            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const customConfig = JSON.parse(jsonMatch[0]);
                return customConfig;
            }
        }

        // Fallback to base config if parsing fails
        return baseConfig;
    } catch (error) {
        console.error('Error customizing with Claude:', error);
        // Fallback to base config
        return baseConfig;
    }
}

/**
 * Main function: Generate CRM configuration from user prompt
 */
export async function generateCRMConfig(
    userPrompt: string,
    context?: BusinessContext
): Promise<GenerateConfigResult> {
    try {
        // Step 1: Match to best template
        const match = await matchToTemplate(userPrompt, context);
        const baseTemplate = templates[match.templateId];

        if (!baseTemplate) {
            throw new Error(`Template not found: ${match.templateId}`);
        }

        // Step 2: Customize template
        const config = await customizeTemplate(baseTemplate, userPrompt, context);

        // Step 3: Validate and return
        const warnings: string[] = [];
        const suggestions: string[] = [];

        // Basic validation
        if (Object.keys(config.entities).length === 0) {
            warnings.push('No entities defined in configuration');
        }

        // Add suggestions
        suggestions.push(`Based on "${baseTemplate.name}" template`);
        suggestions.push(`Confidence: ${(match.confidence * 100).toFixed(0)}%`);

        return {
            config,
            templateUsed: baseTemplate.slug,
            warnings,
            suggestions,
        };
    } catch (error) {
        console.error('Error generating CRM config:', error);
        throw new Error(`Failed to generate configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Validate generated config
 */
export function validateConfig(config: WorkspaceConfig): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Check required fields
    if (!config.id) errors.push('Missing workspace ID');
    if (!config.name) errors.push('Missing workspace name');
    if (!config.industry) errors.push('Missing industry');

    // Check entities
    if (!config.entities || Object.keys(config.entities).length === 0) {
        errors.push('No entities defined');
    } else {
        // Validate each entity
        for (const [slug, entity] of Object.entries(config.entities)) {
            if (!entity.name) errors.push(`Entity "${slug}" missing name`);
            if (!entity.fields || entity.fields.length === 0) {
                errors.push(`Entity "${slug}" has no fields`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
