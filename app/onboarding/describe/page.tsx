/**
 * Onboarding - Describe CRM Page
 * User describes their CRM needs, AI generates config
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { getAuthToken } from '@/lib/utils/auth';

export default function DescribePage() {
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [businessContext, setBusinessContext] = useState<any>(null);

    useEffect(() => {
        // Load business context from previous step
        const context = sessionStorage.getItem('businessContext');
        if (!context) {
            router.push('/onboarding');
            return;
        }
        setBusinessContext(JSON.parse(context));
    }, [router]);

    const examplePrompts = [
        "I need to manage properties, clients, and showings",
        "Track client projects, invoices, and deliverables",
        "Manage customers, products, and orders",
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Call AI config generation API
            const response = await fetch('/api/generate-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    context: businessContext,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate configuration');
            }

            const { config } = await response.json();

            // Store config in session storage
            sessionStorage.setItem('crmConfig', JSON.stringify(config));

            // Navigate to preview/confirmation page
            // For now, redirect to create workspace
            await createWorkspace(config);
        } catch (error) {
            console.error('Error generating config:', error);
            alert('Failed to generate CRM configuration. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const createWorkspace = async (config: any) => {
        try {
            // Get auth token
            const token = await getAuthToken();
            if (!token) {
                alert('Authentication required. Please refresh and try again.');
                return;
            }

            const response = await fetch('/api/workspace', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: businessContext.companyName,
                    config,
                    // template_id is optional - AI already used template internally
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create workspace');
            }

            const { workspace } = await response.json();

            // Clear session storage
            sessionStorage.removeItem('businessContext');
            sessionStorage.removeItem('crmConfig');

            // Redirect to CRM dashboard
            router.push(`/crm/${workspace.id}/dashboard`);
        } catch (error) {
            console.error('Error creating workspace:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to create workspace: ${errorMessage}`);
        }
    };

    if (!businessContext) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-3xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-4">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">AI-Powered Configuration</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Describe your ideal CRM
                    </h1>
                    <p className="text-lg text-gray-600">
                        Tell us what you need to track and we'll build it for you
                    </p>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div className="w-20 h-1 bg-blue-600"></div>
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            2
                        </div>
                        <div className="w-20 h-1 bg-gray-300"></div>
                        <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                            3
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Prompt Textarea */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What do you need to manage? *
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Example: I run a real estate agency. I need to track properties, manage client relationships, schedule showings, and follow up on leads."
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                required
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                Be as specific as you like. Mention the types of records, relationships, and workflows you need.
                            </p>
                        </div>

                        {/* Example Prompts */}
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">
                                Need inspiration? Try one of these:
                            </p>
                            <div className="space-y-2">
                                {examplePrompts.map((example, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setPrompt(example)}
                                        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Generating your CRM...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    <span>Generate My CRM</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>How it works:</strong> Our AI will analyze your description, match it to the best template,
                        and customize it to fit your specific needs. You can always adjust it later!
                    </p>
                </div>
            </div>
        </div>
    );
}
