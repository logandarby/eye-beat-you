import type {
  MetricsGroup,
  MetricConfig,
} from "../components/PerformanceViewer";

/**
 * Common color threshold presets for different types of metrics
 */
export const ColorThresholds = {
  fps: { good: 55, warning: 30, comparison: "greater" as const },
  latency: { good: 16, warning: 33, comparison: "less" as const },
  fastLatency: { good: 5, warning: 10, comparison: "less" as const },
  mediumLatency: {
    good: 8,
    warning: 15,
    comparison: "less" as const,
  },
  slowLatency: {
    good: 50,
    warning: 100,
    comparison: "less" as const,
  },
  percentage: {
    good: 80,
    warning: 60,
    comparison: "greater" as const,
  },
  memory: { good: 100, warning: 500, comparison: "less" as const },
} as const;

/**
 * Common formatters for different types of values
 */
export const Formatters = {
  fps: (value: number) => `${value.toFixed(0)}`,
  milliseconds: (value: number) => `${value.toFixed(1)}ms`,
  microseconds: (value: number) => `${value.toFixed(1)}µs`,
  percentage: (value: number) => `${value.toFixed(1)}%`,
  bytes: (value: number) => {
    if (value < 1024) return `${value.toFixed(0)}B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)}KB`;
    return `${(value / (1024 * 1024)).toFixed(1)}MB`;
  },
  count: (value: number) => `${value.toFixed(0)}`,
  decimal: (value: number) => `${value.toFixed(2)}`,
} as const;

/**
 * Helper function to create a metric configuration
 */
export function createMetric(
  label: string,
  value: number,
  options: {
    format?: (value: number) => string;
    colorThresholds?: MetricConfig["colorThresholds"];
  } = {},
): MetricConfig {
  return {
    label,
    value,
    format: options.format,
    colorThresholds: options.colorThresholds,
  };
}

/**
 * Helper function to create a metrics group
 */
export function createMetricsGroup(
  title: string,
  metrics: MetricConfig[],
): MetricsGroup {
  return {
    title,
    metrics,
  };
}

/**
 * Helper function to create face detection metrics group
 */
export function createFaceDetectionMetrics(metrics: {
  fps: number;
  detection: number;
  analysis: number;
  drawing: number;
}): MetricsGroup {
  return createMetricsGroup("face detection", [
    createMetric("fps:", metrics.fps, {
      format: Formatters.fps,
      colorThresholds: ColorThresholds.fps,
    }),
    createMetric("detect:", metrics.detection, {
      format: Formatters.milliseconds,
      colorThresholds: ColorThresholds.mediumLatency,
    }),
    createMetric("analyze:", metrics.analysis, {
      format: Formatters.milliseconds,
      colorThresholds: { good: 3, warning: 8, comparison: "less" },
    }),
    createMetric("draw:", metrics.drawing, {
      format: Formatters.milliseconds,
      colorThresholds: ColorThresholds.fastLatency,
    }),
  ]);
}
