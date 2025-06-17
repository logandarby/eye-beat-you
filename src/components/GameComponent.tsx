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

const CANVAS_PADDING_X = 80 * 2;
const CANVAS_PADDING_Y = 80;

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
      // TODO: Fix this
      if (videoElement.videoWidth && videoElement.videoHeight) {
        const videoRect = videoElement.getBoundingClientRect();
        canvasElement.width = videoRect.width;
        canvasElement.height = videoRect.height;
        videoElement.width = videoRect.width;
        videoElement.height = videoRect.height;

        // canvasElement.style.width = `${videoRect.width}px`;
        // canvasElement.style.height = `${videoRect.height}px`;
        // videoElement.style.width = `${videoRect.width}px`;
        // videoElement.style.height = `${videoRect.height}px`;

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
        width: `calc(100vw - ${CANVAS_PADDING_X * 2}px)`,
        height: `calc(100vh - ${CANVAS_PADDING_Y * 2}px)`,
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
      style={{
        padding: `${CANVAS_PADDING_Y}px ${CANVAS_PADDING_X}px`,
      }}
    >
      <div className="relative overflow-visible">
        {cameraStatus === "success" && (
          <>
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

            <div className="warning-notice">
              <div className="warning-notice-inner">
                <div className="warning-notice-title">WARNING:</div>
                <div className="warning-notice-text">
                  Objects in mirror are stupider than they appear.
                </div>
              </div>
            </div>

            <div className="circle-sticker">
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

            <div className="encouragement-badge">
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
          </>
        )}
        <div
          className={`relative rounded-4xl border-4 border-brand-orange-dark shadow-2xl drop-shadow-2xl overflow-hidden ${
            cameraStatus === "success" ? "block" : "hidden"
          }`}
          style={{
            width: `calc(100vw - ${CANVAS_PADDING_X * 2}px)`,
            height: `calc(100vh - ${CANVAS_PADDING_Y * 2}px)`,
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
