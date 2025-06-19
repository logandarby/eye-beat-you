import "./GameComponent.css";

import { useEffect, useRef, useState, useCallback } from "react";
import { useFaceLandmarker } from "../hooks/useFaceLandmarker";
import { useFacialLandmarkDetection } from "../hooks/useFacialLandmarkDetection";
import { useWebcam } from "../hooks/useWebcam";
import { FaceAnalyzer } from "../lib/faceAnalyzer";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import {
  BLINK_AUDIO,
  CAMERA_READY_DELAY,
  FACE_DETECTION_DELAY,
  MOUTH_OPEN_AUDIO,
} from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PerformanceViewer,
  usePerformanceToggle,
  useFaceDetectionPerformance,
  createFaceDetectionMetrics,
} from "@/lib/performance";
import "@fortawesome/fontawesome-free/css/all.min.css";
import AnimationOverlay from "./AnimationOverlay";
import {
  BLINK_LINE_DURATION_MS,
  type AnimatedLine,
  type Star,
} from "./AnimationOverlay.utils";
import { calculateAnimations } from "./util";

function GameComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize webcam access
  const { cameraStatus, requestCameraAccess } = useWebcam({
    videoRef,
  });
  const detectionEnabled = true;
  const [debugMode, setDebugMode] = useState<
    "off" | "points" | "lines" | "connectors"
  >("off");
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const faceDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [cameraReadyDelayPassed, setCameraReadyDelayPassed] =
    useState(false);
  const cameraReadyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation states
  const [animatedLines, setAnimatedLines] = useState<AnimatedLine[]>(
    [],
  );
  const [stars, setStars] = useState<Star[]>([
    { id: "left-star", side: "left", x: 0, y: 0 },
    { id: "right-star", side: "right", x: 0, y: 0 },
  ]);

  const eyeLandmarksRef = useRef<{
    leftEyeLines: Array<{ x: number; y: number; angle: number }>;
    rightEyeLines: Array<{ x: number; y: number; angle: number }>;
  }>({
    leftEyeLines: [],
    rightEyeLines: [],
  });

  // Performance tracking
  const isPerformanceVisible = usePerformanceToggle();
  const { metrics: faceDetectionMetrics } =
    useFaceDetectionPerformance({
      enabled: isPerformanceVisible && cameraStatus === "success",
    });

  // Convert face detection metrics to generic MetricsGroup format
  const performanceMetricsGroups = [
    createFaceDetectionMetrics(faceDetectionMetrics),
  ];

  // Initialize MediaPipe FaceLandmarker
  const {
    faceLandmarker,
    isLoaded: isModelLoaded,
    error: modelError,
  } = useFaceLandmarker();

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

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
        side: eyeSide,
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

  // Callback to handle face events (on open or close)
  const handleFaceEvent = useCallback(
    (
      bodyPart: "leftEye" | "rightEye" | "mouth",
      event: "open" | "close",
    ) => {
      if (isMutedRef.current) return;

      if (bodyPart === "leftEye" || bodyPart === "rightEye") {
        if (event === "close") {
          BLINK_AUDIO.currentTime = 0;
          BLINK_AUDIO.volume = 0.35;
          BLINK_AUDIO.play();

          // Spawn animations
          const side = bodyPart === "leftEye" ? "left" : "right";
          spawnEyeLines(side);
        }
      }
      if (bodyPart === "mouth") {
        if (event === "open") {
          MOUTH_OPEN_AUDIO.currentTime = 0;
          MOUTH_OPEN_AUDIO.volume = 0.35;
          MOUTH_OPEN_AUDIO.play();
        }
      }
    },
    [spawnEyeLines],
  );

  const faceAnalyzerRef = useRef<FaceAnalyzer | null>(null);

  // Initialize FaceAnalyzer only once
  if (!faceAnalyzerRef.current) {
    faceAnalyzerRef.current = new FaceAnalyzer(handleFaceEvent);
  }

  // Callback to analyze face landmarks for blinks and mouth movements
  const handleResults = useCallback(
    (results: FaceLandmarkerResult) => {
      const hasFaces =
        results.faceLandmarks && results.faceLandmarks.length > 0;

      const canvasElement = canvasRef.current;
      const videoElement = videoRef.current;
      if (!canvasElement || !videoElement) return;

      if (!hasFaces) {
        if (!faceDetectionTimeoutRef.current) {
          faceDetectionTimeoutRef.current = setTimeout(() => {
            setFaceDetected(false);
            faceDetectionTimeoutRef.current = null;
          }, FACE_DETECTION_DELAY);
        }
        return;
      }

      faceAnalyzerRef.current?.analyzeFace(results);
      setFaceDetected(true);
      // Clear any existing timeout
      if (faceDetectionTimeoutRef.current) {
        clearTimeout(faceDetectionTimeoutRef.current);
        faceDetectionTimeoutRef.current = null;
      }

      const {
        leftEyeLines,
        rightEyeLines,
        leftInnerCorner,
        rightInnerCorner,
      } = calculateAnimations({
        landmarks: results.faceLandmarks[0],
        videoElement,
      });

      eyeLandmarksRef.current = {
        leftEyeLines,
        rightEyeLines,
      };

      // Update positions of existing animated lines to follow face
      setAnimatedLines((prev) =>
        prev.map((line) => {
          const point =
            line.side === "left"
              ? leftEyeLines[line.index]
              : rightEyeLines[line.index];
          if (!point) return line;
          return {
            ...line,
            x: point.x,
            y: point.y,
            angle: point.angle,
          };
        }),
      );

      // Update star positions
      setStars((prev) =>
        prev.map((star: Star) => {
          const corner =
            star.side === "left" ? leftInnerCorner : rightInnerCorner;
          if (!corner) return star;
          return { ...star, x: corner.x, y: corner.y };
        }),
      );
    },
    [],
  );

  // Initialize facial landmark detection
  useFacialLandmarkDetection({
    videoElement: videoRef.current,
    canvasElement: canvasRef.current,
    faceLandmarker,
    isModelLoaded,
    isEnabled: detectionEnabled && cameraStatus === "success",
    debugMode,
    onResults: handleResults,
  });

  // Toggle drawing of facial landmarks w/ d, cycle debug modes with b
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "d") {
        const nextMode =
          debugMode === "off"
            ? "points"
            : debugMode === "points"
              ? "lines"
              : debugMode === "lines"
                ? "connectors"
                : "off";
        setDebugMode(nextMode);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [debugMode]);

  // Resize canvas to match video dimensions
  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement) return;

    const resizeCanvas = () => {
      if (videoElement.videoWidth && videoElement.videoHeight) {
        const containerRect = videoElement.getBoundingClientRect();
        const { videoWidth, videoHeight } = videoElement;

        // Calculate how the video fits within its container with object-fit: cover
        const containerAspectRatio =
          containerRect.width / containerRect.height;
        const videoAspectRatio = videoWidth / videoHeight;

        let displayWidth, displayHeight, offsetX, offsetY;

        if (videoAspectRatio > containerAspectRatio) {
          // Video is wider than container - fit to height, crop width
          displayHeight = containerRect.height;
          displayWidth =
            (videoWidth * containerRect.height) / videoHeight;
          offsetX = (displayWidth - containerRect.width) / 2;
          offsetY = 0;
        } else {
          // Video is taller than container - fit to width, crop height
          displayWidth = containerRect.width;
          displayHeight =
            (videoHeight * containerRect.width) / videoWidth;
          offsetX = 0;
          offsetY = (displayHeight - containerRect.height) / 2;
        }

        // Set canvas to match container size
        canvasElement.width = containerRect.width;
        canvasElement.height = containerRect.height;

        // Store the video display properties for use in drawing operations
        canvasElement.dataset.videoDisplayWidth =
          displayWidth.toString();
        canvasElement.dataset.videoDisplayHeight =
          displayHeight.toString();
        canvasElement.dataset.videoOffsetX = (-offsetX).toString();
        canvasElement.dataset.videoOffsetY = (-offsetY).toString();
      }
    };

    // Resize canvas when video loads or window resizes
    videoElement.addEventListener("loadedmetadata", resizeCanvas);
    videoElement.addEventListener("canplay", resizeCanvas);
    window.addEventListener("resize", resizeCanvas);

    // Initial resize if video is already loaded
    if (videoElement.videoWidth && videoElement.videoHeight) {
      resizeCanvas();
    }

    return () => {
      videoElement.removeEventListener(
        "loadedmetadata",
        resizeCanvas,
      );
      videoElement.removeEventListener("canplay", resizeCanvas);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [cameraStatus]);

  // Handle camera ready delay
  useEffect(() => {
    if (cameraStatus === "success") {
      // Reset the delay state when camera becomes ready
      setCameraReadyDelayPassed(false);

      // Set timeout to allow overlay after 300ms
      cameraReadyTimeoutRef.current = setTimeout(() => {
        setCameraReadyDelayPassed(true);
        cameraReadyTimeoutRef.current = null;
      }, CAMERA_READY_DELAY);
    } else {
      // Clear timeout and reset state when camera is not ready
      if (cameraReadyTimeoutRef.current) {
        clearTimeout(cameraReadyTimeoutRef.current);
        cameraReadyTimeoutRef.current = null;
      }
      setCameraReadyDelayPassed(false);
    }
  }, [cameraStatus]);

  // Cleanup face detection timeout on unmount
  useEffect(() => {
    return () => {
      if (faceDetectionTimeoutRef.current) {
        clearTimeout(faceDetectionTimeoutRef.current);
      }
      if (cameraReadyTimeoutRef.current) {
        clearTimeout(cameraReadyTimeoutRef.current);
      }
    };
  }, []);

  const CameraFallback = () => (
    <div className="bg-brand-dark rounded-4xl border-4 border-brand-orange-dark shadow-2xl flex flex-col items-center justify-center text-center p-8 w-full h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)] lg:h-[calc(100vh-6rem)] xl:h-[calc(100vh-10rem)]">
      <i
        className={`fas ${
          cameraStatus === "loading"
            ? "fa-camera-retro"
            : "fa-exclamation-triangle"
        } text-brand-cream text-6xl mb-6`}
      />
      <h1 className="font-display text-brand-cream text-4xl md:text-6xl mb-8">
        {cameraStatus === "loading"
          ? "Getting your close-up ready..."
          : "That's not all folks..."}
      </h1>
      <p className="font-body text-brand-cream text-lg md:text-xl max-w-md leading-relaxed">
        {cameraStatus === "loading"
          ? "Please wait while we access your camera."
          : "Please give your browser permission to use your camera so we can get this party started!"}
      </p>
      {cameraStatus === "error" && (
        <Button
          onClick={requestCameraAccess}
          variant="default"
          size="lg"
          className="mt-6"
        >
          <i className="fas fa-video" />
          Allow Camera Access
        </Button>
      )}
      {modelError && (
        <p className="font-body text-red-400 text-sm mt-4 max-w-md">
          MediaPipe Error: {modelError}
        </p>
      )}
    </div>
  );

  const NoFaceOverlay = () => (
    <div
      className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm rounded-4xl flex flex-col items-center justify-center text-center p-8"
      style={{
        zIndex: 20,
      }}
    >
      <i className="fas fa-face-smile text-brand-cream text-6xl mb-6" />
      <h1 className="font-display text-brand-cream text-3xl md:text-5xl mb-6">
        Where'd you go, gorgeous?
      </h1>
      <p className="font-body text-brand-cream text-lg md:text-xl max-w-md leading-relaxed">
        I can't see your beautiful face! Don't be shy, make sure
        you're centered in the frame and well-lit.
      </p>
    </div>
  );

  return (
    <div className="bg-background min-h-screen texture-bg p-4 sm:p-6 md:p-8 lg:p-12 xl:p-20">
      <div className="relative overflow-visible">
        {cameraStatus === "success" && (
          <>
            <div className="cute-tag scale-75 sm:scale-100 origin-top-right">
              <div className="cute-tag-hello">
                <svg viewBox="0 0 120 20">
                  <defs>
                    <path
                      id="curve"
                      d={`M 10 25 Q 60 5 110 25`}
                      fill="none"
                    />
                  </defs>
                  <text>
                    <textPath
                      href="#curve"
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      Hello
                    </textPath>
                  </text>
                </svg>
              </div>
              <span className="cute-tag-gorgeous">Gorgeous!</span>
            </div>

            <div className="button-controls top-1/2 -translate-y-1/2">
              <Dialog onOpenChange={setIsMuted}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <i className="far fa-question" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Eye Beat You! - The Art of Making Faces
                    </DialogTitle>
                    <DialogDescription>
                      A Comprehensive Guide to Looking Ridiculous on
                      Camera
                    </DialogDescription>
                  </DialogHeader>
                  <div className="help-content">
                    <p className="help-section">
                      <strong>What is this?</strong> A completely
                      over-engineered application to make delightfully
                      obnoxious sounds in the most roundabout way
                      possible.
                    </p>
                    <p className="help-section">
                      <strong>How do I use it?</strong> Blink and open
                      your mouth! Make funny faces! See what happens.
                    </p>
                    <p className="help-section">
                      <strong>Pro Tip:</strong> Make sure your face is
                      visible, well-lit, and not covered by your hair
                      or glasses.
                    </p>
                    <p className="help-section">
                      <strong>Who made this?</strong>{" "}
                      <a
                        className="underline"
                        href="https://github.com/logandarby"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        I did.
                      </a>
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="icon"
                className={isMuted ? "muted-button" : ""}
                onClick={() => setIsMuted(!isMuted)}
              >
                <i
                  className={`fas ${
                    isMuted ? "fa-volume-xmark" : "fa-volume-high"
                  }`}
                />
              </Button>
            </div>

            <div className="warning-notice sticker-shine scale-75 sm:scale-100 origin-bottom-left">
              <div className="warning-notice-inner">
                <div className="warning-notice-title">WARNING:</div>
                <div className="warning-notice-text">
                  Objects in mirror are more handsome than they
                  appear.
                </div>
              </div>
            </div>

            <div className="circle-sticker sticker-shine scale-75 sm:scale-100 origin-left -translate-x-8 sm:translate-x-6">
              <svg viewBox="0 0 120 120">
                <defs>
                  <path
                    id="circle"
                    d="M 60,60 m -45,0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0"
                    fill="none"
                  />
                </defs>
                <text>
                  <textPath href="#circle" startOffset="11%">
                    My head is shaped like an egg.
                  </textPath>
                </text>
                <g transform="translate(40, 85) scale(0.007, 0.007) translate(-640, -350) rotate(-90)">
                  <path
                    d="M3170 6659 c-585 -60 -1143 -473 -1582 -1172 -100 -160 -274 -504 -341 -677 -395 -1013 -421 -2054 -70 -2860 217 -501 537 -871 975 -1131 239 -142 477 -229 767 -280 145 -26 451 -36 604 -20 917 93 1661 711 1976 1639 70 204 117 420 146 667 23 189 23 566 1 778 -55 522 -198 1032 -419 1491 -190 394 -392 689 -656 960 -363 371 -735 566 -1158 606 -119 11 -122 11 -243 -1z"
                    fill="var(--color-brand-cream)"
                    stroke="var(--color-brand-dark)"
                    strokeWidth="80"
                  />
                </g>
              </svg>
            </div>

            <div className="encouragement-badge scale-75 sm:scale-100 origin-top-left">
              <div className="encouragement-text-bg"></div>
              <div className="encouragement-orange"></div>
              <svg viewBox="0 0 180 180">
                <defs>
                  <path
                    id="encouragement-circle"
                    d="M 90,90 m -58,0 a 58,58 0 1,1 116,0 a 58,58 0 1,1 -116,0"
                    fill="none"
                  />
                </defs>
                <text>
                  <textPath
                    href="#encouragement-circle"
                    startOffset="0%"
                  >
                    You're doing amazing sweetie
                  </textPath>
                </text>
                <g transform="rotate(126 90 90)">
                  <g transform="translate(98, 20) scale(0.055, 0.055)">
                    <path
                      d="M6.839,137.02l46.417,47.774l-8.028,68.045l-0.045,0.619c-0.33,8.836,2.138,16.25,7.129,21.429c7.104,7.374,18.707,8.866,30.214,3.677l61.621-33.545l61.099,33.281l0.518,0.264c4.637,2.087,9.201,3.148,13.579,3.148c6.484,0,12.39-2.428,16.63-6.825c4.991-5.179,7.46-12.593,7.13-21.429l-8.079-68.664l45.793-47.05l0.624-0.724c6.398-8.417,8.415-18.073,5.535-26.482c-2.884-8.409-10.395-14.8-20.611-17.524l-68.781-11.09l-29.99-60.339l-0.452-0.792c-5.916-9.052-14.594-14.247-23.811-14.247c-8.861,0-17.113,4.634-23.247,13.035l-35.47,62.327L22.495,92.344l-0.853,0.193c-10.141,2.895-17.575,9.422-20.398,17.912C-1.58,118.935,0.456,128.624,6.839,137.02z"
                      fill="var(--color-brand-cream)"
                    />
                  </g>
                </g>
              </svg>
            </div>

            <img
              src="/eye-beat-you/star.svg"
              alt="Star sticker"
              className="star-sticker sticker-shine scale-75 sm:scale-100 origin-bottom-right"
            />
          </>
        )}
        <div
          className={`relative rounded-4xl border-4 border-brand-orange-dark shadow-2xl drop-shadow-2xl overflow-hidden w-full h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)] lg:h-[calc(100vh-6rem)] xl:h-[calc(100vh-10rem)] ${
            cameraStatus === "success" ? "block" : "hidden"
          }`}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full bg-card object-cover backdrop-blur-sm"
            style={{
              transform: "scaleX(-1)",
            }}
          />

          {/* Facial landmarks canvas overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              transform: "scaleX(-1)",
              zIndex: 10,
            }}
          />

          {/* Muted text overlay */}
          {isMuted && (
            <div className="muted-overlay">
              <span>Muted</span>
            </div>
          )}

          {/* No face detected overlay */}
          {cameraStatus === "success" &&
            !faceDetected &&
            cameraReadyDelayPassed && <NoFaceOverlay />}

          {/* Vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.6) 100%)",
              zIndex: 5,
            }}
          />
        </div>
      </div>

      <AnimationOverlay
        enabled={faceDetected && cameraStatus === "success"}
        animatedLines={animatedLines}
        stars={stars}
      />

      {/* Show fallback when camera is not ready */}
      {cameraStatus !== "success" && <CameraFallback />}

      {/* Performance metrics overlay */}
      <PerformanceViewer
        metricsGroups={performanceMetricsGroups}
        isVisible={isPerformanceVisible && cameraStatus === "success"}
      />

      {/* Footer */}
      <footer className="footer-credits">
        <a
          href="https://github.com/logandarby"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          Built with ❤️ by Logan Darby
        </a>
      </footer>
    </div>
  );
}

export default GameComponent;
