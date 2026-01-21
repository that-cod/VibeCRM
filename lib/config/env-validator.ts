/**
 * @fileoverview Environment variable validation at application startup
 * 
 * Reasoning:
 * - Fail fast if required environment variables are missing
 * - Provide clear error messages for configuration issues
 * - Prevent runtime errors due to missing configuration
 */

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ANTHROPIC_API_KEY: string;
  NODE_ENV: string;
}

/**
 * Validate that all required environment variables are present
 * @throws Error if any required variable is missing
 */
export function validateEnvVariables(): EnvConfig {
  const errors: string[] = [];

  // Check required variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
  ] as const;

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate URL format for Supabase URL
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    } catch {
      errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
    }
  }

  // Validate key formats (basic length check)
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length < 20) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length < 20) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short)');
  }

  if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    errors.push('ANTHROPIC_API_KEY appears to be invalid (should start with sk-ant-)');
  }

  if (errors.length > 0) {
    const errorMessage = [
      '❌ Environment Configuration Error',
      '',
      'The following environment variables are missing or invalid:',
      ...errors.map(e => `  • ${e}`),
      '',
      'Please check your .env file and ensure all required variables are set.',
      'See .env.example for reference.',
    ].join('\n');

    throw new Error(errorMessage);
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

/**
 * Get validated environment configuration
 * Memoized to avoid repeated validation
 */
let cachedConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnvVariables();
  }
  return cachedConfig;
}
