import "./GameComponent.css";

import { useEffect, useRef, useState, useCallback } from "react";
import { useFaceLandmarker } from "../hooks/useFaceLandmarker";
import { useFacialLandmarkDetection } from "../hooks/useFacialLandmarkDetection";
import { FaceAnalyzer } from "../lib/faceAnalyzer";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import {
  BLINK_AUDIO_FILE,
  MOUTH_OPEN_AUDIO_FILE,
} from "@/lib/constants";

const CANVAS_PADDING_PX = 80;

type LegacyHTMLVideoElement =
  | Omit<HTMLVideoElement, "srcObject">
  | Omit<HTMLVideoElement, "src">;

function GameComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStatus, setCameraStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const detectionEnabled = true;
  const [debugMode, setDebugMode] = useState<
    "off" | "points" | "lines" | "connectors"
  >("off");

  // Initialize MediaPipe FaceLandmarker
  const {
    faceLandmarker,
    isLoaded: isModelLoaded,
    error: modelError,
  } = useFaceLandmarker();

  // Callback to handle face events (on open or close)
  const handleFaceEvent = useCallback(
    (
      bodyPart: "leftEye" | "rightEye" | "mouth",
      event: "open" | "close",
    ) => {
      if (bodyPart === "leftEye" || bodyPart === "rightEye") {
        if (event === "close") {
          const blinkAudio = new Audio(BLINK_AUDIO_FILE);
          blinkAudio.volume = 0.35;
          blinkAudio.play();
        }
      }
      if (bodyPart === "mouth") {
        if (event === "open") {
          const mouthOpenAudio = new Audio(MOUTH_OPEN_AUDIO_FILE);
          mouthOpenAudio.play();
        }
      }
    },
    [],
  );

  const faceAnalyzerRef = useRef<FaceAnalyzer>(
    new FaceAnalyzer(handleFaceEvent),
  );

  // Callback to analyze face landmarks for blinks and mouth movements
  const handleResults = useCallback(
    (results: FaceLandmarkerResult) => {
      faceAnalyzerRef.current.analyzeFace(results);
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

  // Get webcam access
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const setupWebcam = async () => {
      try {
        // Request access to webcam
        const mediaStream = await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: false,
          },
        );
        // Set video source with fallback for older browsers
        const video = videoElement as LegacyHTMLVideoElement;

        // Set up event listeners before setting source
        const handleCanPlay = () => {
          setCameraStatus("success");
          videoElement.removeEventListener("canplay", handleCanPlay);
        };

        const handleError = () => {
          console.error("Video playback error");
          setCameraStatus("error");
          videoElement.removeEventListener("error", handleError);
        };

        videoElement.addEventListener("canplay", handleCanPlay);
        videoElement.addEventListener("error", handleError);

        if ("srcObject" in video) {
          video.srcObject = mediaStream;
        } else {
          video.src = URL.createObjectURL(
            mediaStream as unknown as Blob,
          );
        }
        console.log("Successfully set up webcam");
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setCameraStatus("error");
      }
    };
    setupWebcam();
    // Cleanup function using captured video element
    return () => {
      const video = videoElement as unknown as LegacyHTMLVideoElement;

      if ("srcObject" in video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      } else if ("src" in video && video.src) {
        // Clean up object URL for older browsers
        URL.revokeObjectURL(video.src);
      }
    };
  }, []);

  // Resize canvas to match video dimensions
  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement) return;

    const resizeCanvas = () => {
      // Use video's actual video dimensions, not the display size
      if (videoElement.videoWidth && videoElement.videoHeight) {
        const videoRect = videoElement.getBoundingClientRect();
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        canvasElement.style.width = `${videoRect.width}px`;
        canvasElement.style.height = `${videoRect.height}px`;
        console.log(
          `Canvas resized to: ${canvasElement.width}x${canvasElement.height} (display: ${videoRect.width}x${videoRect.height})`,
        );
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

  const CameraFallback = () => (
    <div
      className="bg-brand-dark rounded-4xl border-4 border-brand-orange-dark shadow-2xl flex flex-col items-center justify-center text-center p-8"
      style={{
        width: `calc(100vw - ${CANVAS_PADDING_PX * 2}px)`,
        height: `calc(100vh - ${CANVAS_PADDING_PX * 2}px)`,
      }}
    >
      <h1 className="font-display text-brand-cream text-4xl md:text-6xl mb-8">
        {cameraStatus === "loading"
          ? "Getting your close-up ready..."
          : "That's not all folks..."}
      </h1>
      <p className="font-body text-brand-cream text-lg md:text-xl max-w-md leading-relaxed">
        {cameraStatus === "loading"
          ? "Please wait while we access your camera."
          : "Please give your browser permission to use your camera and refresh the page so we can get this party started!"}
      </p>
      {modelError && (
        <p className="font-body text-red-400 text-sm mt-4 max-w-md">
          MediaPipe Error: {modelError}
        </p>
      )}
    </div>
  );

  return (
    <div
      className="bg-background min-h-screen texture-bg"
      style={{ padding: `${CANVAS_PADDING_PX}px` }}
    >
      <div className="relative overflow-visible">
        {cameraStatus === "success" && (
          <div className="cute-tag">
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
        )}
        <div
          className={`relative rounded-4xl border-4 border-brand-orange-dark shadow-2xl drop-shadow-2xl overflow-hidden ${
            cameraStatus === "success" ? "block" : "hidden"
          }`}
          style={{
            width: `calc(100vw - ${CANVAS_PADDING_PX * 2}px)`,
            height: `calc(100vh - ${CANVAS_PADDING_PX * 2}px)`,
          }}
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

      {/* Show fallback when camera is not ready */}
      {cameraStatus !== "success" && <CameraFallback />}
    </div>
  );
}

export default GameComponent;
