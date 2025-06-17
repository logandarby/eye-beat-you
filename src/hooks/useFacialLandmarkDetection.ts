import { useEffect, useRef, useCallback } from "react";
import {
  FaceLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import {
  LEFT_EYE_LANDMARKS,
  MOUTH_LANDMARKS,
  RIGHT_EYE_LANDMARKS,
} from "@/lib/constants";
import {
  drawDebugPointsOntoCanvas,
  drawCalculationLines,
} from "@/lib/debug.util";

interface UseFacialLandmarkDetectionProps {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  faceLandmarker: FaceLandmarker | null;
  isModelLoaded: boolean;
  isEnabled: boolean;
  debugMode: "off" | "points" | "lines" | "connectors";
  onResults?: (results: FaceLandmarkerResult) => void;
}

export function useFacialLandmarkDetection({
  videoElement,
  canvasElement,
  faceLandmarker,
  isModelLoaded,
  isEnabled,
  debugMode,
  onResults,
}: UseFacialLandmarkDetectionProps) {
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const drawDebugPoints = useCallback(
    (
      landmarks: { x: number; y: number; z?: number }[],
      canvasCtx: CanvasRenderingContext2D,
    ) => {
      // Draw debug points for all landmark groups
      drawDebugPointsOntoCanvas({
        landmarks,
        landmarkIndices: MOUTH_LANDMARKS,
        canvasCtx,
        label: "M",
      });
      drawDebugPointsOntoCanvas({
        landmarks,
        landmarkIndices: LEFT_EYE_LANDMARKS,
        canvasCtx,
        label: "L",
      });
      drawDebugPointsOntoCanvas({
        landmarks,
        landmarkIndices: RIGHT_EYE_LANDMARKS,
        canvasCtx,
        label: "R",
      });

      // Draw title
      canvasCtx.font = "bold 20px Arial";
      canvasCtx.fillStyle = "#00FF00";
      canvasCtx.strokeStyle = "#000000";
      canvasCtx.lineWidth = 3;
      const titleText = "LANDMARK POINTS (Press B to cycle modes)";
      canvasCtx.strokeText(titleText, 20, 40);
      canvasCtx.fillText(titleText, 20, 40);
    },
    [],
  );

  const drawCalculationDebug = useCallback(
    (
      landmarks: { x: number; y: number; z?: number }[],
      canvasCtx: CanvasRenderingContext2D,
    ) => {
      // Draw calculation lines for left eye EAR
      drawCalculationLines({
        landmarks,
        landmarkIndices: LEFT_EYE_LANDMARKS,
        canvasCtx,
        label: "L",
        calculationType: "EAR",
      });

      // Draw calculation lines for right eye EAR
      drawCalculationLines({
        landmarks,
        landmarkIndices: RIGHT_EYE_LANDMARKS,
        canvasCtx,
        label: "R",
        calculationType: "EAR",
      });

      // Draw calculation lines for mouth MAR
      drawCalculationLines({
        landmarks,
        landmarkIndices: MOUTH_LANDMARKS,
        canvasCtx,
        label: "M",
        calculationType: "MAR",
      });

      // Draw title
      canvasCtx.font = "bold 20px Arial";
      canvasCtx.fillStyle = "#FFFFFF";
      canvasCtx.strokeStyle = "#000000";
      canvasCtx.lineWidth = 3;
      const titleText =
        "EAR/MAR CALCULATION LINES (Press B to cycle modes)";
      canvasCtx.strokeText(titleText, 20, 40);
      canvasCtx.fillText(titleText, 20, 40);
    },
    [],
  );

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

      if (debugMode === "points") {
        // Debug mode: Draw landmark points with labels
        for (const landmarks of results.faceLandmarks) {
          drawDebugPoints(landmarks, canvasCtx);
        }
      } else if (debugMode === "lines") {
        // Debug mode: Draw calculation lines
        for (const landmarks of results.faceLandmarks) {
          drawCalculationDebug(landmarks, canvasCtx);
        }
      } else if (debugMode === "connectors") {
        // Normal mode: Draw landmarks for each detected face - only eyes and mouth
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
      }
    },
    [debugMode, drawDebugPoints, drawCalculationDebug],
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

          // Only draw landmarks if drawing is enabled OR debug mode is enabled
          if (debugMode !== "off") {
            const drawingUtils = new DrawingUtils(canvasCtx);
            drawLandmarks(results, canvasCtx, drawingUtils);
          }
        }
      }
    } catch (error) {
      console.error("Error in face detection:", error);
    }

    if (isEnabled) {
      animationFrameRef.current =
        requestAnimationFrame(detectAndDraw);
    }
  }, [
    videoElement,
    canvasElement,
    faceLandmarker,
    isModelLoaded,
    isEnabled,
    debugMode,
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

  // Clear canvas when both drawing and debug mode are disabled
  useEffect(() => {
    if (debugMode === "off" && canvasElement) {
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
  }, [debugMode, canvasElement]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
}
