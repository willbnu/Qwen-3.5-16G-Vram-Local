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
import { checkHealth, getMetricsFromTest, getModels, parseModelName } from './services/llmApi';
import type { DocCategory } from './types';

/**
 * Sample documentation categories for initial data
 */
const sampleDocCategories: DocCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Quick start guides and tutorials',
    entries: [
      {
        id: 'installation',
        title: 'Installation',
        category: 'getting-started',
        content: '## Installation\n\nFollow these steps to set up the LLM Chat Dashboard:\n\n1. Clone the repository\n2. Install dependencies\n3. Configure your API keys\n4. Start the development server',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'quick-start',
        title: 'Quick Start Guide',
        category: 'getting-started',
        content: '## Quick Start\n\nGet started with the dashboard in minutes:\n\n- Configure your model settings\n- Set up cost tracking\n- Monitor performance metrics',
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
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
        title: 'Chat Endpoint',
        category: 'api-reference',
        content: '## Chat Endpoint\n\nPOST /api/chat\n\nSend a chat message to the LLM and receive a response.',
        url: 'https://example.com/docs/chat',
      },
      {
        id: 'metrics-endpoint',
        title: 'Metrics Endpoint',
        category: 'api-reference',
        content: '## Metrics Endpoint\n\nGET /api/metrics\n\nRetrieve current performance metrics.',
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
        title: 'Connection Issues',
        category: 'troubleshooting',
        content: '## Connection Issues\n\nIf you experience connection problems:\n\n1. Check your network connection\n2. Verify API credentials\n3. Check server logs',
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
    useCase: 'Start the llama.cpp server to see real metrics',
    version: 'N/A',
  },
  docs: sampleDocCategories,
  serverStatus: 'offline' as 'online' | 'offline' | 'checking',
};

/**
 * Main App component
 */
function App() {
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [metrics, setMetrics] = useState(defaultState.metrics);
  const [modelInfo, setModelInfo] = useState(defaultState.model);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger refresh without incrementing counter

  // Fetch real metrics from the server
  const fetchMetrics = useCallback(async () => {
    setServerStatus('checking');
    
    const healthy = await checkHealth();
    if (!healthy) {
      setServerStatus('offline');
      setModelInfo(defaultState.model);
      return;
    }
    
    setServerStatus('online');
    
    // Get model info
    const models = await getModels();
    if (models.length > 0) {
      const parsed = parseModelName(models[0].id);
      setModelInfo({
        name: parsed.name,
        provider: parsed.provider,
        port: 8002,
        contextWindow: models[0].meta.n_ctx_train,
        maxOutput: 8192,
        speed: 'fast',
        useCase: 'Local inference via llama.cpp',
        version: parsed.quant,
      });
    }
    
    // Get real metrics via test request
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
        requestsCount: 0, // Local inference - no request counting needed
      });
    }
  }, []);

  // Check server on mount and periodically
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Build initial state for json-render
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
    docs: sampleDocCategories,
    serverStatus,
  }), [metrics, modelInfo, serverStatus]);

  return (
    <div className="relative">
      {/* Server status indicator */}
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
