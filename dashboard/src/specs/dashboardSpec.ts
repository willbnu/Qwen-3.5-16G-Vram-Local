/**
 * Dashboard Spec - JSON-Render Schema for LLM Chat Dashboard
 */

import type { Spec } from '@json-render/react';

export const dashboardSpec: Spec = {
  root: 'dashboard',
  elements: {
    dashboard: {
      type: 'div',
      props: {
        className: 'min-h-screen bg-background text-foreground',
      },
      children: ['header', 'main'],
    },
    header: {
      type: 'header',
      props: {
        className: 'border-b border-border px-6 py-4',
      },
      children: ['headerTitle', 'headerSubtitle'],
    },
    headerTitle: {
      type: 'h1',
      props: {
        className: 'text-2xl font-semibold tracking-tight',
        children: 'LLM Chat Dashboard',
      },
      children: [],
    },
    headerSubtitle: {
      type: 'p',
      props: {
        className: 'text-muted-foreground text-sm',
        children: 'Monitor and manage your LLM chat interactions',
      },
      children: [],
    },
    main: {
      type: 'main',
      props: {
        className: 'p-6',
      },
      children: ['grid'],
    },
    grid: {
      type: 'div',
      props: {
        className: 'grid gap-6 md:grid-cols-2 lg:grid-cols-4',
      },
      children: ['metricsPanel', 'costPanel', 'modelPanel', 'docsPanel'],
    },
    metricsPanel: {
      type: 'MetricsPanel',
      props: {
        genTps: { "$state": '/metrics/genTps' },
        promptTps: { "$state": '/metrics/promptTps' },
        totalTokens: { "$state": '/metrics/totalTokens' },
        promptTokens: { "$state": '/metrics/promptTokens' },
        completionTokens: { "$state": '/metrics/completionTokens' },
        time: { "$state": '/metrics/time' },
        averageLatency: { "$state": '/metrics/averageLatency' },
        requestsCount: { "$state": '/metrics/requestsCount' },
      },
      children: [],
    },
    costPanel: {
      type: 'CostPanel',
      props: {
        inputCost: { "$state": '/costs/inputCost' },
        outputCost: { "$state": '/costs/outputCost' },
        totalCost: { "$state": '/costs/totalCost' },
        costPerRequest: { "$state": '/costs/costPerRequest' },
        costPer1kTokens: { "$state": '/costs/costPer1kTokens' },
        currency: { "$state": '/costs/currency' },
      },
      children: [],
    },
    modelPanel: {
      type: 'ModelInfoPanel',
      props: {
        name: { "$state": '/model/name' },
        provider: { "$state": '/model/provider' },
        port: { "$state": '/model/port' },
        contextWindow: { "$state": '/model/contextWindow' },
        maxOutput: { "$state": '/model/maxOutput' },
        speed: { "$state": '/model/speed' },
        useCase: { "$state": '/model/useCase' },
        version: { "$state": '/model/version' },
      },
      children: [],
    },
    docsPanel: {
      type: 'DocsPanel',
      props: {
        categories: { "$state": '/docs' },
        searchQuery: null,
        selectedCategoryId: null,
        expandedDocId: null,
      },
      children: [],
    },
  },
};

export default dashboardSpec;
