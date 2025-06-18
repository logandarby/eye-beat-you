import { useEffect, useState } from "react";
import {
  globalFaceDetectionTracker,
  type FaceDetectionStageMetrics,
} from "../core/FaceDetectionPerformanceTracker";

interface UseFaceDetectionPerformanceOptions {
  updateIntervalMs?: number;
  enabled?: boolean;
}

export function useFaceDetectionPerformance(
  options: UseFaceDetectionPerformanceOptions = {},
) {
  const { updateIntervalMs = 100, enabled = true } = options;

  const [metrics, setMetrics] = useState<FaceDetectionStageMetrics>({
    detection: 0,
    analysis: 0,
    drawing: 0,
    fps: 0,
  });

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setMetrics(globalFaceDetectionTracker.getMetrics());
    }, updateIntervalMs);

    return () => clearInterval(interval);
  }, [updateIntervalMs, enabled]);

  const clearMetrics = () => {
    globalFaceDetectionTracker.clear();
  };

  return {
    metrics,
    clearMetrics,
    tracker: globalFaceDetectionTracker,
  };
}
