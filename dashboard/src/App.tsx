/**
 * LLM Chat Dashboard Application
 *
 * Root component that wraps the dashboard with JSONUIProvider
 * from the @json-render ecosystem for schema-driven UI rendering.
 *
 * The dashboard is rendered via the Renderer component using a JSON spec,
 * fulfilling the requirement that "All UI can be modified by changing JSON
 * schemas without touching React components."
 *
 * Uses initialState in JSONUIProvider to provide data for $state expressions.
 */

import { useMemo } from 'react';
import { JSONUIProvider, Renderer } from '@json-render/react';
import { registry } from './registry';
import { dashboardSpec } from './specs/dashboardSpec';
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
        content:
          '## Installation\n\nFollow these steps to set up the LLM Chat Dashboard:\n\n1. Clone the repository\n2. Install dependencies\n3. Configure your API keys\n4. Start the development server',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'quick-start',
        title: 'Quick Start Guide',
        category: 'getting-started',
        content:
          '## Quick Start\n\nGet started with the dashboard in minutes:\n\n- Configure your model settings\n- Set up cost tracking\n- Monitor performance metrics',
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
        content:
          '## Chat Endpoint\n\nPOST /api/chat\n\nSend a chat message to the LLM and receive a response.',
        url: 'https://example.com/docs/chat',
      },
      {
        id: 'metrics-endpoint',
        title: 'Metrics Endpoint',
        category: 'api-reference',
        content:
          '## Metrics Endpoint\n\nGET /api/metrics\n\nRetrieve current performance metrics.',
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
        content:
          '## Connection Issues\n\nIf you experience connection problems:\n\n1. Check your network connection\n2. Verify API credentials\n3. Check server logs',
      },
    ],
  },
];

/**
 * Initial state for the json-render state model
 * This data is accessed via $state expressions in the spec
 */
const initialDashboardState = {
  metrics: {
    genTps: 45.2,
    promptTps: 1250.5,
    totalTokens: 1024,
    promptTokens: 512,
    completionTokens: 512,
    time: 11.35,
    averageLatency: 245,
    requestsCount: 42,
  },
  costs: {
    inputCost: 0.015,
    outputCost: 0.030,
    totalCost: 0.045,
    costPerRequest: 0.00107,
    costPer1kTokens: 0.044,
    currency: 'USD',
  },
  model: {
    name: 'Qwen2.5-7B-Instruct',
    provider: 'Alibaba',
    port: 8002,
    contextWindow: 32768,
    maxOutput: 4096,
    speed: 'fast',
    useCase: 'General purpose chat and code assistance',
    version: 'v2.5',
  },
  docs: sampleDocCategories,
};

/**
 * Main App component
 *
 * Wraps the dashboard with JSONUIProvider for @json-render ecosystem integration.
 * All UI is rendered via json-render schemas (dashboardSpec), fulfilling the
 * requirement that UI can be modified by changing JSON schemas without touching
 * React components.
 *
 * The initialState prop provides data that $state expressions in the spec can access.
 */
function App() {
  // Memoize initial state to prevent unnecessary re-renders
  const initialState = useMemo(() => initialDashboardState, []);

  return (
    <JSONUIProvider
      registry={registry}
      initialState={initialState}
    >
      <Renderer spec={dashboardSpec} registry={registry} />
    </JSONUIProvider>
  );
}

export default App;
