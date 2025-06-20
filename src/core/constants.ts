// Camera ready delay
export const CAMERA_READY_DELAY = 300;
export const FACE_DETECTION_DELAY = 1000;

// Audio files to play
export const BLINK_AUDIO = new Audio("/eye-beat-you/blink.wav");
export const MOUTH_OPEN_AUDIO = new Audio("/eye-beat-you/scream.wav");
export const TIMPANI_HI_AUDIO = new Audio(
  "/eye-beat-you/timpani-hi.wav",
);
export const TIMPANI_LO_AUDIO = new Audio(
  "/eye-beat-you/timpani-lo.wav",
);
export const HEAVEN_AUDIO = new Audio("/eye-beat-you/heaven.wav");
export const TIMPANI_LOWEST_AUDIO = new Audio(
  "/eye-beat-you/timpani-lowest.wav",
);

// Thresholds for determining open/closed state
export const EYE_ASPECT_RATIO_THRESHOLD = 0.2;
export const MOUTH_ASPECT_RATIO_THRESHOLD = 0.7;

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

// Eye center landmarks (pupil centers) for radial line angle calculation
export const RIGHT_EYE_CENTER = 468;
export const LEFT_EYE_CENTER = 473;

// Eye top landmarks for radial line spawn points
export const RIGHT_EYE_RADIAL_POINTS = [161, 159, 157]; // Top of left eye (3 points)
export const LEFT_EYE_RADIAL_POINTS = [384, 386, 388]; // Top of right eye (3 points)

// Mouth radial points for animations
export const LEFT_MOUTH_RADIAL_POINTS = [40, 78, 146]; // Left side of mouth (3 points)
// export const LEFT_MOUTH_RADIAL_POINTS = [0, 0, 0]; // Left side of mouth (3 points)
export const RIGHT_MOUTH_RADIAL_POINTS = [270, 308, 321]; // Right side of mouth (3 points)

export const LEFT_MOUTH_CORNER = 78;
export const RIGHT_MOUTH_CORNER = 308;

// Face orientation landmarks for calculating vertical direction (roll)
export const CHIN_CENTER = 19;
export const FOREHEAD_TOP = 10;

// Star spawn points (inner eye corners)
export const LEFT_EYE_INNER_CORNER = 263;
export const RIGHT_EYE_INNER_CORNER = 33;

// Head Turn Ratio (HTR) detection settings
export const HTR_THRESHOLD = 0.4; // Absolute threshold for detecting head turning (positive -> left, negative -> right)
export const HTR_ROLLING_WINDOW_SIZE = 5; // Window size for HTR rolling average calculation

// Landmarks for HTR calculation
export const PHILTRUM_CENTER = 164;
export const NOSE_CENTER = 1;
export const LEFT_FACE_SIDE = 137;
export const RIGHT_FACE_SIDE = 366;

// Head Pitch Ratio (HPR) detection settings
export const HPR_THRESHOLD = 0.3; // Threshold for detecting head pitch (positive -> up, negative -> down)
export const HPR_ROLLING_WINDOW_SIZE = 5; // Window size for HPR rolling average calculation

// --------------------------
// UI Tuning Constants
// --------------------------
// Base pixel size for overlay stars
export const STAR_BASE_SIZE = 13;
// How aggressively the mouth aspect ratio scales the star size (higher = larger growth)
export const STAR_MAR_SCALE_SENSITIVITY = 3;
export const STAR_MAR_MAX_SCALE = 2;
// Fraction of the overlay width/height used for each edge glow
export const GLOW_EDGE_RATIO = 0.3;
// How far beyond the threshold the glow saturates (1 = at threshold*2 it hits full opacity)
export const GLOW_OPACITY_EXTRA_RANGE = 0;

// Amplitude for star pulsation (scale range is 1 ± amplitude)
export const STAR_PULSATE_AMPLITUDE = 0.3;

// Multiplier applied to edge glow opacity when thresholds are ignored
export const INDEPENDENT_GLOW_OPACITY_MULTIPLIER = 2;
