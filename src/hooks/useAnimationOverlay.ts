import { useCallback, useRef, useState } from "react";
import {
  BLINK_LINE_DURATION_MS,
  calculateAnimations,
  MOUTH_LINE_DURATION_MS,
  type AnimatedLine,
  type Star,
  type Vec2,
} from "@/components/AnimationOverlay/AnimationOverlay.utils";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { MedianFilter } from "@/lib/face-detection/utils/medianFilter";

const STAR_ROLLING_AVERAGE_WINDOW = 5;

export default function useAnimationOverlay() {
  // Animation states
  const [animatedLines, setAnimatedLines] = useState<AnimatedLine[]>(
    [],
  );
  const [stars, setStars] = useState<Star[]>([
    { id: "left-star", side: "leftEye", position: { x: 0, y: 0 } },
    { id: "right-star", side: "rightEye", position: { x: 0, y: 0 } },
    {
      id: "left-mouth-star",
      side: "leftMouth",
      position: { x: 0, y: 0 },
    },
    {
      id: "right-mouth-star",
      side: "rightMouth",
      position: { x: 0, y: 0 },
    },
  ]);

  const eyeLandmarksRef = useRef<{
    leftEyeLines: Array<{ position: Vec2; angle: number }>;
    rightEyeLines: Array<{ position: Vec2; angle: number }>;
    leftMouthLines: Array<{ position: Vec2; angle: number }>;
    rightMouthLines: Array<{ position: Vec2; angle: number }>;
  }>({
    leftEyeLines: [],
    rightEyeLines: [],
    leftMouthLines: [],
    rightMouthLines: [],
  });

  // Rolling averages to smooth star positions
  const starRollingAveragesRef = useRef<
    Record<
      "leftEye" | "rightEye" | "leftMouth" | "rightMouth",
      { x: MedianFilter; y: MedianFilter }
    >
  >({
    leftEye: {
      x: new MedianFilter(STAR_ROLLING_AVERAGE_WINDOW),
      y: new MedianFilter(STAR_ROLLING_AVERAGE_WINDOW),
    },
    rightEye: {
      x: new MedianFilter(STAR_ROLLING_AVERAGE_WINDOW),
      y: new MedianFilter(STAR_ROLLING_AVERAGE_WINDOW),
    },
    leftMouth: {
      x: new MedianFilter(STAR_ROLLING_AVERAGE_WINDOW),
      y: new MedianFilter(STAR_ROLLING_AVERAGE_WINDOW),
    },
    rightMouth: {
      x: new MedianFilter(STAR_ROLLING_AVERAGE_WINDOW),
      y: new MedianFilter(STAR_ROLLING_AVERAGE_WINDOW),
    },
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
        side: eyeSide === "left" ? "leftEye" : "rightEye",
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

  const spawnMouthLines = useCallback(
    (mouthSide: "left" | "right") => {
      const lines =
        mouthSide === "left"
          ? eyeLandmarksRef.current.leftMouthLines
          : eyeLandmarksRef.current.rightMouthLines;

      lines.forEach((lineData, index) => {
        const lineId = `line-mouth-${mouthSide}-${index}-${Date.now()}-${Math.random()}`;

        const newLine: AnimatedLine = {
          ...lineData,
          id: lineId,
          side: mouthSide === "left" ? "leftMouth" : "rightMouth",
          index,
          createdAt: Date.now(),
        };

        setAnimatedLines((prev) => [...prev, newLine]);

        // Remove line after animation completes
        setTimeout(() => {
          setAnimatedLines((prev) =>
            prev.filter((line) => line.id !== lineId),
          );
        }, MOUTH_LINE_DURATION_MS);
      });
    },
    [],
  );

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
        leftMouthCorner,
        rightMouthCorner,
        leftMouthLines,
        rightMouthLines,
      } = calculateAnimations({
        landmarks,
        videoElement,
      });

      eyeLandmarksRef.current = {
        leftEyeLines,
        rightEyeLines,
        leftMouthLines,
        rightMouthLines,
      };

      // Update positions of existing animated lines to follow face
      setAnimatedLines((prev) =>
        prev.map((line) => {
          const point =
            line.side === "leftEye"
              ? leftEyeLines[line.index]
              : line.side === "rightEye"
                ? rightEyeLines[line.index]
                : line.side === "leftMouth"
                  ? leftMouthLines[line.index]
                  : rightMouthLines[line.index];
          if (!point) return line;
          return {
            ...line,
            ...point,
          };
        }),
      );

      // Update star positions using rolling averages for smoother movement
      setStars((prev) =>
        prev.map((star: Star) => {
          const corner = (() => {
            switch (star.side) {
              case "leftEye":
                return leftInnerCorner;
              case "rightEye":
                return rightInnerCorner;
              case "leftMouth":
                return leftMouthCorner;
              case "rightMouth":
                return rightMouthCorner;
            }
          })();

          if (!corner) return star;

          const averages = starRollingAveragesRef.current[star.side];
          averages.x.addValue(corner.x);
          averages.y.addValue(corner.y);

          return {
            ...star,
            position: {
              x: averages.x.getMedian(),
              y: averages.y.getMedian(),
            },
          };
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
    spawnMouthLines,
  };
}
