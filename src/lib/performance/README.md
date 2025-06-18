# Performance Tracking System

A flexible and reusable performance tracking system for React applications.

## Components

### PerformanceViewer

A generic component that displays performance metrics in a clean, organized format with color-coded values.

#### Basic Usage

```tsx
import {
  PerformanceViewer,
  type MetricsGroup,
} from "@/lib/performance";

const metrics: MetricsGroup[] = [
  {
    title: "system performance",
    metrics: [
      { label: "fps:", value: 60 },
      { label: "latency:", value: 12.5 },
    ],
  },
];

<PerformanceViewer metricsGroups={metrics} isVisible={true} />;
```

#### Advanced Usage with Formatting and Color Coding

```tsx
import {
  PerformanceViewer,
  createMetricsGroup,
  createMetric,
  Formatters,
  ColorThresholds,
} from "@/lib/performance";

const metrics = [
  createMetricsGroup("rendering", [
    createMetric("fps:", 45, {
      format: Formatters.fps,
      colorThresholds: ColorThresholds.fps,
    }),
    createMetric("frame time:", 22.3, {
      format: Formatters.milliseconds,
      colorThresholds: ColorThresholds.latency,
    }),
  ]),
  createMetricsGroup("memory", [
    createMetric("used:", 1024 * 1024 * 150, {
      format: Formatters.bytes,
      colorThresholds: ColorThresholds.memory,
    }),
  ]),
];
```

## Helper Functions

### createMetric(label, value, options)

Creates a metric configuration object.

```tsx
const metric = createMetric("cpu:", 75.5, {
  format: Formatters.percentage,
  colorThresholds: ColorThresholds.percentage,
});
```

### createMetricsGroup(title, metrics)

Creates a metrics group containing multiple related metrics.

```tsx
const systemMetrics = createMetricsGroup("system", [
  createMetric("cpu:", 45.2, { format: Formatters.percentage }),
  createMetric("memory:", 8.5, { format: Formatters.bytes }),
]);
```

### createFaceDetectionMetrics(metrics)

Specialized helper for face detection pipeline metrics.

```tsx
const faceMetrics = createFaceDetectionMetrics({
  fps: 30,
  total: 25.4,
  detection: 12.1,
  analysis: 3.2,
  drawing: 8.1,
});
```

## Formatters

Pre-built formatters for common value types:

- `Formatters.fps` - Formats as integer (e.g., "60")
- `Formatters.milliseconds` - Formats with "ms" suffix (e.g., "12.5ms")
- `Formatters.microseconds` - Formats with "µs" suffix
- `Formatters.percentage` - Formats with "%" suffix
- `Formatters.bytes` - Smart byte formatting (B/KB/MB)
- `Formatters.count` - Integer formatting
- `Formatters.decimal` - 2 decimal places

## Color Thresholds

Pre-configured color thresholds for common metrics:

- `ColorThresholds.fps` - FPS metrics (higher is better)
- `ColorThresholds.latency` - General latency (lower is better)
- `ColorThresholds.fastLatency` - Fast operations (lower is better)
- `ColorThresholds.mediumLatency` - Medium operations (lower is better)
- `ColorThresholds.slowLatency` - Slow operations (lower is better)
- `ColorThresholds.percentage` - Percentage metrics (higher is better)
- `ColorThresholds.memory` - Memory usage (lower is better)

## Custom Color Thresholds

```tsx
const customThreshold = {
  good: 100, // Values <= 100 are green
  warning: 500, // Values <= 500 are yellow
  comparison: "less" as const, // Lower values are better
};

// For higher-is-better metrics:
const fpsThreshold = {
  good: 55, // Values >= 55 are green
  warning: 30, // Values >= 30 are yellow
  comparison: "greater" as const, // Higher values are better
};
```

## Hooks

### usePerformanceToggle()

Toggle performance display with the 'P' key.

```tsx
const isVisible = usePerformanceToggle();
```

### useFaceDetectionPerformance(options)

Access face detection performance metrics.

```tsx
const { metrics, clearMetrics } = useFaceDetectionPerformance({
  updateIntervalMs: 100,
  enabled: true,
});
```

## Complete Example

```tsx
import {
  PerformanceViewer,
  usePerformanceToggle,
  useFaceDetectionPerformance,
  createFaceDetectionMetrics,
  createMetricsGroup,
  createMetric,
  Formatters,
  ColorThresholds,
} from "@/lib/performance";

function MyComponent() {
  const isVisible = usePerformanceToggle();
  const { metrics } = useFaceDetectionPerformance();

  const metricsGroups = [
    // Face detection metrics using helper
    createFaceDetectionMetrics(metrics),

    // Custom metrics group
    createMetricsGroup("custom", [
      createMetric("network:", 120, {
        format: Formatters.milliseconds,
        colorThresholds: ColorThresholds.slowLatency,
      }),
      createMetric("cache hit:", 95.5, {
        format: Formatters.percentage,
        colorThresholds: ColorThresholds.percentage,
      }),
    ]),
  ];

  return (
    <PerformanceViewer
      metricsGroups={metricsGroups}
      isVisible={isVisible}
    />
  );
}
```
