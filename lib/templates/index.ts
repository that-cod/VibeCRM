/**
 * Template Registry
 * Export all available CRM templates
 */

import { realEstateTemplate } from './real-estate';
import { agencyTemplate } from './agency';
import { retailTemplate } from './retail';
import type { TemplateConfig } from '@/types/crm-config';

/**
 * All available templates
 */
export const templates: Record<string, TemplateConfig> = {
    'real-estate': realEstateTemplate,
    'agency': agencyTemplate,
    'retail': retailTemplate,
};

/**
 * Get template by slug
 */
export function getTemplateBySlug(slug: string): TemplateConfig | undefined {
    return templates[slug];
}

/**
 * Get all templates as array
 */
export function getAllTemplates(): TemplateConfig[] {
    return Object.values(templates);
}

/**
 * Get featured templates
 */
export function getFeaturedTemplates(): TemplateConfig[] {
    return getAllTemplates().filter(t => t.featured);
}

/**
 * Get templates by industry
 */
export function getTemplatesByIndustry(industry: string): TemplateConfig[] {
    return getAllTemplates().filter(
        t => t.industry.toLowerCase() === industry.toLowerCase()
    );
}

/**
 * Search templates by keyword
 */
export function searchTemplates(query: string): TemplateConfig[] {
    const lowerQuery = query.toLowerCase();
    return getAllTemplates().filter(
        t =>
            t.name.toLowerCase().includes(lowerQuery) ||
            t.description.toLowerCase().includes(lowerQuery) ||
            t.industry.toLowerCase().includes(lowerQuery) ||
            t.useCases?.some(useCase => useCase.toLowerCase().includes(lowerQuery))
    );
}
