/**
 * Zod Schema Definitions for Model Info Panel
 *
 * This module defines Zod schemas for the model info panel component,
 * including validation rules for model identification, deployment details,
 * and capability specifications.
 *
 * @module schemas/model
 */

import { z } from 'zod';

// ============================================================================
// Core Model Schemas
// ============================================================================

/**
 * Schema for server port number
 * Valid port range for model servers (8000-8999)
 */
export const portSchema = z
  .number()
  .int('Port must be an integer')
  .min(1024, 'Port must be at least 1024')
  .max(65535, 'Port must be at most 65535')
  .describe('Server port number for the model endpoint');

/**
 * Schema for model name/identifier
 * The display name or identifier for the LLM model.
 */
export const modelNameSchema = z
  .string()
  .min(1, 'Model name is required')
  .max(100, 'Model name must be 100 characters or less')
  .describe('Display name or identifier of the LLM model');

/**
 * Schema for model provider/organization
 * The company or organization that provides the model.
 */
export const providerSchema = z
  .string()
  .min(1, 'Provider name is required')
  .max(50, 'Provider name must be 50 characters or less')
  .describe('Provider or organization hosting the model');

/**
 * Schema for speed classification
 * Indicates the relative speed of the model.
 */
export const speedSchema = z
  .enum(['fast', 'medium', 'slow'])
  .describe('Relative speed classification of the model');

/**
 * Schema for use case description
 * Describes the recommended use case for the model.
 */
export const useCaseSchema = z
  .string()
  .min(1, 'Use case is required')
  .max(200, 'Use case must be 200 characters or less')
  .describe('Recommended use case for this model');

/**
 * Schema for context window size in tokens
 * Maximum number of tokens the model can process in a single request.
 */
export const contextWindowSchema = z
  .number()
  .int('Context window must be an integer')
  .min(512, 'Context window must be at least 512 tokens')
  .max(2000000, 'Context window must be at most 2M tokens')
  .describe('Maximum context window size in tokens');

/**
 * Schema for maximum output tokens
 * Maximum number of tokens the model can generate in a single response.
 */
export const maxOutputSchema = z
  .number()
  .int('Max output must be an integer')
  .min(1, 'Max output must be at least 1 token')
  .max(100000, 'Max output must be at most 100K tokens')
  .describe('Maximum output tokens per request');

/**
 * Schema for model version string
 * Optional version identifier for the model.
 */
export const versionSchema = z
  .string()
  .max(50, 'Version must be 50 characters or less')
  .optional()
  .describe('Model version or variant identifier');

/**
 * Schema for model status
 * Current operational status of the model server.
 */
export const modelStatusSchema = z
  .enum(['starting', 'ready', 'busy', 'error', 'stopped'])
  .optional()
  .describe('Current operational status of the model');

/**
 * Schema for model description
 * Detailed description of the model's capabilities.
 */
export const modelDescriptionSchema = z
  .string()
  .max(500, 'Description must be 500 characters or less')
  .optional()
  .describe('Detailed description of the model');

// ============================================================================
// Composite Model Schemas
// ============================================================================

/**
 * Schema for basic model information
 * Core model details needed for display and identification.
 */
export const modelInfoSchema = z.object({
  /** Display name of the model */
  name: modelNameSchema,
  /** Provider/organization hosting the model */
  provider: providerSchema,
  /** Maximum context window size in tokens */
  context_window: contextWindowSchema,
  /** Maximum output tokens per request */
  max_output: maxOutputSchema,
});

/**
 * Schema for model info props with camelCase naming
 * Used by React components with idiomatic JavaScript naming.
 */
export const modelInfoPropsSchema = z.object({
  /** Display name of the model */
  name: modelNameSchema,
  /** Provider/organization hosting the model */
  provider: providerSchema,
  /** Maximum context window size in tokens */
  contextWindow: contextWindowSchema,
  /** Maximum output tokens per request */
  maxOutput: maxOutputSchema,
});

/**
 * Schema for model port mapping
 * Used for listing available model instances on different ports.
 */
export const modelPortMappingSchema = z.object({
  /** Server port number */
  port: portSchema,
  /** Model identifier/name */
  model: modelNameSchema,
  /** Speed classification */
  speed: speedSchema,
  /** Use case description */
  use_case: useCaseSchema,
});

/**
 * Schema for model port mapping props with camelCase naming
 * Used by React components with idiomatic JavaScript naming.
 */
export const modelPortMappingPropsSchema = z.object({
  /** Server port number */
  port: portSchema,
  /** Model identifier/name */
  model: modelNameSchema,
  /** Speed classification */
  speed: speedSchema,
  /** Use case description */
  useCase: useCaseSchema,
});

/**
 * Schema for complete model panel data
 * Includes all model information needed for the dashboard panel display.
 */
export const modelPanelSchema = z.object({
  // Core identification (snake_case for API compatibility)
  /** Display name of the model */
  name: modelNameSchema,
  /** Provider/organization hosting the model */
  provider: providerSchema,

  // Capabilities
  /** Maximum context window size in tokens */
  context_window: contextWindowSchema,
  /** Maximum output tokens per request */
  max_output: maxOutputSchema,

  // Deployment details
  /** Server port number */
  port: portSchema,
  /** Speed classification */
  speed: speedSchema,
  /** Use case description */
  use_case: useCaseSchema,

  // Optional fields
  /** Model version or variant */
  version: versionSchema.optional(),
  /** Operational status */
  status: modelStatusSchema.optional(),
  /** Detailed description */
  description: modelDescriptionSchema.optional(),
});

/**
 * Schema for model panel props with camelCase naming
 * Used by React components with idiomatic JavaScript naming.
 */
export const modelPanelPropsSchema = z.object({
  // Core identification
  /** Display name of the model */
  name: modelNameSchema,
  /** Provider/organization hosting the model */
  provider: providerSchema,

  // Capabilities
  /** Maximum context window size in tokens */
  contextWindow: contextWindowSchema,
  /** Maximum output tokens per request */
  maxOutput: maxOutputSchema,

  // Deployment details
  /** Server port number */
  port: portSchema,
  /** Speed classification */
  speed: speedSchema,
  /** Use case description */
  useCase: useCaseSchema,

  // Optional fields
  /** Model version or variant */
  version: versionSchema.optional(),
  /** Operational status */
  status: modelStatusSchema.optional(),
  /** Detailed description */
  description: modelDescriptionSchema.optional(),
});

/**
 * Schema for model comparison entry
 * Used for comparing multiple models side by side.
 */
export const modelComparisonSchema = z.object({
  /** Unique identifier for comparison */
  id: z.string().min(1, 'Comparison ID is required'),
  /** Model panel data */
  model: modelPanelPropsSchema,
  /** Whether this is the currently selected model */
  isActive: z.boolean().default(false),
  /** Performance benchmark data (optional) */
  benchmark: z
    .object({
      genTps: z.number().optional(),
      promptTps: z.number().optional(),
    })
    .optional(),
});

/**
 * Schema for model list/filter state
 * Used for managing multiple models in a list view.
 */
export const modelListStateSchema = z.object({
  /** List of available models */
  models: z.array(modelPortMappingPropsSchema),
  /** Currently selected model port */
  selectedPort: portSchema.optional(),
  /** Filter by speed classification */
  speedFilter: speedSchema.optional(),
  /** Search query for model names */
  searchQuery: z.string().optional(),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates that a port is in the typical model server range (8000-8999)
 * Used for additional runtime validation beyond schema
 */
export const isValidModelPort = (value: number): boolean =>
  Number.isInteger(value) && value >= 8000 && value <= 8999;

/**
 * Validates that a port is a valid server port (1024-65535)
 * Used for general port validation
 */
export const isValidPortRange = (value: number): boolean =>
  Number.isInteger(value) && value >= 1024 && value <= 65535;

/**
 * Validates that context window is reasonable (512-2M tokens)
 * Used for additional runtime validation beyond schema
 */
export const isValidContextWindow = (value: number): boolean =>
  Number.isInteger(value) && value >= 512 && value <= 2_000_000;

/**
 * Validates that max output is reasonable relative to context window
 * Max output should typically not exceed context window
 */
export const isValidMaxOutputForContext = (maxOutput: number, contextWindow: number): boolean =>
  Number.isInteger(maxOutput) && maxOutput > 0 && maxOutput <= contextWindow;

/**
 * Gets the speed icon/color for a speed classification
 * Used for consistent UI styling
 */
export const getSpeedDisplayInfo = (
  speed: string
): { label: string; color: string; icon: string } => {
  const speedMap: Record<string, { label: string; color: string; icon: string }> = {
    fast: { label: 'Fast', color: 'green', icon: 'zap' },
    medium: { label: 'Medium', color: 'yellow', icon: 'clock' },
    slow: { label: 'Slow', color: 'red', icon: 'turtle' },
  };
  return speedMap[speed] ?? { label: speed, color: 'gray', icon: 'help' };
};

/**
 * Formats context window for display
 * Returns a human-readable string (e.g., "32K", "128K", "1M")
 */
export const formatContextWindow = (tokens: number): string => {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(tokens % 1000 === 0 ? 0 : 1)}K`;
  }
  return tokens.toString();
};

/**
 * Formats port number for display with localhost prefix
 */
export const formatPortDisplay = (port: number): string => `localhost:${port}`;

/**
 * Custom refinement for validating complete model panel data
 */
export const modelRefinement = z
  .object({
    contextWindow: contextWindowSchema,
    maxOutput: maxOutputSchema,
    port: portSchema,
  })
  .refine(
    (data) => {
      // Max output should not exceed context window
      return isValidMaxOutputForContext(data.maxOutput, data.contextWindow);
    },
    {
      message: 'Max output tokens cannot exceed context window size',
    }
  )
  .refine(
    (data) => {
      // Port should typically be in model server range
      return isValidModelPort(data.port);
    },
    {
      message: 'Port should typically be in the 8000-8999 range for model servers',
    }
  );

// ============================================================================
// Model Presets
// ============================================================================

/**
 * Common model configurations for quick reference
 * Based on typical Qwen model variants
 */
export const modelPresets = {
  /** Qwen 0.5B - Smallest, fastest */
  qwen05b: {
    name: 'Qwen2.5-0.5B-Instruct',
    provider: 'Alibaba',
    contextWindow: 32768,
    maxOutput: 4096,
    speed: 'fast' as const,
    useCase: 'Fast responses, simple tasks',
  },
  /** Qwen 1.5B - Small, fast */
  qwen15b: {
    name: 'Qwen2.5-1.5B-Instruct',
    provider: 'Alibaba',
    contextWindow: 32768,
    maxOutput: 4096,
    speed: 'fast' as const,
    useCase: 'Quick chat, short responses',
  },
  /** Qwen 7B - Balanced */
  qwen7b: {
    name: 'Qwen2.5-7B-Instruct',
    provider: 'Alibaba',
    contextWindow: 32768,
    maxOutput: 4096,
    speed: 'fast' as const,
    useCase: 'General purpose chat and code assistance',
  },
  /** Qwen 14B - Medium complexity */
  qwen14b: {
    name: 'Qwen2.5-14B-Instruct',
    provider: 'Alibaba',
    contextWindow: 32768,
    maxOutput: 8192,
    speed: 'medium' as const,
    useCase: 'Complex reasoning, detailed analysis',
  },
  /** Qwen 32B - Advanced */
  qwen32b: {
    name: 'Qwen2.5-32B-Instruct',
    provider: 'Alibaba',
    contextWindow: 32768,
    maxOutput: 8192,
    speed: 'medium' as const,
    useCase: 'Advanced reasoning, long-form content',
  },
  /** Qwen 72B - Largest, most capable */
  qwen72b: {
    name: 'Qwen2.5-72B-Instruct',
    provider: 'Alibaba',
    contextWindow: 32768,
    maxOutput: 8192,
    speed: 'slow' as const,
    useCase: 'Highest quality, research tasks',
  },
} as const;

/**
 * Type for model preset keys
 */
export type ModelPresetKey = keyof typeof modelPresets;

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Type for basic model info (snake_case)
 */
export type ModelInfo = z.infer<typeof modelInfoSchema>;

/**
 * Type for model info props (camelCase)
 */
export type ModelInfoProps = z.infer<typeof modelInfoPropsSchema>;

/**
 * Type for model port mapping (snake_case)
 */
export type ModelPortMapping = z.infer<typeof modelPortMappingSchema>;

/**
 * Type for model port mapping props (camelCase)
 */
export type ModelPortMappingProps = z.infer<typeof modelPortMappingPropsSchema>;

/**
 * Type for complete model panel data (snake_case)
 */
export type ModelPanelData = z.infer<typeof modelPanelSchema>;

/**
 * Type for model panel props (camelCase)
 */
export type ModelPanelProps = z.infer<typeof modelPanelPropsSchema>;

/**
 * Type for model comparison entry
 */
export type ModelComparison = z.infer<typeof modelComparisonSchema>;

/**
 * Type for model list state
 */
export type ModelListState = z.infer<typeof modelListStateSchema>;

/**
 * Type for speed classification
 */
export type SpeedClassification = z.infer<typeof speedSchema>;

/**
 * Type for model status
 */
export type ModelStatus = z.infer<typeof modelStatusSchema>;

// Default export for convenience
export default {
  // Core schemas
  portSchema,
  modelNameSchema,
  providerSchema,
  speedSchema,
  useCaseSchema,
  contextWindowSchema,
  maxOutputSchema,
  versionSchema,
  modelStatusSchema,
  modelDescriptionSchema,

  // Composite schemas
  modelInfoSchema,
  modelInfoPropsSchema,
  modelPortMappingSchema,
  modelPortMappingPropsSchema,
  modelPanelSchema,
  modelPanelPropsSchema,
  modelComparisonSchema,
  modelListStateSchema,

  // Validation helpers
  isValidModelPort,
  isValidPortRange,
  isValidContextWindow,
  isValidMaxOutputForContext,
  getSpeedDisplayInfo,
  formatContextWindow,
  formatPortDisplay,
  modelRefinement,

  // Presets
  modelPresets,
};
