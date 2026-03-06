/**
 * Component Registry for LLM Chat Dashboard
 */

import type { ReactNode, ComponentType } from 'react';
import type { ComponentRegistry, ComponentRenderProps } from '@json-render/react';
import { shadcnComponents } from '@json-render/shadcn';

import { MetricsPanel as MetricsPanelComponent } from '../components/dashboard/MetricsPanel';
import { CostPanel as CostPanelComponent } from '../components/dashboard/CostPanel';
import { ModelInfoPanel as ModelInfoPanelComponent } from '../components/dashboard/ModelInfoPanel';
import { DocsPanel as DocsPanelComponent } from '../components/dashboard/DocsPanel';

// Basic HTML Elements
const Div: ComponentType<ComponentRenderProps> = ({ element, children }) => <div {...element.props}>{children}</div>;
const Header: ComponentType<ComponentRenderProps> = ({ element, children }) => <header {...element.props}>{children}</header>;
const Main: ComponentType<ComponentRenderProps> = ({ element, children }) => <main {...element.props}>{children}</main>;
const Section: ComponentType<ComponentRenderProps> = ({ element, children }) => <section {...element.props}>{children}</section>;
const Footer: ComponentType<ComponentRenderProps> = ({ element, children }) => <footer {...element.props}>{children}</footer>;
const H1: ComponentType<ComponentRenderProps> = ({ element }) => <h1 {...element.props}>{element.props.children as ReactNode}</h1>;
const H2: ComponentType<ComponentRenderProps> = ({ element }) => <h2 {...element.props}>{element.props.children as ReactNode}</h2>;
const H3: ComponentType<ComponentRenderProps> = ({ element }) => <h3 {...element.props}>{element.props.children as ReactNode}</h3>;
const P: ComponentType<ComponentRenderProps> = ({ element }) => <p {...element.props}>{element.props.children as ReactNode}</p>;
const Span: ComponentType<ComponentRenderProps> = ({ element }) => <span {...element.props}>{element.props.children as ReactNode}</span>;
const Ul: ComponentType<ComponentRenderProps> = ({ element, children }) => <ul {...element.props}>{children}</ul>;
const Ol: ComponentType<ComponentRenderProps> = ({ element, children }) => <ol {...element.props}>{children}</ol>;
const Li: ComponentType<ComponentRenderProps> = ({ element, children }) => <li {...element.props}>{children}</li>;

// Dashboard Components - using resolved props directly
const MetricsPanel: ComponentType<ComponentRenderProps> = ({ element }) => {
  return <MetricsPanelComponent {...element.props as any} />;
};
const CostPanel: ComponentType<ComponentRenderProps> = ({ element }) => {
  return <CostPanelComponent {...element.props as any} />;
};
const ModelInfoPanel: ComponentType<ComponentRenderProps> = ({ element }) => {
  return <ModelInfoPanelComponent {...element.props as any} />;
};
const DocsPanel: ComponentType<ComponentRenderProps> = ({ element }) => {
  return <DocsPanelComponent {...element.props as any} />;
};

const StatCard: ComponentType<ComponentRenderProps> = ({ element }) => {
  const { label, value, unit, description, trend, trendValue } = element.props as any;
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
};

const BenchmarkPanel: ComponentType<ComponentRenderProps> = ({ element }) => {
  const { results, runAt } = element.props as any;
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Benchmark Results</h3>
      {results?.map((r: any, i: number) => (
        <div key={i} className="border-b pb-2">
          <div className="font-medium">{r.model}</div>
          <div className="text-xs text-muted-foreground">Gen TPS: {r.genTps?.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
};

const htmlElements = {
  div: Div,
  header: Header,
  main: Main,
  section: Section,
  footer: Footer,
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  span: Span,
  ul: Ul,
  ol: Ol,
  li: Li,
};

const _registry = {
  ...htmlElements,
  MetricsPanel,
  CostPanel,
  ModelInfoPanel,
  DocsPanel,
  StatCard,
  BenchmarkPanel,
  ...shadcnComponents,
};

export const registry: ComponentRegistry = _registry as unknown as ComponentRegistry;
export default registry;
