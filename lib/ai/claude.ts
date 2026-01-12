/**
 * @fileoverview Anthropic Claude client for AI schema generation.
 * 
 * Reasoning:
 * - Centralized Claude API configuration
 * - Uses Claude Sonnet 4.5 as specified in requirements
 * - Provides type-safe interface for AI interactions
 * 
 * Dependencies:
 * - @anthropic-ai/sdk for Claude API
 */

import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
}

export const anthropic = new Anthropic({
    apiKey,
});

/**
 * Model to use for schema generation
 * Using Claude Sonnet 4.5 as specified
 */
export const CLAUDE_MODEL = "claude-sonnet-4-20250514" as const;

/**
 * Default max tokens for schema generation
 */
export const DEFAULT_MAX_TOKENS = 4096;
