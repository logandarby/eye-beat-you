import {
  LEFT_EYE_RADIAL_POINTS,
  RIGHT_EYE_RADIAL_POINTS,
  CHIN_CENTER,
  FOREHEAD_TOP,
  LEFT_EYE_INNER_CORNER,
  RIGHT_EYE_INNER_CORNER,
  RIGHT_MOUTH_CORNER,
  LEFT_MOUTH_CORNER,
  RIGHT_MOUTH_RADIAL_POINTS,
  LEFT_MOUTH_RADIAL_POINTS,
} from "@/core/constants";
import { calculateObjectCoverDisplayProperties } from "@/utils/object-cover";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface Vec2 {
  x: number;
  y: number;
}

// Star animation interface
export interface Star {
  id: string;
  side: "leftEye" | "rightEye" | "leftMouth" | "rightMouth";
  position: Vec2;
}

export interface AnimatedLine {
  id: string;
  side: "leftEye" | "rightEye" | "leftMouth" | "rightMouth";
  index: number; // 0,1,2 for the radial line order
  position: Vec2; // current screen position (updates each frame)
  angle: number; // current angle (updates each frame)
  createdAt: number;
}

// Constants

export const BLINK_LINE_HEIGHT = 15;
export const BLINK_LINE_OFFSET_Y = 10;
export const BLINK_LINE_WIDTH = 2;
export const BLINK_ANGLE_OFFSET = 15;
export const MOUTH_ANGLE_OFFSET = 30;
export const MOUTH_LINE_OFFSET: Vec2 = {
  x: 30,
  y: -10,
};
export const BLINK_LINE_DURATION_MS = 300;
export const MOUTH_LINE_DURATION_MS = 1000;

// Util Functions

export function landmarkToScreenCoords(
  landmark: Vec2,
  videoElement: HTMLVideoElement,
): Vec2 {
  const containerRect = videoElement.getBoundingClientRect();
  const { displayWidth, displayHeight, offsetX, offsetY } =
    calculateObjectCoverDisplayProperties(videoElement);

  // Convert landmark coordinates to screen coordinates
  // Note: landmarks are mirrored due to scaleX(-1) transform
  const screenX =
    containerRect.left +
    containerRect.width -
    (landmark.x * displayWidth - offsetX);
  const screenY =
    containerRect.top + (landmark.y * displayHeight - offsetY);

  return { x: screenX, y: screenY };
}

export interface CalculateAnimationArgs {
  landmarks: NormalizedLandmark[];
  videoElement: HTMLVideoElement;
}

export interface CalculateAnimationResult {
  leftEyeLines: { position: Vec2; angle: number }[];
  rightEyeLines: { position: Vec2; angle: number }[];
  leftInnerCorner: Vec2 | null;
  rightInnerCorner: Vec2 | null;
  leftMouthLines: { position: Vec2; angle: number }[];
  rightMouthLines: { position: Vec2; angle: number }[];
  leftMouthCorner: Vec2 | null;
  rightMouthCorner: Vec2 | null;
}

export function calculateAnimations({
  landmarks,
  videoElement,
}: CalculateAnimationArgs): CalculateAnimationResult {
  const addBlinkOffset = (point: Vec2) => {
    return {
      x: point.x,
      y: point.y - BLINK_LINE_OFFSET_Y,
    };
  };

  const addMouthOffset = (point: Vec2, side: "left" | "right") => {
    return {
      x:
        point.x +
        (side === "left"
          ? MOUTH_LINE_OFFSET.x
          : -MOUTH_LINE_OFFSET.x),
      y: point.y - MOUTH_LINE_OFFSET.y,
    };
  };

  const leftEyePoints = LEFT_EYE_RADIAL_POINTS.map(
    (index) => landmarks[index]!,
  )
    .map((point) => landmarkToScreenCoords(point, videoElement))
    .map(addBlinkOffset);
  const rightEyePoints = RIGHT_EYE_RADIAL_POINTS.map(
    (index) => landmarks[index]!,
  )
    .map((point) => landmarkToScreenCoords(point, videoElement))
    .map(addBlinkOffset);
  const leftMouthPoints = LEFT_MOUTH_RADIAL_POINTS.map(
    (index) => landmarks[index]!,
  )
    .map((point) => landmarkToScreenCoords(point, videoElement))
    .map((point) => addMouthOffset(point, "left"));
  const rightMouthPoints = RIGHT_MOUTH_RADIAL_POINTS.map(
    (index) => landmarks[index]!,
  )
    .map((point) => landmarkToScreenCoords(point, videoElement))
    .map((point) => addMouthOffset(point, "right"));
  const chinCenter = landmarkToScreenCoords(
    landmarks[CHIN_CENTER]!,
    videoElement,
  );
  const foreheadTop = landmarkToScreenCoords(
    landmarks[FOREHEAD_TOP]!,
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

  const calculateBlinkAngle = (index: number) => {
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

  const calculateMouthAngle = (
    index: number,
    side: "left" | "right",
  ) => {
    const baseAngle =
      side === "right" ? faceUpAngle + 180 : faceUpAngle;
    switch (index) {
      case 0:
        return (
          baseAngle -
          (side === "left" ? MOUTH_ANGLE_OFFSET : -MOUTH_ANGLE_OFFSET)
        );
      case 1:
        return baseAngle;
      case 2:
        return (
          baseAngle +
          (side === "left" ? MOUTH_ANGLE_OFFSET : -MOUTH_ANGLE_OFFSET)
        );
      default:
        throw new Error(`Invalid index: ${index} for mouth`);
    }
  };

  const leftInnerCorner = landmarkToScreenCoords(
    landmarks[LEFT_EYE_INNER_CORNER]!,
    videoElement,
  );
  const rightInnerCorner = landmarkToScreenCoords(
    landmarks[RIGHT_EYE_INNER_CORNER]!,
    videoElement,
  );

  const leftMouthCorner = landmarkToScreenCoords(
    landmarks[LEFT_MOUTH_CORNER]!,
    videoElement,
  );
  const rightMouthCorner = landmarkToScreenCoords(
    landmarks[RIGHT_MOUTH_CORNER]!,
    videoElement,
  );

  return {
    leftEyeLines: leftEyePoints.map((point, index) => ({
      position: point,
      angle: calculateBlinkAngle(index),
    })),
    rightEyeLines: rightEyePoints.map((point, index) => ({
      position: point,
      angle: calculateBlinkAngle(index),
    })),
    leftInnerCorner,
    rightInnerCorner,
    leftMouthLines: leftMouthPoints.map((point, index) => ({
      position: point,
      angle: calculateMouthAngle(index, "left"),
    })),
    rightMouthLines: rightMouthPoints.map((point, index) => ({
      position: point,
      angle: calculateMouthAngle(index, "right"),
    })),
    leftMouthCorner,
    rightMouthCorner,
  };
}
