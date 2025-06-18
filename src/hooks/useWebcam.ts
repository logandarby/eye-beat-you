import { useEffect, useState, useCallback } from "react";

type LegacyHTMLVideoElement =
  | Omit<HTMLVideoElement, "srcObject">
  | Omit<HTMLVideoElement, "src">;

interface UseWebcamProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

interface UseWebcamReturn {
  cameraStatus: "loading" | "success" | "error";
  requestCameraAccess: () => Promise<void>;
}

export function useWebcam({
  videoRef,
}: UseWebcamProps): UseWebcamReturn {
  const [cameraStatus, setCameraStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  // Function to request webcam access
  const requestCameraAccess = useCallback(async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    try {
      // Request access to webcam with mobile-optimized constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Prefer front-facing camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      setCameraStatus("loading");

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
      console.error(
        "Error accessing webcam with specific constraints:",
        error,
      );

      // Fallback: Try with simpler constraints
      try {
        console.log("Trying fallback camera constraints...");
        const fallbackStream =
          await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
          });

        const video = videoElement as LegacyHTMLVideoElement;

        // Set up event listeners
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
          video.srcObject = fallbackStream;
        } else {
          video.src = URL.createObjectURL(
            fallbackStream as unknown as Blob,
          );
        }
        console.log(
          "Successfully set up webcam with fallback constraints",
        );
      } catch (fallbackError) {
        console.error(
          "Error accessing webcam with fallback constraints:",
          fallbackError,
        );
        setCameraStatus("error");
      }
    }
  }, [videoRef]);

  // Get webcam access and handle cleanup
  useEffect(() => {
    const videoElement = videoRef.current;
    requestCameraAccess();

    // Cleanup function using captured video element
    return () => {
      if (!videoElement) return;

      const video = videoElement as unknown as LegacyHTMLVideoElement;

      if ("srcObject" in video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      } else if ("src" in video && video.src) {
        // Clean up object URL for older browsers
        URL.revokeObjectURL(video.src);
      }
    };
  }, [requestCameraAccess, videoRef]);

  return {
    cameraStatus,
    requestCameraAccess,
  };
}
