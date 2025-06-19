import {
  LEFT_MOUTH_RADIAL_POINTS,
  RIGHT_MOUTH_RADIAL_POINTS,
} from "@/core/constants";

export interface DrawDebugPointsProps {
  landmarks: Array<{ x: number; y: number; z?: number }>;
  landmarkIndices: number[];
  canvasCtx: CanvasRenderingContext2D;
  label: string;
}

export interface DrawCalculationLinesProps {
  landmarks: Array<{ x: number; y: number; z?: number }>;
  landmarkIndices: number[];
  canvasCtx: CanvasRenderingContext2D;
  label: string;
  calculationType: "EAR" | "MAR";
}

export function drawDebugPointsOntoCanvas({
  landmarks,
  landmarkIndices,
  canvasCtx,
  label,
}: DrawDebugPointsProps) {
  landmarkIndices.forEach((landmarkIndex, pointIndex) => {
    const landmark = landmarks[landmarkIndex];
    if (!landmark) return;

    // Get video display properties from canvas dataset
    const displayWidth = parseFloat(
      canvasCtx.canvas.dataset.videoDisplayWidth ||
        canvasCtx.canvas.width.toString(),
    );
    const displayHeight = parseFloat(
      canvasCtx.canvas.dataset.videoDisplayHeight ||
        canvasCtx.canvas.height.toString(),
    );
    const offsetX = parseFloat(
      canvasCtx.canvas.dataset.videoOffsetX || "0",
    );
    const offsetY = parseFloat(
      canvasCtx.canvas.dataset.videoOffsetY || "0",
    );

    // Transform coordinates to match video display area
    const x = landmark.x * displayWidth + offsetX;
    const y = landmark.y * displayHeight + offsetY;

    // Draw larger circle for the point
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 3, 0, 2 * Math.PI);
    canvasCtx.fillStyle = "#00FF00"; // Bright green
    canvasCtx.fill();
    canvasCtx.strokeStyle = "#000000"; // Black border
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();

    // Draw landmark index label
    canvasCtx.font = "bold 14px Arial";
    canvasCtx.fillStyle = "#FFFFFF"; // White text
    canvasCtx.strokeStyle = "#000000"; // Black outline
    canvasCtx.lineWidth = 3;

    const indexText = `${landmarkIndex}`;
    const pointText = `${label} ${pointIndex + 1}`;

    // Draw text with outline for better visibility
    canvasCtx.strokeText(indexText, x + 12, y - 5);
    canvasCtx.fillText(indexText, x + 12, y - 5);

    canvasCtx.strokeText(pointText, x + 12, y + 15);
    canvasCtx.fillText(pointText, x + 12, y + 15);
  });
}

export function drawCalculationLines({
  landmarks,
  landmarkIndices,
  canvasCtx,
  label,
  calculationType,
}: DrawCalculationLinesProps) {
  if (calculationType === "EAR" && landmarkIndices.length >= 6) {
    // EAR calculation lines
    // Get the 6 points: [left_corner, top_outer, top_inner, right_corner, bottom_inner, bottom_outer]

    // Get video display properties from canvas dataset
    const displayWidth = parseFloat(
      canvasCtx.canvas.dataset.videoDisplayWidth ||
        canvasCtx.canvas.width.toString(),
    );
    const displayHeight = parseFloat(
      canvasCtx.canvas.dataset.videoDisplayHeight ||
        canvasCtx.canvas.height.toString(),
    );
    const offsetX = parseFloat(
      canvasCtx.canvas.dataset.videoOffsetX || "0",
    );
    const offsetY = parseFloat(
      canvasCtx.canvas.dataset.videoOffsetY || "0",
    );

    const points = landmarkIndices.map((index) => {
      const landmark = landmarks[index];
      return {
        x: landmark.x * displayWidth + offsetX,
        y: landmark.y * displayHeight + offsetY,
      };
    });

    const [p1, p2, p3, p4, p5, p6] = points;

    // Draw horizontal line (p1 to p4) - denominator
    canvasCtx.beginPath();
    canvasCtx.moveTo(p1.x, p1.y);
    canvasCtx.lineTo(p4.x, p4.y);
    canvasCtx.strokeStyle = "#FF0000"; // Red for horizontal (denominator)
    canvasCtx.lineWidth = 3;
    canvasCtx.stroke();

    // Draw first vertical line (p2 to p6) - numerator part 1
    canvasCtx.beginPath();
    canvasCtx.moveTo(p2.x, p2.y);
    canvasCtx.lineTo(p6.x, p6.y);
    canvasCtx.strokeStyle = "#00FFFF"; // Cyan for vertical 1
    canvasCtx.lineWidth = 3;
    canvasCtx.stroke();

    // Draw second vertical line (p3 to p5) - numerator part 2
    canvasCtx.beginPath();
    canvasCtx.moveTo(p3.x, p3.y);
    canvasCtx.lineTo(p5.x, p5.y);
    canvasCtx.strokeStyle = "#FFFF00"; // Yellow for vertical 2
    canvasCtx.lineWidth = 3;
    canvasCtx.stroke();

    // Add legend
    canvasCtx.font = "bold 12px Arial";
    canvasCtx.fillStyle = "#FFFFFF";
    canvasCtx.strokeStyle = "#000000";
    canvasCtx.lineWidth = 2;

    const legendY =
      80 + (label === "L" ? 0 : label === "R" ? 60 : 120);
    canvasCtx.strokeText(
      `${label} EAR = (cyan + yellow) / (2 * red)`,
      20,
      legendY,
    );
    canvasCtx.fillText(
      `${label} EAR = (cyan + yellow) / (2 * red)`,
      20,
      legendY,
    );
  } else if (
    calculationType === "MAR" &&
    landmarkIndices.length >= 8
  ) {
    // MAR calculation lines
    // Get the 8 points: [left_corner, right_corner, top_outer, bottom_outer, top_middle, bottom_middle, bottom_inner, top_inner]

    // Get video display properties from canvas dataset
    const displayWidth = parseFloat(
      canvasCtx.canvas.dataset.videoDisplayWidth ||
        canvasCtx.canvas.width.toString(),
    );
    const displayHeight = parseFloat(
      canvasCtx.canvas.dataset.videoDisplayHeight ||
        canvasCtx.canvas.height.toString(),
    );
    const offsetX = parseFloat(
      canvasCtx.canvas.dataset.videoOffsetX || "0",
    );
    const offsetY = parseFloat(
      canvasCtx.canvas.dataset.videoOffsetY || "0",
    );

    const points = landmarkIndices.map((index) => {
      const landmark = landmarks[index];
      return {
        x: landmark.x * displayWidth + offsetX,
        y: landmark.y * displayHeight + offsetY,
      };
    });

    const [p1, p2, p3, p4, p5, p6, p7, p8] = points;

    // Draw horizontal line (p1 to p2) - denominator (mouth width)
    canvasCtx.beginPath();
    canvasCtx.moveTo(p1.x, p1.y);
    canvasCtx.lineTo(p2.x, p2.y);
    canvasCtx.strokeStyle = "#FF0000"; // Red for horizontal (denominator)
    canvasCtx.lineWidth = 3;
    canvasCtx.stroke();

    // Draw first vertical line (p3 to p4) - numerator part 1
    canvasCtx.beginPath();
    canvasCtx.moveTo(p3.x, p3.y);
    canvasCtx.lineTo(p4.x, p4.y);
    canvasCtx.strokeStyle = "#00FFFF"; // Cyan for vertical 1
    canvasCtx.lineWidth = 3;
    canvasCtx.stroke();

    // Draw second vertical line (p5 to p6) - numerator part 2
    canvasCtx.beginPath();
    canvasCtx.moveTo(p5.x, p5.y);
    canvasCtx.lineTo(p6.x, p6.y);
    canvasCtx.strokeStyle = "#FFFF00"; // Yellow for vertical 2
    canvasCtx.lineWidth = 3;
    canvasCtx.stroke();

    // Draw third vertical line (p7 to p8) - numerator part 3
    canvasCtx.beginPath();
    canvasCtx.moveTo(p7.x, p7.y);
    canvasCtx.lineTo(p8.x, p8.y);
    canvasCtx.strokeStyle = "#FF00FF"; // Magenta for vertical 3
    canvasCtx.lineWidth = 3;
    canvasCtx.stroke();

    // Add legend
    canvasCtx.font = "bold 12px Arial";
    canvasCtx.fillStyle = "#FFFFFF";
    canvasCtx.strokeStyle = "#000000";
    canvasCtx.lineWidth = 2;

    const legendY = 200;
    canvasCtx.strokeText(
      `MAR = (cyan + yellow + magenta) / (3 * red)`,
      20,
      legendY,
    );
    canvasCtx.fillText(
      `MAR = (cyan + yellow + magenta) / (3 * red)`,
      20,
      legendY,
    );
  }
}

// New helper to draw mouth radial debug points
/**
 * Draws the mouth radial landmark points (used for animation spawn) onto the canvas.
 * This is useful for debugging and validating the radial point indices.
 */
export function drawMouthRadialPoints({
  landmarks,
  canvasCtx,
}: {
  landmarks: Array<{ x: number; y: number; z?: number }>;
  canvasCtx: CanvasRenderingContext2D;
}) {
  drawDebugPointsOntoCanvas({
    landmarks,
    landmarkIndices: LEFT_MOUTH_RADIAL_POINTS,
    canvasCtx,
    label: "LM", // Left-Mouth
  });

  drawDebugPointsOntoCanvas({
    landmarks,
    landmarkIndices: RIGHT_MOUTH_RADIAL_POINTS,
    canvasCtx,
    label: "RM", // Right-Mouth
  });
}
