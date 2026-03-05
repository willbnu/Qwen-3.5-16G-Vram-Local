/**
 * Zod Schema Definitions for Cost/Benefit Panel
 *
 * This module defines Zod schemas for the cost/benefit panel component,
 * including validation rules for token costs, efficiency metrics, and
 * cost analysis data.
 *
 * @module schemas/costs
 */

import { z } from 'zod';

// ============================================================================
// Core Cost Schemas
// ============================================================================

/**
 * Schema for input/prompt token cost in USD
 * Represents the cost for processing input tokens.
 */
export const inputCostSchema = z
  .number()
  .min(0, 'Input cost must be non-negative')
  .finite()
  .describe('Cost for input/prompt tokens in USD');

/**
 * Schema for output/completion token cost in USD
 * Represents the cost for generating output tokens.
 */
export const outputCostSchema = z
  .number()
  .min(0, 'Output cost must be non-negative')
  .finite()
  .describe('Cost for output/completion tokens in USD');

/**
 * Schema for total combined cost in USD
 * The sum of input and output costs for a request or session.
 */
export const totalCostSchema = z
  .number()
  .min(0, 'Total cost must be non-negative')
  .finite()
  .describe('Total combined cost in USD');

/**
 * Schema for cost per single request
 * Average cost incurred per API request.
 */
export const costPerRequestSchema = z
  .number()
  .min(0, 'Cost per request must be non-negative')
  .finite()
  .nullable()
  .describe('Average cost per API request in USD');

/**
 * Schema for cost per 1,000 tokens
 * Normalized cost metric for comparing efficiency across models.
 */
export const costPer1kTokensSchema = z
  .number()
  .min(0, 'Cost per 1K tokens must be non-negative')
  .finite()
  .nullable()
  .describe('Cost per 1,000 tokens processed in USD');

/**
 * Schema for input token price per 1K tokens
 * Pricing rate for input tokens (used for cost calculations).
 */
export const inputPricePer1kSchema = z
  .number()
  .min(0, 'Input price must be non-negative')
  .finite()
  .describe('Price per 1K input tokens in USD');

/**
 * Schema for output token price per 1K tokens
 * Pricing rate for output tokens (used for cost calculations).
 */
export const outputPricePer1kSchema = z
  .number()
  .min(0, 'Output price must be non-negative')
  .finite()
  .describe('Price per 1K output tokens in USD');

// ============================================================================
// Efficiency Metrics Schemas
// ============================================================================

/**
 * Schema for tokens per dollar efficiency metric
 * Higher values indicate better cost efficiency.
 */
export const tokensPerDollarSchema = z
  .number()
  .min(0, 'Tokens per dollar must be non-negative')
  .finite()
  .describe('Number of tokens that can be generated per dollar spent');

/**
 * Schema for cost efficiency ratio (0-1 scale)
 * 1.0 represents maximum efficiency, 0.0 represents minimum.
 */
export const costEfficiencySchema = z
  .number()
  .min(0, 'Cost efficiency must be between 0 and 1')
  .max(1, 'Cost efficiency must be between 0 and 1')
  .finite()
  .describe('Cost efficiency ratio on a 0-1 scale');

/**
 * Schema for savings percentage compared to baseline
 * Positive values indicate savings, negative indicate additional cost.
 */
export const savingsPercentageSchema = z
  .number()
  .min(-100, 'Savings percentage cannot be less than -100%')
  .max(100, 'Savings percentage cannot exceed 100%')
  .finite()
  .describe('Percentage savings compared to baseline pricing');

// ============================================================================
// Composite Cost Schemas
// ============================================================================

/**
 * Schema for basic cost breakdown
 * Used for simple cost tracking with input, output, and total costs.
 */
export const costsSchema = z.object({
  /** Cost for input/prompt tokens in USD */
  input_cost: inputCostSchema,
  /** Cost for output/completion tokens in USD */
  output_cost: outputCostSchema,
  /** Total combined cost in USD */
  total_cost: totalCostSchema,
});

/**
 * Schema for complete cost panel data with efficiency metrics
 * Includes all cost data needed for the dashboard panel display.
 */
export const costPanelSchema = z.object({
  // Core cost breakdown (snake_case for API compatibility)
  /** Cost for input/prompt tokens in USD */
  input_cost: inputCostSchema,
  /** Cost for output/completion tokens in USD */
  output_cost: outputCostSchema,
  /** Total combined cost in USD */
  total_cost: totalCostSchema,

  // Efficiency metrics
  /** Average cost per API request in USD */
  cost_per_request: costPerRequestSchema.optional(),
  /** Cost per 1,000 tokens processed in USD */
  cost_per_1k_tokens: costPer1kTokensSchema.optional(),

  // Optional pricing information
  /** Price per 1K input tokens in USD */
  input_price_per_1k: inputPricePer1kSchema.optional(),
  /** Price per 1K output tokens in USD */
  output_price_per_1k: outputPricePer1kSchema.optional(),
});

/**
 * Schema for cost panel props with camelCase naming
 * Used by React components with idiomatic JavaScript naming.
 */
export const costPanelPropsSchema = z.object({
  // Core cost breakdown
  /** Cost for input/prompt tokens in USD */
  inputCost: inputCostSchema,
  /** Cost for output/completion tokens in USD */
  outputCost: outputCostSchema,
  /** Total combined cost in USD */
  totalCost: totalCostSchema,

  // Efficiency metrics
  /** Average cost per API request in USD */
  costPerRequest: costPerRequestSchema.optional(),
  /** Cost per 1,000 tokens processed in USD */
  costPer1kTokens: costPer1kTokensSchema.optional(),

  // Optional pricing information
  /** Price per 1K input tokens in USD */
  inputPricePer1k: inputPricePer1kSchema.optional(),
  /** Price per 1K output tokens in USD */
  outputPricePer1k: outputPricePer1kSchema.optional(),
});

/**
 * Schema for extended cost analysis with efficiency metrics
 * Includes tokens per dollar and efficiency ratings.
 */
export const costAnalysisSchema = costPanelPropsSchema.extend({
  /** Number of tokens generated per dollar spent */
  tokensPerDollar: tokensPerDollarSchema.optional(),
  /** Cost efficiency ratio on a 0-1 scale */
  costEfficiency: costEfficiencySchema.optional(),
  /** Percentage savings compared to baseline pricing */
  savingsPercentage: savingsPercentageSchema.optional(),
});

/**
 * Schema for cost comparison between models
 * Used for comparing costs across different model configurations.
 */
export const costComparisonSchema = z.object({
  /** Model identifier for comparison */
  modelId: z.string().min(1, 'Model ID is required'),
  /** Model display name */
  modelName: z.string().min(1, 'Model name is required'),
  /** Cost data for this model */
  costs: costPanelPropsSchema,
  /** Efficiency rating (1-5 stars) */
  efficiencyRating: z.number().int().min(1).max(5).optional(),
});

/**
 * Schema for cost history entry (for charts/graphs)
 */
export const costHistoryEntrySchema = z.object({
  /** Timestamp of the cost snapshot */
  timestamp: z.string().datetime().describe('When this cost snapshot was taken'),
  /** Cost data at this point in time */
  costs: costPanelPropsSchema,
});

/**
 * Schema for array of cost history entries
 */
export const costHistorySchema = z.array(costHistoryEntrySchema);

/**
 * Schema for cost budget configuration
 */
export const costBudgetSchema = z.object({
  /** Maximum allowed total cost */
  maxTotalCost: z.number().min(0).describe('Maximum allowed total cost in USD'),
  /** Warning threshold (percentage of max) */
  warningThreshold: z
    .number()
    .min(0)
    .max(100)
    .default(80)
    .describe('Warning threshold as percentage of max cost'),
  /** Budget period in days */
  budgetPeriod: z.number().int().min(1).default(30).describe('Budget period in days'),
  /** Whether budget enforcement is enabled */
  isEnabled: z.boolean().default(true).describe('Whether budget enforcement is enabled'),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates that a cost value is reasonable (0-$1000 range)
 * Used for additional runtime validation beyond schema
 */
export const isValidCostRange = (value: number): boolean =>
  value >= 0 && value <= 1000 && Number.isFinite(value);

/**
 * Validates that cost per request is reasonable (0-$10 range)
 * Used for additional runtime validation beyond schema
 */
export const isValidCostPerRequest = (value: number): boolean =>
  value >= 0 && value <= 10 && Number.isFinite(value);

/**
 * Validates that cost per 1K tokens is reasonable (0-$100 range)
 * Used for additional runtime validation beyond schema
 */
export const isValidCostPer1kTokens = (value: number): boolean =>
  value >= 0 && value <= 100 && Number.isFinite(value);

/**
 * Validates that total cost matches input + output costs
 * Used for data consistency validation
 */
export const isTotalCostConsistent = (
  inputCost: number,
  outputCost: number,
  totalCost: number
): boolean => {
  const calculatedTotal = inputCost + outputCost;
  // Allow 0.01% variance for floating point precision
  const tolerance = calculatedTotal * 0.0001;
  return Math.abs(calculatedTotal - totalCost) <= tolerance;
};

/**
 * Formats a cost value for display
 * Returns a string with proper currency formatting
 */
export const formatCostDisplay = (cost: number): string => {
  if (cost === 0) return '$0.00';
  if (cost < 0.01) return `< $0.01`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(cost);
};

/**
 * Custom refinement for validating complete cost data
 */
export const costRefinement = z
  .object({
    inputCost: inputCostSchema,
    outputCost: outputCostSchema,
    totalCost: totalCostSchema,
  })
  .refine(
    (data) => {
      // Total should be approximately input + output
      return isTotalCostConsistent(data.inputCost, data.outputCost, data.totalCost);
    },
    {
      message: 'Total cost does not match the sum of input and output costs',
    }
  )
  .refine(
    (data) => {
      // Total cost should be at least as large as input or output
      return data.totalCost >= Math.max(data.inputCost, data.outputCost);
    },
    {
      message: 'Total cost cannot be less than either input or output cost',
    }
  );

// ============================================================================
// Pricing Presets
// ============================================================================

/**
 * Common pricing presets for popular LLM providers
 * Prices are per 1K tokens in USD
 */
export const pricingPresets = {
  /** Qwen model pricing (typical rates) */
  qwen: {
    input: 0.0007,
    output: 0.0028,
  },
  /** OpenAI GPT-4 pricing */
  gpt4: {
    input: 0.03,
    output: 0.06,
  },
  /** OpenAI GPT-3.5 Turbo pricing */
  gpt35Turbo: {
    input: 0.0005,
    output: 0.0015,
  },
  /** Claude 3 Opus pricing */
  claude3Opus: {
    input: 0.015,
    output: 0.075,
  },
  /** Claude 3 Sonnet pricing */
  claude3Sonnet: {
    input: 0.003,
    output: 0.015,
  },
} as const;

/**
 * Type for pricing preset keys
 */
export type PricingPresetKey = keyof typeof pricingPresets;

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Type for basic cost breakdown (snake_case)
 */
export type Costs = z.infer<typeof costsSchema>;

/**
 * Type for complete cost panel data (snake_case)
 */
export type CostPanelData = z.infer<typeof costPanelSchema>;

/**
 * Type for cost panel props (camelCase)
 */
export type CostPanelProps = z.infer<typeof costPanelPropsSchema>;

/**
 * Type for extended cost analysis
 */
export type CostAnalysis = z.infer<typeof costAnalysisSchema>;

/**
 * Type for cost comparison entry
 */
export type CostComparison = z.infer<typeof costComparisonSchema>;

/**
 * Type for cost history entry
 */
export type CostHistoryEntry = z.infer<typeof costHistoryEntrySchema>;

/**
 * Type for cost history array
 */
export type CostHistory = z.infer<typeof costHistorySchema>;

/**
 * Type for cost budget configuration
 */
export type CostBudget = z.infer<typeof costBudgetSchema>;

// Default export for convenience
export default {
  // Core schemas
  inputCostSchema,
  outputCostSchema,
  totalCostSchema,
  costPerRequestSchema,
  costPer1kTokensSchema,
  inputPricePer1kSchema,
  outputPricePer1kSchema,

  // Efficiency schemas
  tokensPerDollarSchema,
  costEfficiencySchema,
  savingsPercentageSchema,

  // Composite schemas
  costsSchema,
  costPanelSchema,
  costPanelPropsSchema,
  costAnalysisSchema,
  costComparisonSchema,
  costHistoryEntrySchema,
  costHistorySchema,
  costBudgetSchema,

  // Validation helpers
  isValidCostRange,
  isValidCostPerRequest,
  isValidCostPer1kTokens,
  isTotalCostConsistent,
  formatCostDisplay,
  costRefinement,

  // Pricing presets
  pricingPresets,
};
