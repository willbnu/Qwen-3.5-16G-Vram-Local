/**
 * LLM API Service
 *
 * Fetches real metrics from the llama.cpp server at localhost:8002
 */

const API_BASE = import.meta.env.VITE_LLM_API_BASE || 'http://127.0.0.1:8002';

export interface ModelInfo {
  id: string;
  owned_by: string;
  meta: {
    vocab_type: number;
    n_vocab: number;
    n_ctx_train: number;
    n_embd: number;
    n_params: number;
    size: number;
  };
}

export interface UsageMetrics {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Timings {
  prompt_n: number;
  prompt_ms: number;
  prompt_per_second: number;
  predicted_n: number;
  predicted_ms: number;
  predicted_per_second: number;
}

export interface ChatResponse {
  model: string;
  usage: UsageMetrics;
  timings: Timings;
}

/**
 * Check if the server is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    // nosemgrep: typescript.react.security.react-insecure-request.react-insecure-request
    const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get available models
 */
export async function getModels(): Promise<ModelInfo[]> {
  try {
    // nosemgrep: typescript.react.security.react-insecure-request.react-insecure-request
    const response = await fetch(`${API_BASE}/v1/models`);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.data || [];
  } catch {
    return [];
  }
}

/**
 * Send a test message and get real metrics
 */
export async function getMetricsFromTest(maxTokens: number = 50): Promise<ChatResponse | null> {
  try {
    // nosemgrep: typescript.react.security.react-insecure-request.react-insecure-request
    const response = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say "metrics check" and nothing else.' }],
        max_tokens: maxTokens,
        temperature: 0.1,
      }),
    });
    
    if (!response.ok) throw new Error('Failed to get metrics');
    return await response.json();
  } catch (error) {
    console.error('Metrics fetch error:', error);
    return null;
  }
}

/**
 * Parse model name to extract info
 */
export function parseModelName(modelId: string): {
  name: string;
  provider: string;
  quant: string;
} {
  // Example: Qwen3.5-35B-A3B-Q3_K_S.gguf
  const parts = modelId.replace('.gguf', '').split('-');
  const quantIndex = parts.findIndex(p => p.includes('Q') || p.includes('K'));
  
  return {
    name: parts.slice(0, quantIndex > 0 ? quantIndex : 3).join('-'),
    provider: 'Local (llama.cpp)',
    quant: quantIndex > 0 ? parts.slice(quantIndex).join('-') : 'unknown',
  };
}

/**
 * Format tokens per second
 */
export function formatTps(tps: number): string {
  return tps.toFixed(1);
}

/**
 * Format token count with commas
 */
export function formatTokens(tokens: number): string {
  return tokens.toLocaleString();
}

/**
 * Format time in seconds
 */
export function formatTime(ms: number): string {
  return (ms / 1000).toFixed(2) + 's';
}
