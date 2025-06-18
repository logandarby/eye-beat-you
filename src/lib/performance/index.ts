/**
 * Performance Feature Public API
 * Features several utils to measure the performance of several aspects of the application
 *  - Event tracking
 *  - Event performance metrics
 *  - JS Compute time tracking
 *  - WebGPU Compute time tracking
 */

export { RollingAverage } from "./core/RollingAverage";
export {
  FaceDetectionPerformanceTracker,
  globalFaceDetectionTracker,
  type FaceDetectionStageMetrics,
} from "./core/FaceDetectionPerformanceTracker";
export {
  PerformanceViewer,
  type MetricsGroup,
  type MetricConfig,
} from "./components/PerformanceViewer";
export { FaceDetectionPerformanceViewer } from "./components/FaceDetectionPerformanceViewer";
export { usePerformanceToggle } from "./hooks/usePerformanceToggle";
export { useFaceDetectionPerformance } from "./hooks/useFaceDetectionPerformance";

// Metrics helpers
export {
  ColorThresholds,
  Formatters,
  createMetric,
  createMetricsGroup,
  createFaceDetectionMetrics,
} from "./utils/metricsHelpers";

// Event tracking utilities
export {
  FunctionCallTracker,
  EventCoalescer,
  Throttle,
} from "./utils/eventTracking";

// Event optimization utilities
export { RAFEventProcessor } from "./utils/eventOptimization";

// Event performance types
export type {
  EventPerformanceMetrics,
  ExtendedPerformanceMetrics,
} from "./types/eventMetrics";
