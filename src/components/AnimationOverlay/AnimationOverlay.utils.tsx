import {
  LEFT_EYE_RADIAL_POINTS,
  RIGHT_EYE_RADIAL_POINTS,
  CHIN_CENTER,
  FOREHEAD_TOP,
  LEFT_EYE_INNER_CORNER,
  RIGHT_EYE_INNER_CORNER,
} from "@/core/constants";
import { calculateObjectCoverDisplayProperties } from "@/utils/object-cover";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

// Star animation interface
export interface Star {
  id: string;
  side: "left" | "right";
  x: number;
  y: number;
}

export interface AnimatedLine {
  id: string;
  side: "left" | "right"; // which eye this line belongs to
  index: number; // 0,1,2 for the radial line order
  x: number; // current screen x position (updates each frame)
  y: number; // current screen y position (updates each frame)
  angle: number; // current angle (updates each frame)
  createdAt: number;
}

// Constants

export const BLINK_LINE_HEIGHT = 15;
export const BLINK_LINE_WIDTH = 2;
export const BLINK_ANGLE_OFFSET = 15;
export const BLINK_LINE_DURATION_MS = 300;

// Util Functions

export function landmarkToScreenCoords(
  landmarkX: number,
  landmarkY: number,
  videoElement: HTMLVideoElement,
): { x: number; y: number } | null {
  if (!videoElement) return null;

  const containerRect = videoElement.getBoundingClientRect();
  const { displayWidth, displayHeight, offsetX, offsetY } =
    calculateObjectCoverDisplayProperties(videoElement);

  // Convert landmark coordinates to screen coordinates
  // Note: landmarks are mirrored due to scaleX(-1) transform
  const screenX =
    containerRect.left +
    containerRect.width -
    (landmarkX * displayWidth - offsetX);
  const screenY =
    containerRect.top + (landmarkY * displayHeight - offsetY);

  return { x: screenX, y: screenY };
}

export interface CalculateAnimationArgs {
  landmarks: NormalizedLandmark[];
  videoElement: HTMLVideoElement;
}

export interface CalculateAnimationResult {
  leftEyeLines: { x: number; y: number; angle: number }[];
  rightEyeLines: { x: number; y: number; angle: number }[];
  leftInnerCorner: { x: number; y: number } | null;
  rightInnerCorner: { x: number; y: number } | null;
}

export function calculateAnimations({
  landmarks,
  videoElement,
}: CalculateAnimationArgs): CalculateAnimationResult {
  const leftEyePoints = LEFT_EYE_RADIAL_POINTS.map(
    (index) => landmarks[index]!,
  ).map((point) =>
    landmarkToScreenCoords(point.x, point.y, videoElement),
  );
  const rightEyePoints = RIGHT_EYE_RADIAL_POINTS.map(
    (index) => landmarks[index]!,
  ).map((point) =>
    landmarkToScreenCoords(point.x, point.y, videoElement),
  );
  const chinCenter = landmarkToScreenCoords(
    landmarks[CHIN_CENTER]!.x,
    landmarks[CHIN_CENTER]!.y,
    videoElement,
  );
  const foreheadTop = landmarkToScreenCoords(
    landmarks[FOREHEAD_TOP]!.x,
    landmarks[FOREHEAD_TOP]!.y,
    videoElement,
  );
  const faceUpAngle =
    chinCenter && foreheadTop
      ? Math.atan2(
          chinCenter.y - foreheadTop.y,
          chinCenter.x - foreheadTop.x,
        ) *
        (180 / Math.PI)
      : 0;

  const calculateAngle = (index: number) => {
    const baseAngle = faceUpAngle - 90;
    switch (index) {
      case 0:
        return baseAngle + BLINK_ANGLE_OFFSET;
      case 1:
        return baseAngle;
      case 2:
        return baseAngle - BLINK_ANGLE_OFFSET;
      default:
        throw new Error(`Invalid index: ${index} for eye`);
    }
  };

  const leftInnerCorner = landmarkToScreenCoords(
    landmarks[LEFT_EYE_INNER_CORNER]!.x,
    landmarks[LEFT_EYE_INNER_CORNER]!.y,
    videoElement,
  );
  const rightInnerCorner = landmarkToScreenCoords(
    landmarks[RIGHT_EYE_INNER_CORNER]!.x,
    landmarks[RIGHT_EYE_INNER_CORNER]!.y,
    videoElement,
  );

  return {
    leftEyeLines: leftEyePoints
      .filter((p): p is { x: number; y: number } => !!p)
      .map((point, index) => ({
        x: point.x,
        y: point.y,
        angle: calculateAngle(index),
      })),
    rightEyeLines: rightEyePoints
      .filter((p): p is { x: number; y: number } => !!p)
      .map((point, index) => ({
        x: point.x,
        y: point.y,
        angle: calculateAngle(index),
      })),
    leftInnerCorner,
    rightInnerCorner,
  };
}
