import {
  LEFT_EYE_RADIAL_POINTS,
  RIGHT_EYE_RADIAL_POINTS,
  CHIN_CENTER,
  FOREHEAD_TOP,
  LEFT_EYE_INNER_CORNER,
  RIGHT_EYE_INNER_CORNER,
} from "@/lib/constants";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { BLINK_ANGLE_OFFSET } from "./AnimationOverlay.utils";

export function landmarkToScreenCoords(
  landmarkX: number,
  landmarkY: number,
  videoElement: HTMLVideoElement,
): { x: number; y: number } | null {
  if (!videoElement) return null;

  const containerRect = videoElement.getBoundingClientRect();
  const { videoWidth, videoHeight } = videoElement;

  if (!videoWidth || !videoHeight) return null;

  // Calculate how the video fits within its container with object-fit: cover
  const containerAspectRatio =
    containerRect.width / containerRect.height;
  const videoAspectRatio = videoWidth / videoHeight;

  let displayWidth, displayHeight, offsetX, offsetY;

  if (videoAspectRatio > containerAspectRatio) {
    // Video is wider than container - fit to height, crop width
    displayHeight = containerRect.height;
    displayWidth = (videoWidth * containerRect.height) / videoHeight;
    offsetX = (displayWidth - containerRect.width) / 2;
    offsetY = 0;
  } else {
    // Video is taller than container - fit to width, crop height
    displayWidth = containerRect.width;
    displayHeight = (videoHeight * containerRect.width) / videoWidth;
    offsetX = 0;
    offsetY = (displayHeight - containerRect.height) / 2;
  }

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
