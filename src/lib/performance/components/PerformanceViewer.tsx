import React from "react";
import { Card, CardContent } from "../../ui/components/card";
import type { EventPerformanceMetrics } from "../types/eventMetrics";

export interface MetricConfig {
  label: string;
  value: number;
  format?: (value: number) => string;
  colorThresholds?: {
    good: number;
    warning: number;
    comparison?: "less" | "greater"; // Default is 'greater' (higher is better)
  };
}

export interface MetricsGroup {
  title: string;
  metrics: MetricConfig[];
}

interface PerformanceViewerProps {
  metricsGroups: MetricsGroup[];
  eventMetrics?: EventPerformanceMetrics;
  isVisible: boolean;
  className?: string;
}

interface EventMetricConfig {
  key: keyof EventPerformanceMetrics;
  label: string;
  format: (value: number) => string;
  className?: string | ((value: number) => string);
}

const EVENT_METRIC_DISPLAY_CONFIG: EventMetricConfig[] = [
  {
    key: "mouseMoveCallsPerSecond",
    label: "mouse:",
    format: (value: number) => `${value.toFixed(1)}/s`,
    className: (value: number) => {
      if (value > 100) return "text-red-400";
      if (value > 60) return "text-yellow-400";
      return "text-green-400";
    },
  },
  {
    key: "mouseDownCallsPerSecond",
    label: "click:",
    format: (value: number) => `${value.toFixed(1)}/s`,
  },
];

const defaultFormat = (value: number): string =>
  `${value.toFixed(1)}`;

const getColorClass = (
  value: number,
  config: MetricConfig,
): string => {
  if (!config.colorThresholds) return "";

  const {
    good,
    warning,
    comparison = "greater",
  } = config.colorThresholds;

  if (comparison === "less") {
    // Lower values are better (e.g., response time)
    if (value <= good) return "text-green-400";
    if (value <= warning) return "text-yellow-400";
    return "text-red-400";
  } else {
    // Higher values are better (e.g., FPS)
    if (value >= good) return "text-green-400";
    if (value >= warning) return "text-yellow-400";
    return "text-red-400";
  }
};

export const PerformanceViewer: React.FC<PerformanceViewerProps> =
  React.memo(
    ({ metricsGroups, eventMetrics, isVisible, className = "" }) => {
      if (!isVisible) return null;

      const hasEventMetrics =
        eventMetrics &&
        Object.values(eventMetrics).some((v) => v > 0);

      return (
        <Card
          className={`fixed top-4 left-4 z-50 w-36 bg-black/80 text-white border-gray-600 ${className}`}
        >
          <CardContent className="p-3 space-y-1">
            {/* Metrics Groups */}
            {metricsGroups.map((group, groupIndex) => (
              <div key={group.title}>
                {groupIndex > 0 && (
                  <div className="border-t border-gray-600 my-2"></div>
                )}
                <div className="text-xs font-mono text-gray-300 mb-1">
                  {group.title}
                </div>
                {group.metrics.map((metric, metricIndex) => {
                  const format = metric.format || defaultFormat;
                  const formattedValue = format(metric.value);
                  const colorClass = getColorClass(
                    metric.value,
                    metric,
                  );

                  return (
                    <div
                      key={`${group.title}-${metricIndex}`}
                      className="flex justify-between text-xs font-mono"
                    >
                      <span>{metric.label}</span>
                      <span className={colorClass}>
                        {formattedValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Event Performance Metrics */}
            {hasEventMetrics && (
              <>
                <div className="border-t border-gray-600 my-2"></div>
                <div className="text-xs font-mono text-gray-300 mb-1">
                  events
                </div>
                {EVENT_METRIC_DISPLAY_CONFIG.map((config) => {
                  if (
                    !eventMetrics ||
                    eventMetrics[config.key] === undefined
                  ) {
                    return null;
                  }

                  const value = eventMetrics[config.key] as number;
                  const formattedValue = config.format(value);
                  const className =
                    typeof config.className === "function"
                      ? config.className(value)
                      : config.className;

                  return (
                    <div
                      key={config.key}
                      className="flex justify-between text-xs font-mono"
                    >
                      <span>{config.label}</span>
                      <span className={className}>
                        {formattedValue}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </CardContent>
        </Card>
      );
    },
  );
