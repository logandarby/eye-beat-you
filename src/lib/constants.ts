// Camera ready delay
export const CAMERA_READY_DELAY = 300;
export const FACE_DETECTION_DELAY = 1000;

// Audio files to play
export const BLINK_AUDIO_FILE = "/eye-beat-you/blink.mp3";
export const MOUTH_OPEN_AUDIO_FILE = "/eye-beat-you/scream.mp3";

// Thresholds for determining open/closed state
export const EYE_ASPECT_RATIO_THRESHOLD = 0.2;
export const MOUTH_ASPECT_RATIO_THRESHOLD = 0.4;

// EAR velocity detection settings
export const EAR_VELOCITY_THRESHOLD = 0.03; // Minimum velocity to trigger blink
export const EAR_VELOCITY_WINDOW_SIZE = 1; // Rolling average window size for velocity calculation

// MAR velocity detection settings
export const MAR_VELOCITY_THRESHOLD = 0.05; // Minimum velocity to trigger mouth open/close
export const MAR_VELOCITY_WINDOW_SIZE = 1; // Window size for MAR velocity calculation

// Median filter settings for smoothing EAR/MAR values
export const MEDIAN_FILTER_WINDOW_SIZE = 3; // Window size for median filtering of ratios

// MediaPipe face landmark indices
// These are the specific 6 points used for EAR calculation from each eye
export const LEFT_EYE_LANDMARKS = [
  362, // Left corner
  385, // Top outer
  387, // Top inner
  263, // Right corner
  373, // Bottom inner
  380, // Bottom outer
];

// This is definitely right!
export const RIGHT_EYE_LANDMARKS = [
  33, // Left corner
  160, // Top outer
  158, // Top inner
  133, // Right corner
  153, // Bottom inner
  144, // Bottom outer
];

// Mouth landmark indices for mouth aspect ratio calculation
export const MOUTH_LANDMARKS = [
  78, // Left corner
  308, // Right corner
  81, // Top outer
  178, // Bottom outer
  13, // Top middle
  14, // Bottom middle
  312, // Bottom inner
  317, // Top inner
];
