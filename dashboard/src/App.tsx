/**
 * LLM Chat Dashboard Application
 *
 * Root component that wraps the dashboard with JSONUIProvider
 * from the @json-render ecosystem for schema-driven UI rendering.
 *
 * Fetches real metrics from the llama.cpp server at localhost:8002
 */

import { useMemo, useEffect, useState, useCallback } from 'react';
import { JSONUIProvider, Renderer } from '@json-render/react';
import { registry } from './registry';
import { dashboardSpec } from './specs/dashboardSpec';
import { checkHealth, getMetricsFromTest, getModels } from './services/llmApi';
import type { DocCategory } from './types';

/**
 * Documentation categories with comprehensive content
 */
const docCategories: DocCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Quick start guides and tutorials',
    entries: [
      {
        id: 'installation',
        title: 'Installation',
        category: 'getting-started',
        content: `## Installation

Get the dashboard running in minutes.

**Steps:**
1. Clone: \`git clone <repo>\`
2. Install: \`npm install\`
3. Start server: \`start_servers_speed.bat coding\`
4. Run dashboard: \`npm run dev\`

**Requirements:**
- Node.js 18+
- 16GB GPU VRAM (for 35B model)
- llama.cpp SM120 build`,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'quick-start',
        title: 'Quick Start Guide',
        category: 'getting-started',
        content: `## Quick Start

1. Start the LLM server first
2. Open the dashboard at http://localhost:5173
3. Check the server status indicator (green = online)
4. Click "Refresh" to update metrics

**Using Kilo Code CLI:**
\`\`\`bash
kilo run "write a hello world function"
\`\`\``,
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'models-performance',
    name: 'Models & Performance',
    description: 'Local LLM specs and benchmarks',
    entries: [
      {
        id: 'qwen-35b',
        title: 'Qwen3.5-35B-A3B (MoE)',
        category: 'models-performance',
        content: `## Qwen3.5-35B-A3B

Mixture-of-Experts model with A3B active parameters.

| Spec | Value |
|-----|-------|
| Parameters | 35B (8.95B active) |
| Context | 32K-120K tokens |
| Speed | 120+ t/s generation |
| VRAM | ~14GB (32K context) |
| Use Case | Coding, complex reasoning |

**Critical flags:**
- \`--parallel 1\` - Required for 10x speed boost
- \`--reasoning-budget 0\` - Disables thinking mode`,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'qwen-9b',
        title: 'Qwen3.5-9B (Fast)',
        category: 'models-performance',
        content: `## Qwen3.5-9B

Dense model optimized for speed.

| Spec | Value |
|-----|-------|
| Parameters | 9B |
| Context | 64K tokens |
| Speed | 95-105 t/s |
| VRAM | ~7GB (full GPU fit) |
| Use Case | Chat, Kilo Code CLI |
| Vision | Yes (multimodal) |

**Best for interactive applications.**`,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'qwen-27b',
        title: 'Qwen3.5-27B (Quality)',
        category: 'models-performance',
        content: `## Qwen3.5-27B

Dense model for high-quality output.

| Spec | Value |
|-----|-------|
| Parameters | 27B |
| Context | 64K tokens |
| Speed | 45-55 t/s |
| VRAM | ~12GB (partial offload) |
| Use Case | Complex analysis |

**Note:** Requires partial CPU offloading at 64K.**`,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'optimization-tips',
        title: 'Performance Tips',
        category: 'models-performance',
        content: `## Speed Optimization

**Required Flags:**
- \`--parallel 1\` - **10x speed boost** (critical!)
- \`--reasoning-budget 0\` - Disables thinking mode
- \`--flash-attn on\` - Faster attention

**Context vs Speed:**
- 32K: Full GPU fit, 120+ t/s
- 64K: Partial offload, 2-10 t/s
- 120K+: Severe offload, <1 t/s

**Hardware:** RTX 5080 16GB VRAM`,
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'api-reference',
    name: 'API Reference',
    description: 'API documentation and endpoints',
    entries: [
      {
        id: 'chat-endpoint',
        title: 'Chat Completions',
        category: 'api-reference',
        content: `## Chat Completions API

OpenAI-compatible chat endpoint.

**Endpoint:** \`POST /v1/chat/completions\`

\`\`\`bash
curl http://localhost:8002/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 100
  }'
\`\`\`

**Returns:** Usage stats, timing info, tokens/sec`,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'models-endpoint',
        title: 'Models API',
        category: 'api-reference',
        content: `## Models API

Get loaded model info.

**Endpoint:** \`GET /v1/models\`

**Returns:**
- Model ID and filename
- Context window size
- Parameter count
- Quantization level`,
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Common issues and solutions',
    entries: [
      {
        id: 'connection-issues',
        title: 'Server Offline',
        category: 'troubleshooting',
        content: `## Server Offline

If dashboard shows "Server Offline":

1. Check if running: \`tasklist | find llama\`
2. Check port: \`netstat -an | find 8002\`
3. Start server: \`start_servers_speed.bat coding\``,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'slow-speed',
        title: 'Slow Generation',
        category: 'troubleshooting',
        content: `## Slow Token Generation

If speed is below 10 t/s:

**Causes:**
- Context too large
- Missing \`--parallel 1\`
- CPU offloading

**Fix:** Add \`--parallel 1\` flag!`,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'thinking-mode',
        title: 'Thinking Mode',
        category: 'troubleshooting',
        content: `## Thinking Mode Issues

Qwen3.5 may output to \`reasoning_content\`.

**Problem:** Empty \`content\` field

**Fix:** Add \`--reasoning-budget 0\``,
        updatedAt: new Date().toISOString(),
      },
    ],
  },
];

/**
 * Default state when server is not available
 */
const defaultState = {
  metrics: {
    genTps: 0,
    promptTps: 0,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    time: 0,
    averageLatency: 0,
    requestsCount: 0,
  },
  costs: {
    inputCost: 0,
    outputCost: 0,
    totalCost: 0,
    costPerRequest: 0,
    costPer1kTokens: 0,
    currency: 'USD',
  },
  model: {
    name: 'Server Offline',
    provider: 'N/A',
    port: 8002,
    contextWindow: 0,
    maxOutput: 0,
    speed: 'offline',
    useCase: 'Start the llama.cpp server',
    version: 'N/A',
    params: 0,
    quantization: 'N/A',
  },
  docs: docCategories,
  serverStatus: 'offline' as 'online' | 'offline' | 'checking',
};

/**
 * Main App component
 */
function App() {
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [metrics, setMetrics] = useState(defaultState.metrics);
  const [modelInfo, setModelInfo] = useState(defaultState.model);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMetrics = useCallback(async () => {
    setServerStatus('checking');
    
    const healthy = await checkHealth();
    if (!healthy) {
      setServerStatus('offline');
      setModelInfo(defaultState.model);
      return;
    }
    
    setServerStatus('online');
    
    const models = await getModels();
    if (models.length > 0) {
      const model = models[0];
      const modelId = model.id.replace('.gguf', '');
      const parts = modelId.split('-');
      
      const quantMatch = modelId.match(/Q\d+_[A-Z_]+/i);
      const quantization = quantMatch ? quantMatch[0] : 'unknown';
      
      const nameMatch = modelId.match(/^([A-Za-z0-9.]+-\d+B)/);
      const name = nameMatch ? nameMatch[1] : modelId;
      
      const sizeGB = (model.meta.size / 1e9).toFixed(1);
      const paramsB = (model.meta.n_params / 1e9).toFixed(1);
      
      setModelInfo({
        name: name,
        provider: 'Local (llama.cpp)',
        port: 8002,
        contextWindow: model.meta.n_ctx_train,
        maxOutput: 8192,
        speed: 'fast',
        useCase: 'Local inference',
        version: `${paramsB}B params | ${sizeGB}GB`,
        params: model.meta.n_params,
        quantization: quantization,
      });
    }
    
    const response = await getMetricsFromTest(50);
    if (response && response.timings) {
      setMetrics({
        genTps: response.timings.predicted_per_second,
        promptTps: response.timings.prompt_per_second,
        totalTokens: response.usage.total_tokens,
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        time: response.timings.predicted_ms / 1000,
        averageLatency: Math.round(response.timings.prompt_ms),
        requestsCount: 0,
      });
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const initialState = useMemo(() => ({
    metrics,
    costs: {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      costPerRequest: 0,
      costPer1kTokens: 0,
      currency: 'USD',
    },
    model: modelInfo,
    docs: docCategories,
    serverStatus,
  }), [metrics, modelInfo, serverStatus]);

  return (
    <div className="relative">
      <div className="fixed top-2 right-2 z-50 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium shadow-lg">
        <span className={`h-2 w-2 rounded-full ${
          serverStatus === 'online' ? 'bg-green-500 animate-pulse' :
          serverStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
          'bg-red-500'
        }`} />
        <span className={`
          ${serverStatus === 'online' ? 'text-green-600 bg-green-50' :
            serverStatus === 'checking' ? 'text-yellow-600 bg-yellow-50' :
            'text-red-600 bg-red-50'}
          rounded-full px-2 py-0.5
        `}>
          {serverStatus === 'online' ? 'Server Online' :
           serverStatus === 'checking' ? 'Checking...' :
           'Server Offline'}
        </span>
        {serverStatus === 'online' && (
          <button
            onClick={() => {
              fetchMetrics();
              setRefreshKey(k => k + 1);
            }}
            className="ml-1 rounded bg-blue-500 px-2 py-0.5 text-white hover:bg-blue-600"
          >
            Refresh
          </button>
        )}
      </div>
      
      <JSONUIProvider registry={registry} initialState={initialState} key={refreshKey}>
        <Renderer spec={dashboardSpec} registry={registry} />
      </JSONUIProvider>
    </div>
  );
}

export default App;
