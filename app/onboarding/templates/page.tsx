/**
 * Template Selection Page
 * Beautiful UI to browse and select CRM templates
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { getAllTemplates } from '@/lib/templates';
import type { TemplateConfig } from '@/types/crm-config';

export default function TemplateSelectionPage() {
    const router = useRouter();
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const templates = getAllTemplates();

    const handleContinue = () => {
        if (selectedTemplate) {
            // Store selected template and continue to customization
            sessionStorage.setItem('selectedTemplate', selectedTemplate);
            router.push('/onboarding/describe');
        }
    };

    const handleSkip = () => {
        // Skip template selection, let AI decide
        sessionStorage.removeItem('selectedTemplate');
        router.push('/onboarding/describe');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Choose Your CRM Template
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Start with a pre-built template designed for your industry, or skip to let our AI build one from scratch.
                    </p>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {templates.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            isSelected={selectedTemplate === template.slug}
                            onSelect={() => setSelectedTemplate(template.slug)}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={handleSkip}
                        className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-white transition-colors font-medium"
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            <span>Let AI Decide</span>
                        </div>
                    </button>

                    <button
                        onClick={handleContinue}
                        disabled={!selectedTemplate}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-center gap-2">
                            <span>Continue with {selectedTemplate ? templates.find(t => t.slug === selectedTemplate)?.name : 'Template'}</span>
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

interface TemplateCardProps {
    template: TemplateConfig;
    isSelected: boolean;
    onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
    // Get entity icons and colors
    const getEntityIcon = (entityName: string) => {
        const iconMap: Record<string, string> = {
            properties: '🏠',
            clients: '👥',
            showings: '📅',
            projects: '📊',
            invoices: '💰',
            customers: '🛍️',
            products: '📦',
            orders: '🛒',
        };
        return iconMap[entityName.toLowerCase()] || '📋';
    };

    const entityEntries = Object.entries(template.entities);

    return (
        <button
            onClick={onSelect}
            className={`relative bg-white rounded-xl p-6 text-left transition-all transform hover:scale-105 hover:shadow-xl ${isSelected
                    ? 'ring-4 ring-blue-500 shadow-xl'
                    : 'border-2 border-gray-200 shadow-md'
                }`}
        >
            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                </div>
            )}

            {/* Header */}
            <div className="mb-4">
                <div className="text-3xl mb-2">{template.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-blue-600 font-medium">{template.industry}</p>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {template.description}
            </p>

            {/* Entities Preview */}
            <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Includes:
                </p>
                <div className="flex flex-wrap gap-2">
                    {entityEntries.slice(0, 3).map(([slug, entity]) => (
                        <div
                            key={slug}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                        >
                            <span>{getEntityIcon(slug)}</span>
                            <span className="font-medium text-gray-700">{entity.namePlural}</span>
                        </div>
                    ))}
                    {entityEntries.length > 3 && (
                        <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600">
                            +{entityEntries.length - 3} more
                        </div>
                    )}
                </div>
            </div>

            {/* Use Cases (if available) */}
            {template.useCases && template.useCases.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 line-clamp-2">
                        Perfect for: {template.useCases.join(', ')}
                    </p>
                </div>
            )}
        </button>
    );
}
