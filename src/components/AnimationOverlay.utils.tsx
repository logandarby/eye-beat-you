// Star animation interface
export interface Star {
  id: string;
  side: "left" | "right";
  x: number;
  y: number;
}

export interface AnimatedLine {
  id: string;
  side: "left" | "right"; // which eye this line belongs to
  index: number; // 0,1,2 for the radial line order
  x: number; // current screen x position (updates each frame)
  y: number; // current screen y position (updates each frame)
  angle: number; // current angle (updates each frame)
  createdAt: number;
}

// Constants

export const BLINK_LINE_HEIGHT = 15;
export const BLINK_LINE_WIDTH = 2;
export const BLINK_ANGLE_OFFSET = 15;
export const BLINK_LINE_DURATION_MS = 300;
