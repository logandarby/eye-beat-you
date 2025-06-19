import "./AnimationOverlay.css";
import {
  BLINK_LINE_DURATION_MS,
  BLINK_LINE_HEIGHT,
  BLINK_LINE_WIDTH,
  type AnimatedLine,
  type Star,
} from "./AnimationOverlay.utils";

interface AnimationOverlayProps {
  enabled: boolean;
  animatedLines: AnimatedLine[];
  stars: Star[];
}

function AnimationOverlay({
  enabled,
  animatedLines,
  stars,
}: AnimationOverlayProps) {
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

      {/* Fixed stars that track eye corners */}
      {enabled &&
        stars.map((star) => (
          <div
            key={star.id}
            style={{
              position: "fixed",
              left: star.position.x - 10, // Center the star
              top: star.position.y - 10,
              width: "20px",
              height: "20px",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <img
              src="/eye-beat-you/star.svg"
              alt={`${star.side} eye star`}
              width="20"
              height="20"
            />
          </div>
        ))}
    </>
  );
}

export default AnimationOverlay;
