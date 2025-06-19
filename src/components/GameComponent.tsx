import "./GameComponent.css";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  useFaceLandmarker,
  useFacialLandmarkDetection,
  FaceAnalyzer,
} from "@/lib/face-detection";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import {
  BLINK_AUDIO,
  CAMERA_READY_DELAY,
  FACE_DETECTION_DELAY,
  MOUTH_OPEN_AUDIO,
  TIMPANI_HI_AUDIO,
  TIMPANI_LO_AUDIO,
} from "@/core/constants";
import { Button } from "@/lib/ui/components/button";
import {
  PerformanceViewer,
  usePerformanceToggle,
  useFaceDetectionPerformance,
  createFaceDetectionMetrics,
} from "@/lib/performance";
import "@fortawesome/fontawesome-free/css/all.min.css";
import AnimationOverlay from "./AnimationOverlay/AnimationOverlay";
import FunnyStickers from "./FunnyStickers/FunnyStickers";
import SideBar from "./SideBar/SideBar";
import useAnimationOverlay from "@/hooks/useAnimationOverlay";
import { useWebcam } from "@/hooks/useWebcam";
import { calculateObjectCoverDisplayProperties } from "@/utils/object-cover";
import { debounce } from "@/utils/debounce";

function GameComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize webcam access
  const { cameraStatus, requestCameraAccess } = useWebcam({
    videoRef,
  });
  const detectionEnabled = true;
  const [debugMode, setDebugMode] = useState<
    "off" | "points" | "lines" | "connectors" | "mouth"
  >("off");
  const [isMuteButtonToggled, setIsMuteButtonToggled] =
    useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const isMutedRef = useRef(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const faceDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [cameraReadyDelayPassed, setCameraReadyDelayPassed] =
    useState(false);
  const cameraReadyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    isMutedRef.current = isMuteButtonToggled || isHelpOpen;
  }, [isMuteButtonToggled, isHelpOpen]);

  const {
    pushLandmarkInformation,
    spawnEyeLines,
    spawnMouthLines,
    animatedLines,
    stars,
  } = useAnimationOverlay();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const playDebouncedAudio = useCallback(
    debounce(
      () => {
        BLINK_AUDIO.currentTime = 0;
        BLINK_AUDIO.volume = 0.35;
        BLINK_AUDIO.play();
      },
      16,
      true,
    ),
    [],
  );

  // Callback to handle face events (on open or close)
  const handleFaceEvent = useCallback(
    (
      bodyPart: "leftEye" | "rightEye" | "mouth" | "head",
      event: "open" | "close" | "left" | "right" | "up" | "down",
    ) => {
      if (isMutedRef.current) return;

      if (bodyPart === "head") {
        if (event === "left") {
          TIMPANI_HI_AUDIO.currentTime = 0;
          TIMPANI_HI_AUDIO.play();
        } else if (event === "right") {
          TIMPANI_LO_AUDIO.currentTime = 0;
          TIMPANI_LO_AUDIO.play();
        } else if (event === "up" || event === "down") {
          // Log head pitch events to the console
          console.log(`Head pitch detected: ${event}`);
        }
        return;
      }

      if (bodyPart === "leftEye" || bodyPart === "rightEye") {
        if (event === "close") {
          playDebouncedAudio();

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
          spawnMouthLines("left");
          spawnMouthLines("right");
        }
      }
    },
    [spawnEyeLines, playDebouncedAudio, spawnMouthLines],
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
      pushLandmarkInformation(
        results.faceLandmarks[0]!,
        videoElement,
      );
    },
    [pushLandmarkInformation],
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
                : debugMode === "connectors"
                  ? "mouth"
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
        const { displayWidth, displayHeight, offsetX, offsetY } =
          calculateObjectCoverDisplayProperties(videoElement);

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
            <FunnyStickers />
            <SideBar
              isMuted={isMuteButtonToggled}
              onMuteChange={setIsMuteButtonToggled}
              onOpenChange={setIsHelpOpen}
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
          {isMuteButtonToggled && (
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
