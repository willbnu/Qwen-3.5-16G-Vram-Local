/**
 * LLM Chat Dashboard Application
 *
 * Root component that wraps the dashboard with JSONUIProvider
 * from the @json-render ecosystem for schema-driven UI rendering.
 */

import { JSONUIProvider } from '@json-render/react';
import { registry } from './registry';
import { MetricsPanel } from './components/dashboard/MetricsPanel';
import { CostPanel } from './components/dashboard/CostPanel';
import { ModelInfoPanel } from './components/dashboard/ModelInfoPanel';
import { DocsPanel } from './components/dashboard/DocsPanel';

// Sample metrics data for demonstration
const sampleMetrics = {
  genTps: 45.2,
  promptTps: 1250.5,
  totalTokens: 1024,
  promptTokens: 512,
  completionTokens: 512,
  time: 11.35,
  averageLatency: 245,
  requestsCount: 42,
};

// Sample cost data for demonstration
const sampleCosts = {
  inputCost: 0.015,
  outputCost: 0.030,
  totalCost: 0.045,
  costPerRequest: 0.00107,
  costPer1kTokens: 0.044,
  currency: 'USD' as const,
};

// Sample model info data for demonstration
const sampleModelInfo = {
  name: 'Qwen2.5-7B-Instruct',
  provider: 'Alibaba',
  port: 8002,
  contextWindow: 32768,
  maxOutput: 4096,
  speed: 'fast' as const,
  useCase: 'General purpose chat and code assistance',
  version: 'v2.5',
};

// Sample documentation data for demonstration
const sampleDocs = {
  categories: [
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
          url: null,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'quick-start',
          title: 'Quick Start Guide',
          category: 'getting-started',
          content: '## Quick Start\n\nGet started with the dashboard in minutes:\n\n- Configure your model settings\n- Set up cost tracking\n- Monitor performance metrics',
          url: null,
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
          updatedAt: null,
        },
        {
          id: 'metrics-endpoint',
          title: 'Metrics Endpoint',
          category: 'api-reference',
          content: '## Metrics Endpoint\n\nGET /api/metrics\n\nRetrieve current performance metrics.',
          url: null,
          updatedAt: null,
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
          url: null,
          updatedAt: null,
        },
      ],
    },
  ],
};

/**
 * Dashboard content component
 * Renders all four dashboard panels in a grid layout
 */
function DashboardContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">LLM Chat Dashboard</h1>
        <p className="text-muted-foreground text-sm">Monitor and manage your LLM chat interactions</p>
      </header>
      <main className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Metrics Panel */}
          <MetricsPanel {...sampleMetrics} />
          {/* Cost Panel */}
          <CostPanel {...sampleCosts} />
          {/* Model Info Panel */}
          <ModelInfoPanel {...sampleModelInfo} />
          {/* Docs Panel */}
          <DocsPanel {...sampleDocs} />
        </div>
      </main>
    </div>
  );
}

/**
 * Main App component
 * Wraps the dashboard with JSONUIProvider for @json-render ecosystem integration
 */
function App() {
  return (
    <JSONUIProvider registry={registry}>
      <DashboardContent />
    </JSONUIProvider>
  );
}

export default App;
