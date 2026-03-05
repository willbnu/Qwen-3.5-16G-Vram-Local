/**
 * Component Registry for LLM Chat Dashboard
 *
 * This registry maps catalog component names to their React implementations.
 * It combines custom dashboard components with shadcn/ui components.
 *
 * The registry is used by JSONUIProvider to render JSON specs.
 */

import type { ReactNode } from 'react';
import type { ComponentRegistry } from '@json-render/react';
import { shadcnComponents } from '@json-render/shadcn';
import type {
  MetricsPanelProps,
  CostPanelProps,
  ModelInfoPanelProps,
  DocsPanelProps,
  DashboardLayoutProps,
  StatCardProps,
  BenchmarkPanelProps,
} from '../catalog';

// Import real dashboard components
import { MetricsPanel as MetricsPanelComponent } from '../components/dashboard/MetricsPanel';

// ============================================================================
// Types for Component Props
// ============================================================================

/**
 * Base props provided by the json-render renderer to all components
 */
interface BaseRenderProps {
  children?: ReactNode;
  /** Emit a named event */
  emit: (event: string) => void;
  /** Get an event handle with metadata */
  on: (event: string) => { emit: () => void; shouldPreventDefault: boolean; bound: boolean };
  /** Two-way binding paths */
  bindings?: Record<string, string>;
  loading?: boolean;
}

/**
 * Props structure from json-render renderer
 * Props are accessed through element.props
 */
interface RenderProps {
  element: {
    type: string;
    props: Record<string, unknown>;
  };
  children?: ReactNode;
  emit: (event: string) => void;
  on: (event: string) => { emit: () => void; shouldPreventDefault: boolean; bound: boolean };
  bindings?: Record<string, string>;
  loading?: boolean;
}

// ============================================================================
// Dashboard Components
// ============================================================================

/**
 * DashboardLayout component
 * Renders a grid layout for dashboard panels
 */
function DashboardLayout({ element, children }: RenderProps & BaseRenderProps) {
  const props = element.props as DashboardLayoutProps;
  const {
    title = 'LLM Chat Dashboard',
    showMetrics = true,
    showCosts = true,
    showModelInfo = true,
    showDocs = true,
  } = props;

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {showMetrics && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Metrics Panel</div>
            <div className="text-xs text-muted-foreground/60">(Component pending)</div>
          </div>
        )}
        {showCosts && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Cost Panel</div>
            <div className="text-xs text-muted-foreground/60">(Component pending)</div>
          </div>
        )}
        {showModelInfo && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Model Info Panel</div>
            <div className="text-xs text-muted-foreground/60">(Component pending)</div>
          </div>
        )}
        {showDocs && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Docs Panel</div>
            <div className="text-xs text-muted-foreground/60">(Component pending)</div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * MetricsPanel component wrapper for registry
 * Uses the full implementation from src/components/dashboard/MetricsPanel.tsx
 */
function MetricsPanel({ element }: RenderProps & BaseRenderProps) {
  const props = element.props as MetricsPanelProps;
  return <MetricsPanelComponent {...props} />;
}

/**
 * CostPanel component
 * Displays cost/benefit analysis for LLM usage
 */
function CostPanel({ element }: RenderProps & BaseRenderProps) {
  const props = element.props as CostPanelProps;
  const {
    inputCost,
    outputCost,
    totalCost,
    costPerRequest,
    costPer1kTokens,
    currency = 'USD',
  } = props;

  const formatCost = (cost: number | undefined): string => {
    if (cost === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 4,
    }).format(cost);
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-card-foreground">Cost Analysis</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Input Cost:</span>{' '}
          <span className="font-mono font-medium">{formatCost(inputCost)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Output Cost:</span>{' '}
          <span className="font-mono font-medium">{formatCost(outputCost)}</span>
        </div>
        <div className="col-span-2 border-t pt-2">
          <span className="text-muted-foreground">Total Cost:</span>{' '}
          <span className="font-mono text-lg font-bold text-primary">{formatCost(totalCost)}</span>
        </div>
        {costPerRequest !== undefined && costPerRequest !== null && (
          <div>
            <span className="text-muted-foreground">Per Request:</span>{' '}
            <span className="font-mono font-medium">{formatCost(costPerRequest)}</span>
          </div>
        )}
        {costPer1kTokens !== undefined && costPer1kTokens !== null && (
          <div>
            <span className="text-muted-foreground">Per 1K Tokens:</span>{' '}
            <span className="font-mono font-medium">{formatCost(costPer1kTokens)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ModelInfoPanel component
 * Displays current LLM model configuration
 */
function ModelInfoPanel({ element }: RenderProps & BaseRenderProps) {
  const props = element.props as ModelInfoPanelProps;
  const {
    name,
    provider,
    port,
    contextWindow,
    maxOutput,
    speed,
    useCase,
    version,
  } = props;

  const speedColors: Record<string, string> = {
    fast: 'text-green-600',
    medium: 'text-yellow-600',
    slow: 'text-orange-600',
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-card-foreground">Model Information</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Name:</span>
          <span className="font-medium">{name ?? 'Not configured'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Provider:</span>
          <span className="font-medium">{provider ?? 'Not configured'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Port:</span>
          <span className="font-mono font-medium">{port ?? '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Context Window:</span>
          <span className="font-mono font-medium">{contextWindow?.toLocaleString() ?? '-'} tokens</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Max Output:</span>
          <span className="font-mono font-medium">{maxOutput?.toLocaleString() ?? '-'} tokens</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Speed:</span>
          <span className={`font-medium capitalize ${speed ? speedColors[speed] ?? '' : ''}`}>
            {speed ?? '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Use Case:</span>
          <span className="font-medium text-right max-w-[60%]">{useCase ?? '-'}</span>
        </div>
        {version && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version:</span>
            <span className="font-mono font-medium">{version}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * DocsPanel component
 * Displays organized documentation with categories
 */
function DocsPanel({ element }: RenderProps & BaseRenderProps) {
  const props = element.props as DocsPanelProps;
  const {
    categories,
    searchQuery,
    selectedCategoryId,
    expandedDocId,
  } = props;

  const totalDocs = categories?.reduce((sum, cat) => sum + cat.entries.length, 0) ?? 0;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-card-foreground">Documentation</h3>
      {searchQuery && (
        <div className="mb-2 text-sm text-muted-foreground">
          Search: "{searchQuery}"
        </div>
      )}
      <div className="space-y-3">
        {categories?.map((category) => (
          <div key={category.id} className="border-b pb-2 last:border-b-0">
            <div
              className={`cursor-pointer font-medium ${
                selectedCategoryId === category.id ? 'text-primary' : 'text-foreground'
              }`}
            >
              {category.name}
              <span className="ml-2 text-xs text-muted-foreground">
                ({category.entries.length} docs)
              </span>
            </div>
            {category.description && (
              <p className="mt-1 text-xs text-muted-foreground">{category.description}</p>
            )}
            {selectedCategoryId === category.id && (
              <ul className="mt-2 space-y-1 pl-4">
                {category.entries.map((entry) => (
                  <li
                    key={entry.id}
                    className={`cursor-pointer text-sm ${
                      expandedDocId === entry.id ? 'font-medium text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {entry.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        {totalDocs} documents in {categories?.length ?? 0} categories
      </div>
    </div>
  );
}

/**
 * StatCard component
 * Individual statistic display card
 */
function StatCard({ element }: RenderProps & BaseRenderProps) {
  const props = element.props as StatCardProps;
  const {
    label,
    value,
    unit,
    description,
    trend,
    trendValue,
  } = props;

  const trendColors: Record<string, string> = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {description && (
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      )}
      {trend && trendValue && (
        <div className={`mt-1 text-xs ${trendColors[trend] ?? ''}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </div>
      )}
    </div>
  );
}

/**
 * BenchmarkPanel component
 * Displays benchmark comparison results
 */
function BenchmarkPanel({ element }: RenderProps & BaseRenderProps) {
  const props = element.props as BenchmarkPanelProps;
  const { results, runAt } = props;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-card-foreground">Benchmark Results</h3>
      {runAt && (
        <div className="mb-2 text-xs text-muted-foreground">
          Run at: {new Date(runAt).toLocaleString()}
        </div>
      )}
      <div className="space-y-2">
        {results?.map((result, index) => (
          <div key={`${result.port}-${index}`} className="border-b pb-2 last:border-b-0">
            <div className="font-medium">{result.model}</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Port: {result.port}</div>
              <div>Speed: {result.speed}</div>
              <div>Gen TPS: {result.genTps?.toFixed(2)}</div>
              <div>Prompt TPS: {result.promptTps?.toFixed(2)}</div>
              <div>Tokens: {result.tokens?.toLocaleString()}</div>
              <div>Time: {result.time?.toFixed(2)}s</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Registry Assembly
// ============================================================================

/**
 * Component registry for the LLM Chat Dashboard
 *
 * Maps component names from the catalog to their React implementations.
 * Includes both custom dashboard components and shadcn/ui components.
 *
 * @example
 * ```tsx
 * import { JSONUIProvider } from '@json-render/react';
 * import { registry } from './registry';
 *
 * function App() {
 *   return (
 *     <JSONUIProvider registry={registry}>
 *       <Renderer spec={spec} registry={registry} />
 *     </JSONUIProvider>
 *   );
 * }
 * ```
 */
// Internal registry object combining all components
const _registry = {
  // Custom dashboard components
  DashboardLayout,
  MetricsPanel,
  CostPanel,
  ModelInfoPanel,
  DocsPanel,
  StatCard,
  BenchmarkPanel,

  // shadcn/ui components (35 available)
  ...shadcnComponents,
};

/**
 * Component registry for the LLM Chat Dashboard
 *
 * Maps component names from the catalog to their React implementations.
 * Includes both custom dashboard components and shadcn/ui components.
 *
 * Note: Type assertion is used because shadcn components use BaseComponentProps
 * while ComponentRegistry expects ComponentRenderProps. At runtime, the renderer
 * handles both patterns correctly.
 *
 * @example
 * ```tsx
 * import { JSONUIProvider } from '@json-render/react';
 * import { registry } from './registry';
 *
 * function App() {
 *   return (
 *     <JSONUIProvider registry={registry}>
 *       <Renderer spec={spec} registry={registry} />
 *     </JSONUIProvider>
 *   );
 * }
 * ```
 */
export const registry: ComponentRegistry = _registry as unknown as ComponentRegistry;

/**
 * Type of the component registry
 */
export type DashboardRegistry = typeof registry;

/**
 * Names of all available components in the registry
 */
export type ComponentName = keyof DashboardRegistry;

// Default export for convenience
export default registry;
