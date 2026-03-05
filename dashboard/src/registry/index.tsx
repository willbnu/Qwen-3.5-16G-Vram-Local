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

// Import all real dashboard components
import { MetricsPanel as MetricsPanelComponent } from '../components/dashboard/MetricsPanel';
import { CostPanel as CostPanelComponent } from '../components/dashboard/CostPanel';
import { ModelInfoPanel as ModelInfoPanelComponent } from '../components/dashboard/ModelInfoPanel';
import { DocsPanel as DocsPanelComponent } from '../components/dashboard/DocsPanel';

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
// Dashboard Components - Wrappers for Full Implementations
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
          </div>
        )}
        {showCosts && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Cost Panel</div>
          </div>
        )}
        {showModelInfo && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Model Info Panel</div>
          </div>
        )}
        {showDocs && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Docs Panel</div>
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
 * CostPanel component wrapper for registry
 * Uses the full implementation from src/components/dashboard/CostPanel.tsx
 */
function CostPanel({ element }: RenderProps & BaseRenderProps) {
  const props = element.props as CostPanelProps;
  return <CostPanelComponent {...props} />;
}

/**
 * ModelInfoPanel component wrapper for registry
 * Uses the full implementation from src/components/dashboard/ModelInfoPanel.tsx
 */
function ModelInfoPanel({ element }: RenderProps & BaseRenderProps) {
  const props = element.props as ModelInfoPanelProps;
  return <ModelInfoPanelComponent {...props} />;
}

/**
 * DocsPanel component wrapper for registry
 * Uses the full implementation from src/components/dashboard/DocsPanel.tsx
 */
function DocsPanel({ element }: RenderProps & BaseRenderProps) {
  const props = element.props as DocsPanelProps;
  return <DocsPanelComponent {...props} />;
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
 * Internal registry object combining all components
 */
const _registry = {
  // Custom dashboard components (using full implementations)
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
 * import { JSONUIProvider, Renderer } from '@json-render/react';
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
