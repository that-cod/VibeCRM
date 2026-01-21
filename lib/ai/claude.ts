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
import { getEnvConfig } from "@/lib/config/env-validator";

const env = getEnvConfig();

export const anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
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
