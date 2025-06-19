import { useEffect, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

interface UseFaceLandmarkerReturn {
  faceLandmarker: FaceLandmarker | null;
  isLoaded: boolean;
  error: string | null;
}

export function useFaceLandmarker(): UseFaceLandmarkerReturn {
  const [faceLandmarker, setFaceLandmarker] =
    useState<FaceLandmarker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeFaceLandmarker = async () => {
      try {
        console.log("Initializing MediaPipe FaceLandmarker...");

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "/eye-beat-you/wasm",
        );

        const landmarker = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath: "/eye-beat-you/face_landmarker.task",
              delegate: "GPU",
            },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO",
            numFaces: 1,
          },
        );

        if (isMounted) {
          setFaceLandmarker(landmarker);
          setIsLoaded(true);
          console.log(
            "MediaPipe FaceLandmarker initialized successfully",
          );
        }
      } catch (err) {
        console.error("Error initializing FaceLandmarker:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize FaceLandmarker",
          );
        }
      }
    };

    initializeFaceLandmarker();

    return () => {
      isMounted = false;
      // Note: MediaPipe FaceLandmarker doesn't have a cleanup method in the current version
    };
  }, []);

  return {
    faceLandmarker,
    isLoaded,
    error,
  };
}
