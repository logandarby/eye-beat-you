import { useEffect, useRef, useState } from "react";

const CANVAS_PADDING_PX = 80;

type LegacyHTMLVideoElement =
  | Omit<HTMLVideoElement, "srcObject">
  | Omit<HTMLVideoElement, "src">;

function GameComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStatus, setCameraStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) return;

    const setupWebcam = async () => {
      try {
        // Request access to webcam
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
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
          video.src = URL.createObjectURL(mediaStream as unknown as Blob);
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
  }, []); // videoRef.current changes don't trigger re-renders, so we don't need it as dependency

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
    </div>
  );

  return (
    <div
      className="bg-background min-h-screen texture-bg"
      style={{ padding: `${CANVAS_PADDING_PX}px` }}
    >
      {/* Always render video element but control visibility */}
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
        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.6) 100%)",
          }}
        />
      </div>

      {/* Show fallback when camera is not ready */}
      {cameraStatus !== "success" && <CameraFallback />}
    </div>
  );
}

export default GameComponent;
