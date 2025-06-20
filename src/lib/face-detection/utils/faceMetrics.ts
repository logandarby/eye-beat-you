// Utility functions for facial metric calculations.
// These are pure functions with no side-effects so they can be reused or unit-tested independently.

export interface Point3D {
  x: number;
  y: number;
  z?: number;
}

/**
 * Euclidean distance between two 2-D points.
 */
export function distance(p1: Point3D, p2: Point3D): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2),
  );
}

/**
 * Eye Aspect Ratio (EAR)
 * EAR = |p2‒p6| / |p1‒p4|
 * Expects an ordered array of 6 landmarks: [p1, p2, p3, p4, p5, p6]
 */
export function calculateEAR(eyeLandmarks: Point3D[]): number {
  if (eyeLandmarks.length < 6) {
    throw new Error("Eye landmarks length is not 6");
  }
  const p1 = eyeLandmarks[0]; // left corner
  const p2 = eyeLandmarks[1]; // top outer
  const p4 = eyeLandmarks[3]; // right corner
  const p6 = eyeLandmarks[5]; // bottom outer

  const outerVertical = distance(p2, p6);
  const horizontal = distance(p1, p4);

  return horizontal === 0 ? 0 : outerVertical / horizontal;
}

/**
 * Mouth Aspect Ratio (MAR)
 * Uses 8 landmarks -- Similar Calculation to EAR
 */
export function calculateMAR(mouthLandmarks: Point3D[]): number {
  if (mouthLandmarks.length !== 8) {
    throw new Error("Mouth landmarks length is not 8");
  }
  const vertical1 = distance(mouthLandmarks[2], mouthLandmarks[3]);
  const vertical2 = distance(mouthLandmarks[4], mouthLandmarks[5]);
  const vertical3 = distance(mouthLandmarks[6], mouthLandmarks[7]);
  const horizontal = distance(mouthLandmarks[0], mouthLandmarks[1]);

  return horizontal === 0
    ? 0
    : (vertical1 + vertical2 + vertical3) / (3.0 * horizontal);
}

/**
 * Head Turn Ratio (HTR)
 * Positive value => head turned left, negative => right.
 */
export function calculateHTR(
  landmarks: Point3D[],
  philtrumIdx: number,
  leftFaceIdx: number,
  rightFaceIdx: number,
): number {
  // HTR = sin(clamp((nose.x – midX) / (faceWidth/2), -1, 1)) – horizontal offset of the philtrum within the face width.

  // Gather points.
  const nose = landmarks[philtrumIdx];
  const left = landmarks[leftFaceIdx];
  const right = landmarks[rightFaceIdx];

  // Compute half-width of the face.
  const faceWidth = right.x - left.x;
  // Guard against division by zero (should not happen under normal circumstances).
  if (faceWidth === 0) {
    return 0;
  }

  const halfWidth = faceWidth / 2.0;

  // Horizontal displacement of the nose from mid-point.
  const midX = left.x + halfWidth;
  let rawRatio = (nose.x - midX) / halfWidth; // Expected range ≈ [-1, 1]

  // Clamp ratio to [-1,1].
  if (rawRatio > 1) rawRatio = 1;
  else if (rawRatio < -1) rawRatio = -1;

  // Map through sin() for smoother curve near center.
  return Math.sin(rawRatio);
}

/**
 * Head Pitch Ratio (HPR)
 * Positive value => looking up, negative => looking down.
 */
export function calculateHPR(
  landmarks: Point3D[],
  noseIdx: number,
  leftFaceIdx: number,
  rightFaceIdx: number,
  foreheadIdx: number,
  chinIdx: number,
): number {
  const nose = landmarks[noseIdx];
  const left = landmarks[leftFaceIdx];
  const right = landmarks[rightFaceIdx];
  const forehead = landmarks[foreheadIdx];
  const chin = landmarks[chinIdx];

  // Signed perpendicular distance from nose to the LR line.
  const numerator =
    (right.y - left.y) * nose.x -
    (right.x - left.x) * nose.y +
    right.x * left.y -
    right.y * left.x;
  const denominator = Math.sqrt(
    Math.pow(right.y - left.y, 2) + Math.pow(right.x - left.x, 2),
  );
  const cnDistance = denominator === 0 ? 0 : numerator / denominator;

  const headHeight = distance(forehead, chin);
  const hpr = headHeight === 0 ? 0 : cnDistance / headHeight;
  // Use sin to make it more linear
  return Math.sin(hpr);
}
