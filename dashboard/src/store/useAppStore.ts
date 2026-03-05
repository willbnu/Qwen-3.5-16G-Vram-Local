/**
 * Zustand store for the LLM Chat Dashboard
 * Uses immer middleware for immutable state updates
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  AppState,
  AppActions,
  Metrics,
  Costs,
  ModelInfo,
  DocEntry,
  BenchmarkData,
} from '../types';

/**
 * Default initial state values
 */
const defaultMetrics: Metrics = {
  totalTokens: 0,
  promptTokens: 0,
  completionTokens: 0,
  requestsCount: 0,
  averageLatency: undefined,
};

const defaultCosts: Costs = {
  inputCost: 0,
  outputCost: 0,
  totalCost: 0,
};

const defaultModel: ModelInfo = {
  name: 'Qwen',
  provider: 'Alibaba',
  contextWindow: 32768,
  maxOutput: 4096,
};

/**
 * Combined store type for Zustand
 */
type AppStore = AppState & AppActions;

/**
 * Main application store using Zustand with immer middleware
 *
 * Usage:
 * ```tsx
 * const { metrics, setMetrics } = useAppStore();
 * setMetrics({ totalTokens: 1000 });
 * ```
 */
export const useAppStore = create<AppStore>()(
  immer((set) => ({
    // State
    metrics: { ...defaultMetrics },
    costs: { ...defaultCosts },
    model: { ...defaultModel },
    docs: [],
    benchmarks: undefined,

    // Actions
    setMetrics: (metrics: Partial<Metrics>) =>
      set((state) => {
        Object.assign(state.metrics, metrics);
      }),

    setCosts: (costs: Partial<Costs>) =>
      set((state) => {
        Object.assign(state.costs, costs);
      }),

    setModel: (model: Partial<ModelInfo>) =>
      set((state) => {
        Object.assign(state.model, model);
      }),

    setDocs: (docs: DocEntry[]) =>
      set((state) => {
        state.docs = docs;
      }),

    setBenchmarks: (benchmarks: BenchmarkData) =>
      set((state) => {
        state.benchmarks = benchmarks;
      }),

    reset: () =>
      set((state) => {
        state.metrics = { ...defaultMetrics };
        state.costs = { ...defaultCosts };
        state.model = { ...defaultModel };
        state.docs = [];
        state.benchmarks = undefined;
      }),
  }))
);

// Export selectors for optimized component re-renders
export const selectMetrics = (state: AppState) => state.metrics;
export const selectCosts = (state: AppState) => state.costs;
export const selectModel = (state: AppState) => state.model;
export const selectDocs = (state: AppState) => state.docs;
export const selectBenchmarks = (state: AppState) => state.benchmarks;

// Export default for convenience
export default useAppStore;
