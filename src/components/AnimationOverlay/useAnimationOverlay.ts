import { useCallback, useRef, useState, useEffect } from "react";
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

// Metric calculation helpers
import {
  calculateEAR,
  calculateMAR,
  calculateHTR,
  calculateHPR,
  type Point3D,
} from "@/lib/face-detection/utils/faceMetrics";
import {
  LEFT_EYE_LANDMARKS,
  RIGHT_EYE_LANDMARKS,
  MOUTH_LANDMARKS,
  PHILTRUM_CENTER,
  LEFT_FACE_SIDE,
  RIGHT_FACE_SIDE,
  NOSE_CENTER,
  FOREHEAD_TOP,
  CHIN_CENTER,
} from "@/core/constants";

const STAR_ROLLING_AVERAGE_WINDOW = 5;

export interface FaceMetrics {
  leftEAR: number;
  rightEAR: number;
  mouthMAR: number;
  htr: number;
  hpr: number;
}

export default function useAnimationOverlay(
  videoElement: HTMLVideoElement | null,
) {
  // ------------------------
  // Animation states
  // ------------------------
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

  const [faceMetrics, setFaceMetrics] = useState<FaceMetrics>({
    leftEAR: 0,
    rightEAR: 0,
    mouthMAR: 0,
    htr: 0,
    hpr: 0,
  });

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

  // Track the bounding rectangle of the video element for in-bounds overlays
  const [containerRect, setContainerRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // ------------------------
  // Sync containerRect with video element resize/move
  // ------------------------
  useEffect(() => {
    if (!videoElement) return;

    const updateRect = () => {
      const rect = videoElement.getBoundingClientRect();
      setContainerRect((prev) => {
        if (
          !prev ||
          prev.left !== rect.left ||
          prev.top !== rect.top ||
          prev.width !== rect.width ||
          prev.height !== rect.height
        ) {
          return {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          };
        }
        return prev;
      });
    };

    // Initialise
    updateRect();

    // Observe size changes of element
    const resizeObserver = new ResizeObserver(updateRect);
    resizeObserver.observe(videoElement);

    // Also update on window resize (position changes)
    window.addEventListener("resize", updateRect);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateRect);
    };
  }, [videoElement]);

  // ------------------------
  // Animation helpers
  // ------------------------
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
          prev.filter((l) => l.id !== lineId),
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
            prev.filter((l) => l.id !== lineId),
          );
        }, MOUTH_LINE_DURATION_MS);
      });
    },
    [],
  );

  // ------------------------
  // Landmark processing
  // ------------------------
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
      } = calculateAnimations({ landmarks, videoElement });

      // Update refs for eye & mouth lines (used when spawning)
      eyeLandmarksRef.current = {
        leftEyeLines,
        rightEyeLines,
        leftMouthLines,
        rightMouthLines,
      };

      // Update positions of existing animated lines to follow face
      setAnimatedLines((prev) =>
        prev.map((line) => {
          const point = (() => {
            switch (line.side) {
              case "leftEye":
                return leftEyeLines[line.index];
              case "rightEye":
                return rightEyeLines[line.index];
              case "leftMouth":
                return leftMouthLines[line.index];
              case "rightMouth":
                return rightMouthLines[line.index];
            }
          })();
          return point ? { ...line, ...point } : line;
        }),
      );

      // Update star positions using rolling averages for smoother movement
      setStars((prev) =>
        prev.map((star) => {
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

      // -----------------
      // Face metrics calc
      // -----------------
      // Cast landmarks to Point3D for metric calculations
      const landmarks3D = landmarks as unknown as Point3D[];

      const newLeftEAR = calculateEAR(
        LEFT_EYE_LANDMARKS.map((idx) => landmarks3D[idx]!),
      );
      const newRightEAR = calculateEAR(
        RIGHT_EYE_LANDMARKS.map((idx) => landmarks3D[idx]!),
      );
      const newMAR = calculateMAR(
        MOUTH_LANDMARKS.map((idx) => landmarks3D[idx]!),
      );
      const newHTR = calculateHTR(
        landmarks3D,
        PHILTRUM_CENTER,
        LEFT_FACE_SIDE,
        RIGHT_FACE_SIDE,
      );
      const newHPR = calculateHPR(
        landmarks3D,
        NOSE_CENTER,
        LEFT_FACE_SIDE,
        RIGHT_FACE_SIDE,
        FOREHEAD_TOP,
        CHIN_CENTER,
      );

      setFaceMetrics((prev) => {
        if (
          prev.leftEAR === newLeftEAR &&
          prev.rightEAR === newRightEAR &&
          prev.mouthMAR === newMAR &&
          prev.htr === newHTR &&
          prev.hpr === newHPR
        ) {
          return prev;
        }
        return {
          leftEAR: newLeftEAR,
          rightEAR: newRightEAR,
          mouthMAR: newMAR,
          htr: newHTR,
          hpr: newHPR,
        };
      });

      // containerRect is now updated via ResizeObserver effect
    },
    [],
  );

  return {
    animatedLines,
    stars,
    faceMetrics,
    containerRect,
    pushLandmarkInformation,
    spawnEyeLines,
    spawnMouthLines,
  };
}
