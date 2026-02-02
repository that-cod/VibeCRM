/**
 * Entity Form Component
 * Dynamic form builder based on entity configuration
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EntityConfig, FieldConfig } from '@/types/crm-config';

interface EntityFormProps {
    entity: EntityConfig;
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export function EntityForm({
    entity,
    initialData,
    onSubmit,
    onCancel,
    loading = false,
}: EntityFormProps) {
    const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Filter fields that should be in the form
    const formFields = entity.fields.filter(
        (field) => field.name !== 'id' && !field.hidden
    );

    const handleChange = (field: FieldConfig, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field.name]: value,
        }));

        // Clear error when field is modified
        if (errors[field.name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field.name];
                return next;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        formFields.forEach((field) => {
            const value = formData[field.name];

            // Required field validation
            if (field.required && (value === undefined || value === null || value === '')) {
                newErrors[field.name] = `${field.label} is required`;
            }

            // Email validation
            if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                newErrors[field.name] = 'Invalid email address';
            }

            // URL validation
            if (field.type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
                newErrors[field.name] = 'Invalid URL';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    const renderField = (field: FieldConfig) => {
        const value = formData[field.name] || '';
        const error = errors[field.name];

        const baseInputClass = cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
            error ? 'border-red-300' : 'border-gray-300'
        );

        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleChange(field, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className={baseInputClass}
                        required={field.required}
                    />
                );

            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleChange(field, e.target.value)}
                        className={baseInputClass}
                        required={field.required}
                    >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((option) => {
                            const optValue = typeof option === 'object' ? option.value : String(option);
                            const optLabel = typeof option === 'object' ? option.label : String(option);
                            return (
                                <option key={optValue} value={optValue}>
                                    {optLabel}
                                </option>
                            );
                        })}
                    </select>
                );

            case 'checkbox':
                return (
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={value || false}
                            onChange={(e) => handleChange(field, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                            {field.placeholder || `Enable ${field.label}`}
                        </label>
                    </div>
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={value}
                        onChange={(e) => handleChange(field, e.target.value)}
                        className={baseInputClass}
                        required={field.required}
                    />
                );

            case 'datetime':
                return (
                    <input
                        type="datetime-local"
                        value={value}
                        onChange={(e) => handleChange(field, e.target.value)}
                        className={baseInputClass}
                        required={field.required}
                    />
                );

            case 'number':
            case 'currency':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => handleChange(field, parseFloat(e.target.value))}
                        placeholder={field.placeholder}
                        step={field.type === 'currency' ? '0.01' : '1'}
                        className={baseInputClass}
                        required={field.required}
                    />
                );

            default:
                return (
                    <input
                        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                        value={value}
                        onChange={(e) => handleChange(field, e.target.value)}
                        placeholder={field.placeholder}
                        className={baseInputClass}
                        required={field.required}
                    />
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {initialData ? `Edit ${entity.name.slice(0, -1)}` : `Add ${entity.name.slice(0, -1)}`}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="px-6 py-4 space-y-4">
                        {formFields.map((field) => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {renderField(field)}
                                {errors[field.name] && (
                                    <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                                )}
                                {field.description && (
                                    <p className="mt-1 text-sm text-gray-500">{field.description}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : initialData ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
