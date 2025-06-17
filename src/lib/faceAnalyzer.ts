import { type FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import {
  EYE_ASPECT_RATIO_THRESHOLD,
  LEFT_EYE_LANDMARKS,
  MOUTH_ASPECT_RATIO_THRESHOLD,
  MOUTH_LANDMARKS,
  RIGHT_EYE_LANDMARKS,
  EAR_VELOCITY_THRESHOLD,
  EAR_VELOCITY_WINDOW_SIZE,
} from "./constants";
import { RollingAverage } from "./rollingAverage";

interface OrificeState {
  isOpen: boolean;
  previouslyOpen: boolean;
}

export class FaceAnalyzer {
  private leftEyeState: OrificeState = {
    isOpen: true,
    previouslyOpen: true,
  };
  private rightEyeState: OrificeState = {
    isOpen: true,
    previouslyOpen: true,
  };
  private mouthState: OrificeState = {
    isOpen: false,
    previouslyOpen: false,
  };

  // Store current EAR values for external access
  private currentLeftEAR: number = 0;
  private currentRightEAR: number = 0;
  private currentMouthMAR: number = 0;

  // Previous EAR values for velocity calculation
  private previousLeftEAR: number | null = null;
  private previousRightEAR: number | null = null;

  // Rolling averages for EAR velocity (finite differences)
  private leftEARVelocity: RollingAverage;
  private rightEARVelocity: RollingAverage;

  constructor(
    private readonly onEvent: (
      bodyPart: "leftEye" | "rightEye" | "mouth",
      event: "open" | "close",
    ) => void,
  ) {
    // Initialize rolling averages for EAR velocity tracking
    this.leftEARVelocity = new RollingAverage(
      EAR_VELOCITY_WINDOW_SIZE,
    );
    this.rightEARVelocity = new RollingAverage(
      EAR_VELOCITY_WINDOW_SIZE,
    );
  }

  /**
   * Calculate Eye Aspect Ratio (EAR) using the standard formula
   * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
   * Where:
   * p1, p4 = horizontal eye corners
   * p2, p6 = top and bottom outer vertical points
   * p3, p5 = top and bottom inner vertical points
   */
  private calculateEAR(
    eyeLandmarks: Array<{ x: number; y: number; z?: number }>,
  ): number {
    if (eyeLandmarks.length < 6) {
      throw new Error("Eye landmarks length is not 6");
    }

    // Calculate distances between points
    const p1 = eyeLandmarks[0]; // Left corner
    const p2 = eyeLandmarks[1]; // Top outer
    const p3 = eyeLandmarks[2]; // Top inner
    const p4 = eyeLandmarks[3]; // Right corner
    const p5 = eyeLandmarks[4]; // Bottom inner
    const p6 = eyeLandmarks[5]; // Bottom outer

    const vertical1 = this.distance(p2, p6);
    const vertical2 = this.distance(p3, p5);
    const horizontal = this.distance(p1, p4);

    if (horizontal === 0) return 0;

    // EAR calculation using standard formula
    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  private distance(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
  ): number {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2),
    );
  }

  /**
   * Calculate Mouth Aspect Ratio (MAR)
   * Similar to EAR but for mouth opening
   */
  private calculateMAR(
    mouthLandmarks: Array<{ x: number; y: number; z?: number }>,
  ): number {
    if (mouthLandmarks.length !== 8) {
      throw new Error("Mouth landmarks length is not 8");
    }

    // Vertical distances (mouth height at different points)
    const vertical1 = this.distance(
      mouthLandmarks[2],
      mouthLandmarks[3],
    );
    const vertical2 = this.distance(
      mouthLandmarks[4],
      mouthLandmarks[5],
    );
    const vertical3 = this.distance(
      mouthLandmarks[6],
      mouthLandmarks[7],
    );

    // Horizontal distance (mouth width)
    const horizontal = this.distance(
      mouthLandmarks[0],
      mouthLandmarks[1],
    );

    // Avoid division by zero
    if (horizontal === 0) return 0;

    // MAR calculation
    return (vertical1 + vertical2 + vertical3) / (3.0 * horizontal);
  }

  /**
   * Extract specific eye landmarks from the full landmark array
   */
  private extractEyeLandmarks(
    allLandmarks: Array<{ x: number; y: number; z?: number }>,
    eyeIndices: number[],
  ): Array<{ x: number; y: number; z?: number }> {
    return eyeIndices.map((index) => allLandmarks[index]);
  }

  /**
   * Extract mouth landmarks from the full landmark array
   */
  private extractMouthLandmarks(
    allLandmarks: Array<{ x: number; y: number; z?: number }>,
  ): Array<{ x: number; y: number; z?: number }> {
    return MOUTH_LANDMARKS.slice(0, 12).map(
      (index) => allLandmarks[index],
    );
  }

  /**
   * Update state and log transitions with velocity-based blink detection for eyes
   */
  private updateOrificeState(
    state: OrificeState,
    isCurrentlyOpen: boolean,
    orificeName: "leftEye" | "rightEye" | "mouth",
  ): void {
    state.previouslyOpen = state.isOpen;
    state.isOpen = isCurrentlyOpen;

    // For eyes, use velocity-based detection
    if (orificeName === "leftEye" || orificeName === "rightEye") {
      const velocityAverage =
        orificeName === "leftEye"
          ? this.leftEARVelocity.getAverage()
          : this.rightEARVelocity.getAverage();

      // Only trigger blink events if velocity is above threshold
      if (
        state.previouslyOpen &&
        !state.isOpen &&
        Math.abs(velocityAverage) > EAR_VELOCITY_THRESHOLD
      ) {
        this.onEvent(orificeName, "close");
      } else if (
        !state.previouslyOpen &&
        state.isOpen &&
        Math.abs(velocityAverage) > EAR_VELOCITY_THRESHOLD
      ) {
        this.onEvent(orificeName, "open");
      }
    } else {
      // For mouth, use traditional state-based detection
      if (state.previouslyOpen && !state.isOpen) {
        this.onEvent(orificeName, "close");
      } else if (!state.previouslyOpen && state.isOpen) {
        this.onEvent(orificeName, "open");
      }
    }
  }

  /**
   * Analyze face landmarks and detect blinks/mouth movements
   */
  public analyzeFace(results: FaceLandmarkerResult): void {
    if (
      !results.faceLandmarks ||
      results.faceLandmarks.length === 0
    ) {
      return;
    }

    const landmarks = results.faceLandmarks[0];

    // Calculate EAR for both eyes using correct landmark indices
    const leftEyeLandmarks = this.extractEyeLandmarks(
      landmarks,
      LEFT_EYE_LANDMARKS,
    );
    const rightEyeLandmarks = this.extractEyeLandmarks(
      landmarks,
      RIGHT_EYE_LANDMARKS,
    );

    const leftEAR = this.calculateEAR(leftEyeLandmarks);
    const rightEAR = this.calculateEAR(rightEyeLandmarks);

    // Calculate MAR for mouth
    const mouthLandmarks = this.extractMouthLandmarks(landmarks);
    const mouthMAR = this.calculateMAR(mouthLandmarks);

    // Calculate EAR velocities (finite differences) and update rolling averages
    if (this.previousLeftEAR !== null) {
      const leftVelocity = leftEAR - this.previousLeftEAR;
      this.leftEARVelocity.addValue(leftVelocity);
    }

    if (this.previousRightEAR !== null) {
      const rightVelocity = rightEAR - this.previousRightEAR;
      this.rightEARVelocity.addValue(rightVelocity);
    }

    // Store current values for external access and next iteration
    this.previousLeftEAR = this.currentLeftEAR;
    this.previousRightEAR = this.currentRightEAR;
    this.currentLeftEAR = leftEAR;
    this.currentRightEAR = rightEAR;
    this.currentMouthMAR = mouthMAR;

    // Determine if orifices are open or closed
    const leftEyeOpen = leftEAR > EYE_ASPECT_RATIO_THRESHOLD;
    const rightEyeOpen = rightEAR > EYE_ASPECT_RATIO_THRESHOLD;
    const mouthOpen = mouthMAR > MOUTH_ASPECT_RATIO_THRESHOLD;

    // Update states and log transitions
    this.updateOrificeState(
      this.leftEyeState,
      leftEyeOpen,
      "leftEye",
    );
    this.updateOrificeState(
      this.rightEyeState,
      rightEyeOpen,
      "rightEye",
    );
    this.updateOrificeState(this.mouthState, mouthOpen, "mouth");
  }

  /**
   * Reset all states (useful for when detection restarts)
   */
  public reset(): void {
    this.leftEyeState = { isOpen: true, previouslyOpen: true };
    this.rightEyeState = { isOpen: true, previouslyOpen: true };
    this.mouthState = { isOpen: false, previouslyOpen: false };

    // Reset velocity tracking
    this.previousLeftEAR = null;
    this.previousRightEAR = null;
    this.leftEARVelocity.reset();
    this.rightEARVelocity.reset();
  }

  /**
   * Get current states for external use
   */
  public getStates() {
    return {
      leftEye: this.leftEyeState.isOpen,
      rightEye: this.rightEyeState.isOpen,
      mouth: this.mouthState.isOpen,
    };
  }

  /**
   * Get current EAR and MAR values
   */
  public getCurrentRatios() {
    return {
      leftEAR: this.currentLeftEAR,
      rightEAR: this.currentRightEAR,
      mouthMAR: this.currentMouthMAR,
    };
  }

  /**
   * Get current EAR velocity information
   */
  public getCurrentVelocities() {
    return {
      leftEARVelocity: this.leftEARVelocity.getAverage(),
      rightEARVelocity: this.rightEARVelocity.getAverage(),
      leftVelocityCount: this.leftEARVelocity.getCount(),
      rightVelocityCount: this.rightEARVelocity.getCount(),
    };
  }
}
