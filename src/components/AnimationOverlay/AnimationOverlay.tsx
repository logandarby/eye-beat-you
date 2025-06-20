import "./AnimationOverlay.css";
import {
  BLINK_LINE_DURATION_MS,
  BLINK_LINE_HEIGHT,
  BLINK_LINE_WIDTH,
  type AnimatedLine,
  type Star,
} from "./AnimationOverlay.utils";
import {
  MOUTH_ASPECT_RATIO_THRESHOLD,
  HTR_THRESHOLD,
  HPR_THRESHOLD,
  STAR_BASE_SIZE,
  STAR_MAR_SCALE_SENSITIVITY,
  GLOW_EDGE_RATIO,
  GLOW_OPACITY_EXTRA_RANGE,
  STAR_PULSATE_AMPLITUDE,
  INDEPENDENT_GLOW_OPACITY_MULTIPLIER,
  STAR_MAR_MAX_SCALE,
} from "@/core/constants";
import { useEffect } from "react";

type FaceMetrics = {
  leftEAR: number;
  rightEAR: number;
  mouthMAR: number;
  htr: number;
  hpr: number;
};

interface AnimationOverlayProps {
  enabled: boolean;
  animatedLines: AnimatedLine[];
  stars: Star[];
  containerRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null;
  faceMetrics: FaceMetrics;
  ignoreThresholds?: boolean;
}

function AnimationOverlay({
  enabled,
  animatedLines,
  stars,
  containerRect,
  faceMetrics,
  ignoreThresholds = false,
}: AnimationOverlayProps) {
  // Setup CSS vars for pulsation amplitude once
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--star-pulsate-scale-shrink",
      `${1 - STAR_PULSATE_AMPLITUDE}`,
    );
    root.style.setProperty(
      "--star-pulsate-scale-grow",
      `${1 + STAR_PULSATE_AMPLITUDE}`,
    );
  }, []);

  // ------------------------
  // Calculate dynamic visuals
  // ------------------------
  const marScaleFactor = (() => {
    if (ignoreThresholds) {
      return (
        1 +
        Math.min(
          faceMetrics.mouthMAR * STAR_MAR_SCALE_SENSITIVITY,
          STAR_MAR_MAX_SCALE,
        )
      );
    }
    const marDelta = Math.max(
      0,
      faceMetrics.mouthMAR - MOUTH_ASPECT_RATIO_THRESHOLD,
    );
    return 1 + Math.min(marDelta * STAR_MAR_SCALE_SENSITIVITY, 1);
  })();

  const calcOpacity = (value: number, threshold: number) => {
    const abs = Math.abs(value);
    if (ignoreThresholds) {
      return Math.min(abs * INDEPENDENT_GLOW_OPACITY_MULTIPLIER, 1);
    }
    if (abs < threshold) return 0;
    return Math.min(
      (abs - threshold) / (threshold * GLOW_OPACITY_EXTRA_RANGE),
      1,
    );
  };

  const leftGlowOpacity =
    faceMetrics.htr > 0
      ? calcOpacity(faceMetrics.htr, HTR_THRESHOLD)
      : 0;
  const rightGlowOpacity =
    faceMetrics.htr < 0
      ? calcOpacity(faceMetrics.htr, HTR_THRESHOLD)
      : 0;
  const topGlowOpacity =
    faceMetrics.hpr > 0
      ? calcOpacity(faceMetrics.hpr, HPR_THRESHOLD)
      : 0;
  const bottomGlowOpacity =
    faceMetrics.hpr < 0
      ? calcOpacity(faceMetrics.hpr, HPR_THRESHOLD)
      : 0;

  return (
    <>
      {enabled &&
        animatedLines.map((line) => (
          <div
            key={line.id}
            className="blink-line-container"
            style={{
              transform: `rotate(${line.angle}deg)`,
              left: line.position.x - 1, // Center the 2px line
              top: line.position.y - BLINK_LINE_HEIGHT,
              width: `${BLINK_LINE_WIDTH}px`,
              height: `${BLINK_LINE_HEIGHT}px`,
            }}
          >
            <div
              key={line.id}
              className="blink-line"
              style={{
                height: "100%",
                animation: `blink-line-animation ${BLINK_LINE_DURATION_MS}ms linear`,
              }}
            />
          </div>
        ))}

      {/* Stars that track eyes and mouth */}
      {enabled &&
        stars.map((star) => {
          const baseSize = STAR_BASE_SIZE;
          const size =
            star.side === "leftMouth" || star.side === "rightMouth"
              ? baseSize * marScaleFactor
              : baseSize;
          return (
            <div
              key={star.id}
              style={{
                position: "fixed",
                left: star.position.x - size / 2,
                top: star.position.y - size / 2,
                width: `${size}px`,
                height: `${size}px`,
                pointerEvents: "none",
                zIndex: 10,
                opacity: 0.8,
                filter: "blur(0.6px)",
              }}
            >
              <img
                className="pulsate-star"
                src="/eye-beat-you/star.svg"
                alt={`${star.side} star`}
                width={size}
                height={size}
              />
            </div>
          );
        })}

      {/* Cream edge glows indicating head orientation */}
      {enabled && containerRect && (
        <>
          {/* Left glow */}
          <div
            className="edge-glow rounded-l-4xl"
            style={{
              top: containerRect.top,
              left: containerRect.left,
              opacity: leftGlowOpacity,
              width: `${containerRect.width * GLOW_EDGE_RATIO}px`,
              height: `${containerRect.height}px`,
              background:
                "linear-gradient(to right, var(--color-brand-cream, #FFF9E6) 0%, rgba(255,249,230,0) 100%)",
            }}
          />
          {/* Right glow */}
          <div
            className="edge-glow rounded-r-4xl"
            style={{
              opacity: rightGlowOpacity,
              left:
                containerRect.left +
                containerRect.width -
                containerRect.width * GLOW_EDGE_RATIO,
              top: containerRect.top,
              width: `${containerRect.width * GLOW_EDGE_RATIO}px`,
              height: `${containerRect.height}px`,
              background:
                "linear-gradient(to left, var(--color-brand-cream, #FFF9E6) 0%, rgba(255,249,230,0) 100%)",
            }}
          />
          {/* Top glow */}
          <div
            className="edge-glow rounded-t-4xl"
            style={{
              opacity: topGlowOpacity,
              top: containerRect.top,
              left: containerRect.left,
              width: `${containerRect.width}px`,
              height: `${containerRect.height * GLOW_EDGE_RATIO}px`,
              background:
                "linear-gradient(to bottom, var(--color-brand-cream, #FFF9E6) 0%, rgba(255,249,230,0) 100%)",
            }}
          />
          {/* Bottom glow */}
          <div
            className="edge-glow rounded-b-4xl"
            style={{
              opacity: bottomGlowOpacity,
              top:
                containerRect.top +
                containerRect.height -
                containerRect.height * GLOW_EDGE_RATIO,
              left: containerRect.left,
              width: `${containerRect.width}px`,
              height: `${containerRect.height * GLOW_EDGE_RATIO}px`,
              background:
                "linear-gradient(to top, var(--color-brand-cream, #FFF9E6) 0%, rgba(255,249,230,0) 100%)",
            }}
          />
        </>
      )}
    </>
  );
}

export default AnimationOverlay;
