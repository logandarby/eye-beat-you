import { RollingAverage } from "./RollingAverage";

export interface FaceDetectionStageMetrics {
  detection: number;
  analysis: number;
  drawing: number;
  fps: number;
}

export class FaceDetectionPerformanceTracker {
  private detectionAverage = new RollingAverage(30); // Track last 30 samples for more responsive metrics
  private analysisAverage = new RollingAverage(30);
  private drawingAverage = new RollingAverage(30);
  private fpsAverage = new RollingAverage(30);

  private timers = new Map<string, number>();
  private lastFrameStartTime = 0;

  startFrame(): void {
    const now = performance.now();

    // Calculate FPS based on time between frame starts (animation frame rate)
    if (this.lastFrameStartTime > 0) {
      const deltaTime = (now - this.lastFrameStartTime) / 1000;
      if (deltaTime > 0) {
        this.fpsAverage.addSample(1 / deltaTime);
      }
    }

    this.lastFrameStartTime = now;
  }

  endFrame(): void {
    // This method is now just for API compatibility
    // FPS tracking happens in startFrame()
  }

  startStage(stageName: "detection" | "analysis" | "drawing"): void {
    this.timers.set(stageName, performance.now());
  }

  endStage(stageName: "detection" | "analysis" | "drawing"): void {
    const startTime = this.timers.get(stageName);
    if (!startTime) return;

    const elapsed = performance.now() - startTime;
    this.timers.delete(stageName);

    switch (stageName) {
      case "detection":
        this.detectionAverage.addSample(elapsed);
        break;
      case "analysis":
        this.analysisAverage.addSample(elapsed);
        break;
      case "drawing":
        this.drawingAverage.addSample(elapsed);
        break;
    }
  }

  getMetrics(): FaceDetectionStageMetrics {
    return {
      detection: this.detectionAverage.get(),
      analysis: this.analysisAverage.get(),
      drawing: this.drawingAverage.get(),
      fps: this.fpsAverage.get(),
    };
  }

  clear(): void {
    this.detectionAverage.clear();
    this.analysisAverage.clear();
    this.drawingAverage.clear();
    this.fpsAverage.clear();
    this.timers.clear();
    this.lastFrameStartTime = 0;
  }
}

// Global instance for easy access across the application
export const globalFaceDetectionTracker =
  new FaceDetectionPerformanceTracker();
