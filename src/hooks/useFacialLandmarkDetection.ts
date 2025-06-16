import { useEffect, useRef, useCallback } from "react";
import { FaceLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

interface UseFacialLandmarkDetectionProps {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  faceLandmarker: FaceLandmarker | null;
  isModelLoaded: boolean;
  isEnabled: boolean;
  isDrawing: boolean;
  onResults?: (results: FaceLandmarkerResult) => void;
}

export function useFacialLandmarkDetection({
  videoElement,
  canvasElement,
  faceLandmarker,
  isModelLoaded,
  isEnabled,
  isDrawing,
  onResults,
}: UseFacialLandmarkDetectionProps) {
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const drawLandmarks = useCallback(
    (
      results: FaceLandmarkerResult,
      canvasCtx: CanvasRenderingContext2D,
      drawingUtils: DrawingUtils,
    ) => {
      if (!results.faceLandmarks) return;

      // Clear canvas
      canvasCtx.clearRect(
        0,
        0,
        canvasCtx.canvas.width,
        canvasCtx.canvas.height,
      );

      // Draw landmarks for each detected face - only eyes and mouth
      for (const landmarks of results.faceLandmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
          { color: "#FF3030" },
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
          { color: "#30FF30" },
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LIPS,
          { color: "#E0E0E0" },
        );
      }
    },
    [],
  );

  const detectAndDraw = useCallback(async () => {
    if (
      !videoElement ||
      !canvasElement ||
      !faceLandmarker ||
      !isModelLoaded ||
      !isEnabled
    ) {
      return;
    }

    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return;

    try {
      // Only process if video time has changed
      if (lastVideoTimeRef.current !== videoElement.currentTime) {
        lastVideoTimeRef.current = videoElement.currentTime;

        const startTimeMs = performance.now();
        const results = await faceLandmarker.detectForVideo(
          videoElement,
          startTimeMs,
        );

        if (results) {
          // Call optional callback with results
          if (onResults) {
            onResults(results);
          }

          // Only draw landmarks if drawing is enabled
          if (isDrawing) {
            const drawingUtils = new DrawingUtils(canvasCtx);
            drawLandmarks(results, canvasCtx, drawingUtils);
          }
        }
      }
    } catch (error) {
      console.error("Error in face detection:", error);
    }

    if (isEnabled) {
      animationFrameRef.current = requestAnimationFrame(detectAndDraw);
    }
  }, [
    videoElement,
    canvasElement,
    faceLandmarker,
    isModelLoaded,
    isEnabled,
    isDrawing,
    drawLandmarks,
    onResults,
  ]);

  // Start/stop detection loop
  useEffect(() => {
    if (
      isEnabled &&
      videoElement &&
      canvasElement &&
      faceLandmarker &&
      isModelLoaded
    ) {
      console.log("Starting facial landmark detection loop");
      detectAndDraw();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [
    isEnabled,
    videoElement,
    canvasElement,
    faceLandmarker,
    isModelLoaded,
    detectAndDraw,
  ]);

  // Clear canvas when drawing is disabled
  useEffect(() => {
    if (!isDrawing && canvasElement) {
      const canvasCtx = canvasElement.getContext("2d");
      if (canvasCtx) {
        canvasCtx.clearRect(
          0,
          0,
          canvasElement.width,
          canvasElement.height,
        );
      }
    }
  }, [isDrawing, canvasElement]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
}
