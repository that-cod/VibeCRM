/**
 * Generate CRM Configuration API
 * POST /api/generate-config
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCRMConfig, validateConfig } from '@/lib/ai/config-generator';
import type { GenerateConfigRequest, GenerateConfigResponse } from '@/types/api';

export async function POST(request: NextRequest) {
    try {
        const body: GenerateConfigRequest = await request.json();

        const { prompt, context, templateId } = body;

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: 'Invalid request', message: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Generate configuration
        const result = await generateCRMConfig(prompt, context);

        // Validate generated config
        const validation = validateConfig(result.config);
        if (!validation.valid) {
            return NextResponse.json(
                {
                    error: 'Invalid configuration',
                    message: 'Generated configuration is invalid',
                    details: { errors: validation.errors },
                },
                { status: 500 }
            );
        }

        const response: GenerateConfigResponse = {
            config: result.config,
            templateUsed: result.templateUsed,
            warnings: result.warnings,
            suggestions: result.suggestions,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error generating config:', error);
        return NextResponse.json(
            {
                error: 'Generation failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
