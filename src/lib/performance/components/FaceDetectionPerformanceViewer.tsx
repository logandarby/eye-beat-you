import React, { useEffect, useState } from "react";
import {
  globalFaceDetectionTracker,
  type FaceDetectionStageMetrics,
} from "../core/FaceDetectionPerformanceTracker";

interface FaceDetectionPerformanceViewerProps {
  className?: string;
  updateIntervalMs?: number;
}

export const FaceDetectionPerformanceViewer: React.FC<
  FaceDetectionPerformanceViewerProps
> = ({ className = "", updateIntervalMs = 100 }) => {
  const [metrics, setMetrics] = useState<FaceDetectionStageMetrics>({
    detection: 0,
    analysis: 0,
    drawing: 0,
    fps: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(globalFaceDetectionTracker.getMetrics());
    }, updateIntervalMs);

    return () => clearInterval(interval);
  }, [updateIntervalMs]);

  const formatTime = (ms: number): string => {
    return ms.toFixed(2);
  };

  const formatFps = (fps: number): string => {
    return fps.toFixed(1);
  };

  const containerStyle: React.CSSProperties = {
    background: "rgba(0, 0, 0, 0.8)",
    color: "#00ff00",
    padding: "12px",
    borderRadius: "8px",
    fontFamily: "Courier New, monospace",
    fontSize: "12px",
    minWidth: "200px",
  };

  const titleStyle: React.CSSProperties = {
    margin: "0 0 8px 0",
    color: "#ffffff",
    fontSize: "14px",
  };

  const metricsStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const metricStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const labelStyle: React.CSSProperties = {
    color: "#cccccc",
  };

  const valueStyle: React.CSSProperties = {
    color: "#00ff00",
    fontWeight: "bold",
  };

  return (
    <div
      className={`face-detection-performance ${className}`}
      style={containerStyle}
    >
      <h3 style={titleStyle}>Face Detection Performance</h3>
      <div style={metricsStyle}>
        <div style={metricStyle}>
          <span style={labelStyle}>FPS:</span>
          <span style={valueStyle}>{formatFps(metrics.fps)}</span>
        </div>
        <div style={metricStyle}>
          <span style={labelStyle}>Detection:</span>
          <span style={valueStyle}>
            {formatTime(metrics.detection)}ms
          </span>
        </div>
        <div style={metricStyle}>
          <span style={labelStyle}>Analysis:</span>
          <span style={valueStyle}>
            {formatTime(metrics.analysis)}ms
          </span>
        </div>
        <div style={metricStyle}>
          <span style={labelStyle}>Drawing:</span>
          <span style={valueStyle}>
            {formatTime(metrics.drawing)}ms
          </span>
        </div>
      </div>
    </div>
  );
};
