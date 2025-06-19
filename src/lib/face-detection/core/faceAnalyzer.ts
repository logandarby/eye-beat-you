import { type FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import {
  EYE_ASPECT_RATIO_THRESHOLD,
  LEFT_EYE_LANDMARKS,
  MOUTH_ASPECT_RATIO_THRESHOLD,
  MOUTH_LANDMARKS,
  RIGHT_EYE_LANDMARKS,
  EAR_VELOCITY_THRESHOLD,
  EAR_VELOCITY_WINDOW_SIZE,
  MAR_VELOCITY_THRESHOLD,
  MAR_VELOCITY_WINDOW_SIZE,
  MEDIAN_FILTER_WINDOW_SIZE,
  HTR_THRESHOLD,
  HTR_ROLLING_WINDOW_SIZE,
  PHILTRUM_CENTER,
  LEFT_FACE_SIDE,
  RIGHT_FACE_SIDE,
  FOREHEAD_TOP,
  CHIN_CENTER,
  HPR_THRESHOLD,
  HPR_ROLLING_WINDOW_SIZE,
  NOSE_CENTER,
} from "@/core/constants";
import { MedianFilter } from "../utils/medianFilter";
import { globalFaceDetectionTracker } from "@/lib/performance";
import { RollingAverage } from "../utils/rollingAverage";
import {
  calculateEAR,
  calculateMAR,
  calculateHTR,
  calculateHPR,
} from "../utils/faceMetrics";

class OrificeState {
  constructor(
    public isOpen: boolean,
    public previouslyOpen: boolean,
  ) {}

  get isClosing(): boolean {
    return !this.isOpen && this.previouslyOpen;
  }

  get isOpening(): boolean {
    return this.isOpen && !this.previouslyOpen;
  }
}

export class FaceAnalyzer {
  private leftEyeState = new OrificeState(true, true);
  private rightEyeState = new OrificeState(true, true);
  private mouthState = new OrificeState(false, false);

  // Store current EAR values for external access
  private currentLeftEAR: number = 0;
  private currentRightEAR: number = 0;
  private currentMouthMAR: number = 0;

  // Previous EAR values for velocity calculation
  private previousLeftEAR: number | null = null;
  private previousRightEAR: number | null = null;

  // Previous MAR value for velocity calculation
  private previousMouthMAR: number | null = null;

  // Median filters for EAR velocity (finite differences)
  private leftEARVelocity: MedianFilter;
  private rightEARVelocity: MedianFilter;

  // Median filter for MAR velocity (finite differences)
  private mouthMARVelocity: MedianFilter;

  // Median filters for smoothing EAR and MAR values
  private leftEARFilter: MedianFilter;
  private rightEARFilter: MedianFilter;
  private mouthMARFilter: MedianFilter;

  // Rolling average for head turning ratio
  private htrRollingAverage: RollingAverage;

  // Rolling average for head pitch ratio
  private hprRollingAverage: RollingAverage;

  // Track current head position to avoid repeated events
  private currentHeadPosition: "center" | "left" | "right" = "center";

  // Track current head pitch to avoid repeated events
  private currentHeadPitch: "center" | "up" | "down" = "center";

  constructor(
    private readonly onEvent: (
      bodyPart: "leftEye" | "rightEye" | "mouth" | "head",
      event: "open" | "close" | "left" | "right" | "up" | "down",
    ) => void,
  ) {
    console.log("FaceAnalyzer constructor");
    // Initialize median filters for EAR velocity tracking
    this.leftEARVelocity = new MedianFilter(EAR_VELOCITY_WINDOW_SIZE);
    this.rightEARVelocity = new MedianFilter(
      EAR_VELOCITY_WINDOW_SIZE,
    );

    // Initialize median filter for MAR velocity tracking
    this.mouthMARVelocity = new MedianFilter(
      MAR_VELOCITY_WINDOW_SIZE,
    );

    // Initialize median filters for smoothing ratios
    this.leftEARFilter = new MedianFilter(MEDIAN_FILTER_WINDOW_SIZE);
    this.rightEARFilter = new MedianFilter(MEDIAN_FILTER_WINDOW_SIZE);
    this.mouthMARFilter = new MedianFilter(MEDIAN_FILTER_WINDOW_SIZE);

    // Initialize rolling average for HTR detection
    this.htrRollingAverage = new RollingAverage(
      HTR_ROLLING_WINDOW_SIZE,
    );

    // Initialize rolling average for HPR detection
    this.hprRollingAverage = new RollingAverage(
      HPR_ROLLING_WINDOW_SIZE,
    );
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

    // For eyes, use velocity-based detection for closing, but always detect opening
    if (orificeName === "leftEye" || orificeName === "rightEye") {
      const velocityMedian =
        orificeName === "leftEye"
          ? this.leftEARVelocity.getMedian()
          : this.rightEARVelocity.getMedian();

      // Closing: Only trigger if velocity is above threshold (to avoid false positives)
      if (
        state.isClosing &&
        Math.abs(velocityMedian) > EAR_VELOCITY_THRESHOLD
      ) {
        this.onEvent(orificeName, "close");
      }
      // Opening: Always trigger (no velocity threshold needed)
      else if (state.isOpening) {
        this.onEvent(orificeName, "open");
      }
    } else {
      // For mouth, use velocity-based detection for both directions
      const velocityMedian = this.mouthMARVelocity.getMedian();

      // Only trigger mouth events if velocity is above threshold
      if (
        state.previouslyOpen &&
        !state.isOpen &&
        Math.abs(velocityMedian) > MAR_VELOCITY_THRESHOLD
      ) {
        this.onEvent(orificeName, "close");
      } else if (
        !state.previouslyOpen &&
        state.isOpen &&
        Math.abs(velocityMedian) > MAR_VELOCITY_THRESHOLD
      ) {
        this.onEvent(orificeName, "open");
      }
    }
  }

  /**
   * Analyze face landmarks and detect blinks/mouth movements
   */
  public analyzeFace(results: FaceLandmarkerResult): void {
    // Start tracking analysis stage
    globalFaceDetectionTracker.startStage("analysis");

    if (
      !results.faceLandmarks ||
      results.faceLandmarks.length === 0
    ) {
      globalFaceDetectionTracker.endStage("analysis");
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

    // Calculate raw EAR values
    const rawLeftEAR = calculateEAR(leftEyeLandmarks);
    const rawRightEAR = calculateEAR(rightEyeLandmarks);

    // Calculate raw MAR for mouth
    const mouthLandmarks = this.extractMouthLandmarks(landmarks);
    const rawMouthMAR = calculateMAR(mouthLandmarks);

    // Apply median filtering to smooth the values
    this.leftEARFilter.addValue(rawLeftEAR);
    this.rightEARFilter.addValue(rawRightEAR);
    this.mouthMARFilter.addValue(rawMouthMAR);

    // Get filtered values
    const leftEAR = this.leftEARFilter.getMedian();
    const rightEAR = this.rightEARFilter.getMedian();
    const mouthMAR = this.mouthMARFilter.getMedian();

    // Calculate EAR velocities (finite differences) and update median filters
    if (this.previousLeftEAR !== null) {
      const leftVelocity = leftEAR - this.previousLeftEAR;
      this.leftEARVelocity.addValue(leftVelocity);
    }

    if (this.previousRightEAR !== null) {
      const rightVelocity = rightEAR - this.previousRightEAR;
      this.rightEARVelocity.addValue(rightVelocity);
    }

    // Calculate MAR velocity (finite differences) and update median filter
    if (this.previousMouthMAR !== null) {
      const mouthVelocity = mouthMAR - this.previousMouthMAR;
      this.mouthMARVelocity.addValue(mouthVelocity);
    }

    // Store current values for external access and next iteration
    this.previousLeftEAR = this.currentLeftEAR;
    this.previousRightEAR = this.currentRightEAR;
    this.previousMouthMAR = this.currentMouthMAR;
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

    // Calculate Head Turning Ratio (HTR) using util
    const rawHTR = calculateHTR(
      landmarks,
      PHILTRUM_CENTER,
      LEFT_FACE_SIDE,
      RIGHT_FACE_SIDE,
    );

    // Update rolling average for HTR
    this.htrRollingAverage.addValue(rawHTR);
    const avgHTR = this.htrRollingAverage.getAverage();

    // Determine head position based on threshold
    let newHeadPosition: "center" | "left" | "right" = "center";
    if (avgHTR > HTR_THRESHOLD) {
      newHeadPosition = "left";
    } else if (avgHTR < -HTR_THRESHOLD) {
      newHeadPosition = "right";
    }

    // Trigger event if head position changed and is not center
    if (
      newHeadPosition !== this.currentHeadPosition &&
      newHeadPosition !== "center"
    ) {
      this.onEvent("head", newHeadPosition);
    }

    // Update current position
    this.currentHeadPosition = newHeadPosition;

    /**
     * -----------------------
     *  Head Pitch Calculation
     * -----------------------
     */

    // Calculate Head Pitch Ratio (HPR) using util
    const rawHPR = calculateHPR(
      landmarks,
      NOSE_CENTER,
      LEFT_FACE_SIDE,
      RIGHT_FACE_SIDE,
      FOREHEAD_TOP,
      CHIN_CENTER,
    );

    // Update rolling average for HPR
    this.hprRollingAverage.addValue(rawHPR);
    const avgHPR = this.hprRollingAverage.getAverage();

    // Determine head pitch based on threshold
    let newHeadPitch: "center" | "up" | "down" = "center";
    if (avgHPR > HPR_THRESHOLD) {
      newHeadPitch = "up";
    } else if (avgHPR < -HPR_THRESHOLD) {
      newHeadPitch = "down";
    }

    // Trigger event if head pitch changed and is not center
    if (
      newHeadPitch !== this.currentHeadPitch &&
      newHeadPitch !== "center"
    ) {
      this.onEvent("head", newHeadPitch);
    }

    // Update current pitch
    this.currentHeadPitch = newHeadPitch;

    // End tracking analysis stage
    globalFaceDetectionTracker.endStage("analysis");
  }

  /**
   * Reset all states (useful for when detection restarts)
   */
  public reset(): void {
    this.leftEyeState = new OrificeState(true, true);
    this.rightEyeState = new OrificeState(true, true);
    this.mouthState = new OrificeState(false, false);

    // Reset velocity tracking
    this.previousLeftEAR = null;
    this.previousRightEAR = null;
    this.previousMouthMAR = null;
    this.leftEARVelocity.reset();
    this.rightEARVelocity.reset();
    this.mouthMARVelocity.reset();

    // Reset median filters
    this.leftEARFilter.reset();
    this.rightEARFilter.reset();
    this.mouthMARFilter.reset();

    // Reset head turning detection
    this.htrRollingAverage.reset();
    this.currentHeadPosition = "center";

    // Reset head pitch detection
    this.hprRollingAverage.reset();
    this.currentHeadPitch = "center";
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
   * Get current EAR and MAR velocity information
   */
  public getCurrentVelocities() {
    return {
      leftEARVelocity: this.leftEARVelocity.getMedian(),
      rightEARVelocity: this.rightEARVelocity.getMedian(),
      mouthMARVelocity: this.mouthMARVelocity.getMedian(),
      leftVelocityCount: this.leftEARVelocity.getCount(),
      rightVelocityCount: this.rightEARVelocity.getCount(),
      mouthVelocityCount: this.mouthMARVelocity.getCount(),
    };
  }

  /**
   * Get current Head Turning Ratio
   */
  public getCurrentHTR() {
    return {
      htrAverage: this.htrRollingAverage.getAverage(),
      htrCount: this.htrRollingAverage.getCount(),
    };
  }

  /**
   * Get current Head Pitch Ratio
   */
  public getCurrentHPR() {
    return {
      hprAverage: this.hprRollingAverage.getAverage(),
      hprCount: this.hprRollingAverage.getCount(),
    };
  }
}
