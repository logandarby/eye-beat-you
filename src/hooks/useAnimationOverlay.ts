import { useCallback, useRef, useState } from "react";
import {
  BLINK_LINE_DURATION_MS,
  calculateAnimations,
  type AnimatedLine,
  type Star,
} from "@/components/AnimationOverlay/AnimationOverlay.utils";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export default function useAnimationOverlay() {
  // Animation states
  const [animatedLines, setAnimatedLines] = useState<AnimatedLine[]>(
    [],
  );
  const [stars, setStars] = useState<Star[]>([
    { id: "left-star", side: "left", x: 0, y: 0 },
    { id: "right-star", side: "right", x: 0, y: 0 },
  ]);

  const eyeLandmarksRef = useRef<{
    leftEyeLines: Array<{ x: number; y: number; angle: number }>;
    rightEyeLines: Array<{ x: number; y: number; angle: number }>;
  }>({
    leftEyeLines: [],
    rightEyeLines: [],
  });
  // Function to spawn radial lines for an eye
  const spawnEyeLines = useCallback((eyeSide: "left" | "right") => {
    const lines =
      eyeSide === "left"
        ? eyeLandmarksRef.current.leftEyeLines
        : eyeLandmarksRef.current.rightEyeLines;

    lines.forEach((lineData, index) => {
      const lineId = `line-${eyeSide}-${index}-${Date.now()}-${Math.random()}`;

      const newLine: AnimatedLine = {
        ...lineData,
        id: lineId,
        side: eyeSide,
        index,
        createdAt: Date.now(),
      };

      setAnimatedLines((prev) => [...prev, newLine]);

      // Remove line after animation completes
      setTimeout(() => {
        setAnimatedLines((prev) =>
          prev.filter((line) => line.id !== lineId),
        );
      }, BLINK_LINE_DURATION_MS);
    });
  }, []);

  const pushLandmarkInformation = useCallback(
    (
      landmarks: NormalizedLandmark[],
      videoElement: HTMLVideoElement,
    ) => {
      const {
        leftEyeLines,
        rightEyeLines,
        leftInnerCorner,
        rightInnerCorner,
      } = calculateAnimations({
        landmarks,
        videoElement,
      });

      eyeLandmarksRef.current = {
        leftEyeLines,
        rightEyeLines,
      };

      // Update positions of existing animated lines to follow face
      setAnimatedLines((prev) =>
        prev.map((line) => {
          const point =
            line.side === "left"
              ? leftEyeLines[line.index]
              : rightEyeLines[line.index];
          if (!point) return line;
          return {
            ...line,
            x: point.x,
            y: point.y,
            angle: point.angle,
          };
        }),
      );

      // Update star positions
      setStars((prev) =>
        prev.map((star: Star) => {
          const corner =
            star.side === "left" ? leftInnerCorner : rightInnerCorner;
          if (!corner) return star;
          return { ...star, x: corner.x, y: corner.y };
        }),
      );
    },
    [],
  );

  return {
    animatedLines,
    stars,
    pushLandmarkInformation,
    spawnEyeLines,
  };
}
